package dev.pedropim.aquarium.identity;

import java.time.Instant;
import java.util.UUID;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;

@Entity
@Table(name = "password_reset_tokens")
class PasswordResetToken {

	@Id
	@Column(name = "token_hash")
	private String tokenHash;

	@Column(name = "user_id", nullable = false)
	private UUID userId;

	@Column(name = "expires_at", nullable = false)
	private Instant expiresAt;

	protected PasswordResetToken() {
	}

	PasswordResetToken(String tokenHash, UUID userId, Instant expiresAt) {
		this.tokenHash = tokenHash;
		this.userId = userId;
		this.expiresAt = expiresAt;
	}

	UUID userId() {
		return userId;
	}

	boolean isExpiredAt(Instant now) {
		return !now.isBefore(expiresAt);
	}

}
