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

	/** Emails with a link (confirmation again, password reset) to one address: one every 2 minutes... */
	private final RecentEvents emailsToAddressPerTwoMinutes = new RecentEvents(1, Duration.ofMinutes(2), MAX_KEYS);

	/** ...and five a day. */
	private final RecentEvents emailsToAddressPerDay = new RecentEvents(5, Duration.ofDays(1), MAX_KEYS);

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

	/**
	 * Whether a link email may go to this (normalized) address now. A request held back is not an error and is not
	 * counted, so the link the person already has keeps working (a new email would replace it). The caller counts every
	 * request the same, whether or not the address has an account, so the answer reveals nothing.
	 */
	boolean mayEmail(String address) {
		var now = clock.instant();
		synchronized (this) {
			if (emailsToAddressPerTwoMinutes.isFull(address, now) || emailsToAddressPerDay.isFull(address, now)) {
				return false;
			}
			emailsToAddressPerTwoMinutes.add(address, now);
			emailsToAddressPerDay.add(address, now);
			return true;
		}
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
