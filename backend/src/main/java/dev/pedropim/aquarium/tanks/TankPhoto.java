package dev.pedropim.aquarium.tanks;

import java.time.Instant;
import java.util.UUID;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;

/** A dated picture of a Tank. The file is in the {@link PhotoStorage}, under {@code storageKey}. */
@Entity
@Table(name = "tank_photos")
class TankPhoto {

	@Id
	private UUID id;

	@Column(name = "tank_id", nullable = false)
	private UUID tankId;

	@Column(name = "taken_at", nullable = false)
	private Instant takenAt;

	private String note;

	@Column(name = "storage_key", nullable = false)
	private String storageKey;

	@Column(name = "size_bytes", nullable = false)
	private long sizeBytes;

	@Column(nullable = false)
	private int width;

	@Column(nullable = false)
	private int height;

	@Column(name = "created_at", nullable = false)
	private Instant createdAt;

	protected TankPhoto() {
	}

	TankPhoto(UUID id, UUID tankId, Instant takenAt, String note, String storageKey, long sizeBytes, int width,
			int height, Instant createdAt) {
		this.id = id;
		this.tankId = tankId;
		this.takenAt = takenAt;
		this.note = note;
		this.storageKey = storageKey;
		this.sizeBytes = sizeBytes;
		this.width = width;
		this.height = height;
		this.createdAt = createdAt;
	}

	void change(Instant takenAt, String note) {
		this.takenAt = takenAt;
		this.note = note;
	}

	UUID id() {
		return id;
	}

	Instant takenAt() {
		return takenAt;
	}

	String note() {
		return note;
	}

	String storageKey() {
		return storageKey;
	}

	int width() {
		return width;
	}

	int height() {
		return height;
	}

}
