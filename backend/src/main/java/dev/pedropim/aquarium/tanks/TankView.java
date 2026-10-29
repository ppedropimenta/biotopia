package dev.pedropim.aquarium.tanks;

import java.math.BigDecimal;
import java.time.Instant;
import java.time.LocalDate;
import java.util.UUID;

/** A Tank as the API shows it; {@code archivedAt} is null for an active one. */
record TankView(UUID id, String name, LocalDate startDate, BigDecimal lengthCm, BigDecimal widthCm,
		BigDecimal heightCm, BigDecimal netVolumeLiters, String note, Instant archivedAt) {

	static TankView of(Tank tank) {
		TankDetails details = tank.details();
		return new TankView(tank.id(), details.name(), details.startDate(), details.lengthCm(), details.widthCm(),
				details.heightCm(), details.netVolumeLiters(), details.note(), tank.archivedAt());
	}

}
