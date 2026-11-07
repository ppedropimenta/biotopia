package dev.pedropim.aquarium.identity;

import java.time.Clock;
import java.time.Duration;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Component;

import dev.pedropim.aquarium.web.ApiException;
import jakarta.servlet.http.HttpServletRequest;

/**
 * Limits on guessing passwords and on hammering the open routes. Past a limit the answer is 429 and nothing else
 * happens, so a refused login costs no bcrypt hash. Every limit ends on its own as the window moves on: there is no
 * lockout, and a password reset does not go through the per-account limits.
 */
@Component
class RateLimits {

	private static final int MAX_KEYS = 10_000;

	/** Failed logins of one account from one address. */
	private final RecentEvents failuresOfAccountFromAddress = new RecentEvents(5, Duration.ofMinutes(15), MAX_KEYS);

	/** Failed logins of one account from anywhere. */
	private final RecentEvents failuresOfAccount = new RecentEvents(50, Duration.ofHours(1), MAX_KEYS);

	/** Every request to an open route, from one address. */
	private final RecentEvents openRouteRequests;

	private final RecentEvents signUps;

	private final Clock clock;

	/**
	 * The two limits by address can be raised in configuration, for the browser tests: they reach the app through the
	 * dev server, so all of their journeys come from one address. Production uses the defaults.
	 */
	RateLimits(Clock clock, @Value("${app.rate-limits.open-route-requests-per-minute:30}") int openRouteRequestsPerMinute,
			@Value("${app.rate-limits.sign-ups-per-hour:5}") int signUpsPerHour) {
		this.clock = clock;
		this.openRouteRequests = new RecentEvents(openRouteRequestsPerMinute, Duration.ofMinutes(1), MAX_KEYS);
		this.signUps = new RecentEvents(signUpsPerHour, Duration.ofHours(1), MAX_KEYS);
	}

	/** Counts a request to an open route (login, signup, confirmation, resend, forgot and reset). */
	void openRoute(HttpServletRequest request) {
		refuseUnless(openRouteRequests.tryAdd(ClientAddress.of(request), clock.instant()));
	}

	void signUp(HttpServletRequest request) {
		refuseUnless(signUps.tryAdd(ClientAddress.of(request), clock.instant()));
	}

	/** Refuses a login before any hash is computed. Counts nothing: only failures count. */
	void checkLogin(String email, HttpServletRequest request) {
		var now = clock.instant();
		refuseUnless(!failuresOfAccountFromAddress.isFull(accountAndAddress(email, request), now)
				&& !failuresOfAccount.isFull(email, now));
	}

	void loginFailed(String email, HttpServletRequest request) {
		var now = clock.instant();
		failuresOfAccountFromAddress.add(accountAndAddress(email, request), now);
		failuresOfAccount.add(email, now);
	}

	private static String accountAndAddress(String email, HttpServletRequest request) {
		return email + "|" + ClientAddress.of(request);
	}

	private static void refuseUnless(boolean allowed) {
		if (!allowed) {
			throw new ApiException(HttpStatus.TOO_MANY_REQUESTS, "too_many_requests");
		}
	}

}
