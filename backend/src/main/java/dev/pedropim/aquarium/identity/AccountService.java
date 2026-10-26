package dev.pedropim.aquarium.identity;

import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.security.SecureRandom;
import java.time.Clock;
import java.time.Duration;
import java.util.Base64;
import java.util.HexFormat;
import java.util.UUID;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.http.HttpStatus;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import dev.pedropim.aquarium.email.EmailSender;
import dev.pedropim.aquarium.web.ApiException;

@Service
class AccountService {

	static final int MIN_PASSWORD_LENGTH = 8;

	/** BCrypt only looks at the first 72 bytes, so longer passwords are refused instead of silently cut. */
	private static final int MAX_PASSWORD_BYTES = 72;

	private static final Duration CONFIRMATION_LINK_LIFETIME = Duration.ofHours(24);

	private final UserRepository users;

	private final ConfirmationTokenRepository tokens;

	private final PasswordEncoder passwordEncoder;

	private final EmailSender emailSender;

	private final Clock clock;

	private final String publicUrl;

	private final SecureRandom random = new SecureRandom();

	AccountService(UserRepository users, ConfirmationTokenRepository tokens, PasswordEncoder passwordEncoder,
			EmailSender emailSender, Clock clock, @Value("${app.public-url}") String publicUrl) {
		this.users = users;
		this.tokens = tokens;
		this.passwordEncoder = passwordEncoder;
		this.emailSender = emailSender;
		this.clock = clock;
		this.publicUrl = publicUrl;
	}

	/**
	 * Creates an unconfirmed account and emails the confirmation link. The email is sent inside the transaction on
	 * purpose: if it cannot be sent, no account is left behind that the visitor never heard about.
	 */
	@Transactional
	void signUp(String email, String password, Language language) {
		String address = Emails.normalized(email);
		if (password.getBytes(StandardCharsets.UTF_8).length > MAX_PASSWORD_BYTES) {
			throw ApiException.invalidField("password", "too_long");
		}
		if (users.existsByEmail(address)) {
			throw emailTaken();
		}
		User user = new User(address, passwordEncoder.encode(password), language, clock.instant());
		try {
			users.saveAndFlush(user);
		}
		catch (DataIntegrityViolationException twoSignUpsAtOnce) {
			throw emailTaken();
		}
		sendConfirmationLink(user);
	}

	/** Silent about who has an account: unknown and already confirmed addresses get nothing, and no error. */
	@Transactional
	void resendConfirmation(String email) {
		users.findByEmail(Emails.normalized(email)).filter(user -> !user.isConfirmed()).ifPresent(user -> {
			tokens.deleteByUserId(user.id());
			sendConfirmationLink(user);
		});
	}

	@Transactional
	void confirm(String token) {
		ConfirmationToken found = tokens.findById(hash(token)).orElseThrow(AccountService::invalidLink);
		if (found.isExpiredAt(clock.instant())) {
			throw invalidLink();
		}
		User user = users.findById(found.userId()).orElseThrow(AccountService::invalidLink);
		user.confirm(clock.instant());
		tokens.deleteByUserId(user.id());
	}

	@Transactional
	void changeLanguage(UUID userId, Language language) {
		users.findById(userId).orElseThrow().changeLanguage(language);
	}

	private void sendConfirmationLink(User user) {
		byte[] bytes = new byte[32];
		random.nextBytes(bytes);
		String token = Base64.getUrlEncoder().withoutPadding().encodeToString(bytes);
		tokens.save(new ConfirmationToken(hash(token), user.id(), clock.instant().plus(CONFIRMATION_LINK_LIFETIME)));
		String link = publicUrl + "/confirm?token=" + token;
		emailSender.send(ConfirmationEmail.to(user.email(), user.language(), link));
	}

	private static String hash(String token) {
		try {
			byte[] digest = MessageDigest.getInstance("SHA-256").digest(token.getBytes(StandardCharsets.UTF_8));
			return HexFormat.of().formatHex(digest);
		}
		catch (NoSuchAlgorithmException impossible) {
			throw new IllegalStateException(impossible);
		}
	}

	private static ApiException emailTaken() {
		return new ApiException(HttpStatus.CONFLICT, "email_taken");
	}

	private static ApiException invalidLink() {
		return new ApiException(HttpStatus.BAD_REQUEST, "invalid_link");
	}

}
