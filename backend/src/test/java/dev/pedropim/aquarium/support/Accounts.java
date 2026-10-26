package dev.pedropim.aquarium.support;

import static org.assertj.core.api.Assertions.assertThat;

import java.util.Map;
import java.util.UUID;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

/**
 * Gives a test a logged-in browser, without repeating the sign-up, confirmation and login steps.
 */
public final class Accounts {

	public static final String PASSWORD = "correct horse battery";

	private static final Pattern CONFIRMATION_LINK = Pattern.compile("https?://\\S+/confirm\\?token=([\\w-]+)");

	private Accounts() {
	}

	/** A new browser logged in as a new, confirmed user. */
	public static ApiClient loggedInBrowser(int port, RecordingEmailSender mail) {
		String email = "keeper-" + UUID.randomUUID() + "@example.com";
		ApiClient browser = new ApiClient(port);
		browser.post("/api/auth/signup", Map.of("email", email, "password", PASSWORD, "language", "en"));
		Matcher link = CONFIRMATION_LINK.matcher(mail.sentTo(email).getFirst().body());
		assertThat(link.find()).as("a confirmation link for " + email).isTrue();
		browser.post("/api/auth/confirm", Map.of("token", link.group(1)));
		assertThat(browser.post("/api/auth/login", Map.of("email", email, "password", PASSWORD)).status())
			.isEqualTo(200);
		return browser;
	}

}
