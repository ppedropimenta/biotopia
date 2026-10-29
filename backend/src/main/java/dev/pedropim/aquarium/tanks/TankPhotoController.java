package dev.pedropim.aquarium.tanks;

import java.io.IOException;
import java.util.List;
import java.util.UUID;
import java.util.concurrent.TimeUnit;

import org.springframework.http.CacheControl;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
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
import org.springframework.web.multipart.MultipartFile;

import dev.pedropim.aquarium.identity.SessionUser;
import dev.pedropim.aquarium.web.ApiException;

@RestController
@RequestMapping("/api/tanks/{tankId}/photos")
class TankPhotoController {

	private final TankPhotoService photos;

	private final TankService tanks;

	TankPhotoController(TankPhotoService photos, TankService tanks) {
		this.photos = photos;
		this.tanks = tanks;
	}

	@GetMapping
	List<PhotoView> list(@AuthenticationPrincipal SessionUser user, @PathVariable String tankId,
			@RequestParam(defaultValue = "1000") int limit) {
		return photos.list(tanks.readerOf(TankController.viewerId(user), TankController.tankId(tankId)), TankController.tankId(tankId), limit);
	}

	@GetMapping("/summary")
	PhotoSummary summary(@AuthenticationPrincipal SessionUser user, @PathVariable String tankId) {
		return photos.summary(tanks.readerOf(TankController.viewerId(user), TankController.tankId(tankId)), TankController.tankId(tankId));
	}

	@GetMapping("/{id}")
	PhotoView read(@AuthenticationPrincipal SessionUser user, @PathVariable String tankId, @PathVariable String id) {
		return photos.read(tanks.readerOf(TankController.viewerId(user), TankController.tankId(tankId)), TankController.tankId(tankId), photoId(id));
	}

	/** The picture. Only the owner and, for the Demo Tank, any visitor can read it. A stored file never changes, so the browser may keep it. */
	@GetMapping("/{id}/file")
	ResponseEntity<byte[]> file(@AuthenticationPrincipal SessionUser user, @PathVariable String tankId,
			@PathVariable String id) {
		byte[] jpeg = photos.file(tanks.readerOf(TankController.viewerId(user), TankController.tankId(tankId)), TankController.tankId(tankId), photoId(id));
		return ResponseEntity.ok()
			.contentType(MediaType.IMAGE_JPEG)
			.cacheControl(CacheControl.maxAge(7, TimeUnit.DAYS).cachePrivate().immutable())
			.header("X-Content-Type-Options", "nosniff")
			.body(jpeg);
	}

	@PostMapping(consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
	@ResponseStatus(HttpStatus.CREATED)
	PhotoView upload(@AuthenticationPrincipal SessionUser user, @PathVariable String tankId,
			@RequestParam(required = false) MultipartFile file, @RequestParam(required = false) String takenAt,
			@RequestParam(required = false) String note) throws IOException {
		if (file == null || file.isEmpty()) {
			throw ApiException.invalidField("file", "required");
		}
		return photos.upload(user.id(), TankController.tankId(tankId), file.getBytes(), takenAt, note);
	}

	@PutMapping("/{id}")
	PhotoView edit(@AuthenticationPrincipal SessionUser user, @PathVariable String tankId, @PathVariable String id,
			@RequestBody PhotoDetails request) {
		return photos.edit(user.id(), TankController.tankId(tankId), photoId(id), request);
	}

	@DeleteMapping("/{id}")
	@ResponseStatus(HttpStatus.NO_CONTENT)
	void delete(@AuthenticationPrincipal SessionUser user, @PathVariable String tankId, @PathVariable String id) {
		photos.delete(user.id(), TankController.tankId(tankId), photoId(id));
	}

	/** An id that is not even a UUID cannot belong to any Tank Photo, so it is just as not found. */
	private static UUID photoId(String id) {
		try {
			return UUID.fromString(id);
		}
		catch (IllegalArgumentException malformed) {
			throw new ApiException(HttpStatus.NOT_FOUND, "photo_not_found");
		}
	}

}
