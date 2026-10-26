package dev.pedropim.aquarium.identity;

import dev.pedropim.aquarium.email.Email;

/**
 * The confirmation email, in the language saved on the account.
 */
final class ConfirmationEmail {

	private ConfirmationEmail() {
	}

	static Email to(String address, Language language, String link) {
		return switch (language) {
			case EN -> new Email(address, "Confirm your email", """
					Welcome to the aquarium logbook.

					Open this link to confirm your email address and finish creating your account:
					%s

					The link works once and expires in 24 hours. If you did not sign up, you can ignore this message.
					""".formatted(link));
			case PT_BR -> new Email(address, "Confirme seu e-mail", """
					Bem-vindo ao diário do seu aquário.

					Abra este link para confirmar seu e-mail e terminar de criar a conta:
					%s

					O link funciona uma vez e expira em 24 horas. Se não foi você quem se cadastrou, ignore esta mensagem.
					""".formatted(link));
		};
	}

}
