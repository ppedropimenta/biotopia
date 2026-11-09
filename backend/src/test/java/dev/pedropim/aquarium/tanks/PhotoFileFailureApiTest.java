package dev.pedropim.aquarium.tanks;

import static org.assertj.core.api.Assertions.assertThat;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.util.Map;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.web.server.LocalServerPort;

import dev.pedropim.aquarium.support.Accounts;
import dev.pedropim.aquarium.support.ApiClient;
import dev.pedropim.aquarium.support.ApiTest;
import dev.pedropim.aquarium.support.RecordingEmailSender;

import static dev.pedropim.aquarium.tanks.PhotoProcessorTest.Images;

/**
 * A photo file that cannot be removed once its row is gone. The request still succeeds: what the keeper asked for has
 * happened, and the file left behind only wastes disk. A non-empty directory where the file was makes removing it fail
 * on any system.
 */
@ApiTest
class PhotoFileFailureApiTest {

	private static final Path PHOTOS_DIR = Path.of("target/test-photos");

	@LocalServerPort
	int port;

	@Autowired
	RecordingEmailSender mail;

	ApiClient keeper;

	String tankId;

	@BeforeEach
	void aKeeperWithATank() {
		keeper = Accounts.loggedInBrowser(port, mail);
		tankId = (String) keeper.post("/api/tanks", Map.of("name", "Tank", "startDate", "2025-03-01")).field("id");
	}

	@Test
	void deletingAPhotoSucceedsWhenItsFileCannotBeRemoved() throws IOException {
		String id = upload();
		block(id);

		assertThat(keeper.delete(photos() + "/" + id).status()).isEqualTo(204);
		assertThat(keeper.get(photos() + "/" + id).status()).isEqualTo(404);
	}

	@Test
	void deletingATankSucceedsAndRemovesTheOtherFilesWhenOneCannotBeRemoved() throws IOException {
		String blocked = upload();
		String other = upload();
		block(blocked);

		assertThat(keeper.delete("/api/tanks/" + tankId).status()).isEqualTo(204);
		assertThat(keeper.get("/api/tanks/" + tankId).status()).isEqualTo(404);
		assertThat(fileOf(other)).doesNotExist();
	}

	private String upload() {
		return (String) keeper.postForm(photos(), Map.of("file", Images.jpeg(50, 50))).field("id");
	}

	private void block(String photoId) throws IOException {
		Path file = fileOf(photoId);
		Files.delete(file);
		Files.createDirectories(file.resolve("blocker"));
	}

	private Path fileOf(String photoId) {
		return PHOTOS_DIR.resolve(tankId).resolve(photoId + ".jpg");
	}

	private String photos() {
		return "/api/tanks/" + tankId + "/photos";
	}

}
