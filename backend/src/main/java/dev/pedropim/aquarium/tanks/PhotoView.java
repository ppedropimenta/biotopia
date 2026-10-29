package dev.pedropim.aquarium.tanks;

import java.time.Instant;
import java.util.UUID;

/** A Tank Photo as the API shows it. The picture itself is at {@code /file}. */
record PhotoView(UUID id, Instant takenAt, String note, int width, int height) {

	static PhotoView of(TankPhoto photo) {
		return new PhotoView(photo.id(), photo.takenAt(), photo.note(), photo.width(), photo.height());
	}

}
