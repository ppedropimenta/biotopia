package dev.pedropim.aquarium.identity;

import java.nio.charset.StandardCharsets;
import java.text.Normalizer;
import java.util.Locale;
import java.util.Optional;

/**
 * What a new password must be. Length is the only rule on its makeup: no required digits or symbols, since those
 * lead to predictable passwords ("Password1!") rather than strong ones. A password that mentions the account's email
 * or the app's name is refused, being the first thing someone would try.
 * <p>
 * The minimum is 10 characters. NIST SP 800-63B asks for 15 when the password is the only factor; 10 was chosen for
 * usability while the app holds no sensitive data, and should be raised or paired with a second factor later. There is
 * no blocklist of common or breached passwords yet.
 */
final class PasswordRules {

	static final int MIN_LENGTH = 10;

	/** BCrypt only looks at the first 72 bytes, so longer passwords are refused instead of silently cut. */
	static final int MAX_BYTES = 72;

	/** Shorter parts of an address ("ana") show up in ordinary words, so only these are checked. */
	private static final int MIN_PERSONAL_LENGTH = 4;

	private static final String APP_NAME = "biotopia";

	private PasswordRules() {
	}

	/**
	 * The same text whichever way it was typed: an accented letter can arrive as one character or as a letter plus a
	 * combining accent, and both must give the same hash.
	 */
	static String normalized(String password) {
		return Normalizer.normalize(password, Normalizer.Form.NFC);
	}

	/**
	 * {@code too_short} or {@code too_long}, if the password does not fit. Each character counts once, however many
	 * code units or bytes it takes.
	 */
	static Optional<String> lengthProblem(String password) {
		String text = normalized(password);
		if (text.codePointCount(0, text.length()) < MIN_LENGTH) {
			return Optional.of("too_short");
		}
		if (text.getBytes(StandardCharsets.UTF_8).length > MAX_BYTES) {
			return Optional.of("too_long");
		}
		return Optional.empty();
	}

	/** Whether the password contains the address, the part before the @, or the app's name, in any case. */
	static boolean isPersonal(String password, String email) {
		String text = normalized(password).toLowerCase(Locale.ROOT);
		String address = email.toLowerCase(Locale.ROOT);
		String localPart = address.substring(0, Math.max(address.indexOf('@'), 0));
		return text.contains(APP_NAME) || text.contains(address)
				|| (localPart.length() >= MIN_PERSONAL_LENGTH && text.contains(localPart));
	}

}
