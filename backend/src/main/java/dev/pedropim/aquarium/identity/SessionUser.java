package dev.pedropim.aquarium.identity;

import java.io.Serializable;
import java.util.UUID;

/**
 * The logged-in user as kept in the session. Other modules refer to users by this id only.
 */
public record SessionUser(UUID id, String email) implements Serializable {
}
