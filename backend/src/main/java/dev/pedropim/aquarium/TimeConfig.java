package dev.pedropim.aquarium;

import java.time.Clock;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

/**
 * All code asks this clock for "now" instead of calling the system time directly, so tests can fix the time.
 */
@Configuration(proxyBeanMethods = false)
class TimeConfig {

	@Bean
	Clock clock() {
		return Clock.systemUTC();
	}

}
