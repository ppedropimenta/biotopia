package dev.pedropim.aquarium.tanks;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.UUID;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.Id;
import jakarta.persistence.Table;

/** A record of care work already done on a Tank. */
@Entity
@Table(name = "maintenance")
class Maintenance {

	@Id
	private UUID id;

	@Column(name = "tank_id", nullable = false)
	private UUID tankId;

	@Enumerated(EnumType.STRING)
	@Column(nullable = false)
	private MaintenanceType type;

	/** Only a Water Change has one: the part of the water replaced, above 0 and at most 100. */
	private BigDecimal percent;

	@Column(name = "performed_at", nullable = false)
	private Instant performedAt;

	private String note;

	@Column(name = "created_at", nullable = false)
	private Instant createdAt;

	protected Maintenance() {
	}

	Maintenance(UUID tankId, MaintenanceType type, BigDecimal percent, Instant performedAt, String note,
			Instant createdAt) {
		this.id = UUID.randomUUID();
		this.tankId = tankId;
		this.type = type;
		this.percent = percent;
		this.performedAt = performedAt;
		this.note = note;
		this.createdAt = createdAt;
	}

	void change(MaintenanceType type, BigDecimal percent, Instant performedAt, String note) {
		this.type = type;
		this.percent = percent;
		this.performedAt = performedAt;
		this.note = note;
	}

	UUID id() {
		return id;
	}

	MaintenanceType type() {
		return type;
	}

	BigDecimal percent() {
		return percent;
	}

	Instant performedAt() {
		return performedAt;
	}

	String note() {
		return note;
	}

}
