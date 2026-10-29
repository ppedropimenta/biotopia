package dev.pedropim.aquarium.tanks;

import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import dev.pedropim.aquarium.identity.SessionUser;

@RestController
@RequestMapping("/api/photo-usage")
class PhotoUsageController {

	private final TankPhotoService photos;

	PhotoUsageController(TankPhotoService photos) {
		this.photos = photos;
	}

	@GetMapping
	PhotoUsage usage(@AuthenticationPrincipal SessionUser user) {
		return photos.usage(user.id());
	}

}
