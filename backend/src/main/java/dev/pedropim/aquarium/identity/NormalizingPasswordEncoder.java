package dev.pedropim.aquarium.identity;

import org.springframework.security.crypto.password.PasswordEncoder;

/**
 * Hashes and checks passwords in their normalized form ({@link PasswordRules#normalized}), so a password typed with
 * a combining accent on one device matches the same password typed with a single accented letter on another. Every
 * hash and every check goes through here: sign-up, reset, login and account deletion.
 */
final class NormalizingPasswordEncoder implements PasswordEncoder {

	private final PasswordEncoder encoder;

	NormalizingPasswordEncoder(PasswordEncoder encoder) {
		this.encoder = encoder;
	}

	@Override
	public String encode(CharSequence rawPassword) {
		return encoder.encode(PasswordRules.normalized(rawPassword.toString()));
	}

	@Override
	public boolean matches(CharSequence rawPassword, String encodedPassword) {
		return encoder.matches(PasswordRules.normalized(rawPassword.toString()), encodedPassword);
	}

	@Override
	public boolean upgradeEncoding(String encodedPassword) {
		return encoder.upgradeEncoding(encodedPassword);
	}

}
