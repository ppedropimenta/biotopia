package dev.pedropim.aquarium.email;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.autoconfigure.condition.ConditionalOnMissingBean;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

/**
 * Writes emails to the log. Used in local development until a real SMTP sender is configured.
 */
class LoggingEmailSender implements EmailSender {

	private static final Logger log = LoggerFactory.getLogger(LoggingEmailSender.class);

	@Override
	public void send(Email email) {
		log.info("Email to {}: {}\n{}", email.to(), email.subject(), email.body());
	}

	@Configuration(proxyBeanMethods = false)
	static class Config {

		@Bean
		@ConditionalOnMissingBean(EmailSender.class)
		EmailSender loggingEmailSender() {
			return new LoggingEmailSender();
		}

	}

}
