package dev.pedropim.aquarium.tanks;

import java.math.BigDecimal;
import java.time.Instant;
import java.time.LocalDate;
import java.util.UUID;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;

@Entity
@Table(name = "tanks")
class Tank {

	@Id
	private UUID id;

	/** The owner is held by id only; the {@code identity} module owns users. */
	@Column(name = "owner_id", nullable = false)
	private UUID ownerId;

	@Column(nullable = false)
	private String name;

	@Column(name = "start_date", nullable = false)
	private LocalDate startDate;

	@Column(name = "length_cm")
	private BigDecimal lengthCm;

	@Column(name = "width_cm")
	private BigDecimal widthCm;

	@Column(name = "height_cm")
	private BigDecimal heightCm;

	@Column(name = "net_volume_liters")
	private BigDecimal netVolumeLiters;

	private String note;

	@Column(name = "created_at", nullable = false)
	private Instant createdAt;

	protected Tank() {
	}

	Tank(UUID ownerId, TankDetails details, Instant createdAt) {
		this.id = UUID.randomUUID();
		this.ownerId = ownerId;
		this.createdAt = createdAt;
		change(details);
	}

	void change(TankDetails details) {
		this.name = details.name();
		this.startDate = details.startDate();
		this.lengthCm = details.lengthCm();
		this.widthCm = details.widthCm();
		this.heightCm = details.heightCm();
		this.netVolumeLiters = details.netVolumeLiters();
		this.note = details.note();
	}

	TankDetails details() {
		return new TankDetails(name, startDate, lengthCm, widthCm, heightCm, netVolumeLiters, note);
	}

	UUID id() {
		return id;
	}

}
