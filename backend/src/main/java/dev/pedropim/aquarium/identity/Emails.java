package dev.pedropim.aquarium.identity;

import java.util.Locale;

/**
 * One way of writing an email address, so "Ana@Example.com " and "ana@example.com" are the same account.
 */
final class Emails {

	private Emails() {
	}

	/** Trims the ends, before validation looks at the address. Null stays null for validation to refuse. */
	static String stripped(String email) {
		return email == null ? null : email.strip();
	}

	/** The form stored in the database and looked up at login. */
	static String normalized(String email) {
		return email.strip().toLowerCase(Locale.ROOT);
	}

}
