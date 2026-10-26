package dev.pedropim.aquarium.identity;

import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

import dev.pedropim.aquarium.web.ApiException;
import jakarta.validation.Valid;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

@RestController
@RequestMapping("/api/auth")
class RegistrationController {

	private final AccountService accounts;

	RegistrationController(AccountService accounts) {
		this.accounts = accounts;
	}

	@PostMapping("/signup")
	@ResponseStatus(HttpStatus.CREATED)
	void signUp(@Valid @RequestBody SignUpRequest request) {
		Language language = Language.fromCode(request.language())
			.orElseThrow(() -> ApiException.invalidField("language", "unsupported"));
		accounts.signUp(request.email(), request.password(), language);
	}

	@PostMapping("/confirm")
	@ResponseStatus(HttpStatus.NO_CONTENT)
	void confirm(@Valid @RequestBody ConfirmRequest request) {
		accounts.confirm(request.token());
	}

	@PostMapping("/resend-confirmation")
	@ResponseStatus(HttpStatus.NO_CONTENT)
	void resendConfirmation(@Valid @RequestBody ResendRequest request) {
		accounts.resendConfirmation(request.email());
	}

	record SignUpRequest(
			@NotBlank(message = "invalid") @Email(message = "invalid") @Size(max = 254, message = "invalid") String email,
			@NotBlank(message = "too_short") @Size(min = AccountService.MIN_PASSWORD_LENGTH, message = "too_short") String password,
			@Pattern(regexp = "en|pt-BR", message = "unsupported") String language) {

		SignUpRequest {
			email = Emails.stripped(email);
		}

	}

	record ConfirmRequest(@NotBlank(message = "invalid") String token) {
	}

	record ResendRequest(@NotBlank(message = "invalid") String email) {

		ResendRequest {
			email = Emails.stripped(email);
		}

	}

}
