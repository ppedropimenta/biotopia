package dev.pedropim.aquarium.identity;

import static org.assertj.core.api.Assertions.assertThat;

import java.time.Duration;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import java.util.concurrent.CountDownLatch;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;
import java.util.concurrent.Future;
import java.util.regex.Matcher;
import java.util.regex.Pattern;
import java.util.stream.IntStream;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.web.server.LocalServerPort;

import dev.pedropim.aquarium.email.Email;
import dev.pedropim.aquarium.support.ApiClient;
import dev.pedropim.aquarium.support.ApiClient.Response;
import dev.pedropim.aquarium.support.ApiTest;
import dev.pedropim.aquarium.support.MutableClock;
import dev.pedropim.aquarium.support.RecordingEmailSender;
import dev.pedropim.aquarium.support.TestSubstitutes;

@ApiTest
class PasswordResetApiTest {

	private static final String PASSWORD = "correct horse battery";

	private static final String NEW_PASSWORD = "a brand new passphrase";

	private static final Pattern CONFIRMATION_LINK = Pattern.compile("https?://\\S+/confirm\\?token=([\\w-]+)");

	private static final Pattern RESET_LINK = Pattern.compile("https?://\\S+/reset-password\\?token=([\\w-]+)");

	@LocalServerPort
	int port;

	@Autowired
	RecordingEmailSender mail;

	@Autowired
	MutableClock clock;

	ApiClient browser;

	String email;

	@BeforeEach
	void aNewVisitor() {
		clock.set(TestSubstitutes.START);
		browser = new ApiClient(port);
		email = "fish-" + UUID.randomUUID() + "@example.com";
	}

	@Test
	void theResetLinkSetsANewPasswordAndTheOldOneStopsWorking() {
		confirmedAccount("en");

		Response asked = forgotPassword(email);
		Response reset = resetPassword(resetToken(), NEW_PASSWORD);

		assertThat(asked.status()).isEqualTo(204);
		assertThat(reset.status()).isEqualTo(204);
		assertThat(logIn(email, PASSWORD).status()).isEqualTo(401);
		assertThat(logIn(email, NEW_PASSWORD).status()).isEqualTo(200);
	}

	@Test
	void aResetEndsTheSessionsThatWereAlreadyLoggedIn() {
		confirmedAccount("en");
		ApiClient otherBrowser = new ApiClient(port);
		otherBrowser.post("/api/auth/login", Map.of("email", email, "password", PASSWORD));
		assertThat(otherBrowser.get("/api/me").status()).isEqualTo(200);

		clock.advance(Duration.ofMinutes(5));
		forgotPassword(email);
		resetPassword(resetToken(), NEW_PASSWORD);

		assertThat(otherBrowser.get("/api/me").status()).isEqualTo(401);
		// A login right after the reset, at the same instant, is a new session and stays.
		assertThat(logIn(email, NEW_PASSWORD).status()).isEqualTo(200);
		assertThat(browser.get("/api/me").status()).isEqualTo(200);
	}

	@Test
	void askingNeverRevealsWhetherAnAddressHasAnAccount() {
		confirmedAccount("en");
		mail.clear();

		Response known = forgotPassword(email);
		Response unknown = forgotPassword("nobody-" + email);

		assertThat(unknown.status()).isEqualTo(known.status()).isEqualTo(204);
		assertThat(unknown.body()).isEqualTo(known.body());
		assertThat(mail.sentTo(email)).hasSize(1);
		assertThat(mail.sentTo("nobody-" + email)).isEmpty();
	}

	@Test
	void theResetEmailIsInTheLanguageOfTheAccount() {
		confirmedAccount("pt-BR");
		forgotPassword(email);

		Email sent = mail.sentTo(email).getLast();
		assertThat(sent.subject()).isEqualTo("Redefina sua senha");
		assertThat(sent.body()).contains("nova senha");
	}

	@Test
	void theResetEmailIsInEnglishForAnEnglishAccount() {
		confirmedAccount("en");
		forgotPassword(email);

		assertThat(mail.sentTo(email).getLast().subject()).isEqualTo("Reset your password");
	}

	@Test
	void theLinkWorksOnlyOnce() {
		confirmedAccount("en");
		forgotPassword(email);
		String token = resetToken();
		resetPassword(token, NEW_PASSWORD);

		Response again = resetPassword(token, "someone else's choice");

		assertThat(again.status()).isEqualTo(400);
		assertThat(again.field("code")).isEqualTo("invalid_link");
		assertThat(logIn(email, NEW_PASSWORD).status()).isEqualTo(200);
	}

	@Test
	void theLinkWorksOnceEvenWhenUsedTwiceAtTheSameTime() throws Exception {
		confirmedAccount("en");
		forgotPassword(email);
		String token = resetToken();
		int attempts = 6;

		try (ExecutorService pool = Executors.newFixedThreadPool(attempts)) {
			CountDownLatch go = new CountDownLatch(1);
			List<Future<Integer>> statuses = IntStream.range(0, attempts).mapToObj(attempt -> pool.submit(() -> {
				ApiClient someoneElse = new ApiClient(port);
				go.await();
				return someoneElse.post("/api/auth/reset-password",
						Map.of("token", token, "password", "passphrase number " + attempt)).status();
			})).toList();
			go.countDown();

			List<Integer> results = new ArrayList<>();
			for (Future<Integer> status : statuses) {
				results.add(status.get());
			}
			assertThat(results).filteredOn(status -> status == 204).hasSize(1);
		}
	}

	@Test
	void theLinkExpiresAfterAnHour() {
		confirmedAccount("en");
		forgotPassword(email);
		String token = resetToken();

		clock.advance(Duration.ofHours(1));
		Response response = resetPassword(token, NEW_PASSWORD);

		assertThat(response.status()).isEqualTo(400);
		assertThat(response.field("code")).isEqualTo("invalid_link");
		assertThat(logIn(email, PASSWORD).status()).isEqualTo(200);
	}

	@Test
	void theLinkStillWorksJustBeforeItExpires() {
		confirmedAccount("en");
		forgotPassword(email);
		String token = resetToken();

		clock.advance(Duration.ofMinutes(59));

		assertThat(resetPassword(token, NEW_PASSWORD).status()).isEqualTo(204);
	}

	@Test
	void askingAgainReplacesTheOlderLink() {
		confirmedAccount("en");
		forgotPassword(email);
		String first = resetToken();
		forgotPassword(email);
		String second = resetToken();

		assertThat(second).isNotEqualTo(first);
		assertThat(resetPassword(first, NEW_PASSWORD).status()).isEqualTo(400);
		assertThat(resetPassword(second, NEW_PASSWORD).status()).isEqualTo(204);
	}

	@Test
	void aLinkThatWasNeverSentIsRefused() {
		Response response = resetPassword("made-up-token", NEW_PASSWORD);

		assertThat(response.status()).isEqualTo(400);
		assertThat(response.field("code")).isEqualTo("invalid_link");
	}

	@Test
	void aShortOrTooLongNewPasswordIsRefusedAndTheLinkKeepsWorking() {
		confirmedAccount("en");
		forgotPassword(email);
		String token = resetToken();

		Response tooShort = resetPassword(token, "short");
		Response tooLong = resetPassword(token, "x".repeat(73));

		assertThat(tooShort.status()).isEqualTo(400);
		assertThat(tooShort.field("fields")).isEqualTo(Map.of("password", "too_short"));
		assertThat(tooLong.status()).isEqualTo(400);
		assertThat(tooLong.field("fields")).isEqualTo(Map.of("password", "too_long"));
		assertThat(logIn(email, PASSWORD).status()).isEqualTo(200);
		assertThat(resetPassword(token, NEW_PASSWORD).status()).isEqualTo(204);
	}

	@Test
	void aConfirmationLinkIsNotAResetLink() {
		browser.post("/api/auth/signup", Map.of("email", email, "password", PASSWORD, "language", "en"));
		Matcher matcher = CONFIRMATION_LINK.matcher(mail.sentTo(email).getFirst().body());
		assertThat(matcher.find()).isTrue();

		assertThat(resetPassword(matcher.group(1), NEW_PASSWORD).status()).isEqualTo(400);
	}

	@Test
	void resettingThroughTheMailboxAlsoConfirmsAnAccountThatNeverConfirmed() {
		browser.post("/api/auth/signup", Map.of("email", email, "password", PASSWORD, "language", "en"));
		forgotPassword(email);

		resetPassword(resetToken(), NEW_PASSWORD);

		assertThat(logIn(email, NEW_PASSWORD).status()).isEqualTo(200);
	}

	private String resetToken() {
		Email sent = mail.sentTo(email).getLast();
		Matcher matcher = RESET_LINK.matcher(sent.body());
		assertThat(matcher.find()).as("a reset link in:\n" + sent.body()).isTrue();
		return matcher.group(1);
	}

	private void confirmedAccount(String language) {
		browser.post("/api/auth/signup", Map.of("email", email, "password", PASSWORD, "language", language));
		Matcher matcher = CONFIRMATION_LINK.matcher(mail.sentTo(email).getFirst().body());
		assertThat(matcher.find()).isTrue();
		browser.post("/api/auth/confirm", Map.of("token", matcher.group(1)));
	}

	private Response forgotPassword(String address) {
		return browser.post("/api/auth/forgot-password", Map.of("email", address));
	}

	private Response resetPassword(String token, String password) {
		return browser.post("/api/auth/reset-password", Map.of("token", token, "password", password));
	}

	private Response logIn(String address, String password) {
		return browser.post("/api/auth/login", Map.of("email", address, "password", password));
	}

}
