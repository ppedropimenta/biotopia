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

/** One value of one Parameter in one Tank at one instant. */
@Entity
@Table(name = "measurements")
class Measurement {

	@Id
	private UUID id;

	@Column(name = "tank_id", nullable = false)
	private UUID tankId;

	@Enumerated(EnumType.STRING)
	@Column(nullable = false)
	private Parameter parameter;

	@Column(nullable = false)
	private BigDecimal value;

	@Column(name = "measured_at", nullable = false)
	private Instant measuredAt;

	private String note;

	@Column(name = "created_at", nullable = false)
	private Instant createdAt;

	protected Measurement() {
	}

	Measurement(UUID tankId, Parameter parameter, BigDecimal value, Instant measuredAt, String note,
			Instant createdAt) {
		this.id = UUID.randomUUID();
		this.tankId = tankId;
		this.parameter = parameter;
		this.value = value;
		this.measuredAt = measuredAt;
		this.note = note;
		this.createdAt = createdAt;
	}

	void change(BigDecimal value, Instant measuredAt, String note) {
		this.value = value;
		this.measuredAt = measuredAt;
		this.note = note;
	}

	UUID id() {
		return id;
	}

	Parameter parameter() {
		return parameter;
	}

	BigDecimal value() {
		return value;
	}

	Instant measuredAt() {
		return measuredAt;
	}

	String note() {
		return note;
	}

}
