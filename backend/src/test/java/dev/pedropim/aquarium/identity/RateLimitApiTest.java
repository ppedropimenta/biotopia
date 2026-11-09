package dev.pedropim.aquarium.identity;

import static org.assertj.core.api.Assertions.assertThat;

import java.time.Duration;
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
import dev.pedropim.aquarium.support.MutableClock;
import dev.pedropim.aquarium.support.RecordingEmailSender;

/**
 * Guessing passwords and hammering the open routes stop at volume. Each test uses its own addresses and accounts,
 * and the browsers of {@link ApiClient} each have an address, so tests do not count against each other.
 */
@ApiTest
class RateLimitApiTest {

	private static final String PASSWORD = "correct horse battery";

	private static final Pattern LINK = Pattern.compile("token=([\\w-]+)");

	@LocalServerPort
	int port;

	@Autowired
	RecordingEmailSender mail;

	@Autowired
	MutableClock clock;

	@Test
	void fiveWrongPasswordsFromOneAddressStopThatAddressEvenWithTheRightPassword() {
		String email = confirmedAccount();
		ApiClient attacker = new ApiClient(port);
		for (int i = 0; i < 5; i++) {
			assertThat(login(attacker, email, "wrong-" + i).status()).isEqualTo(401);
		}

		Response refused = login(attacker, email, PASSWORD);

		assertThat(refused.status()).isEqualTo(429);
		assertThat(refused.field("code")).isEqualTo("too_many_requests");
	}

	@Test
	void theOwnerFromAnotherAddressStillLogsInWhileOneAddressIsStopped() {
		String email = confirmedAccount();
		ApiClient attacker = new ApiClient(port);
		for (int i = 0; i < 6; i++) {
			login(attacker, email, "wrong-" + i);
		}

		assertThat(login(new ApiClient(port), email, PASSWORD).status()).isEqualTo(200);
	}

	@Test
	void theLimitEndsOnItsOwn() {
		String email = confirmedAccount();
		ApiClient attacker = new ApiClient(port);
		for (int i = 0; i < 5; i++) {
			login(attacker, email, "wrong-" + i);
		}
		assertThat(login(attacker, email, PASSWORD).status()).isEqualTo(429);

		clock.advance(Duration.ofMinutes(16));

		assertThat(login(attacker, email, PASSWORD).status()).isEqualTo(200);
	}

	@Test
	void manyAddressesGuessingOneAccountAreStoppedByTheAccountLimitAndOwnerCanStillReset() {
		String email = confirmedAccount();
		for (int i = 0; i < 50; i++) {
			assertThat(login(new ApiClient(port), email, "wrong-" + i).status()).isEqualTo(401);
		}

		assertThat(login(new ApiClient(port), email, "wrong-51").status()).isEqualTo(429);
		assertThat(login(new ApiClient(port), email, PASSWORD).status()).isEqualTo(429);

		ApiClient owner = new ApiClient(port);
		assertThat(owner.post("/api/auth/forgot-password", Map.of("email", email)).status()).isEqualTo(204);
		String link = tokenIn(mail.sentTo(email).getLast().body());
		assertThat(owner.post("/api/auth/reset-password", Map.of("token", link, "password", "a brand new passphrase")).status())
			.isEqualTo(204);

		clock.advance(Duration.ofMinutes(61));
		assertThat(login(owner, email, "a brand new passphrase").status()).isEqualTo(200);
	}

	@Test
	void anUnknownAddressIsCountedAndAnsweredLikeAKnownOne() {
		String unknown = "nobody-" + UUID.randomUUID() + "@example.com";
		ApiClient attacker = new ApiClient(port);
		for (int i = 0; i < 5; i++) {
			assertThat(login(attacker, unknown, "wrong-" + i).status()).isEqualTo(401);
		}

		Response refused = login(attacker, unknown, "wrong-6");

		assertThat(refused.status()).isEqualTo(429);
		assertThat(refused.field("code")).isEqualTo("too_many_requests");
	}

	@Test
	void successfulLoginsDoNotCountTowardTheAccountLimits() {
		String email = confirmedAccount();
		ApiClient owner = new ApiClient(port);
		for (int i = 0; i < 8; i++) {
			assertThat(login(owner, email, PASSWORD).status()).isEqualTo(200);
		}
	}

	@Test
	void thirtyRequestsAMinuteFromOneAddressOnTheOpenRoutesThenAnswer429() {
		ApiClient visitor = new ApiClient(port);
		for (int i = 0; i < 30; i++) {
			assertThat(visitor.post("/api/auth/forgot-password", Map.of("email", "nobody-" + i + "@example.com")).status())
				.isEqualTo(204);
		}

		assertThat(visitor.post("/api/auth/forgot-password", Map.of("email", "nobody@example.com")).status()).isEqualTo(429);
		assertThat(visitor.post("/api/auth/resend-confirmation", Map.of("email", "nobody@example.com")).status())
			.isEqualTo(429);
		assertThat(visitor.post("/api/auth/confirm", Map.of("token", "x")).status()).isEqualTo(429);

		clock.advance(Duration.ofMinutes(2));
		assertThat(visitor.post("/api/auth/forgot-password", Map.of("email", "nobody@example.com")).status()).isEqualTo(204);
	}

	@Test
	void fiveSignUpsAnHourFromOneAddressThenAnswer429() {
		ApiClient visitor = new ApiClient(port);
		for (int i = 0; i < 5; i++) {
			assertThat(signUp(visitor).status()).isEqualTo(201);
		}

		assertThat(signUp(visitor).status()).isEqualTo(429);
		assertThat(signUp(new ApiClient(port)).status()).isEqualTo(201);

		clock.advance(Duration.ofMinutes(61));
		assertThat(signUp(visitor).status()).isEqualTo(201);
	}

	@Test
	void anIpv6AddressCountsByItsSlash64Block() {
		String email = confirmedAccount();
		ApiClient first = new ApiClient(port, "2001:db8:aaaa:bbbb::1");
		ApiClient sameBlock = new ApiClient(port, "2001:db8:aaaa:bbbb:1234:5678:9abc:def0");
		ApiClient otherBlock = new ApiClient(port, "2001:db8:aaaa:cccc::1");
		for (int i = 0; i < 5; i++) {
			login(first, email, "wrong-" + i);
		}

		assertThat(login(sameBlock, email, PASSWORD).status()).isEqualTo(429);
		assertThat(login(otherBlock, email, PASSWORD).status()).isEqualTo(200);
	}

	@Test
	void theServerSeesHttpsWhenTheProxySaysSoSoTheCsrfCookieIsSecureAndHstsIsSent() {
		ApiClient browser = new ApiClient(port);

		ApiClient.Headers viaHttps = browser.headersOf("/api/me", "https");
		ApiClient.Headers viaHttp = browser.headersOf("/api/me", "http");

		assertThat(viaHttps.setCookies()).anyMatch(cookie -> cookie.startsWith("XSRF-TOKEN=") && cookie.contains("Secure"));
		assertThat(viaHttps.strictTransportSecurity()).contains("max-age");
		assertThat(viaHttp.setCookies()).noneMatch(cookie -> cookie.contains("Secure"));
		assertThat(viaHttp.strictTransportSecurity()).isNull();
	}

	@Test
	void aSecondResetRequestWithinTwoMinutesSendsNothingAndTheFirstLinkKeepsWorking() {
		String email = confirmedAccount();
		ApiClient visitor = new ApiClient(port);
		mail.clear();
		assertThat(visitor.post("/api/auth/forgot-password", Map.of("email", email)).status()).isEqualTo(204);
		String firstLink = tokenIn(mail.sentTo(email).getLast().body());

		clock.advance(Duration.ofSeconds(90));
		assertThat(visitor.post("/api/auth/forgot-password", Map.of("email", email)).status()).isEqualTo(204);
		assertThat(new ApiClient(port).post("/api/auth/forgot-password", Map.of("email", email)).status()).isEqualTo(204);

		assertThat(mail.sentTo(email)).hasSize(1);
		assertThat(visitor.post("/api/auth/reset-password", Map.of("token", firstLink, "password", "a brand new passphrase"))
			.status()).isEqualTo(204);
	}

	@Test
	void afterTwoMinutesANewResetEmailGoesOutAndReplacesTheOlderLink() {
		String email = confirmedAccount();
		ApiClient visitor = new ApiClient(port);
		mail.clear();
		visitor.post("/api/auth/forgot-password", Map.of("email", email));
		String firstLink = tokenIn(mail.sentTo(email).getLast().body());

		clock.advance(Duration.ofMinutes(2).plusSeconds(1));
		visitor.post("/api/auth/forgot-password", Map.of("email", email));

		assertThat(mail.sentTo(email)).hasSize(2);
		assertThat(visitor.post("/api/auth/reset-password", Map.of("token", firstLink, "password", "a brand new passphrase"))
			.status()).isEqualTo(400);
	}

	@Test
	void fiveEmailsADayToOneAddressThenNothingUntilTheDayIsOver() {
		String email = confirmedAccount();
		ApiClient visitor = new ApiClient(port);
		mail.clear();
		for (int i = 0; i < 8; i++) {
			assertThat(visitor.post("/api/auth/forgot-password", Map.of("email", email)).status()).isEqualTo(204);
			clock.advance(Duration.ofMinutes(3));
		}
		assertThat(mail.sentTo(email)).hasSize(5);

		clock.advance(Duration.ofHours(24));
		visitor.post("/api/auth/forgot-password", Map.of("email", email));
		assertThat(mail.sentTo(email)).hasSize(6);
	}

	@Test
	void resendConfirmationHasTheSameLimitAndTheSameAddressSharesItWhateverTheCase() {
		String email = "ana-" + UUID.randomUUID() + "@example.com";
		ApiClient visitor = new ApiClient(port);
		visitor.post("/api/auth/signup", Map.of("email", email, "password", PASSWORD, "language", "en"));
		mail.clear();

		assertThat(visitor.post("/api/auth/resend-confirmation", Map.of("email", " " + email.toUpperCase() + " ")).status())
			.isEqualTo(204);
		assertThat(visitor.post("/api/auth/resend-confirmation", Map.of("email", email)).status()).isEqualTo(204);
		assertThat(visitor.post("/api/auth/forgot-password", Map.of("email", email)).status()).isEqualTo(204);

		assertThat(mail.sentTo(email)).hasSize(1);
	}

	@Test
	void anUnknownAddressGetsTheSameAnswerForEveryRequest() {
		String unknown = "nobody-" + UUID.randomUUID() + "@example.com";
		ApiClient visitor = new ApiClient(port);

		assertThat(visitor.post("/api/auth/forgot-password", Map.of("email", unknown)).status()).isEqualTo(204);
		assertThat(visitor.post("/api/auth/forgot-password", Map.of("email", unknown)).status()).isEqualTo(204);
		assertThat(visitor.post("/api/auth/resend-confirmation", Map.of("email", unknown)).status()).isEqualTo(204);
		assertThat(mail.sentTo(unknown)).isEmpty();
	}

	private String confirmedAccount() {
		String email = "keeper-" + UUID.randomUUID() + "@example.com";
		ApiClient browser = new ApiClient(port);
		browser.post("/api/auth/signup", Map.of("email", email, "password", PASSWORD, "language", "en"));
		browser.post("/api/auth/confirm", Map.of("token", tokenIn(mail.sentTo(email).getFirst().body())));
		return email;
	}

	private Response signUp(ApiClient browser) {
		return browser.post("/api/auth/signup",
				Map.of("email", "new-" + UUID.randomUUID() + "@example.com", "password", PASSWORD, "language", "en"));
	}

	private static Response login(ApiClient browser, String email, String password) {
		return browser.post("/api/auth/login", Map.of("email", email, "password", password));
	}

	private static String tokenIn(String body) {
		Matcher link = LINK.matcher(body);
		assertThat(link.find()).isTrue();
		return link.group(1);
	}

}
