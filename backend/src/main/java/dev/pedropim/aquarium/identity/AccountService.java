package dev.pedropim.aquarium.identity;

import java.time.Clock;
import java.time.Duration;
import java.util.UUID;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.http.HttpStatus;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.PlatformTransactionManager;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.transaction.support.TransactionTemplate;

import dev.pedropim.aquarium.email.Email;
import dev.pedropim.aquarium.email.EmailSender;
import dev.pedropim.aquarium.tanks.TankErasure;
import dev.pedropim.aquarium.web.ApiException;

@Service
class AccountService {

	private static final Logger log = LoggerFactory.getLogger(AccountService.class);

	private static final Duration CONFIRMATION_LINK_LIFETIME = Duration.ofHours(24);

	/** Shorter than a confirmation link: whoever reads the mailbox in this window can take over the account. */
	private static final Duration RESET_LINK_LIFETIME = Duration.ofHours(1);

	private final UserRepository users;

	private final ConfirmationTokenRepository tokens;

	private final PasswordResetTokenRepository resetTokens;

	private final PasswordEncoder passwordEncoder;

	private final EmailSender emailSender;

	private final TankErasure tankErasure;

	private final Clock clock;

	private final TransactionTemplate transaction;

	private final String publicUrl;

	private final RateLimits limits;

	AccountService(UserRepository users, ConfirmationTokenRepository tokens,
			PasswordResetTokenRepository resetTokens, PasswordEncoder passwordEncoder, EmailSender emailSender,
			TankErasure tankErasure, Clock clock, PlatformTransactionManager transactions,
			RateLimits limits, @Value("${app.public-url}") String publicUrl) {
		this.limits = limits;
		this.users = users;
		this.tokens = tokens;
		this.resetTokens = resetTokens;
		this.passwordEncoder = passwordEncoder;
		this.emailSender = emailSender;
		this.tankErasure = tankErasure;
		this.clock = clock;
		this.transaction = new TransactionTemplate(transactions);
		this.publicUrl = publicUrl;
	}

	/**
	 * Creates an unconfirmed account and emails the confirmation link. The database work is one transaction and the
	 * email goes out after it, so a slow or broken mail server never holds a database connection. If the email
	 * cannot be sent the account stays: it is logged, and the visitor asks for the link again from the screen that
	 * says it was sent.
	 */
	void signUp(String email, String password, Language language) {
		String address = Emails.normalized(email);
		refuseIfPersonal(password, address);
		Email confirmation = transaction.execute(status -> {
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
			return confirmationEmail(user);
		});
		sendWithoutFailing(confirmation);
	}

	/** Silent about who has an account: unknown and already confirmed addresses get nothing, and no error. */
	void resendConfirmation(String email) {
		String address = Emails.normalized(email);
		if (!limits.mayEmail(address)) {
			return;
		}
		Email confirmation = transaction.execute(status -> users.findByEmail(address)
			.filter(user -> !user.isConfirmed())
			.map(user -> {
				tokens.deleteByUserId(user.id());
				return confirmationEmail(user);
			})
			.orElse(null));
		sendWithoutFailing(confirmation);
	}

	@Transactional
	void confirm(String token) {
		ConfirmationToken found = tokens.findById(LinkTokens.hash(token)).orElseThrow(AccountService::invalidLink);
		if (found.isExpiredAt(clock.instant())) {
			throw invalidLink();
		}
		User user = users.findById(found.userId()).orElseThrow(AccountService::invalidLink);
		user.confirm(clock.instant());
		tokens.deleteByUserId(user.id());
	}

	/** Silent about who has an account: an unknown address gets no email, and the same answer as a known one. */
	void requestPasswordReset(String email) {
		String address = Emails.normalized(email);
		if (!limits.mayEmail(address)) {
			return;
		}
		Email reset = transaction.execute(status -> users.findByEmail(address).map(user -> {
			resetTokens.deleteByUserId(user.id());
			String token = LinkTokens.generate();
			resetTokens.save(
					new PasswordResetToken(LinkTokens.hash(token), user.id(), clock.instant().plus(RESET_LINK_LIFETIME)));
			String link = publicUrl + "/reset-password?token=" + token;
			return PasswordResetEmail.to(user.email(), user.language(), link);
		}).orElse(null));
		sendWithoutFailing(reset);
	}

	/**
	 * Sets the new password and uses up the account's reset links. The link came to the mailbox, so it also proves
	 * the address: an account that never confirmed becomes confirmed.
	 */
	@Transactional
	void resetPassword(String token, String newPassword) {
		String tokenHash = LinkTokens.hash(token);
		PasswordResetToken found = resetTokens.findById(tokenHash).orElseThrow(AccountService::invalidLink);
		if (found.isExpiredAt(clock.instant())) {
			throw invalidLink();
		}
		User user = users.findById(found.userId()).orElseThrow(AccountService::invalidLink);
		// Before the link is used up, so it still works with a better password.
		refuseIfPersonal(newPassword, user.email());
		if (resetTokens.claim(tokenHash) == 0) {
			throw invalidLink();
		}
		user.changePassword(passwordEncoder.encode(newPassword), clock.instant());
		if (!user.isConfirmed()) {
			user.confirm(clock.instant());
			tokens.deleteByUserId(user.id());
		}
		resetTokens.deleteByUserId(user.id());
	}

	@Transactional
	void changeLanguage(UUID userId, Language language) {
		users.findById(userId).orElseThrow().changeLanguage(language);
	}

	/**
	 * Deletes the account and everything in it. The password is asked again so that a session left open on a shared
	 * computer cannot do it.
	 */
	@Transactional
	void delete(UUID userId, String password) {
		User user = users.findById(userId).orElseThrow();
		if (!passwordEncoder.matches(password, user.passwordHash())) {
			throw ApiException.invalidField("password", "invalid");
		}
		tankErasure.eraseAllOf(userId);
		users.delete(user);
	}

	/** Stores the confirmation link's hash and builds the email; sending it is left to the caller, after the transaction. */
	private Email confirmationEmail(User user) {
		String token = LinkTokens.generate();
		tokens.save(new ConfirmationToken(LinkTokens.hash(token), user.id(),
				clock.instant().plus(CONFIRMATION_LINK_LIFETIME)));
		String link = publicUrl + "/confirm?token=" + token;
		return ConfirmationEmail.to(user.email(), user.language(), link);
	}

	/**
	 * Sends the email, if there is one, and logs a failure instead of passing it on: the database work is already done,
	 * and the answer must not tell whether the address has an account. The person asks for the link again.
	 */
	private void sendWithoutFailing(Email email) {
		if (email == null) {
			return;
		}
		try {
			emailSender.send(email);
		}
		catch (RuntimeException failed) {
			log.error("Could not send an email to {}", email.to(), failed);
		}
	}

	/** The length is checked with the request ({@link NewPassword}); this needs the account's address. */
	private static void refuseIfPersonal(String password, String email) {
		if (PasswordRules.isPersonal(password, email)) {
			throw ApiException.invalidField("password", "personal");
		}
	}

	private static ApiException emailTaken() {
		return new ApiException(HttpStatus.CONFLICT, "email_taken");
	}

	private static ApiException invalidLink() {
		return new ApiException(HttpStatus.BAD_REQUEST, "invalid_link");
	}

}
