package dev.pedropim.aquarium.tanks;

import java.util.UUID;

/** How many Tank Photos a Tank has, and the id of the one with the latest date (null when there is none). */
record PhotoSummary(long count, UUID latestId) {
}
