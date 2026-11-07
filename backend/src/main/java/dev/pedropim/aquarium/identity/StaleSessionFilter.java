package dev.pedropim.aquarium.identity;

import java.io.IOException;
import java.time.Instant;

import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.filter.OncePerRequestFilter;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import jakarta.servlet.http.HttpSession;

/**
 * Ends a session that started before the account's password last changed, so a reset logs out whoever was using
 * the old password, and the session of an account that was deleted. The request then goes on as anonymous, and the API answers 401.
 */
class StaleSessionFilter extends OncePerRequestFilter {

	private final UserRepository users;

	StaleSessionFilter(UserRepository users) {
		this.users = users;
	}

	@Override
	protected void doFilterInternal(HttpServletRequest request, HttpServletResponse response, FilterChain chain)
			throws ServletException, IOException {
		Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
		if (authentication != null && authentication.getPrincipal() instanceof SessionUser user
				&& isStale(user)) {
			SecurityContextHolder.clearContext();
			HttpSession session = request.getSession(false);
			if (session != null) {
				session.invalidate();
			}
		}
		chain.doFilter(request, response);
	}

	/** Stale when the account is gone, or when a reset happened after this session started. */
	private boolean isStale(SessionUser user) {
		return users.findPasswordChange(user.id())
			.map(change -> change.changedAt() != null && user.loggedInAt().isBefore(change.changedAt()))
			.orElse(true);
	}

}
