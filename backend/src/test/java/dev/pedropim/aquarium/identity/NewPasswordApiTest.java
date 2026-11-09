package dev.pedropim.aquarium.identity;

import static org.assertj.core.api.Assertions.assertThat;

import java.text.Normalizer;
import java.util.Map;
import java.util.UUID;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.web.server.LocalServerPort;

import dev.pedropim.aquarium.support.ApiClient;
import dev.pedropim.aquarium.support.ApiClient.Response;
import dev.pedropim.aquarium.support.ApiTest;
import dev.pedropim.aquarium.support.MutableClock;
import dev.pedropim.aquarium.support.RecordingEmailSender;
import dev.pedropim.aquarium.support.TestSubstitutes;

/** What a password being chosen must be, on sign-up and on reset, and how it is compared afterwards. */
@ApiTest
class NewPasswordApiTest {

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
		email = "loach-" + UUID.randomUUID() + "@example.com";
	}

	@Test
	void tenCharactersAreEnoughAndNineAreNot() {
		assertThat(signUp("ninechars").field("fields")).isEqualTo(Map.of("password", "too_short"));
		assertThat(signUp("tenletters").status()).isEqualTo(201);
	}

	@Test
	void eachCharacterCountsOnceHoweverManyBytesItTakes() {
		// A fish is two UTF-16 code units and four bytes, but one character.
		assertThat(signUp("🐟".repeat(9)).field("fields")).isEqualTo(Map.of("password", "too_short"));
		assertThat(signUp("🐟".repeat(10)).status()).isEqualTo(201);
	}

	@Test
	void moreThanSeventyTwoBytesIsTooLongForBcrypt() {
		// 37 accented letters are only 37 characters, but 74 bytes.
		assertThat(signUp("é".repeat(37)).field("fields")).isEqualTo(Map.of("password", "too_long"));
	}

	@Test
	void aPasswordWithTheEmailOrTheAppsNameIsRefused() {
		String localPart = email.substring(0, email.indexOf('@'));

		assertThat(signUp("my " + localPart.toUpperCase() + " pass").field("fields")).isEqualTo(Map.of("password", "personal"));
		assertThat(signUp("i love Biotopia").field("fields")).isEqualTo(Map.of("password", "personal"));
		assertThat(mail.sentTo(email)).isEmpty();
	}

	@Test
	void aResetRefusesAPersonalPasswordAndTheLinkKeepsWorking() {
		confirmedAccount("correct horse battery");
		browser.post("/api/auth/forgot-password", Map.of("email", email));
		String token = resetToken();

		Response personal = resetPassword(token, "biotopia rocks forever");

		assertThat(personal.status()).isEqualTo(400);
		assertThat(personal.field("fields")).isEqualTo(Map.of("password", "personal"));
		assertThat(resetPassword(token, "a brand new passphrase").status()).isEqualTo(204);
	}

	@Test
	void aPasswordTypedWithCombiningAccentsMatchesTheSameWithAccentedLetters() {
		String composed = Normalizer.normalize("água e coração", Normalizer.Form.NFC);
		String decomposed = Normalizer.normalize(composed, Normalizer.Form.NFD);
		assertThat(decomposed).isNotEqualTo(composed);

		confirmedAccount(composed);

		assertThat(logIn(decomposed).status()).isEqualTo(200);
	}

	private Response signUp(String password) {
		return browser.post("/api/auth/signup", Map.of("email", email, "password", password, "language", "en"));
	}

	private void confirmedAccount(String password) {
		assertThat(signUp(password).status()).isEqualTo(201);
		Matcher matcher = CONFIRMATION_LINK.matcher(mail.sentTo(email).getFirst().body());
		assertThat(matcher.find()).isTrue();
		browser.post("/api/auth/confirm", Map.of("token", matcher.group(1)));
	}

	private String resetToken() {
		Matcher matcher = RESET_LINK.matcher(mail.sentTo(email).getLast().body());
		assertThat(matcher.find()).isTrue();
		return matcher.group(1);
	}

	private Response resetPassword(String token, String password) {
		return browser.post("/api/auth/reset-password", Map.of("token", token, "password", password));
	}

	private Response logIn(String password) {
		return browser.post("/api/auth/login", Map.of("email", email, "password", password));
	}

}
