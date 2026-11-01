package dev.pedropim.aquarium.email;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.autoconfigure.condition.ConditionalOnExpression;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;

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
		SimpleMailMessage message = new SimpleMailMessage();
		message.setFrom(from);
		message.setTo(email.to());
		message.setSubject(email.subject());
		message.setText(email.body());
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
