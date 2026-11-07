package dev.pedropim.aquarium.identity;

import java.time.Instant;

/** When the password last changed; null for an account that never had a reset. */
record PasswordChange(Instant changedAt) {
}
