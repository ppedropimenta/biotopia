package dev.pedropim.aquarium.identity;

import dev.pedropim.aquarium.email.Email;
import dev.pedropim.aquarium.email.EmailLayout;

/**
 * The password reset email, in the language saved on the account. The HTML version says the same as the text, inside
 * the site's frame.
 */
final class PasswordResetEmail {

	private record Words(String subject, String asked, String openLink, String expiry) {
	}

	private PasswordResetEmail() {
	}

	static Email to(String address, Language language, String link, String siteUrl) {
		Words words = switch (language) {
			case EN -> new Words("Reset your password",
					"Someone asked to reset the password of your Biotopia account.",
					"Open this link to choose a new password:",
					"The link works once and expires in 1 hour. If it was not you, ignore this message: your password stays as it is.");
			case PT_BR -> new Words("Redefina sua senha",
					"Alguém pediu para redefinir a senha da sua conta no Biotopia.",
					"Abra este link para escolher uma nova senha:",
					"O link funciona uma vez e expira em 1 hora. Se não foi você, ignore esta mensagem: sua senha continua a mesma.");
		};
		String text = """
				%s

				%s
				%s

				%s
				""".formatted(words.asked(), words.openLink(), link, words.expiry());
		EmailLayout layout = new EmailLayout(siteUrl);
		String html = layout.page(language.code(), words.subject(), words.asked(),
				layout.paragraph(words.asked()) + layout.paragraph(words.openLink()) + layout.link(link)
						+ layout.note(words.expiry()));
		return new Email(address, words.subject(), text, html);
	}

}
