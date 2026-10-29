package dev.pedropim.aquarium.tanks;

import java.util.Optional;

/**
 * Where the files of Tank Photos live. It is the small part of S3 the app needs (put, get and delete an object by
 * key), so moving to object storage later means one new class, not changes in the code that uses it. Phase 1 has
 * {@link LocalDiskPhotoStorage}.
 */
interface PhotoStorage {

	/** Stores the bytes under the key, replacing what was there. */
	void put(String key, byte[] content);

	/** The bytes under the key, or empty when there is nothing there. */
	Optional<byte[]> get(String key);

	/** Removes the object. Removing one that is not there is not an error, as in S3. */
	void delete(String key);

}
