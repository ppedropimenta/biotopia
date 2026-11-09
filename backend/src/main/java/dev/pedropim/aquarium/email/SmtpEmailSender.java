package dev.pedropim.aquarium.email;

import jakarta.mail.MessagingException;
import jakarta.mail.internet.MimeMessage;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.autoconfigure.condition.ConditionalOnExpression;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.mail.MailPreparationException;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.MimeMessageHelper;

/**
 * Sends emails through an SMTP server. Active only when {@code spring.mail.host} is not empty (production sets it from
 * the SMTP_HOST environment variable); without it the emails go to the log.
 */
class SmtpEmailSender implements EmailSender {

	private final JavaMailSender mailSender;

	private final String from;

	SmtpEmailSender(JavaMailSender mailSender, String from) {
		this.mailSender = mailSender;
		this.from = from;
	}

	@Override
	public void send(Email email) {
		MimeMessage message = mailSender.createMimeMessage();
		try {
			// Multipart: the client shows the HTML, or the plain text when it cannot.
			MimeMessageHelper helper = new MimeMessageHelper(message, true, "UTF-8");
			helper.setFrom(from);
			helper.setTo(email.to());
			helper.setSubject(email.subject());
			helper.setText(email.body(), email.html());
		}
		catch (MessagingException failed) {
			throw new MailPreparationException("Could not build the email to " + email.to(), failed);
		}
		mailSender.send(message);
	}

	@Configuration(proxyBeanMethods = false)
	@ConditionalOnExpression("!'${spring.mail.host:}'.isEmpty()")
	static class Config {

		@Bean
		EmailSender smtpEmailSender(JavaMailSender mailSender, @Value("${app.mail.from}") String from) {
			return new SmtpEmailSender(mailSender, from);
		}

	}

}
