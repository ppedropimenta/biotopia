package dev.pedropim.aquarium.support;

import java.time.Clock;
import java.time.Duration;
import java.time.Instant;
import java.time.ZoneId;
import java.time.ZoneOffset;

/**
 * A clock that tests can set and move, for rules like "no instants in the future" or "links expire".
 */
public class MutableClock extends Clock {

	private Instant now;

	public MutableClock(Instant start) {
		this.now = start;
	}

	public void set(Instant instant) {
		this.now = instant;
	}

	public void advance(Duration duration) {
		this.now = now.plus(duration);
	}

	@Override
	public Instant instant() {
		return now;
	}

	@Override
	public ZoneId getZone() {
		return ZoneOffset.UTC;
	}

	@Override
	public Clock withZone(ZoneId zone) {
		throw new UnsupportedOperationException("The app works in UTC");
	}

}
