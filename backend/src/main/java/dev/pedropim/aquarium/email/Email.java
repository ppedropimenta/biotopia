package dev.pedropim.aquarium.email;

/**
 * An email with two versions of the same message: {@code body} in plain text, for clients that show only text, and
 * {@code html} with the site's look, built with {@link EmailLayout}.
 */
public record Email(String to, String subject, String body, String html) {
}
