package dev.pedropim.aquarium.support;

import java.util.UUID;

import org.springframework.boot.ApplicationRunner;
import org.springframework.context.annotation.Bean;
import org.springframework.jdbc.core.JdbcTemplate;

/**
 * Only for the browser journeys: a Demo Tank with a little history, so a journey can open it as a visitor. The real
 * Demo Tank is flagged by the operator with {@code DEMO_TANK_ID}; here the flag is set directly in the throwaway
 * database. The owner cannot log in (its password hash matches nothing).
 * Not annotated on purpose: it must stay out of the component scan of the API tests, so only
 * {@code TestAquariumApplication} adds it.
 */
public class E2eDemoTank {

	@Bean
	ApplicationRunner seedDemoTank(JdbcTemplate jdbc) {
		return args -> {
			UUID owner = UUID.randomUUID();
			UUID tank = UUID.randomUUID();
			jdbc.update("insert into users (id, email, password_hash, language, confirmed_at, created_at) "
					+ "values (?, 'demo-owner@example.com', 'no-login', 'en', now(), now())", owner);
			jdbc.update("insert into tanks (id, owner_id, name, start_date, net_volume_liters, created_at, demo) "
					+ "values (?, ?, 'Demo blackwater', date '2025-03-01', 98.5, now(), true)", tank, owner);
			for (int days : new int[] { 14, 7, 1 }) {
				jdbc.update("insert into measurements (id, tank_id, parameter, value, measured_at, created_at) "
						+ "values (?, ?, 'ph', 6.2, now() - make_interval(days => ?), now())", UUID.randomUUID(), tank,
						days);
			}
			jdbc.update("insert into maintenance (id, tank_id, type, percent, performed_at, created_at) "
					+ "values (?, ?, 'water_change', 30, now() - interval '3 days', now())", UUID.randomUUID(), tank);
		};
	}

}
