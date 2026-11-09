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
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

import dev.pedropim.aquarium.identity.SessionUser;
import jakarta.validation.Valid;

@RestController
class TankController {

	private final TankService tanks;

	TankController(TankService tanks) {
		this.tanks = tanks;
	}

	@GetMapping("/api/tanks")
	List<TankView> list(@AuthenticationPrincipal SessionUser user) {
		return tanks.listOwnedBy(user.id());
	}

	@GetMapping("/api/tanks/{id}")
	TankView read(@AuthenticationPrincipal SessionUser user, @PathVariable String id) {
		return tanks.find(viewerId(user), tankId(id));
	}

	@PutMapping("/api/tanks/{id}")
	TankView edit(@AuthenticationPrincipal SessionUser user, @PathVariable String id,
			@Valid @RequestBody TankDetails details) {
		return tanks.edit(user.id(), tankId(id), details);
	}

	@PostMapping("/api/tanks/{id}/archive")
	TankView archive(@AuthenticationPrincipal SessionUser user, @PathVariable String id) {
		return tanks.archive(user.id(), tankId(id));
	}

	@PostMapping("/api/tanks/{id}/restore")
	TankView restore(@AuthenticationPrincipal SessionUser user, @PathVariable String id) {
		return tanks.restore(user.id(), tankId(id));
	}

	@DeleteMapping("/api/tanks/{id}")
	@ResponseStatus(HttpStatus.NO_CONTENT)
	void delete(@AuthenticationPrincipal SessionUser user, @PathVariable String id) {
		tanks.delete(user.id(), tankId(id));
	}

	/** The Demo Tank, open to anyone: it is how a visitor finds it. */
	@GetMapping("/api/demo")
	TankView demo() {
		return tanks.demo();
	}

	/** The id of the person reading, or null for a visitor with no session. */
	static UUID viewerId(SessionUser user) {
		return user == null ? null : user.id();
	}

	/** An id that is not even a UUID cannot belong to any Tank, so it is just as not found. */
	static UUID tankId(String id) {
		try {
			return UUID.fromString(id);
		}
		catch (IllegalArgumentException malformed) {
			throw TankAccess.notFound();
		}
	}

	@PostMapping("/api/tanks")
	@ResponseStatus(HttpStatus.CREATED)
	TankView create(@AuthenticationPrincipal SessionUser user, @Valid @RequestBody TankDetails details) {
		return tanks.create(user.id(), details);
	}

}
