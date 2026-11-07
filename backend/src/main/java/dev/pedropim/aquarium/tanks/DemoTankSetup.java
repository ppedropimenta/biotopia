package dev.pedropim.aquarium.tanks;

import java.util.UUID;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

/**
 * Flags the Demo Tank from configuration: the operator sets {@code DEMO_TANK_ID} to the id of a Tank and restarts.
 * It is not a user feature on purpose, so no one can publish a tank by mistake. With nothing set, the flag stays as
 * it is.
 */
@Component
class DemoTankSetup implements ApplicationRunner {

	private static final Logger LOG = LoggerFactory.getLogger(DemoTankSetup.class);

	private final TankRepository tanks;

	private final String configuredId;

	DemoTankSetup(TankRepository tanks, @Value("${app.demo-tank-id:}") String configuredId) {
		this.tanks = tanks;
		this.configuredId = configuredId;
	}

	/**
	 * Transactional here, not only on {@link #flag}: Spring calls this method from outside, through the proxy, while
	 * {@code run} calling {@code flag} on {@code this} would skip it.
	 */
	@Override
	@Transactional
	public void run(ApplicationArguments args) {
		if (configuredId.isBlank()) {
			return;
		}
		try {
			flag(UUID.fromString(configuredId.strip()));
		}
		catch (IllegalArgumentException notAnId) {
			LOG.warn("DEMO_TANK_ID is not a valid id; the Demo Tank is left as it was");
		}
	}

	/** Makes this Tank the only Demo Tank. An id that is no Tank changes nothing. */
	@Transactional
	public void flag(UUID id) {
		if (!tanks.existsById(id)) {
			LOG.warn("DEMO_TANK_ID names no tank; the Demo Tank is left as it was");
			return;
		}
		tanks.clearDemo();
		tanks.markDemo(id);
	}

}
