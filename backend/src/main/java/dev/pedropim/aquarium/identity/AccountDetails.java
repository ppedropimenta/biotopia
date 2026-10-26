package dev.pedropim.aquarium.identity;

import java.time.Instant;
import java.util.Collection;
import java.util.UUID;

import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.authority.AuthorityUtils;
import org.springframework.security.core.userdetails.UserDetails;

/**
 * What Spring Security needs to check a password. It only lives for the length of a login attempt: once the
 * password matches, the session keeps a {@link SessionUser} instead, which holds no password hash.
 *
 * <p>
 * The account is never "disabled" here, even when the email is not confirmed. A disabled account is refused
 * before the password is compared, which would tell anyone who knows an address that it has an unconfirmed
 * account. Login checks {@link #confirmed()} after the password instead.
 */
record AccountDetails(UUID id, String email, String passwordHash, boolean confirmed) implements UserDetails {

	@Override
	public Collection<? extends GrantedAuthority> getAuthorities() {
		return AuthorityUtils.createAuthorityList("ROLE_USER");
	}

	@Override
	public String getPassword() {
		return passwordHash;
	}

	@Override
	public String getUsername() {
		return email;
	}

	SessionUser toSessionUser(Instant loggedInAt) {
		return new SessionUser(id, email, loggedInAt);
	}

	static AccountDetails of(User user) {
		return new AccountDetails(user.id(), user.email(), user.passwordHash(), user.isConfirmed());
	}

}
