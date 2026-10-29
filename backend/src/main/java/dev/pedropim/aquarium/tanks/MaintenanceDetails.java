package dev.pedropim.aquarium.tanks;

import java.math.BigDecimal;
import java.time.Instant;

/**
 * What an owner writes about one Maintenance, to record it or to edit it. When recording, a missing moment means
 * now; an edit always carries its moment.
 */
record MaintenanceDetails(String type, BigDecimal percent, Instant performedAt, String note) {
}
