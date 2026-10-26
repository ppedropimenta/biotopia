package dev.pedropim.aquarium.tanks;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.Map;

/**
 * What one form submission sends: the values of the Parameters the owner filled in, by code, sharing one moment
 * and one note. A missing moment means now.
 */
record NewMeasurements(Instant measuredAt, String note, Map<String, BigDecimal> values) {
}
