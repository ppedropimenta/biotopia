package dev.pedropim.aquarium;

import org.springframework.boot.SpringApplication;

import dev.pedropim.aquarium.support.TestcontainersConfiguration;

/**
 * Runs the app locally with a throwaway PostgreSQL from Testcontainers, no compose needed.
 */
public class TestAquariumApplication {

	public static void main(String[] args) {
		SpringApplication.from(AquariumApplication::main).with(TestcontainersConfiguration.class).run(args);
	}

}
