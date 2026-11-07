package dev.pedropim.aquarium.tanks;

import static org.assertj.core.api.Assertions.assertThat;

import java.util.UUID;

import javax.sql.DataSource;

import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.builder.SpringApplicationBuilder;
import org.springframework.context.ConfigurableApplicationContext;
import org.springframework.jdbc.core.JdbcTemplate;

import com.zaxxer.hikari.HikariDataSource;

import dev.pedropim.aquarium.AquariumApplication;
import dev.pedropim.aquarium.support.ApiTest;

/**
 * Starts the real application the way production does, with {@code DEMO_TANK_ID} set, so the startup runner is called
 * from outside its own bean. Calling {@code flag} directly would hide a missing transaction.
 */
@ApiTest
class DemoTankBootTest {

	@Autowired
	JdbcTemplate jdbc;

	@Autowired
	DataSource dataSource;

	@AfterEach
	void cleanUp() {
		jdbc.update("update tanks set demo = false");
		jdbc.update("delete from tanks where name like 'Boot test %'");
		jdbc.update("delete from users where email = 'boot-test@example.com'");
	}

	@Test
	void startingWithAnExistingTankIdLeavesExactlyThatTankAsTheDemoTank() {
		UUID owner = newOwner();
		UUID first = newTank(owner, "Boot test first");
		UUID second = newTank(owner, "Boot test second");
		jdbc.update("update tanks set demo = true where id = ?", first);

		boot(second.toString());

		assertThat(jdbc.queryForObject("select count(*) from tanks where demo", Integer.class)).isEqualTo(1);
		assertThat(jdbc.queryForObject("select demo from tanks where id = ?", Boolean.class, second)).isTrue();
	}

	@Test
	void startingWithAnIdThatIsNoTankKeepsTheDemoTankAndStarts() {
		UUID first = newTank(newOwner(), "Boot test first");
		jdbc.update("update tanks set demo = true where id = ?", first);

		boot(UUID.randomUUID().toString());

		assertThat(jdbc.queryForObject("select demo from tanks where id = ?", Boolean.class, first)).isTrue();
	}

	@Test
	void startingWithAValueThatIsNotAnIdKeepsTheDemoTankAndStarts() {
		UUID first = newTank(newOwner(), "Boot test first");
		jdbc.update("update tanks set demo = true where id = ?", first);

		boot("not-an-id");

		assertThat(jdbc.queryForObject("select demo from tanks where id = ?", Boolean.class, first)).isTrue();
	}

	private void boot(String demoTankId) {
		HikariDataSource hikari = (HikariDataSource) dataSource;
		// The database goes in as arguments: with .properties(...) application.properties would win and the app would
		// reach the local database instead.
		try (ConfigurableApplicationContext started = new SpringApplicationBuilder(AquariumApplication.class).run(
				"--server.port=0", "--spring.datasource.url=" + hikari.getJdbcUrl(),
				"--spring.datasource.username=" + hikari.getUsername(),
				"--spring.datasource.password=" + hikari.getPassword(), "--app.demo-tank-id=" + demoTankId,
				"--app.photos.dir=target/test-photos", "--spring.main.banner-mode=off")) {
			assertThat(started.isRunning()).isTrue();
		}
	}

	private UUID newOwner() {
		UUID owner = UUID.randomUUID();
		jdbc.update("insert into users (id, email, password_hash, language, confirmed_at, created_at) "
				+ "values (?, 'boot-test@example.com', 'no-login', 'en', now(), now())", owner);
		return owner;
	}

	private UUID newTank(UUID owner, String name) {
		UUID id = UUID.randomUUID();
		jdbc.update("insert into tanks (id, owner_id, name, start_date, created_at) values (?, ?, ?, date '2025-01-01', now())",
				id, owner, name);
		return id;
	}

}
