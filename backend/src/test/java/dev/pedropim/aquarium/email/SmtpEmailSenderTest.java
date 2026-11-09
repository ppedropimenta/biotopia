package dev.pedropim.aquarium.email;

import java.util.HashMap;
import java.util.Map;

import jakarta.mail.Address;
import jakarta.mail.Multipart;
import jakarta.mail.Part;
import jakarta.mail.Session;
import jakarta.mail.internet.InternetAddress;
import jakarta.mail.internet.MimeMessage;

import org.junit.jupiter.api.Test;
import org.mockito.ArgumentCaptor;
import org.springframework.mail.javamail.JavaMailSender;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

class SmtpEmailSenderTest {

	@Test
	void sendsTheTextAndTheHtmlFromTheConfiguredAddress() throws Exception {
		JavaMailSender mailSender = mock(JavaMailSender.class);
		when(mailSender.createMimeMessage()).thenReturn(new MimeMessage((Session) null));
		SmtpEmailSender sender = new SmtpEmailSender(mailSender, "Biotopia <noreply@example.com>");

		sender.send(new Email("ana@example.com", "Confirme seu e-mail", "Abra o link", "<p>Abra o link</p>"));

		ArgumentCaptor<MimeMessage> sent = ArgumentCaptor.forClass(MimeMessage.class);
		verify(mailSender).send(sent.capture());
		MimeMessage message = sent.getValue();
		message.saveChanges();
		assertThat(message.getFrom()).extracting(Address::toString).containsExactly("Biotopia <noreply@example.com>");
		assertThat(message.getAllRecipients()).containsExactly(new InternetAddress("ana@example.com"));
		assertThat(message.getSubject()).isEqualTo("Confirme seu e-mail");
		Map<String, Object> parts = new HashMap<>();
		collect(message, parts);
		assertThat(parts).containsEntry("text/plain", "Abra o link").containsEntry("text/html", "<p>Abra o link</p>");
	}

	/** Finds the text and HTML versions inside the nested multiparts that MimeMessageHelper builds. */
	private static void collect(Part part, Map<String, Object> parts) throws Exception {
		if (part.getContent() instanceof Multipart multipart) {
			for (int i = 0; i < multipart.getCount(); i++) {
				collect(multipart.getBodyPart(i), parts);
			}
		}
		else if (part.isMimeType("text/plain")) {
			parts.put("text/plain", part.getContent());
		}
		else if (part.isMimeType("text/html")) {
			parts.put("text/html", part.getContent());
		}
	}

}
