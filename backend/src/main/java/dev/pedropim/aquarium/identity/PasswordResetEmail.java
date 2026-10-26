package dev.pedropim.aquarium.identity;

import dev.pedropim.aquarium.email.Email;

/**
 * The password reset email, in the language saved on the account.
 */
final class PasswordResetEmail {

	private PasswordResetEmail() {
	}

	static Email to(String address, Language language, String link) {
		return switch (language) {
			case EN -> new Email(address, "Reset your password", """
					Someone asked to reset the password of your aquarium logbook account.

					Open this link to choose a new password:
					%s

					The link works once and expires in 1 hour. If it was not you, ignore this message: your password stays as it is.
					""".formatted(link));
			case PT_BR -> new Email(address, "Redefina sua senha", """
					Alguém pediu para redefinir a senha da sua conta no diário do aquário.

					Abra este link para escolher uma nova senha:
					%s

					O link funciona uma vez e expira em 1 hora. Se não foi você, ignore esta mensagem: sua senha continua a mesma.
					""".formatted(link));
		};
	}

}
