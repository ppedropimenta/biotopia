package dev.pedropim.aquarium.identity;

import java.time.Clock;
import java.util.UUID;

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
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;

@RestController
class SessionController {

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

		return view(account.id());
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

	private AccountView view(UUID userId) {
		User user = users.findById(userId).orElseThrow();
		return new AccountView(user.email(), user.language().code());
	}

	record LoginRequest(@NotBlank(message = "invalid") String email, @NotBlank(message = "invalid") String password) {
	}

	record LanguageRequest(@Pattern(regexp = "en|pt-BR", message = "unsupported") String language) {
	}

	record AccountView(String email, String language) {
	}

}
