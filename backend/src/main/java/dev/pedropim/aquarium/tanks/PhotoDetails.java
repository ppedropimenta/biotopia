package dev.pedropim.aquarium.tanks;

import java.time.Instant;

/** What an owner changes about a Tank Photo already stored: when it was taken and the note. */
record PhotoDetails(Instant takenAt, String note) {
}
