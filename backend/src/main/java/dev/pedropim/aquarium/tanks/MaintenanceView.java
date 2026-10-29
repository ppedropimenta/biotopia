package dev.pedropim.aquarium.tanks;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.UUID;

/** A Maintenance as the API shows it. */
record MaintenanceView(UUID id, String type, BigDecimal percent, Instant performedAt, String note) {

	static MaintenanceView of(Maintenance maintenance) {
		return new MaintenanceView(maintenance.id(), maintenance.type().code(), maintenance.percent(),
				maintenance.performedAt(), maintenance.note());
	}

}
