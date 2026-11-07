package dev.pedropim.aquarium.identity;

import static org.assertj.core.api.Assertions.assertThat;

import java.util.Map;
import java.util.UUID;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.web.server.LocalServerPort;

import dev.pedropim.aquarium.support.ApiClient;
import dev.pedropim.aquarium.support.ApiClient.Response;
import dev.pedropim.aquarium.support.ApiTest;
import dev.pedropim.aquarium.support.RecordingEmailSender;

/** A body is limited before anything reads it whole: no account is needed to send one, so the limit cannot depend on one. */
@ApiTest
class RequestSizeApiTest {

	@LocalServerPort
	int port;

	@Autowired
	RecordingEmailSender mail;

	@Test
	void aJsonBodyOverOneMegabyteIsRefusedWithoutAnAccount() {
		ApiClient visitor = new ApiClient(port);
		String huge = "x".repeat(1_100_000);

		Response response = visitor.post("/api/auth/login", Map.of("email", "someone@example.com", "password", huge));

		assertThat(response.status()).isEqualTo(400);
		assertThat(response.field("code")).isEqualTo("malformed_request");
	}

	@Test
	void aBodyJustUnderTheLimitIsReadAndTheFieldLimitAnswersInstead() {
		ApiClient visitor = new ApiClient(port);
		String big = "x".repeat(900_000);

		Response response = visitor.post("/api/auth/login", Map.of("email", "someone@example.com", "password", big));

		assertThat(response.status()).isEqualTo(400);
		assertThat(response.field("code")).isEqualTo("validation_failed");
	}

	@Test
	void anEmailOverTheAddressLimitIsRefusedOnTheOpenRoutes() {
		ApiClient visitor = new ApiClient(port);
		String email = "a".repeat(250) + "@example.com";

		assertThat(visitor.post("/api/auth/forgot-password", Map.of("email", email)).status()).isEqualTo(400);
		assertThat(visitor.post("/api/auth/resend-confirmation", Map.of("email", email)).status()).isEqualTo(400);
		assertThat(visitor.post("/api/auth/login", Map.of("email", email, "password", "whatever it is")).status()).isEqualTo(400);
	}

	@Test
	void aTokenOverTheLimitIsRefused() {
		ApiClient visitor = new ApiClient(port);
		String token = "t".repeat(500);

		assertThat(visitor.post("/api/auth/confirm", Map.of("token", token)).status()).isEqualTo(400);
		assertThat(visitor.post("/api/auth/reset-password", Map.of("token", token, "password", "a brand new passphrase")).status())
			.isEqualTo(400);
	}

	/** 24 characters of 3 bytes each: exactly the 72 bytes bcrypt reads, and far fewer than any character limit. */
	@Test
	void aPasswordOfExactly72BytesInMultiByteCharactersStillWorks() {
		ApiClient visitor = new ApiClient(port);
		String email = "fish-" + UUID.randomUUID() + "@example.com";
		String password = "€".repeat(24);
		assertThat(password.getBytes(java.nio.charset.StandardCharsets.UTF_8)).hasSize(72);

		assertThat(visitor.post("/api/auth/signup", Map.of("email", email, "password", password, "language", "en")).status())
			.isEqualTo(201);
		Matcher link = Pattern.compile("token=([\\w-]+)").matcher(mail.sentTo(email).getLast().body());
		assertThat(link.find()).isTrue();
		assertThat(visitor.post("/api/auth/confirm", Map.of("token", link.group(1))).status()).isEqualTo(204);
		assertThat(visitor.post("/api/auth/login", Map.of("email", email, "password", password)).status()).isEqualTo(200);
	}

}
