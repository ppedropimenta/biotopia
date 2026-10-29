package dev.pedropim.aquarium.tanks;

import java.util.UUID;

/** What the {@code identity} module needs from {@code tanks} to delete an account for good. */
public interface TankErasure {

	/**
	 * Deletes every Tank of the user with all it holds, including the stored photo files. The files go only once
	 * the surrounding transaction commits.
	 */
	void eraseAllOf(UUID ownerId);

}
