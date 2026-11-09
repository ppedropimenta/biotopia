package dev.pedropim.aquarium.tanks;

import java.util.Optional;
import java.util.UUID;

import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Component;

import dev.pedropim.aquarium.web.ApiException;

/**
 * Who may do what with a Tank. Anyone may read the Demo Tank; any other Tank only its Owner may read or change. A
 * Visitor is refused with 401, and someone else's Tank answers exactly like one that does not exist, so its existence
 * is not revealed.
 */
@Component
class TankAccess {

	private final TankRepository tanks;

	TankAccess(TankRepository tanks) {
		this.tanks = tanks;
	}

	/** The Tank as {@code viewerId} (null for a Visitor) may read it: their own, or the Demo Tank. */
	Tank readable(UUID viewerId, UUID tankId) {
		Optional<Tank> tank = tanks.findById(tankId);
		if (tank.filter(Tank::isDemo).isPresent()) {
			return tank.get();
		}
		if (viewerId == null) {
			throw new ApiException(HttpStatus.UNAUTHORIZED, "unauthorized");
		}
		return tank.filter(found -> found.ownerId().equals(viewerId)).orElseThrow(TankAccess::notFound);
	}

	/** The Tank, if {@code ownerId} is its Owner. Records of an Archived Tank can still be changed through it. */
	Tank owned(UUID ownerId, UUID tankId) {
		return tanks.findByIdAndOwnerId(tankId, ownerId).orElseThrow(TankAccess::notFound);
	}

	/** Like {@link #owned}, and also refuses an Archived Tank: it takes no new records. */
	Tank active(UUID ownerId, UUID tankId) {
		Tank tank = owned(ownerId, tankId);
		if (tank.isArchived()) {
			throw new ApiException(HttpStatus.CONFLICT, "tank_archived");
		}
		return tank;
	}

	static ApiException notFound() {
		return new ApiException(HttpStatus.NOT_FOUND, "tank_not_found");
	}

}
