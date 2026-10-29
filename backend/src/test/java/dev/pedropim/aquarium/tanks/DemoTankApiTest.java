package dev.pedropim.aquarium.tanks;

import static org.assertj.core.api.Assertions.assertThat;

import java.util.HashMap;
import java.util.Map;
import java.util.UUID;

import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.web.server.LocalServerPort;
import org.springframework.jdbc.core.JdbcTemplate;

import dev.pedropim.aquarium.support.Accounts;
import dev.pedropim.aquarium.support.ApiClient;
import dev.pedropim.aquarium.support.ApiClient.Download;
import dev.pedropim.aquarium.support.ApiClient.Response;
import dev.pedropim.aquarium.support.ApiTest;
import dev.pedropim.aquarium.support.RecordingEmailSender;

import static dev.pedropim.aquarium.tanks.PhotoProcessorTest.Images;

@ApiTest
class DemoTankApiTest {

	@LocalServerPort
	int port;

	@Autowired
	RecordingEmailSender mail;

	@Autowired
	JdbcTemplate jdbc;

	@Autowired
	DemoTankSetup setup;

	ApiClient owner;

	ApiClient visitor;

	String demoId;

	String photoId;

	@BeforeEach
	void aDemoTankWithHistory() {
		owner = Accounts.loggedInBrowser(port, mail);
		visitor = new ApiClient(port);
		demoId = newTank(owner, "Blackwater 120");
		owner.post(measurements(demoId), Map.of("values", Map.of("ph", 6.5, "temperature", 25)));
		owner.post(maintenance(demoId), Map.of("type", "water_change", "percent", 30));
		photoId = (String) owner.postForm(photos(demoId), Map.of("file", Images.jpeg(60, 40))).field("id");
		jdbc.update("update tanks set demo = false");
		jdbc.update("update tanks set demo = true where id = ?", UUID.fromString(demoId));
	}

	@AfterEach
	void noDemoLeftBehind() {
		jdbc.update("update tanks set demo = false");
	}

	@Test
	void aVisitorWithoutASessionReadsTheDemoTankAndAllItsHistory() {
		Response found = visitor.get("/api/demo");
		Response tank = visitor.get("/api/tanks/" + demoId);

		assertThat(found.status()).isEqualTo(200);
		assertThat(found.field("id")).isEqualTo(demoId);
		assertThat(tank.status()).isEqualTo(200);
		assertThat(tank.field("name")).isEqualTo("Blackwater 120");
		assertThat(tank.field("demo")).isEqualTo(true);
		assertThat(tank.field("readOnly")).isEqualTo(true);
		assertThat(visitor.get("/api/parameters").status()).isEqualTo(200);
		assertThat(visitor.get(measurements(demoId)).items()).hasSize(2);
		assertThat(visitor.get(measurements(demoId) + "/latest").items()).hasSize(2);
		assertThat(visitor.get(maintenance(demoId)).items()).hasSize(1);
		assertThat(visitor.get(photos(demoId)).items()).hasSize(1);
		assertThat(visitor.get(photos(demoId) + "/summary").field("count")).isEqualTo(1);
		Download file = visitor.download(photos(demoId) + "/" + photoId + "/file");
		assertThat(file.status()).isEqualTo(200);
		assertThat(file.contentType()).startsWith("image/jpeg");
	}

	@Test
	void everyWriteIsRefusedForAVisitor() {
		String measurementId = (String) visitor.get(measurements(demoId)).items().getFirst().get("id");

		assertThat(visitor.post(measurements(demoId), Map.of("values", Map.of("ph", 7))).status()).isEqualTo(401);
		assertThat(visitor.put("/api/tanks/" + demoId, Map.of("name", "Mine", "startDate", "2025-03-01")).status())
			.isEqualTo(401);
		assertThat(visitor.delete(measurements(demoId) + "/" + measurementId).status()).isEqualTo(401);
		assertThat(visitor.post(maintenance(demoId), Map.of("type", "top_up")).status()).isEqualTo(401);
		assertThat(visitor.postForm(photos(demoId), Map.of("file", Images.jpeg(20, 20))).status()).isEqualTo(401);
		assertThat(visitor.delete(photos(demoId) + "/" + photoId).status()).isEqualTo(401);
		assertThat(visitor.delete("/api/tanks/" + demoId).status()).isEqualTo(401);
		assertThat(visitor.post("/api/tanks/" + demoId + "/archive", Map.of()).status()).isEqualTo(401);
		assertThat(owner.get(measurements(demoId)).items()).hasSize(2);
	}

	@Test
	void anotherLoggedInUserReadsTheDemoTankButCannotWriteToIt() {
		ApiClient stranger = Accounts.loggedInBrowser(port, mail);

		Response tank = stranger.get("/api/tanks/" + demoId);

		assertThat(tank.status()).isEqualTo(200);
		assertThat(tank.field("readOnly")).isEqualTo(true);
		assertThat(stranger.get(photos(demoId)).items()).hasSize(1);
		assertThat(stranger.post(measurements(demoId), Map.of("values", Map.of("ph", 7))).status()).isEqualTo(404);
		assertThat(stranger.delete("/api/tanks/" + demoId).status()).isEqualTo(404);
		assertThat(stranger.get("/api/tanks").items()).isEmpty();
	}

	@Test
	void theOwnerKeepsLoggingTheDemoTankLikeAnyOther() {
		Response tank = owner.get("/api/tanks/" + demoId);
		Response added = owner.post(measurements(demoId), Map.of("values", Map.of("ph", 7)));

		assertThat(tank.field("readOnly")).isEqualTo(false);
		assertThat(tank.field("demo")).isEqualTo(true);
		assertThat(added.status()).isEqualTo(201);
		assertThat(visitor.get(measurements(demoId)).items()).hasSize(3);
	}

	@Test
	void aTankThatIsNotTheDemoTankStaysPrivateForVisitors() {
		String other = newTank(owner, "Private");
		owner.post(measurements(other), Map.of("values", Map.of("ph", 7)));

		assertThat(visitor.get("/api/tanks/" + other).status()).isEqualTo(401);
		assertThat(visitor.get(measurements(other)).status()).isEqualTo(401);
		assertThat(visitor.get(photos(other)).status()).isEqualTo(401);
		assertThat(visitor.get("/api/tanks").status()).isEqualTo(401);
		assertThat(visitor.get("/api/photo-usage").status()).isEqualTo(401);
	}

	@Test
	void withoutADemoTankTheDemoAnswersNotFound() {
		jdbc.update("update tanks set demo = false");

		assertThat(visitor.get("/api/demo").status()).isEqualTo(404);
		assertThat(visitor.get("/api/tanks/" + demoId).status()).isEqualTo(401);
	}

	@Test
	void settingTheDemoTankFromConfigurationLeavesExactlyOne() {
		String second = newTank(owner, "Second");

		setup.flag(UUID.fromString(second));

		assertThat(jdbc.queryForObject("select count(*) from tanks where demo", Integer.class)).isEqualTo(1);
		assertThat(visitor.get("/api/demo").field("id")).isEqualTo(second);
		// An id that is no Tank changes nothing.
		setup.flag(UUID.randomUUID());
		assertThat(visitor.get("/api/demo").field("id")).isEqualTo(second);
	}

	@Test
	void theDatabaseRefusesASecondDemoTank() {
		String second = newTank(owner, "Second");

		org.junit.jupiter.api.Assertions.assertThrows(org.springframework.dao.DuplicateKeyException.class,
				() -> jdbc.update("update tanks set demo = true where id = ?", UUID.fromString(second)));
	}

	private static String measurements(String tankId) {
		return "/api/tanks/" + tankId + "/measurements";
	}

	private static String maintenance(String tankId) {
		return "/api/tanks/" + tankId + "/maintenance";
	}

	private static String photos(String tankId) {
		return "/api/tanks/" + tankId + "/photos";
	}

	private static String newTank(ApiClient client, String name) {
		Map<String, Object> tank = new HashMap<>();
		tank.put("name", name);
		tank.put("startDate", "2025-03-01");
		return (String) client.post("/api/tanks", tank).field("id");
	}

}
