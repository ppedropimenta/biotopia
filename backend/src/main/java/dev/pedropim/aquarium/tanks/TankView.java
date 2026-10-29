package dev.pedropim.aquarium.tanks;

import java.math.BigDecimal;
import java.time.Instant;
import java.time.LocalDate;
import java.util.UUID;

/** A Tank as the API shows it; {@code archivedAt} is null for an active one,
 * {@code demo} marks the Demo Tank. */
record TankView(UUID id, String name, LocalDate startDate, BigDecimal lengthCm, BigDecimal widthCm,
		BigDecimal heightCm, BigDecimal netVolumeLiters, String note, Instant archivedAt, boolean demo,
		boolean readOnly) {

	static TankView of(Tank tank) {
		return of(tank, false);
	}

	/** {@code readOnly} is true when the reader is not the owner, as a visitor reading the Demo Tank. */
	static TankView of(Tank tank, boolean readOnly) {
		TankDetails details = tank.details();
		return new TankView(tank.id(), details.name(), details.startDate(), details.lengthCm(), details.widthCm(),
				details.heightCm(), details.netVolumeLiters(), details.note(), tank.archivedAt(), tank.isDemo(), readOnly);
	}

}
