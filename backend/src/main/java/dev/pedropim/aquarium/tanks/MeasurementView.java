package dev.pedropim.aquarium.tanks;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.UUID;

/** A Measurement as the API shows it. */
record MeasurementView(UUID id, String parameter, BigDecimal value, Instant measuredAt, String note) {

	static MeasurementView of(Measurement measurement) {
		return new MeasurementView(measurement.id(), measurement.parameter().code(), measurement.value(),
				measurement.measuredAt(), measurement.note());
	}

}
