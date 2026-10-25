package dev.pedropim.aquarium;

import static org.assertj.core.api.Assertions.assertThat;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.web.server.LocalServerPort;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.web.client.RestClient;

import dev.pedropim.aquarium.support.ApiTest;

@ApiTest
class HealthApiTest {

	@LocalServerPort
	int port;

	@Autowired
	JdbcTemplate jdbc;

	@Test
	void reportsUpWhenTheDatabaseIsReachable() {
		Health health = RestClient.create("http://localhost:" + port)
			.get()
			.uri("/actuator/health")
			.retrieve()
			.body(Health.class);

		assertThat(health.status()).isEqualTo("UP");
	}

	record Health(String status) {
	}

	@Test
	void appliesMigrationsOnStartup() {
		Integer applied = jdbc.queryForObject(
				"select count(*) from flyway_schema_history where version = '1' and success", Integer.class);

		assertThat(applied).isEqualTo(1);
	}

}
