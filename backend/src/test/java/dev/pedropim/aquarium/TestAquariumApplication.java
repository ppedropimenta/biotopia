package dev.pedropim.aquarium;

import org.springframework.boot.SpringApplication;

import dev.pedropim.aquarium.support.E2eDemoTank;
import dev.pedropim.aquarium.support.TestcontainersConfiguration;

/**
 * Runs the app locally with a throwaway PostgreSQL from Testcontainers, no compose needed. It also has a Demo Tank, for the browser journeys.
 */
public class TestAquariumApplication {

	public static void main(String[] args) {
		SpringApplication.from(AquariumApplication::main).with(TestcontainersConfiguration.class, E2eDemoTank.class).run(args);
	}

}
