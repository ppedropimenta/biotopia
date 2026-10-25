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

	@Override
	public synchronized void send(Email email) {
		sent.add(email);
	}

	public synchronized List<Email> sentTo(String address) {
		return sent.stream().filter(email -> email.to().equals(address)).toList();
	}

	public synchronized void clear() {
		sent.clear();
	}

}
