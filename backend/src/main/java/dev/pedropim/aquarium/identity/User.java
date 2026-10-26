package dev.pedropim.aquarium.identity;

import java.time.Instant;
import java.util.UUID;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;

@Entity
@Table(name = "users")
class User {

	@Id
	private UUID id;

	@Column(nullable = false, unique = true)
	private String email;

	@Column(name = "password_hash", nullable = false)
	private String passwordHash;

	@Column(nullable = false)
	private String language;

	@Column(name = "confirmed_at")
	private Instant confirmedAt;

	@Column(name = "created_at", nullable = false)
	private Instant createdAt;

	protected User() {
	}

	User(String email, String passwordHash, Language language, Instant createdAt) {
		this.id = UUID.randomUUID();
		this.email = email;
		this.passwordHash = passwordHash;
		this.language = language.code();
		this.createdAt = createdAt;
	}

	UUID id() {
		return id;
	}

	String email() {
		return email;
	}

	String passwordHash() {
		return passwordHash;
	}

	Language language() {
		return Language.fromCode(language).orElseThrow();
	}

	void changeLanguage(Language language) {
		this.language = language.code();
	}

	boolean isConfirmed() {
		return confirmedAt != null;
	}

	void confirm(Instant when) {
		this.confirmedAt = when;
	}

}
