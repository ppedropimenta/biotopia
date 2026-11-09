package dev.pedropim.aquarium.tanks;

import java.time.Clock;
import java.time.Duration;
import java.time.Instant;
import java.time.format.DateTimeParseException;
import java.util.List;
import java.util.Map;
import java.util.TreeMap;
import java.util.UUID;
import java.util.concurrent.Semaphore;
import java.util.concurrent.TimeUnit;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.data.domain.Limit;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.PlatformTransactionManager;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.transaction.support.TransactionSynchronization;
import org.springframework.transaction.support.TransactionSynchronizationManager;
import org.springframework.transaction.support.TransactionTemplate;

import dev.pedropim.aquarium.web.ApiException;

@Service
class TankPhotoService {

	private static final Logger LOG = LoggerFactory.getLogger(TankPhotoService.class);

	/** The most an uploaded file may weigh: 10 MB. */
	static final long MAX_UPLOAD_BYTES = 10L * 1024 * 1024;

	private static final int MAX_NOTE_LENGTH = 2000;

	private static final int MAX_LIST = 1000;

	/**
	 * How many pictures are decoded at the same time. Decoding takes a core and up to about 100 MB of memory, so more
	 * than two at once could starve everything else on a small server.
	 */
	private static final int MAX_DECODES = 2;

	private final TankAccess access;

	private final TankPhotoRepository photos;

	private final PhotoStorage storage;

	private final PhotoProcessor processor;

	private final Clock clock;

	private final long quotaBytes;

	private final TransactionTemplate transaction;

	private final Semaphore decodeSlots = new Semaphore(MAX_DECODES);

	/** How long an upload waits for a free slot before it is told to try later. Bounded, since each waiting upload holds up to 10 MB. */
	private final Duration decodeWait;

	TankPhotoService(TankAccess access, TankPhotoRepository photos, PhotoStorage storage, PhotoProcessor processor,
			Clock clock, PlatformTransactionManager transactions, @Value("${app.photos.quota-bytes}") long quotaBytes,
			@Value("${app.photos.decode-wait:3s}") Duration decodeWait) {
		this.access = access;
		this.photos = photos;
		this.storage = storage;
		this.processor = processor;
		this.clock = clock;
		this.quotaBytes = quotaBytes;
		this.transaction = new TransactionTemplate(transactions);
		this.decodeWait = decodeWait;
	}

	/** The newest Tank Photos first (by their date), at most {@code limit} of them, kept between 1 and {@value #MAX_LIST}. */
	List<PhotoView> list(UUID viewerId, UUID tankId, int limit) {
		access.readable(viewerId, tankId);
		return photos.findByTankIdOrderByTakenAtDescIdAsc(tankId, Limit.of(Math.clamp(limit, 1, MAX_LIST)))
			.stream()
			.map(PhotoView::of)
			.toList();
	}

	/** How many Tank Photos a Tank has and which one is the latest, for the lists that show a Tank. */
	PhotoSummary summary(UUID viewerId, UUID tankId) {
		access.readable(viewerId, tankId);
		UUID latest = photos.findByTankIdOrderByTakenAtDescIdAsc(tankId, Limit.of(1))
			.stream()
			.findFirst()
			.map(TankPhoto::id)
			.orElse(null);
		return new PhotoSummary(photos.countByTankId(tankId), latest);
	}

	PhotoView read(UUID viewerId, UUID tankId, UUID id) {
		access.readable(viewerId, tankId);
		return PhotoView.of(find(tankId, id));
	}

	/** The stored JPEG of a Tank Photo. */
	byte[] file(UUID viewerId, UUID tankId, UUID id) {
		access.readable(viewerId, tankId);
		TankPhoto photo = find(tankId, id);
		return storage.get(photo.storageKey()).orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "photo_not_found"));
	}

	PhotoUsage usage(UUID ownerId) {
		return new PhotoUsage(photos.storedBytesOf(ownerId), quotaBytes, MAX_UPLOAD_BYTES);
	}

	/**
	 * Stores an uploaded picture: checks it, strips and shrinks it, and refuses it when the user's quota cannot hold
	 * the result. {@code takenAt} is the text the client sent (an instant); missing means now.
	 * <p>
	 * The decode, the slow part, runs with no transaction and so with no database connection. Only the last step,
	 * the one that reads and writes rows, is a transaction (started by hand: a {@code @Transactional} method called from
	 * this class would not go through the proxy).
	 */
	PhotoView upload(UUID ownerId, UUID tankId, byte[] original, String takenAtText, String note) {
		access.active(ownerId, tankId);
		Instant now = clock.instant();
		Instant takenAt = readMoment(takenAtText, now);
		checkDetails(takenAt, note, now);
		if (original.length > MAX_UPLOAD_BYTES) {
			throw new ApiException(HttpStatus.CONTENT_TOO_LARGE, "validation_failed", Map.of("file", "too_large"));
		}
		PhotoProcessor.Processed processed = decodeInASlot(original);
		return transaction.execute(status -> store(ownerId, tankId, processed, takenAt, cleanNote(note), now));
	}

	private PhotoProcessor.Processed decodeInASlot(byte[] original) {
		try {
			if (!decodeSlots.tryAcquire(decodeWait.toMillis(), TimeUnit.MILLISECONDS)) {
				throw new ApiException(HttpStatus.SERVICE_UNAVAILABLE, "photo_busy");
			}
		}
		catch (InterruptedException interrupted) {
			Thread.currentThread().interrupt();
			throw new ApiException(HttpStatus.SERVICE_UNAVAILABLE, "photo_busy");
		}
		try {
			return processor.process(original);
		}
		finally {
			decodeSlots.release();
		}
	}

	/** The part of an upload that needs the database. The Tank is checked again: it may have been archived while decoding. */
	private PhotoView store(UUID ownerId, UUID tankId, PhotoProcessor.Processed processed, Instant takenAt, String note,
			Instant now) {
		access.active(ownerId, tankId);
		photos.lockUploadsOf(ownerId);
		if (photos.storedBytesOf(ownerId) + processed.jpeg().length > quotaBytes) {
			throw new ApiException(HttpStatus.CONTENT_TOO_LARGE, "photo_quota_exceeded");
		}

		UUID id = UUID.randomUUID();
		String key = tankId + "/" + id + ".jpg";
		storage.put(key, processed.jpeg());
		// Whatever ends the transaction other than a commit leaves the row unsaved, so the file must go.
		TransactionSynchronizationManager.registerSynchronization(new TransactionSynchronization() {
			@Override
			public void afterCompletion(int status) {
				if (status != STATUS_COMMITTED) {
					deleteFile(key);
				}
			}
		});
		return PhotoView.of(photos.saveAndFlush(new TankPhoto(id, tankId, takenAt, note, key, processed.jpeg().length,
				processed.width(), processed.height(), now)));
	}

	@Transactional
	PhotoView edit(UUID ownerId, UUID tankId, UUID id, PhotoDetails details) {
		access.owned(ownerId, tankId);
		TankPhoto photo = find(tankId, id);
		if (details.takenAt() == null) {
			throw ApiException.invalidField("takenAt", "required");
		}
		checkDetails(details.takenAt(), details.note(), clock.instant());
		photo.change(details.takenAt(), cleanNote(details.note()));
		return PhotoView.of(photo);
	}

	@Transactional
	void delete(UUID ownerId, UUID tankId, UUID id) {
		access.owned(ownerId, tankId);
		TankPhoto photo = find(tankId, id);
		photos.delete(photo);
		deleteFilesAfterCommit(List.of(photo.storageKey()));
	}

	/**
	 * Removes the photo files of these Tanks once the transaction that deletes their rows has committed. Called inside
	 * that transaction and before the rows go, since it reads which files they are.
	 */
	void deleteFilesOf(List<UUID> tankIds) {
		deleteFilesAfterCommit(photos.storageKeysOf(tankIds));
	}

	/** Only once the rows are really gone: a file removed before a failed commit would leave a broken picture. */
	private void deleteFilesAfterCommit(List<String> keys) {
		TransactionSynchronizationManager.registerSynchronization(new TransactionSynchronization() {
			@Override
			public void afterCommit() {
				keys.forEach(TankPhotoService.this::deleteFile);
			}
		});
	}

	/**
	 * The rows are already gone or were never saved, so a file that cannot be removed only wastes disk: it is logged for
	 * the operator and the request still succeeds. One failure does not stop the other files.
	 */
	private void deleteFile(String key) {
		try {
			storage.delete(key);
		}
		catch (RuntimeException failed) {
			LOG.warn("Could not delete photo file {}", key, failed);
		}
	}

	/** A Tank Photo of another Tank answers like one that does not exist, even for the owner of both. */
	private TankPhoto find(UUID tankId, UUID id) {
		return photos.findByIdAndTankId(id, tankId)
			.orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "photo_not_found"));
	}

	private static Instant readMoment(String text, Instant now) {
		if (text == null || text.isBlank()) {
			return now;
		}
		try {
			return Instant.parse(text.strip());
		}
		catch (DateTimeParseException malformed) {
			throw ApiException.invalidField("takenAt", "invalid");
		}
	}

	private static void checkDetails(Instant takenAt, String note, Instant now) {
		Map<String, String> problems = new TreeMap<>();
		if (takenAt.isAfter(now)) {
			problems.put("takenAt", "in_future");
		}
		if (note != null && note.strip().length() > MAX_NOTE_LENGTH) {
			problems.put("note", "too_long");
		}
		if (!problems.isEmpty()) {
			throw new ApiException(HttpStatus.BAD_REQUEST, "validation_failed", problems);
		}
	}

	private static String cleanNote(String note) {
		return note == null || note.isBlank() ? null : note.strip();
	}

}
