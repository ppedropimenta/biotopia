package dev.pedropim.aquarium.tanks;

import static org.assertj.core.api.Assertions.assertThat;

import java.time.Duration;
import java.util.HashMap;
import java.util.Map;
import java.util.UUID;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.web.server.LocalServerPort;

import dev.pedropim.aquarium.support.Accounts;
import dev.pedropim.aquarium.support.ApiClient;
import dev.pedropim.aquarium.support.ApiClient.Response;
import dev.pedropim.aquarium.support.ApiTest;
import dev.pedropim.aquarium.support.MutableClock;
import dev.pedropim.aquarium.support.RecordingEmailSender;

@ApiTest
class TanksApiTest {

	@LocalServerPort
	int port;

	@Autowired
	RecordingEmailSender mail;

	@Autowired
	MutableClock clock;

	ApiClient keeper;

	@BeforeEach
	void aLoggedInKeeper() {
		keeper = Accounts.loggedInBrowser(port, mail);
	}

	@Test
	void creatingATankKeepsEveryDetailAndGivesItAnId() {
		Response created = keeper.post("/api/tanks", Map.of("name", "Blackwater 120", "startDate", "2025-03-01",
				"lengthCm", 80.5, "widthCm", 35, "heightCm", 45, "netVolumeLiters", 98.5, "note", "Peat filter"));

		assertThat(created.status()).isEqualTo(201);
		assertThat(created.field("id")).isNotNull();
		assertThat(created.field("name")).isEqualTo("Blackwater 120");
		assertThat(created.field("startDate")).isEqualTo("2025-03-01");
		assertThat(number(created, "lengthCm")).isEqualTo(80.5);
		assertThat(number(created, "widthCm")).isEqualTo(35.0);
		assertThat(number(created, "heightCm")).isEqualTo(45.0);
		assertThat(number(created, "netVolumeLiters")).isEqualTo(98.5);
		assertThat(created.field("note")).isEqualTo("Peat filter");
	}

	@Test
	void theListShowsTheKeepersOwnTanksOnlyOldestFirst() {
		keeper.post("/api/tanks", tank("shrimp cube"));
		clock.advance(Duration.ofMinutes(1));
		keeper.post("/api/tanks", tank("Blackwater 120"));
		ApiClient someoneElse = Accounts.loggedInBrowser(port, mail);
		someoneElse.post("/api/tanks", tank("Not mine"));

		Response list = keeper.get("/api/tanks");

		assertThat(list.status()).isEqualTo(200);
		assertThat(list.items()).extracting(item -> item.get("name")).containsExactly("shrimp cube", "Blackwater 120");
	}

	@Test
	void aKeeperWithoutTanksGetsAnEmptyList() {
		Response list = keeper.get("/api/tanks");

		assertThat(list.status()).isEqualTo(200);
		assertThat(list.items()).isEmpty();
	}

	@Test
	void aTankCanBeReadByItsId() {
		String id = (String) keeper.post("/api/tanks", tank("Blackwater 120")).field("id");

		Response read = keeper.get("/api/tanks/" + id);

		assertThat(read.status()).isEqualTo(200);
		assertThat(read.field("name")).isEqualTo("Blackwater 120");
	}

	@Test
	void editingReplacesTheDetailsAndEmptyFieldsAreCleared() {
		String id = (String) keeper.post("/api/tanks", Map.of("name", "Blackwater 120", "startDate", "2025-03-01",
				"lengthCm", 80, "netVolumeLiters", 98, "note", "Peat filter")).field("id");

		Response edited = keeper.put("/api/tanks/" + id, Map.of("name", "Blackwater 125", "startDate", "2025-03-02",
				"netVolumeLiters", 101.5));

		assertThat(edited.status()).isEqualTo(200);
		Response read = keeper.get("/api/tanks/" + id);
		assertThat(read.field("name")).isEqualTo("Blackwater 125");
		assertThat(read.field("startDate")).isEqualTo("2025-03-02");
		assertThat(number(read, "netVolumeLiters")).isEqualTo(101.5);
		assertThat(read.field("lengthCm")).isNull();
		assertThat(read.field("note")).isNull();
	}

	@Test
	void anotherKeepersTankIsNotFoundForReadingAndWritingAndStaysUntouched() {
		String id = (String) keeper.post("/api/tanks", tank("Blackwater 120")).field("id");
		ApiClient intruder = Accounts.loggedInBrowser(port, mail);

		Response read = intruder.get("/api/tanks/" + id);
		Response write = intruder.put("/api/tanks/" + id, tank("Taken over"));

		assertThat(read.status()).isEqualTo(404);
		assertThat(read.field("code")).isEqualTo("tank_not_found");
		assertThat(write.status()).isEqualTo(404);
		assertThat(write.field("code")).isEqualTo("tank_not_found");
		assertThat(keeper.get("/api/tanks/" + id).field("name")).isEqualTo("Blackwater 120");
	}

	@Test
	void aTankThatDoesNotExistIsNotFoundWhateverTheIdLooksLike() {
		assertThat(keeper.get("/api/tanks/" + UUID.randomUUID()).status()).isEqualTo(404);
		assertThat(keeper.get("/api/tanks/not-an-id").status()).isEqualTo(404);
		assertThat(keeper.put("/api/tanks/not-an-id", tank("Anything")).status()).isEqualTo(404);
	}

	@Test
	void withoutALoginTheTankEndpointsAnswerUnauthorized() {
		ApiClient visitor = new ApiClient(port);

		assertThat(visitor.get("/api/tanks").status()).isEqualTo(401);
		assertThat(visitor.post("/api/tanks", tank("Blackwater 120")).status()).isEqualTo(401);
	}

	@Test
	void netVolumeStaysEmptyWhenOnlyTheDimensionsAreGiven() {
		Response created = keeper.post("/api/tanks", Map.of("name", "Cube", "startDate", "2025-03-01", "lengthCm", 60,
				"widthCm", 30, "heightCm", 36));

		assertThat(created.status()).isEqualTo(201);
		assertThat(created.field("netVolumeLiters")).isNull();
		assertThat(keeper.get("/api/tanks/" + created.field("id")).field("netVolumeLiters")).isNull();
	}

	@Test
	void aNameAndAStartDateAreRequired() {
		Map<String, Object> nothing = new HashMap<>();
		nothing.put("name", "   ");

		Response response = keeper.post("/api/tanks", nothing);

		assertThat(response.status()).isEqualTo(400);
		assertThat(response.field("code")).isEqualTo("validation_failed");
		assertThat(response.field("fields")).isEqualTo(Map.of("name", "required", "startDate", "required"));
		assertThat(keeper.get("/api/tanks").items()).isEmpty();
	}

	@Test
	void sizesMustBePositiveReasonableAndHaveAtMostTwoDecimals() {
		Map<String, Object> details = tank("Odd");
		details.put("lengthCm", 0);
		details.put("widthCm", -5);
		details.put("heightCm", 20000);
		details.put("netVolumeLiters", 10.123);

		Response response = keeper.post("/api/tanks", details);

		assertThat(response.status()).isEqualTo(400);
		assertThat(response.field("fields")).isEqualTo(Map.of("lengthCm", "invalid", "widthCm", "invalid",
				"heightCm", "invalid", "netVolumeLiters", "invalid"));
	}

	@Test
	void aTooLongNameOrNoteIsRefused() {
		Map<String, Object> details = tank("x".repeat(101));
		details.put("note", "x".repeat(2001));

		Response response = keeper.post("/api/tanks", details);

		assertThat(response.status()).isEqualTo(400);
		assertThat(response.field("fields")).isEqualTo(Map.of("name", "too_long", "note", "too_long"));
	}

	@Test
	void anEditIsValidatedLikeACreation() {
		String id = (String) keeper.post("/api/tanks", tank("Blackwater 120")).field("id");

		Response response = keeper.put("/api/tanks/" + id, tank(""));

		assertThat(response.status()).isEqualTo(400);
		assertThat(keeper.get("/api/tanks/" + id).field("name")).isEqualTo("Blackwater 120");
	}

	@Test
	void theNameIsTrimmedAndABlankNoteMeansNoNote() {
		Map<String, Object> details = tank("  Blackwater 120 ");
		details.put("note", "   ");

		Response created = keeper.post("/api/tanks", details);

		assertThat(created.field("name")).isEqualTo("Blackwater 120");
		assertThat(created.field("note")).isNull();
	}

	private static double number(Response response, String field) {
		return ((Number) response.field(field)).doubleValue();
	}

	private static Map<String, Object> tank(String name) {
		Map<String, Object> details = new HashMap<>();
		details.put("name", name);
		details.put("startDate", "2025-03-01");
		return details;
	}

}
