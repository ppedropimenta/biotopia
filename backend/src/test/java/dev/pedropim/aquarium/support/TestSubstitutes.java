package dev.pedropim.aquarium.support;

import java.time.Clock;
import java.time.Instant;

import org.springframework.boot.test.context.TestConfiguration;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Primary;

import dev.pedropim.aquarium.email.EmailSender;

/**
 * The only parts of the app that tests replace: time and outgoing email.
 */
@TestConfiguration(proxyBeanMethods = false)
public class TestSubstitutes {

	public static final Instant START = Instant.parse("2026-01-15T10:00:00Z");

	@Bean
	@Primary
	MutableClock testClock() {
		return new MutableClock(START);
	}

	@Bean
	@Primary
	RecordingEmailSender recordingEmailSender() {
		return new RecordingEmailSender();
	}

}
