package dev.pedropim.aquarium.tanks;

import java.time.Clock;
import java.util.List;
import java.util.UUID;

import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import dev.pedropim.aquarium.web.ApiException;

@Service
class TankService {

	private final TankRepository tanks;

	private final Clock clock;

	TankService(TankRepository tanks, Clock clock) {
		this.tanks = tanks;
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
