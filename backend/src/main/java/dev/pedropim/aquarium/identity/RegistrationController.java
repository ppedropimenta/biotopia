package dev.pedropim.aquarium.identity;

import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

import dev.pedropim.aquarium.web.ApiException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

@RestController
@RequestMapping("/api/auth")
class RegistrationController {

	private final AccountService accounts;

	private final RateLimits limits;

	RegistrationController(AccountService accounts, RateLimits limits) {
		this.accounts = accounts;
		this.limits = limits;
	}

	@PostMapping("/signup")
	@ResponseStatus(HttpStatus.CREATED)
	void signUp(@Valid @RequestBody SignUpRequest request, HttpServletRequest httpRequest) {
		limits.openRoute(httpRequest);
		limits.signUp(httpRequest);
		Language language = Language.fromCode(request.language())
			.orElseThrow(() -> ApiException.invalidField("language", "unsupported"));
		accounts.signUp(request.email(), request.password(), language);
	}

	@PostMapping("/confirm")
	@ResponseStatus(HttpStatus.NO_CONTENT)
	void confirm(@Valid @RequestBody ConfirmRequest request, HttpServletRequest httpRequest) {
		limits.openRoute(httpRequest);
		accounts.confirm(request.token());
	}

	@PostMapping("/resend-confirmation")
	@ResponseStatus(HttpStatus.NO_CONTENT)
	void resendConfirmation(@Valid @RequestBody EmailRequest request, HttpServletRequest httpRequest) {
		limits.openRoute(httpRequest);
		accounts.resendConfirmation(request.email());
	}

	@PostMapping("/forgot-password")
	@ResponseStatus(HttpStatus.NO_CONTENT)
	void forgotPassword(@Valid @RequestBody EmailRequest request, HttpServletRequest httpRequest) {
		limits.openRoute(httpRequest);
		accounts.requestPasswordReset(request.email());
	}

	@PostMapping("/reset-password")
	@ResponseStatus(HttpStatus.NO_CONTENT)
	void resetPassword(@Valid @RequestBody ResetPasswordRequest request, HttpServletRequest httpRequest) {
		limits.openRoute(httpRequest);
		accounts.resetPassword(request.token(), request.password());
	}

	record SignUpRequest(
			@NotBlank(message = "invalid") @Email(message = "invalid") @Size(max = Limits.EMAIL, message = "invalid") String email,
			@NotBlank(message = "too_short") @NewPassword @Size(max = Limits.PASSWORD, message = "too_long") String password,
			@Pattern(regexp = "en|pt-BR", message = "unsupported") String language) {

		SignUpRequest {
			email = Emails.stripped(email);
		}

	}

	record ConfirmRequest(@NotBlank(message = "invalid") @Size(max = Limits.TOKEN, message = "invalid") String token) {
	}

	record ResetPasswordRequest(@NotBlank(message = "invalid") @Size(max = Limits.TOKEN, message = "invalid") String token,
			@NotBlank(message = "too_short") @NewPassword @Size(max = Limits.PASSWORD, message = "too_long") String password) {
	}

	/** The requests that only need an address: a new confirmation link or a reset link. */
	record EmailRequest(@NotBlank(message = "invalid") @Size(max = Limits.EMAIL, message = "invalid") String email) {

		EmailRequest {
			email = Emails.stripped(email);
		}

	}

}
