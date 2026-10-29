package dev.pedropim.aquarium.tanks;

import java.util.List;
import java.util.UUID;

import org.springframework.http.HttpStatus;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

import dev.pedropim.aquarium.identity.SessionUser;
import dev.pedropim.aquarium.web.ApiException;

@RestController
@RequestMapping("/api/tanks/{tankId}/measurements")
class MeasurementController {

	private final MeasurementService measurements;

	private final TankService tanks;

	MeasurementController(MeasurementService measurements, TankService tanks) {
		this.measurements = measurements;
		this.tanks = tanks;
	}

	@GetMapping
	List<MeasurementView> list(@AuthenticationPrincipal SessionUser user, @PathVariable String tankId,
			@RequestParam(defaultValue = "1000") int limit) {
		return measurements.list(tanks.readerOf(TankController.viewerId(user), TankController.tankId(tankId)), TankController.tankId(tankId), limit);
	}

	@GetMapping("/{id}")
	MeasurementView read(@AuthenticationPrincipal SessionUser user, @PathVariable String tankId,
			@PathVariable String id) {
		return measurements.read(tanks.readerOf(TankController.viewerId(user), TankController.tankId(tankId)), TankController.tankId(tankId), measurementId(id));
	}

	@GetMapping("/latest")
	List<MeasurementView> latest(@AuthenticationPrincipal SessionUser user, @PathVariable String tankId) {
		return measurements.latest(tanks.readerOf(TankController.viewerId(user), TankController.tankId(tankId)), TankController.tankId(tankId));
	}

	@PostMapping
	@ResponseStatus(HttpStatus.CREATED)
	List<MeasurementView> record(@AuthenticationPrincipal SessionUser user, @PathVariable String tankId,
			@RequestBody NewMeasurements request) {
		return measurements.record(user.id(), TankController.tankId(tankId), request);
	}

	@PutMapping("/{id}")
	MeasurementView edit(@AuthenticationPrincipal SessionUser user, @PathVariable String tankId,
			@PathVariable String id, @RequestBody MeasurementChange change) {
		return measurements.edit(user.id(), TankController.tankId(tankId), measurementId(id), change);
	}

	@DeleteMapping("/{id}")
	@ResponseStatus(HttpStatus.NO_CONTENT)
	void delete(@AuthenticationPrincipal SessionUser user, @PathVariable String tankId, @PathVariable String id) {
		measurements.delete(user.id(), TankController.tankId(tankId), measurementId(id));
	}

	/** An id that is not even a UUID cannot belong to any Measurement, so it is just as not found. */
	private static UUID measurementId(String id) {
		try {
			return UUID.fromString(id);
		}
		catch (IllegalArgumentException malformed) {
			throw new ApiException(HttpStatus.NOT_FOUND, "measurement_not_found");
		}
	}

}
