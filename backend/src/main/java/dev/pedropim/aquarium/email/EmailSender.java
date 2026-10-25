package dev.pedropim.aquarium.email;

/**
 * Sends emails such as account confirmation links. Kept behind an interface so tests can read the emails
 * instead of sending them.
 */
public interface EmailSender {

	void send(Email email);

}
