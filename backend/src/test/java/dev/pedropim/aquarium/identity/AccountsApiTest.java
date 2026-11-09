package dev.pedropim.aquarium.identity;

import static org.assertj.core.api.Assertions.assertThat;

import java.time.Duration;
import java.util.Map;
import java.util.UUID;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.web.server.LocalServerPort;

import dev.pedropim.aquarium.email.Email;
import dev.pedropim.aquarium.support.ApiClient;
import dev.pedropim.aquarium.support.ApiClient.Response;
import dev.pedropim.aquarium.support.MutableClock;
import dev.pedropim.aquarium.support.RecordingEmailSender;
import dev.pedropim.aquarium.support.ApiTest;
import dev.pedropim.aquarium.support.TestSubstitutes;

@ApiTest
class AccountsApiTest {

	private static final String PASSWORD = "correct horse battery";

	private static final Pattern LINK = Pattern.compile("https?://\\S+/confirm\\?token=([\\w-]+)");

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
	void signingUpCreatesAnUnconfirmedAccountAndEmailsAConfirmationLink() {
		Response response = signUp(email, PASSWORD, "en");

		assertThat(response.status()).isEqualTo(201);
		assertThat(mail.sentTo(email)).hasSize(1);
		Email sent = mail.sentTo(email).getFirst();
		assertThat(sent.subject()).isEqualTo("Confirm your email");
		assertThat(confirmationToken(sent)).isNotBlank();
	}

	@Test
	void theConfirmationEmailIsInTheLanguageOfTheAccount() {
		signUp(email, PASSWORD, "pt-BR");

		Email sent = mail.sentTo(email).getFirst();
		assertThat(sent.subject()).isEqualTo("Confirme seu e-mail");
		assertThat(sent.body()).contains("Bem-vindo");
		assertThat(sent.html()).contains("lang=\"pt-BR\"", "Bem-vindo", "Confirmar e-mail", "token=" + confirmationToken(sent))
			.contains("/email/cardinal.png");
	}

	@Test
	void signUpRefusesAnInvalidEmailAShortPasswordAndAnUnknownLanguage() {
		Response response = signUp("not-an-email", "short", "klingon");

		assertThat(response.status()).isEqualTo(400);
		assertThat(response.field("code")).isEqualTo("validation_failed");
		assertThat(response.field("fields")).isEqualTo(
				Map.of("email", "invalid", "password", "too_short", "language", "unsupported"));
		assertThat(mail.sentTo("not-an-email")).isEmpty();
	}

	@Test
	void signUpRefusesAPasswordTooLongForBcrypt() {
		Response response = signUp(email, "x".repeat(73), "en");

		assertThat(response.status()).isEqualTo(400);
		assertThat(response.field("fields")).isEqualTo(Map.of("password", "too_long"));
	}

	@Test
	void signUpRefusesAnEmailThatAlreadyHasAnAccountEvenIfWrittenDifferently() {
		signUp(email, PASSWORD, "en");

		Response again = signUp("  " + email.toUpperCase() + " ", PASSWORD, "en");

		assertThat(again.status()).isEqualTo(409);
		assertThat(again.field("code")).isEqualTo("email_taken");
	}

	@Test
	void aWriteWithoutTheCsrfTokenIsRefused() {
		Response response = browser.postWithoutCsrfToken("/api/auth/signup",
				Map.of("email", email, "password", PASSWORD, "language", "en"));

		assertThat(response.status()).isEqualTo(403);
		assertThat(mail.sentTo(email)).isEmpty();
	}

	@Test
	void anUnconfirmedAccountCannotLogInAndIsToldWhy() {
		signUp(email, PASSWORD, "en");

		Response response = logIn(email, PASSWORD);

		assertThat(response.status()).isEqualTo(403);
		assertThat(response.field("code")).isEqualTo("email_not_confirmed");
		assertThat(browser.get("/api/me").status()).isEqualTo(401);
	}

	@Test
	void aWrongPasswordAndAnUnknownEmailLookTheSame() {
		signUp(email, PASSWORD, "en");

		Response wrongPassword = logIn(email, "not the password");
		Response unknownEmail = logIn("nobody-" + email, PASSWORD);

		assertThat(wrongPassword.status()).isEqualTo(401);
		assertThat(wrongPassword.body()).isEqualTo(unknownEmail.body());
		assertThat(wrongPassword.field("code")).isEqualTo("invalid_credentials");
	}

	@Test
	void theConfirmationLinkConfirmsTheAccountAndThenLoginWorks() {
		signUp(email, PASSWORD, "en");

		Response confirmed = confirm(confirmationToken(mail.sentTo(email).getFirst()));
		Response login = logIn(email, PASSWORD);

		assertThat(confirmed.status()).isEqualTo(204);
		assertThat(login.status()).isEqualTo(200);
		assertThat(login.field("email")).isEqualTo(email);
		assertThat(browser.get("/api/me").field("email")).isEqualTo(email);
	}

	@Test
	void theConfirmationLinkWorksOnlyOnce() {
		signUp(email, PASSWORD, "en");
		String token = confirmationToken(mail.sentTo(email).getFirst());
		confirm(token);

		Response again = confirm(token);

		assertThat(again.status()).isEqualTo(400);
		assertThat(again.field("code")).isEqualTo("invalid_link");
	}

	@Test
	void theConfirmationLinkExpiresAfterADay() {
		signUp(email, PASSWORD, "en");
		String token = confirmationToken(mail.sentTo(email).getFirst());

		clock.advance(Duration.ofHours(24));
		Response response = confirm(token);

		assertThat(response.status()).isEqualTo(400);
		assertThat(response.field("code")).isEqualTo("invalid_link");
		assertThat(logIn(email, PASSWORD).status()).isEqualTo(403);
	}

	@Test
	void aLinkThatWasNeverSentIsRefused() {
		assertThat(confirm("made-up-token").status()).isEqualTo(400);
	}

	@Test
	void resendingSendsANewLinkAndTheOldOneStopsWorking() {
		signUp(email, PASSWORD, "en");
		String first = confirmationToken(mail.sentTo(email).getFirst());

		Response resend = browser.post("/api/auth/resend-confirmation", Map.of("email", email));
		String second = confirmationToken(mail.sentTo(email).getLast());

		assertThat(resend.status()).isEqualTo(204);
		assertThat(mail.sentTo(email)).hasSize(2);
		assertThat(second).isNotEqualTo(first);
		assertThat(confirm(first).status()).isEqualTo(400);
		assertThat(confirm(second).status()).isEqualTo(204);
	}

	@Test
	void resendingNeverRevealsWhetherAnAddressHasAnAccount() {
		signUp(email, PASSWORD, "en");
		confirm(confirmationToken(mail.sentTo(email).getFirst()));
		mail.clear();

		Response confirmedAccount = browser.post("/api/auth/resend-confirmation", Map.of("email", email));
		Response noAccount = browser.post("/api/auth/resend-confirmation", Map.of("email", "nobody-" + email));

		assertThat(confirmedAccount.status()).isEqualTo(204);
		assertThat(noAccount.status()).isEqualTo(204);
		assertThat(mail.sentTo(email)).isEmpty();
		assertThat(mail.sentTo("nobody-" + email)).isEmpty();
	}

	@Test
	void theSessionCookieOutlivesTheBrowserWindow() {
		confirmedAccount("en");
		logIn(email, PASSWORD);

		// The client counts the seconds that already passed since the cookie arrived.
		assertThat(browser.cookieMaxAge("JSESSIONID")).isBetween(Duration.ofDays(30).toSeconds() - 60,
				Duration.ofDays(30).toSeconds());
	}

	@Test
	void notKeepingMeLoggedInGivesACookieThatDiesWithTheBrowser() {
		confirmedAccount("en");

		Response login = browser.post("/api/auth/login",
				Map.of("email", email, "password", PASSWORD, "remember", false));

		assertThat(login.status()).isEqualTo(200);
		assertThat(browser.cookieMaxAge("JSESSIONID")).isEqualTo(-1);
		assertThat(browser.get("/api/me").status()).isEqualTo(200);
	}

	@Test
	void keepingMeLoggedInGivesTheThirtyDayCookie() {
		confirmedAccount("en");

		browser.post("/api/auth/login", Map.of("email", email, "password", PASSWORD, "remember", true));

		assertThat(browser.cookieMaxAge("JSESSIONID")).isBetween(Duration.ofDays(30).toSeconds() - 60,
				Duration.ofDays(30).toSeconds());
	}

	@Test
	void loggingOutEndsTheSession() {
		confirmedAccount("en");
		logIn(email, PASSWORD);
		assertThat(browser.get("/api/me").status()).isEqualTo(200);

		Response logout = browser.post("/api/auth/logout", null);

		assertThat(logout.status()).isEqualTo(204);
		assertThat(browser.get("/api/me").status()).isEqualTo(401);
	}

	@Test
	void theLanguageChosenInTheAppIsSavedOnTheAccountAndRestoredOnLogin() {
		confirmedAccount("en");
		logIn(email, PASSWORD);

		Response saved = browser.put("/api/me/language", Map.of("language", "pt-BR"));
		browser.post("/api/auth/logout", null);
		Response login = logIn(email, PASSWORD);

		assertThat(saved.status()).isEqualTo(204);
		assertThat(login.field("language")).isEqualTo("pt-BR");
		assertThat(browser.get("/api/me").field("language")).isEqualTo("pt-BR");
	}

	@Test
	void theLanguageChosenAtSignUpIsTheOneRestoredOnLogin() {
		confirmedAccount("pt-BR");

		Response login = logIn(email, PASSWORD);

		assertThat(login.field("language")).isEqualTo("pt-BR");
	}

	@Test
	void anUnsupportedLanguageIsRefused() {
		confirmedAccount("en");
		logIn(email, PASSWORD);

		Response response = browser.put("/api/me/language", Map.of("language", "klingon"));

		assertThat(response.status()).isEqualTo(400);
		assertThat(browser.get("/api/me").field("language")).isEqualTo("en");
	}

	@Test
	void changingTheLanguageNeedsALogin() {
		assertThat(browser.put("/api/me/language", Map.of("language", "en")).status()).isEqualTo(401);
	}

	@Test
	void twoBrowsersHaveTwoSeparateSessions() {
		confirmedAccount("en");
		logIn(email, PASSWORD);

		assertThat(new ApiClient(port).get("/api/me").status()).isEqualTo(401);
	}

	@Test
	void aSessionOfADeletedAccountEndsOnTheOtherBrowser() {
		confirmedAccount("en");
		logIn(email, PASSWORD);
		ApiClient otherBrowser = new ApiClient(port);
		otherBrowser.post("/api/auth/login", Map.of("email", email, "password", PASSWORD));
		assertThat(otherBrowser.get("/api/me").status()).isEqualTo(200);

		assertThat(browser.post("/api/me/deletion", Map.of("password", PASSWORD)).status()).isEqualTo(204);

		assertThat(otherBrowser.get("/api/me").status()).isEqualTo(401);
		assertThat(otherBrowser.get("/api/tanks").status()).isEqualTo(401);
		assertThat(otherBrowser.post("/api/tanks", Map.of("name", "Ghost", "startDate", "2025-03-01")).status())
			.isEqualTo(401);
	}

	@Test
	void anAccountThatNeverHadAPasswordResetStaysLoggedIn() {
		confirmedAccount("en");
		logIn(email, PASSWORD);
		clock.advance(Duration.ofDays(1));

		assertThat(browser.get("/api/me").status()).isEqualTo(200);
		assertThat(browser.get("/api/tanks").status()).isEqualTo(200);
	}

	private void confirmedAccount(String language) {
		signUp(email, PASSWORD, language);
		confirm(confirmationToken(mail.sentTo(email).getFirst()));
	}

	private Response logIn(String address, String password) {
		return browser.post("/api/auth/login", Map.of("email", address, "password", password));
	}

	private Response confirm(String token) {
		return browser.post("/api/auth/confirm", Map.of("token", token));
	}

	private Response signUp(String address, String password, String language) {
		return browser.post("/api/auth/signup", Map.of("email", address, "password", password, "language", language));
	}

	private static String confirmationToken(Email email) {
		Matcher matcher = LINK.matcher(email.body());
		assertThat(matcher.find()).as("a confirmation link in:\n" + email.body()).isTrue();
		return matcher.group(1);
	}

}
