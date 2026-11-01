package dev.pedropim.aquarium.email;

import org.junit.jupiter.api.Test;
import org.mockito.ArgumentCaptor;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.verify;

class SmtpEmailSenderTest {

	@Test
	void sendsTheEmailFromTheConfiguredAddress() {
		JavaMailSender mailSender = mock(JavaMailSender.class);
		SmtpEmailSender sender = new SmtpEmailSender(mailSender, "Biotopia <noreply@example.com>");

		sender.send(new Email("ana@example.com", "Confirm your email", "Click the link"));

		ArgumentCaptor<SimpleMailMessage> sent = ArgumentCaptor.forClass(SimpleMailMessage.class);
		verify(mailSender).send(sent.capture());
		assertThat(sent.getValue().getFrom()).isEqualTo("Biotopia <noreply@example.com>");
		assertThat(sent.getValue().getTo()).containsExactly("ana@example.com");
		assertThat(sent.getValue().getSubject()).isEqualTo("Confirm your email");
		assertThat(sent.getValue().getText()).isEqualTo("Click the link");
	}

}
