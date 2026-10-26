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
 * the old password. The request then goes on as anonymous, and the API answers 401.
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
				&& startedBeforePasswordChanged(user)) {
			SecurityContextHolder.clearContext();
			HttpSession session = request.getSession(false);
			if (session != null) {
				session.invalidate();
			}
		}
		chain.doFilter(request, response);
	}

	private boolean startedBeforePasswordChanged(SessionUser user) {
		// The account is gone, or never had a reset: only a reset after login makes a session stale.
		return users.findPasswordChangedAt(user.id())
			.map(changedAt -> user.loggedInAt().isBefore(changedAt))
			.orElse(false);
	}

}
