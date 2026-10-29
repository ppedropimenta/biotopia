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
@RequestMapping("/api/tanks/{tankId}/maintenance")
class MaintenanceController {

	private final MaintenanceService maintenance;

	private final TankService tanks;

	MaintenanceController(MaintenanceService maintenance, TankService tanks) {
		this.maintenance = maintenance;
		this.tanks = tanks;
	}

	@GetMapping
	List<MaintenanceView> list(@AuthenticationPrincipal SessionUser user, @PathVariable String tankId,
			@RequestParam(required = false) String type, @RequestParam(defaultValue = "1000") int limit) {
		return maintenance.list(tanks.readerOf(TankController.viewerId(user), TankController.tankId(tankId)), TankController.tankId(tankId), type, limit);
	}

	@GetMapping("/{id}")
	MaintenanceView read(@AuthenticationPrincipal SessionUser user, @PathVariable String tankId,
			@PathVariable String id) {
		return maintenance.read(tanks.readerOf(TankController.viewerId(user), TankController.tankId(tankId)), TankController.tankId(tankId), maintenanceId(id));
	}

	@PostMapping
	@ResponseStatus(HttpStatus.CREATED)
	MaintenanceView record(@AuthenticationPrincipal SessionUser user, @PathVariable String tankId,
			@RequestBody MaintenanceDetails request) {
		return maintenance.record(user.id(), TankController.tankId(tankId), request);
	}

	@PutMapping("/{id}")
	MaintenanceView edit(@AuthenticationPrincipal SessionUser user, @PathVariable String tankId,
			@PathVariable String id, @RequestBody MaintenanceDetails request) {
		return maintenance.edit(user.id(), TankController.tankId(tankId), maintenanceId(id), request);
	}

	@DeleteMapping("/{id}")
	@ResponseStatus(HttpStatus.NO_CONTENT)
	void delete(@AuthenticationPrincipal SessionUser user, @PathVariable String tankId, @PathVariable String id) {
		maintenance.delete(user.id(), TankController.tankId(tankId), maintenanceId(id));
	}

	/** An id that is not even a UUID cannot belong to any Maintenance, so it is just as not found. */
	private static UUID maintenanceId(String id) {
		try {
			return UUID.fromString(id);
		}
		catch (IllegalArgumentException malformed) {
			throw new ApiException(HttpStatus.NOT_FOUND, "maintenance_not_found");
		}
	}

}
