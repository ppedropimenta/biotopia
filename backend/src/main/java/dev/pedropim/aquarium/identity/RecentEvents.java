package dev.pedropim.aquarium.identity;

import java.time.Duration;
import java.time.Instant;
import java.util.ArrayDeque;
import java.util.Deque;
import java.util.LinkedHashMap;
import java.util.Map;

/**
 * Counts events per key over a sliding window, in memory. The map holds at most {@code maxKeys} keys and drops the
 * least recently used one past that, so a flood of different addresses cannot grow memory without limit (it can
 * push out other counters, which only makes the limit more lenient). Each key keeps at most {@code limit}
 * timestamps. A deploy starts the counts again, which is fine for one server.
 */
final class RecentEvents {

	private final int limit;

	private final Duration window;

	private final Map<String, Deque<Instant>> events;

	RecentEvents(int limit, Duration window, int maxKeys) {
		this.limit = limit;
		this.window = window;
		this.events = new LinkedHashMap<>(16, 0.75f, true) {
			@Override
			protected boolean removeEldestEntry(Map.Entry<String, Deque<Instant>> eldest) {
				return size() > maxKeys;
			}
		};
	}

	/** True when the key already has {@code limit} events inside the window. Counts nothing. */
	synchronized boolean isFull(String key, Instant now) {
		// A read creates no entry: checking many different keys must not push real counters out of the map.
		Deque<Instant> times = events.get(key);
		return times != null && expire(times, now).size() >= limit;
	}

	/** Counts one more event for the key. Does nothing past the limit, which keeps the memory per key small. */
	synchronized void add(String key, Instant now) {
		Deque<Instant> times = recent(key, now);
		if (times.size() < limit) {
			times.addLast(now);
		}
	}

	/** Counts the event unless the key is full; the answer says whether it was counted. */
	synchronized boolean tryAdd(String key, Instant now) {
		if (isFull(key, now)) {
			return false;
		}
		add(key, now);
		return true;
	}

	private Deque<Instant> recent(String key, Instant now) {
		return expire(events.computeIfAbsent(key, ignored -> new ArrayDeque<>()), now);
	}

	private Deque<Instant> expire(Deque<Instant> times, Instant now) {
		Instant oldestKept = now.minus(window);
		while (!times.isEmpty() && !times.getFirst().isAfter(oldestKept)) {
			times.removeFirst();
		}
		return times;
	}

}
