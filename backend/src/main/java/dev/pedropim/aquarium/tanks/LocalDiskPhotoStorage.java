package dev.pedropim.aquarium.tanks;

import java.io.IOException;
import java.io.UncheckedIOException;
import java.nio.file.Files;
import java.nio.file.NoSuchFileException;
import java.nio.file.Path;
import java.util.Optional;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

/** Keeps the files in a folder, one file per key. Production points {@code app.photos.dir} at a persistent disk. */
@Component
class LocalDiskPhotoStorage implements PhotoStorage {

	private final Path root;

	LocalDiskPhotoStorage(@Value("${app.photos.dir}") Path root) {
		this.root = root.toAbsolutePath().normalize();
	}

	@Override
	public void put(String key, byte[] content) {
		Path file = locate(key);
		try {
			Files.createDirectories(file.getParent());
			Files.write(file, content);
		}
		catch (IOException failed) {
			throw new UncheckedIOException("Could not store " + key, failed);
		}
	}

	@Override
	public Optional<byte[]> get(String key) {
		try {
			return Optional.of(Files.readAllBytes(locate(key)));
		}
		catch (NoSuchFileException missing) {
			return Optional.empty();
		}
		catch (IOException failed) {
			throw new UncheckedIOException("Could not read " + key, failed);
		}
	}

	@Override
	public void delete(String key) {
		try {
			Files.deleteIfExists(locate(key));
		}
		catch (IOException failed) {
			throw new UncheckedIOException("Could not delete " + key, failed);
		}
	}

	/** The file for a key, never outside the root, whatever the key says. */
	private Path locate(String key) {
		Path file = root.resolve(key).normalize();
		if (!file.startsWith(root) || file.equals(root)) {
			throw new IllegalArgumentException("Key outside the storage: " + key);
		}
		return file;
	}

}
