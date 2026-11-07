package dev.pedropim.aquarium.support;

import java.util.ArrayList;
import java.util.List;

import dev.pedropim.aquarium.email.Email;
import dev.pedropim.aquarium.email.EmailSender;

/**
 * Keeps sent emails in memory so tests can read confirmation and reset links.
 */
public class RecordingEmailSender implements EmailSender {

	private final List<Email> sent = new ArrayList<>();

	private boolean failing;

	@Override
	public synchronized void send(Email email) {
		if (failing) {
			throw new IllegalStateException("The mail server is down (a test made it so)");
		}
		sent.add(email);
	}

	/** While true, every send fails, as it does when the mail server is down. */
	public synchronized void failing(boolean failing) {
		this.failing = failing;
	}

	public synchronized List<Email> sentTo(String address) {
		return sent.stream().filter(email -> email.to().equals(address)).toList();
	}

	public synchronized void clear() {
		failing = false;
		sent.clear();
	}

}
