package dev.pedropim.aquarium.tanks;

import static org.assertj.core.api.Assertions.assertThat;

import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.web.server.LocalServerPort;
import org.springframework.jdbc.core.JdbcTemplate;

import dev.pedropim.aquarium.support.Accounts;
import dev.pedropim.aquarium.support.ApiClient;
import dev.pedropim.aquarium.support.ApiClient.Response;
import dev.pedropim.aquarium.support.ApiTest;
import dev.pedropim.aquarium.support.RecordingEmailSender;

import static dev.pedropim.aquarium.tanks.PhotoProcessorTest.Images;

@ApiTest
class TankLifecycleApiTest {

	@LocalServerPort
	int port;

	@Autowired
	RecordingEmailSender mail;

	@Autowired
	JdbcTemplate jdbc;

	@Autowired
	PhotoStorage storage;

	ApiClient keeper;

	@BeforeEach
	void aLoggedInKeeper() {
		keeper = Accounts.loggedInBrowser(port, mail);
	}

	@Test
	void anArchivedTankIsMarkedAndItsHistoryStaysViewable() {
		String tankId = newTank(keeper, "Old tank");
		keeper.post(measurements(tankId), Map.of("values", Map.of("ph", 7)));
		keeper.post(maintenance(tankId), Map.of("type", "top_up"));
		assertThat(keeper.get("/api/tanks/" + tankId).field("archivedAt")).isNull();

		Response archived = keeper.post("/api/tanks/" + tankId + "/archive", Map.of());

		assertThat(archived.status()).isEqualTo(200);
		assertThat(archived.field("archivedAt")).isNotNull();
		assertThat(keeper.get("/api/tanks").items()).extracting(t -> t.get("archivedAt")).doesNotContainNull();
		assertThat(keeper.get(measurements(tankId)).items()).hasSize(1);
		assertThat(keeper.get(maintenance(tankId)).items()).hasSize(1);
	}

	@Test
	void anArchivedTankRefusesNewMeasurementsMaintenanceAndPhotos() {
		String tankId = newTank(keeper, "Old tank");
		keeper.post("/api/tanks/" + tankId + "/archive", Map.of());

		Response measurement = keeper.post(measurements(tankId), Map.of("values", Map.of("ph", 7)));
		Response care = keeper.post(maintenance(tankId), Map.of("type", "top_up"));
		Response photo = keeper.postForm("/api/tanks/" + tankId + "/photos", Map.of("file", Images.jpeg(50, 50)));

		for (Response refused : List.of(measurement, care, photo)) {
			assertThat(refused.status()).isEqualTo(409);
			assertThat(refused.field("code")).isEqualTo("tank_archived");
		}
		assertThat(keeper.get(measurements(tankId)).items()).isEmpty();
	}

	@Test
	void restoringBringsTheTankBackToActive() {
		String tankId = newTank(keeper, "Old tank");
		keeper.post("/api/tanks/" + tankId + "/archive", Map.of());

		Response restored = keeper.post("/api/tanks/" + tankId + "/restore", Map.of());

		assertThat(restored.status()).isEqualTo(200);
		assertThat(restored.field("archivedAt")).isNull();
		assertThat(keeper.post(measurements(tankId), Map.of("values", Map.of("ph", 7))).status()).isEqualTo(201);
	}

	@Test
	void deletingATankRemovesItsRowsAndPhotoFilesAndNothingElse() {
		String doomed = newTank(keeper, "Doomed");
		String kept = newTank(keeper, "Kept");
		keeper.post(measurements(doomed), Map.of("values", Map.of("ph", 7, "temperature", 25)));
		keeper.post(maintenance(doomed), Map.of("type", "top_up"));
		String doomedKey = uploadAndFindKey(doomed);
		String keptKey = uploadAndFindKey(kept);
		keeper.post(measurements(kept), Map.of("values", Map.of("ph", 7)));

		Response deleted = keeper.delete("/api/tanks/" + doomed);

		assertThat(deleted.status()).isEqualTo(204);
		assertThat(keeper.get("/api/tanks/" + doomed).status()).isEqualTo(404);
		assertThat(rowsOf(doomed)).isEqualTo(0);
		assertThat(storage.get(doomedKey)).isEmpty();
		assertThat(storage.get(keptKey)).isPresent();
		assertThat(keeper.get(measurements(kept)).items()).hasSize(1);
		assertThat(keeper.get("/api/photo-usage").field("usedBytes")).isNotEqualTo(0);
	}

	@Test
	void anArchivedTankCanBeDeletedToo() {
		String tankId = newTank(keeper, "Old tank");
		keeper.post("/api/tanks/" + tankId + "/archive", Map.of());

		assertThat(keeper.delete("/api/tanks/" + tankId).status()).isEqualTo(204);
	}

	@Test
	void anotherUsersTankCannotBeArchivedRestoredOrDeleted() {
		String tankId = newTank(keeper, "Mine");
		ApiClient stranger = Accounts.loggedInBrowser(port, mail);

		assertThat(stranger.post("/api/tanks/" + tankId + "/archive", Map.of()).status()).isEqualTo(404);
		assertThat(stranger.post("/api/tanks/" + tankId + "/restore", Map.of()).status()).isEqualTo(404);
		assertThat(stranger.delete("/api/tanks/" + tankId).status()).isEqualTo(404);
		assertThat(keeper.get("/api/tanks/" + tankId).status()).isEqualTo(200);
	}

	@Test
	void deletingTheAccountRemovesEveryTankRowAndFileAndEndsTheSession() {
		String first = newTank(keeper, "First");
		String second = newTank(keeper, "Second");
		keeper.post(measurements(first), Map.of("values", Map.of("ph", 7)));
		keeper.post(maintenance(second), Map.of("type", "top_up"));
		String firstKey = uploadAndFindKey(first);
		String secondKey = uploadAndFindKey(second);
		String email = (String) keeper.get("/api/me").field("email");
		ApiClient other = Accounts.loggedInBrowser(port, mail);
		String otherTank = newTank(other, "Not touched");
		String otherKey = uploadAndFindKey(other, otherTank);

		Response deleted = keeper.post("/api/me/deletion", Map.of("password", Accounts.PASSWORD));

		assertThat(deleted.status()).isEqualTo(204);
		assertThat(keeper.get("/api/me").status()).isEqualTo(401);
		assertThat(jdbc.queryForObject("select count(*) from users where email = ?", Integer.class, email)).isEqualTo(0);
		assertThat(rowsOf(first) + rowsOf(second)).isEqualTo(0);
		assertThat(storage.get(firstKey)).isEmpty();
		assertThat(storage.get(secondKey)).isEmpty();
		assertThat(storage.get(otherKey)).isPresent();
		assertThat(other.get("/api/tanks/" + otherTank).status()).isEqualTo(200);
		assertThat(new ApiClient(port).post("/api/auth/login", Map.of("email", email, "password", Accounts.PASSWORD))
			.status()).isEqualTo(401);
	}

	@Test
	void deletingTheAccountNeedsThePassword() {
		String tankId = newTank(keeper, "Safe");

		Response wrong = keeper.post("/api/me/deletion", Map.of("password", "not my password"));

		assertThat(wrong.status()).isEqualTo(400);
		assertThat(wrong.field("fields")).isEqualTo(Map.of("password", "invalid"));
		assertThat(keeper.get("/api/tanks/" + tankId).status()).isEqualTo(200);
	}

	private int rowsOf(String tankId) {
		UUID id = UUID.fromString(tankId);
		int rows = 0;
		for (String table : List.of("tanks", "measurements", "maintenance", "tank_photos")) {
			String column = table.equals("tanks") ? "id" : "tank_id";
			rows += jdbc.queryForObject("select count(*) from " + table + " where " + column + " = ?", Integer.class, id);
		}
		return rows;
	}

	private String uploadAndFindKey(String tankId) {
		return uploadAndFindKey(keeper, tankId);
	}

	private String uploadAndFindKey(ApiClient client, String tankId) {
		Response uploaded = client.postForm("/api/tanks/" + tankId + "/photos", Map.of("file", Images.jpeg(60, 40)));
		assertThat(uploaded.status()).isEqualTo(201);
		return jdbc.queryForObject("select storage_key from tank_photos where id = ?", String.class,
				UUID.fromString((String) uploaded.field("id")));
	}

	private static String measurements(String tankId) {
		return "/api/tanks/" + tankId + "/measurements";
	}

	private static String maintenance(String tankId) {
		return "/api/tanks/" + tankId + "/maintenance";
	}

	private static String newTank(ApiClient client, String name) {
		Map<String, Object> tank = new HashMap<>();
		tank.put("name", name);
		tank.put("startDate", "2025-03-01");
		return (String) client.post("/api/tanks", tank).field("id");
	}

}
