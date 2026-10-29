package dev.pedropim.aquarium.identity;

import java.time.Clock;
import java.util.List;
import java.util.UUID;

import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.AuthenticationException;
import org.springframework.security.core.context.SecurityContext;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.web.context.SecurityContextRepository;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

import dev.pedropim.aquarium.web.ApiException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import jakarta.servlet.http.HttpSession;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;

@RestController
class SessionController {

	private static final String EXPIRY_ATTRIBUTES = "(?i);\\s*(?:Max-Age|Expires)=[^;]*";

	private final AuthenticationManager authenticationManager;

	private final SecurityContextRepository securityContextRepository;

	private final UserRepository users;

	private final AccountService accounts;

	private final Clock clock;

	SessionController(AuthenticationManager authenticationManager, SecurityContextRepository securityContextRepository,
			UserRepository users, AccountService accounts, Clock clock) {
		this.clock = clock;
		this.authenticationManager = authenticationManager;
		this.securityContextRepository = securityContextRepository;
		this.users = users;
		this.accounts = accounts;
	}

	@PostMapping("/api/auth/login")
	AccountView logIn(@Valid @RequestBody LoginRequest request, HttpServletRequest httpRequest,
			HttpServletResponse httpResponse) {
		AccountDetails account;
		try {
			Authentication checked = authenticationManager.authenticate(UsernamePasswordAuthenticationToken
				.unauthenticated(Emails.normalized(request.email()), request.password()));
			account = (AccountDetails) checked.getPrincipal();
		}
		catch (AuthenticationException wrongEmailOrPassword) {
			throw new ApiException(HttpStatus.UNAUTHORIZED, "invalid_credentials");
		}
		if (!account.confirmed()) {
			throw new ApiException(HttpStatus.FORBIDDEN, "email_not_confirmed");
		}

		// A session that existed before login must not survive it with the same id (session fixation).
		if (httpRequest.getSession(false) != null) {
			httpRequest.changeSessionId();
		}
		SecurityContext context = SecurityContextHolder.createEmptyContext();
		context.setAuthentication(UsernamePasswordAuthenticationToken.authenticated(account.toSessionUser(clock.instant()), null,
				account.getAuthorities()));
		SecurityContextHolder.setContext(context);
		securityContextRepository.saveContext(context, httpRequest, httpResponse);
		if (!request.keepLoggedIn()) {
			makeSessionCookieEndWithTheBrowser(httpResponse);
		}

		return view(account.id());
	}

	// The container adds the 30-day Max-Age and Expires from application.properties when it creates the session
	// cookie, and it has no per-session setting. Taking both attributes out of the header turns it into a
	// session cookie, which the browser drops when it closes.
	private static void makeSessionCookieEndWithTheBrowser(HttpServletResponse response) {
		List<String> headers = response.getHeaders(HttpHeaders.SET_COOKIE)
			.stream()
			.map(header -> header.startsWith("JSESSIONID=") ? header.replaceAll(EXPIRY_ATTRIBUTES, "") : header)
			.toList();
		if (headers.isEmpty()) {
			return;
		}
		// setHeader replaces every Set-Cookie header, so the first one starts the list again.
		response.setHeader(HttpHeaders.SET_COOKIE, headers.getFirst());
		headers.stream().skip(1).forEach(header -> response.addHeader(HttpHeaders.SET_COOKIE, header));
	}

	@GetMapping("/api/me")
	AccountView me(@AuthenticationPrincipal SessionUser user) {
		return view(user.id());
	}

	@PutMapping("/api/me/language")
	@ResponseStatus(HttpStatus.NO_CONTENT)
	void changeLanguage(@AuthenticationPrincipal SessionUser user, @Valid @RequestBody LanguageRequest request) {
		accounts.changeLanguage(user.id(), Language.fromCode(request.language()).orElseThrow());
	}

	@PostMapping("/api/me/deletion")
	@ResponseStatus(HttpStatus.NO_CONTENT)
	void deleteAccount(@AuthenticationPrincipal SessionUser user, @Valid @RequestBody DeletionRequest request,
			HttpServletRequest httpRequest) {
		accounts.delete(user.id(), request.password());
		SecurityContextHolder.clearContext();
		HttpSession session = httpRequest.getSession(false);
		if (session != null) {
			session.invalidate();
		}
	}

	private AccountView view(UUID userId) {
		User user = users.findById(userId).orElseThrow();
		return new AccountView(user.email(), user.language().code());
	}

	/** {@code remember} is optional: callers that do not send it get the 30-day session as before. */
	record LoginRequest(@NotBlank(message = "invalid") String email, @NotBlank(message = "invalid") String password,
			Boolean remember) {

		boolean keepLoggedIn() {
			return remember == null || remember;
		}

	}

	record DeletionRequest(@NotBlank(message = "invalid") String password) {
	}

	record LanguageRequest(@Pattern(regexp = "en|pt-BR", message = "unsupported") String language) {
	}

	record AccountView(String email, String language) {
	}

}
