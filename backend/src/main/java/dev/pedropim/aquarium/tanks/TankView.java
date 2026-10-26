package dev.pedropim.aquarium.tanks;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.UUID;

/** A Tank as the API shows it. */
record TankView(UUID id, String name, LocalDate startDate, BigDecimal lengthCm, BigDecimal widthCm,
		BigDecimal heightCm, BigDecimal netVolumeLiters, String note) {

	static TankView of(Tank tank) {
		TankDetails details = tank.details();
		return new TankView(tank.id(), details.name(), details.startDate(), details.lengthCm(), details.widthCm(),
				details.heightCm(), details.netVolumeLiters(), details.note());
	}

}
