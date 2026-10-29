package dev.pedropim.aquarium.tanks;

import java.time.Clock;
import java.util.List;
import java.util.UUID;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.transaction.support.TransactionSynchronization;
import org.springframework.transaction.support.TransactionSynchronizationManager;

import dev.pedropim.aquarium.web.ApiException;

@Service
class TankService implements TankErasure {

	private static final Logger LOG = LoggerFactory.getLogger(TankService.class);

	private final TankRepository tanks;

	private final TankPhotoRepository photos;

	private final PhotoStorage storage;

	private final Clock clock;

	TankService(TankRepository tanks, TankPhotoRepository photos, PhotoStorage storage, Clock clock) {
		this.tanks = tanks;
		this.photos = photos;
		this.storage = storage;
		this.clock = clock;
	}

	List<TankView> listOwnedBy(UUID ownerId) {
		return tanks.findOwnedBy(ownerId).stream().map(TankView::of).toList();
	}

	TankView find(UUID ownerId, UUID id) {
		return TankView.of(owned(ownerId, id));
	}

	@Transactional
	TankView edit(UUID ownerId, UUID id, TankDetails details) {
		Tank tank = owned(ownerId, id);
		tank.change(details);
		return TankView.of(tank);
	}

	@Transactional
	TankView archive(UUID ownerId, UUID id) {
		Tank tank = owned(ownerId, id);
		tank.archive(clock.instant());
		return TankView.of(tank);
	}

	@Transactional
	TankView restore(UUID ownerId, UUID id) {
		Tank tank = owned(ownerId, id);
		tank.restore();
		return TankView.of(tank);
	}

	/**
	 * Deletes the Tank. Its Measurements, Maintenance and Tank Photo rows go with it (the database cascades), and
	 * the photo files are removed once that has been committed.
	 */
	@Transactional
	void delete(UUID ownerId, UUID id) {
		Tank tank = owned(ownerId, id);
		List<String> keys = photos.storageKeysOf(List.of(id));
		tanks.delete(tank);
		tanks.flush();
		deleteFilesAfterCommit(keys);
	}

	@Override
	@Transactional
	public void eraseAllOf(UUID ownerId) {
		List<UUID> ids = tanks.idsOwnedBy(ownerId);
		if (ids.isEmpty()) {
			return;
		}
		List<String> keys = photos.storageKeysOf(ids);
		tanks.deleteAllById(ids);
		tanks.flush();
		deleteFilesAfterCommit(keys);
	}

	/** Only once the rows are really gone: a file removed before a failed commit would leave broken pictures. */
	private void deleteFilesAfterCommit(List<String> keys) {
		TransactionSynchronizationManager.registerSynchronization(new TransactionSynchronization() {
			@Override
			public void afterCommit() {
				// The rows are already gone, so one file that cannot be removed must not stop the others.
				for (String key : keys) {
					try {
						storage.delete(key);
					}
					catch (RuntimeException failed) {
						LOG.warn("Could not delete photo file {}", key, failed);
					}
				}
			}
		});
	}

	/** Fails as not found unless the user owns the Tank. */
	void requireOwned(UUID ownerId, UUID id) {
		owned(ownerId, id);
	}

	/** Like {@link #requireOwned}, and also refuses an Archived Tank: it takes no new records. */
	void requireActive(UUID ownerId, UUID id) {
		if (owned(ownerId, id).isArchived()) {
			throw new ApiException(HttpStatus.CONFLICT, "tank_archived");
		}
	}

	/** Someone else's Tank answers exactly like one that does not exist, so its existence is not revealed. */
	private Tank owned(UUID ownerId, UUID id) {
		return tanks.findByIdAndOwnerId(id, ownerId).orElseThrow(() -> notFound());
	}

	static ApiException notFound() {
		return new ApiException(HttpStatus.NOT_FOUND, "tank_not_found");
	}

	TankView create(UUID ownerId, TankDetails details) {
		return TankView.of(tanks.save(new Tank(ownerId, details, clock.instant())));
	}

}
