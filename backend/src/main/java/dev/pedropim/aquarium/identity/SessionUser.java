package dev.pedropim.aquarium.identity;

import java.io.Serializable;
import java.time.Instant;
import java.util.UUID;

/**
 * The logged-in user as kept in the session. Other modules refer to users by this id only. {@code loggedInAt}
 * lets the app end a session that started before the password last changed.
 */
public record SessionUser(UUID id, String email, Instant loggedInAt) implements Serializable {
}
