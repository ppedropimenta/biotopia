package dev.pedropim.aquarium.identity;

import dev.pedropim.aquarium.email.Email;
import dev.pedropim.aquarium.email.EmailLayout;

/**
 * The confirmation email, in the language saved on the account. The HTML version opens with the cardinal tetra drawn
 * for the site and puts the link in a button.
 */
final class ConfirmationEmail {

	private record Words(String subject, String welcome, String openLink, String confirm, String button,
			String copyLink, String expiry) {
	}

	private ConfirmationEmail() {
	}

	static Email to(String address, Language language, String link, String siteUrl) {
		Words words = switch (language) {
			case EN -> new Words("Confirm your email", "Welcome to the aquarium logbook.",
					"Open this link to confirm your email address and finish creating your account:",
					"Confirm your email address to finish creating your account.", "Confirm email",
					"If the button does not open, copy this address into your browser:",
					"The link works once and expires in 24 hours. If you did not sign up, you can ignore this message.");
			case PT_BR -> new Words("Confirme seu e-mail", "Bem-vindo ao diário do seu aquário.",
					"Abra este link para confirmar seu e-mail e terminar de criar a conta:",
					"Confirme seu e-mail para terminar de criar a conta.", "Confirmar e-mail",
					"Se o botão não abrir, copie este endereço no navegador:",
					"O link funciona uma vez e expira em 24 horas. Se não foi você quem se cadastrou, ignore esta mensagem.");
		};
		String text = """
				%s

				%s
				%s

				%s
				""".formatted(words.welcome(), words.openLink(), link, words.expiry());
		EmailLayout layout = new EmailLayout(siteUrl);
		String html = layout.page(language.code(), words.subject(), words.confirm(),
				layout.drawing("cardinal.png", 280, 113, "Paracheirodon axelrodi") + layout.heading(words.welcome())
						+ layout.paragraph(words.confirm()) + layout.button(words.button(), link)
						+ layout.note(words.copyLink()) + layout.link(link) + layout.note(words.expiry()));
		return new Email(address, words.subject(), text, html);
	}

}
