package dev.pedropim.aquarium.tanks;

import java.time.Clock;
import java.util.List;
import java.util.UUID;

import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import dev.pedropim.aquarium.web.ApiException;

@Service
class TankService implements TankErasure {

	private final TankRepository tanks;

	private final TankAccess access;

	private final TankPhotoService photos;

	private final Clock clock;

	TankService(TankRepository tanks, TankAccess access, TankPhotoService photos, Clock clock) {
		this.tanks = tanks;
		this.access = access;
		this.photos = photos;
		this.clock = clock;
	}

	List<TankView> listOwnedBy(UUID ownerId) {
		return tanks.findOwnedBy(ownerId).stream().map(TankView::of).toList();
	}

	/** The Tank as {@code viewerId} (null for a Visitor) may read it: their own, or the Demo Tank. */
	TankView find(UUID viewerId, UUID id) {
		Tank tank = access.readable(viewerId, id);
		return TankView.of(tank, !tank.ownerId().equals(viewerId));
	}

	/** The Demo Tank, if one is flagged. */
	TankView demo() {
		return tanks.findByDemoTrue()
			.map(tank -> TankView.of(tank, true))
			.orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "demo_not_found"));
	}

	@Transactional
	TankView edit(UUID ownerId, UUID id, TankDetails details) {
		Tank tank = access.owned(ownerId, id);
		tank.change(details);
		return TankView.of(tank);
	}

	@Transactional
	TankView archive(UUID ownerId, UUID id) {
		Tank tank = access.owned(ownerId, id);
		tank.archive(clock.instant());
		return TankView.of(tank);
	}

	@Transactional
	TankView restore(UUID ownerId, UUID id) {
		Tank tank = access.owned(ownerId, id);
		tank.restore();
		return TankView.of(tank);
	}

	/**
	 * Deletes the Tank. Its Measurements, Maintenance and Tank Photo rows go with it (the database cascades), and
	 * the photo files are removed once that has been committed.
	 */
	@Transactional
	void delete(UUID ownerId, UUID id) {
		Tank tank = access.owned(ownerId, id);
		photos.deleteFilesOf(List.of(id));
		tanks.delete(tank);
		tanks.flush();
	}

	@Override
	@Transactional
	public void eraseAllOf(UUID ownerId) {
		List<UUID> ids = tanks.idsOwnedBy(ownerId);
		if (ids.isEmpty()) {
			return;
		}
		photos.deleteFilesOf(ids);
		tanks.deleteAllById(ids);
		tanks.flush();
	}

	TankView create(UUID ownerId, TankDetails details) {
		return TankView.of(tanks.save(new Tank(ownerId, details, clock.instant())));
	}

}
