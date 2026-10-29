package dev.pedropim.aquarium.tanks;

import static org.assertj.core.api.Assertions.assertThat;

import java.util.HashMap;
import java.util.Map;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.web.server.LocalServerPort;
import org.springframework.test.context.TestPropertySource;

import dev.pedropim.aquarium.support.Accounts;
import dev.pedropim.aquarium.support.ApiClient;
import dev.pedropim.aquarium.support.ApiClient.Response;
import dev.pedropim.aquarium.support.ApiTest;
import dev.pedropim.aquarium.support.RecordingEmailSender;

import static dev.pedropim.aquarium.tanks.PhotoProcessorTest.Images;

/** The quota, with a small one so a few uploads reach it. */
@ApiTest
@TestPropertySource(properties = "app.photos.quota-bytes=6000")
class PhotoQuotaApiTest {

	@LocalServerPort
	int port;

	@Autowired
	RecordingEmailSender mail;

	@Test
	void uploadsPastTheQuotaAreRefusedAndDeletingMakesRoomAgain() {
		ApiClient keeper = Accounts.loggedInBrowser(port, mail);
		String tankId = (String) keeper.post("/api/tanks", new HashMap<>(Map.of("name", "Full", "startDate", "2025-03-01")))
			.field("id");
		String url = "/api/tanks/" + tankId + "/photos";
		byte[] picture = Images.jpeg(300, 200);

		Response first = keeper.postForm(url, Map.of("file", picture));
		int stored = 1;
		Response last = first;
		while (last.status() == 201 && stored < 50) {
			last = keeper.postForm(url, Map.of("file", picture));
			if (last.status() == 201) {
				stored++;
			}
		}

		assertThat(first.status()).isEqualTo(201);
		assertThat(stored).isLessThan(50);
		assertThat(last.status()).isEqualTo(413);
		assertThat(last.field("code")).isEqualTo("photo_quota_exceeded");
		long used = ((Number) keeper.get("/api/photo-usage").field("usedBytes")).longValue();
		assertThat(used).isLessThanOrEqualTo(6000);
		assertThat(keeper.get(url).items()).hasSize(stored);

		keeper.delete(url + "/" + first.field("id"));
		assertThat(keeper.postForm(url, Map.of("file", picture)).status()).isEqualTo(201);
	}

	@Test
	void theQuotaIsPerUser() {
		ApiClient one = Accounts.loggedInBrowser(port, mail);
		ApiClient two = Accounts.loggedInBrowser(port, mail);
		String tankOne = (String) one.post("/api/tanks", new HashMap<>(Map.of("name", "One", "startDate", "2025-03-01"))).field("id");
		String tankTwo = (String) two.post("/api/tanks", new HashMap<>(Map.of("name", "Two", "startDate", "2025-03-01"))).field("id");
		byte[] picture = Images.jpeg(300, 200);
		while (one.postForm("/api/tanks/" + tankOne + "/photos", Map.of("file", picture)).status() == 201) {
			// fill the first user's quota
		}

		assertThat(two.postForm("/api/tanks/" + tankTwo + "/photos", Map.of("file", picture)).status()).isEqualTo(201);
	}

}
