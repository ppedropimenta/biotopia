package dev.pedropim.aquarium.tanks;

import java.math.BigDecimal;
import java.time.Instant;

/** An edit of one Measurement. The Parameter cannot change: to fix the wrong Parameter, delete and record again. */
record MeasurementChange(BigDecimal value, Instant measuredAt, String note) {
}
