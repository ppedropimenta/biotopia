package dev.pedropim.aquarium.tanks;

import java.time.Clock;
import java.time.Instant;
import java.time.format.DateTimeParseException;
import java.util.List;
import java.util.Map;
import java.util.TreeMap;
import java.util.UUID;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.data.domain.Limit;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.transaction.support.TransactionSynchronization;
import org.springframework.transaction.support.TransactionSynchronizationManager;

import dev.pedropim.aquarium.web.ApiException;

@Service
class TankPhotoService {

	/** The most an uploaded file may weigh: 10 MB. */
	static final long MAX_UPLOAD_BYTES = 10L * 1024 * 1024;

	private static final int MAX_NOTE_LENGTH = 2000;

	private static final int MAX_LIST = 1000;

	private final TankService tanks;

	private final TankPhotoRepository photos;

	private final PhotoStorage storage;

	private final PhotoProcessor processor;

	private final Clock clock;

	private final long quotaBytes;

	TankPhotoService(TankService tanks, TankPhotoRepository photos, PhotoStorage storage, PhotoProcessor processor,
			Clock clock, @Value("${app.photos.quota-bytes}") long quotaBytes) {
		this.tanks = tanks;
		this.photos = photos;
		this.storage = storage;
		this.processor = processor;
		this.clock = clock;
		this.quotaBytes = quotaBytes;
	}

	/** The newest Tank Photos first (by their date), at most {@code limit} of them, kept between 1 and {@value #MAX_LIST}. */
	List<PhotoView> list(UUID ownerId, UUID tankId, int limit) {
		tanks.requireOwned(ownerId, tankId);
		return photos.findByTankIdOrderByTakenAtDescIdAsc(tankId, Limit.of(Math.clamp(limit, 1, MAX_LIST)))
			.stream()
			.map(PhotoView::of)
			.toList();
	}

	/** How many Tank Photos a Tank has and which one is the latest, for the lists that show a Tank. */
	PhotoSummary summary(UUID ownerId, UUID tankId) {
		tanks.requireOwned(ownerId, tankId);
		UUID latest = photos.findByTankIdOrderByTakenAtDescIdAsc(tankId, Limit.of(1))
			.stream()
			.findFirst()
			.map(TankPhoto::id)
			.orElse(null);
		return new PhotoSummary(photos.countByTankId(tankId), latest);
	}

	PhotoView read(UUID ownerId, UUID tankId, UUID id) {
		tanks.requireOwned(ownerId, tankId);
		return PhotoView.of(find(tankId, id));
	}

	/** The stored JPEG of a Tank Photo. */
	byte[] file(UUID ownerId, UUID tankId, UUID id) {
		tanks.requireOwned(ownerId, tankId);
		TankPhoto photo = find(tankId, id);
		return storage.get(photo.storageKey()).orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "photo_not_found"));
	}

	PhotoUsage usage(UUID ownerId) {
		return new PhotoUsage(photos.storedBytesOf(ownerId), quotaBytes, MAX_UPLOAD_BYTES);
	}

	/**
	 * Stores an uploaded picture: checks it, strips and shrinks it, and refuses it when the user's quota cannot hold
	 * the result. {@code takenAt} is the text the client sent (an instant); missing means now.
	 */
	@Transactional
	PhotoView upload(UUID ownerId, UUID tankId, byte[] original, String takenAtText, String note) {
		tanks.requireOwned(ownerId, tankId);
		Instant now = clock.instant();
		Instant takenAt = readMoment(takenAtText, now);
		checkDetails(takenAt, note, now);
		if (original.length > MAX_UPLOAD_BYTES) {
			throw new ApiException(HttpStatus.CONTENT_TOO_LARGE, "validation_failed", Map.of("file", "too_large"));
		}
		PhotoProcessor.Processed processed = processor.process(original);
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
					storage.delete(key);
				}
			}
		});
		return PhotoView.of(photos.saveAndFlush(new TankPhoto(id, tankId, takenAt, cleanNote(note), key,
				processed.jpeg().length, processed.width(), processed.height(), now)));
	}

	@Transactional
	PhotoView edit(UUID ownerId, UUID tankId, UUID id, PhotoDetails details) {
		tanks.requireOwned(ownerId, tankId);
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
		tanks.requireOwned(ownerId, tankId);
		TankPhoto photo = find(tankId, id);
		photos.delete(photo);
		// Only once the row is really gone: a file removed before a failed commit would leave a broken picture.
		TransactionSynchronizationManager.registerSynchronization(new TransactionSynchronization() {
			@Override
			public void afterCommit() {
				storage.delete(photo.storageKey());
			}
		});
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
