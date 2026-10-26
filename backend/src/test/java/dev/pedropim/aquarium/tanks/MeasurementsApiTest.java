package dev.pedropim.aquarium.tanks;

import static org.assertj.core.api.Assertions.assertThat;

import java.time.Instant;
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
class MeasurementsApiTest {

	@LocalServerPort
	int port;

	@Autowired
	MutableClock clock;

	@Autowired
	RecordingEmailSender mail;

	ApiClient keeper;

	String tankId;

	@BeforeEach
	void aKeeperWithATank() {
		keeper = Accounts.loggedInBrowser(port, mail);
		tankId = newTank(keeper);
	}

	@Test
	void severalValuesRecordedTogetherShareTheMomentAndTheNote() {
		Response created = keeper.post(measurements(tankId), Map.of("measuredAt", "2026-01-10T08:30:00Z", "note",
				"API kit", "values", Map.of("ph", 6.8, "nitrate", 20)));

		assertThat(created.status()).isEqualTo(201);
		assertThat(created.items()).hasSize(2);
		Response list = keeper.get(measurements(tankId));
		assertThat(list.status()).isEqualTo(200);
		assertThat(list.items()).extracting(m -> m.get("parameter")).containsExactlyInAnyOrder("ph", "nitrate");
		assertThat(list.items()).allSatisfy(m -> {
			assertThat(m.get("id")).isNotNull();
			assertThat(m.get("measuredAt")).isEqualTo("2026-01-10T08:30:00Z");
			assertThat(m.get("note")).isEqualTo("API kit");
		});
		assertThat(value(list, "ph")).isEqualTo(6.8);
		assertThat(value(list, "nitrate")).isEqualTo(20.0);
	}

	@Test
	void aSubmissionWithoutAnyValueIsRefused() {
		Response none = keeper.post(measurements(tankId), Map.of("note", "forgot to fill"));
		Response empty = keeper.post(measurements(tankId), Map.of("values", Map.of()));

		assertThat(none.status()).isEqualTo(400);
		assertThat(none.field("fields")).isEqualTo(Map.of("values", "required"));
		assertThat(empty.status()).isEqualTo(400);
		assertThat(empty.field("fields")).isEqualTo(Map.of("values", "required"));
		assertThat(keeper.get(measurements(tankId)).items()).isEmpty();
	}

	@Test
	void theMomentDefaultsToNowAcceptsThePastAndRefusesTheFuture() {
		Instant now = clock.instant();

		Response defaulted = keeper.post(measurements(tankId), Map.of("values", Map.of("ph", 7)));
		Response exactlyNow = keeper.post(measurements(tankId), Map.of("measuredAt", now.toString(), "values", Map.of("ph", 7)));
		Response past = keeper.post(measurements(tankId),
				Map.of("measuredAt", now.minusSeconds(86400 * 400L).toString(), "values", Map.of("ph", 7)));
		Response future = keeper.post(measurements(tankId),
				Map.of("measuredAt", now.plusSeconds(1).toString(), "values", Map.of("ph", 7)));

		assertThat(defaulted.status()).isEqualTo(201);
		assertThat(defaulted.items().getFirst().get("measuredAt")).isEqualTo(now.toString());
		assertThat(exactlyNow.status()).isEqualTo(201);
		assertThat(past.status()).isEqualTo(201);
		assertThat(future.status()).isEqualTo(400);
		assertThat(future.field("fields")).isEqualTo(Map.of("measuredAt", "in_future"));
		assertThat(keeper.get(measurements(tankId)).items()).hasSize(3);
	}

	@Test
	void valuesOutsideWhatIsPhysicallyPossibleAreRefusedAndNothingIsSaved() {
		Response response = keeper.post(measurements(tankId), Map.of("values", Map.of("ph", 72, "temperature", 46,
				"nitrate", -1, "kh", 6)));

		assertThat(response.status()).isEqualTo(400);
		assertThat(response.field("code")).isEqualTo("validation_failed");
		assertThat(response.field("fields")).isEqualTo(
				Map.of("values.ph", "out_of_range", "values.temperature", "out_of_range", "values.nitrate",
						"out_of_range"));
		assertThat(keeper.get(measurements(tankId)).items()).isEmpty();
	}

	@Test
	void theBoundsThemselvesAreAccepted() {
		Response response = keeper.post(measurements(tankId),
				Map.of("values", Map.of("ph", 14, "temperature", 0, "total_ammonia", 0)));

		assertThat(response.status()).isEqualTo(201);
	}

	@Test
	void zeroIsStoredAsZeroNotAsMissing() {
		keeper.post(measurements(tankId), Map.of("values", Map.of("nitrite", 0, "ph", 7)));

		Response list = keeper.get(measurements(tankId));

		assertThat(list.items()).hasSize(2);
		assertThat(value(list, "nitrite")).isEqualTo(0.0);
	}

	@Test
	void anUnknownParameterOrATooPreciseValueIsRefused() {
		Response response = keeper.post(measurements(tankId),
				Map.of("values", Map.of("salinity", 35, "ph", 6.12345, "nitrate", 20)));

		assertThat(response.status()).isEqualTo(400);
		assertThat(response.field("fields"))
			.isEqualTo(Map.of("values.salinity", "unknown_parameter", "values.ph", "invalid"));
	}

	@Test
	void photometerReadingsWithThreeOrFourDecimalsAreKeptAsTyped() {
		keeper.post(measurements(tankId), Map.of("values", Map.of("nitrite", 0.025, "iron", 0.0051)));

		Response list = keeper.get(measurements(tankId));

		assertThat(value(list, "nitrite")).isEqualTo(0.025);
		assertThat(value(list, "iron")).isEqualTo(0.0051);
	}

	@Test
	void latestShowsTheMostRecentlyMeasuredValueOfEachParameterNotTheLastEntered() {
		keeper.post(measurements(tankId), Map.of("measuredAt", "2026-01-10T08:00:00Z", "values", Map.of("ph", 6.8, "nitrate", 10)));
		keeper.post(measurements(tankId), Map.of("measuredAt", "2026-01-12T08:00:00Z", "values", Map.of("nitrate", 25)));
		// Entered last, but measured before the others: it must not become the latest pH.
		keeper.post(measurements(tankId), Map.of("measuredAt", "2026-01-01T08:00:00Z", "values", Map.of("ph", 7.4)));

		Response latest = keeper.get(measurements(tankId) + "/latest");

		assertThat(latest.status()).isEqualTo(200);
		assertThat(latest.items()).extracting(m -> m.get("parameter")).containsExactly("ph", "nitrate");
		assertThat(value(latest, "ph")).isEqualTo(6.8);
		assertThat(value(latest, "nitrate")).isEqualTo(25.0);
		assertThat(latest.items().getLast().get("measuredAt")).isEqualTo("2026-01-12T08:00:00Z");
	}

	@Test
	void aTankWithoutMeasurementsHasNoLatestValues() {
		assertThat(keeper.get(measurements(tankId) + "/latest").items()).isEmpty();
	}

	@Test
	void editingChangesTheValueTheMomentAndTheNoteButNotTheParameter() {
		String id = recordPh(keeper, tankId, 6.8);

		Response edited = keeper.put(measurements(tankId) + "/" + id,
				Map.of("value", 7.1, "measuredAt", "2026-01-09T20:15:00Z", "note", "re-tested"));

		assertThat(edited.status()).isEqualTo(200);
		Response list = keeper.get(measurements(tankId));
		assertThat(list.items()).hasSize(1);
		Map<String, Object> measurement = list.items().getFirst();
		assertThat(measurement.get("id")).isEqualTo(id);
		assertThat(measurement.get("parameter")).isEqualTo("ph");
		assertThat(value(list, "ph")).isEqualTo(7.1);
		assertThat(measurement.get("measuredAt")).isEqualTo("2026-01-09T20:15:00Z");
		assertThat(measurement.get("note")).isEqualTo("re-tested");
	}

	@Test
	void anEditIsValidatedLikeARecording() {
		String id = recordPh(keeper, tankId, 6.8);
		Instant future = clock.instant().plusSeconds(3600);

		Response response = keeper.put(measurements(tankId) + "/" + id,
				Map.of("value", 72, "measuredAt", future.toString()));

		assertThat(response.status()).isEqualTo(400);
		assertThat(response.field("fields")).isEqualTo(Map.of("value", "out_of_range", "measuredAt", "in_future"));
		assertThat(value(keeper.get(measurements(tankId)), "ph")).isEqualTo(6.8);
	}

	@Test
	void deletingRemovesOnlyThatMeasurement() {
		String id = recordPh(keeper, tankId, 6.8);
		keeper.post(measurements(tankId), Map.of("values", Map.of("nitrate", 20)));

		Response deleted = keeper.delete(measurements(tankId) + "/" + id);

		assertThat(deleted.status()).isEqualTo(204);
		assertThat(keeper.get(measurements(tankId)).items()).extracting(m -> m.get("parameter")).containsExactly("nitrate");
		Response again = keeper.delete(measurements(tankId) + "/" + id);
		assertThat(again.status()).isEqualTo(404);
		assertThat(again.field("code")).isEqualTo("measurement_not_found");
	}

	@Test
	void anotherKeepersTankAndMeasurementsAreNotFoundAndStayUntouched() {
		String id = recordPh(keeper, tankId, 6.8);
		ApiClient intruder = Accounts.loggedInBrowser(port, mail);
		String path = measurements(tankId);

		assertThat(intruder.get(path).status()).isEqualTo(404);
		assertThat(intruder.get(path + "/latest").status()).isEqualTo(404);
		assertThat(intruder.post(path, Map.of("values", Map.of("ph", 7))).status()).isEqualTo(404);
		Response edit = intruder.put(path + "/" + id, Map.of("value", 1, "measuredAt", "2026-01-01T00:00:00Z"));
		Response delete = intruder.delete(path + "/" + id);

		assertThat(edit.status()).isEqualTo(404);
		assertThat(edit.field("code")).isEqualTo("tank_not_found");
		assertThat(delete.status()).isEqualTo(404);
		assertThat(delete.field("code")).isEqualTo("tank_not_found");
		Response list = keeper.get(path);
		assertThat(list.items()).hasSize(1);
		assertThat(value(list, "ph")).isEqualTo(6.8);
	}

	@Test
	void aMeasurementOfAnotherTankIsNotFoundEvenForItsOwner() {
		String id = recordPh(keeper, tankId, 6.8);
		String otherTank = newTank(keeper);

		Response delete = keeper.delete(measurements(otherTank) + "/" + id);
		Response edit = keeper.put(measurements(otherTank) + "/" + id,
				Map.of("value", 1, "measuredAt", "2026-01-01T00:00:00Z"));

		assertThat(delete.status()).isEqualTo(404);
		assertThat(edit.status()).isEqualTo(404);
		assertThat(edit.field("code")).isEqualTo("measurement_not_found");
		assertThat(value(keeper.get(measurements(tankId)), "ph")).isEqualTo(6.8);
	}

	@Test
	void anIdThatIsNotAnIdAndATankThatDoesNotExistAreNotFound() {
		assertThat(keeper.delete(measurements(tankId) + "/not-an-id").status()).isEqualTo(404);
		assertThat(keeper.get(measurements(UUID.randomUUID().toString())).status()).isEqualTo(404);
		assertThat(keeper.get(measurements("not-an-id")).status()).isEqualTo(404);
	}

	@Test
	void withoutALoginTheMeasurementEndpointsAnswerUnauthorized() {
		ApiClient visitor = new ApiClient(port);

		assertThat(visitor.get(measurements(tankId)).status()).isEqualTo(401);
		assertThat(visitor.post(measurements(tankId), Map.of("values", Map.of("ph", 7))).status()).isEqualTo(401);
	}

	@Test
	void aTooLongNoteIsRefusedAndABlankNoteMeansNoNote() {
		Response tooLong = keeper.post(measurements(tankId), Map.of("note", "x".repeat(2001), "values", Map.of("ph", 7)));
		Response blank = keeper.post(measurements(tankId), Map.of("note", "   ", "values", Map.of("ph", 7)));

		assertThat(tooLong.status()).isEqualTo(400);
		assertThat(tooLong.field("fields")).isEqualTo(Map.of("note", "too_long"));
		assertThat(blank.status()).isEqualTo(201);
		assertThat(blank.items().getFirst().get("note")).isNull();
	}

	@Test
	void theFixedParameterListGivesEachCodeItsUnitAndBounds() {
		Response parameters = keeper.get("/api/parameters");

		assertThat(parameters.status()).isEqualTo(200);
		assertThat(parameters.items()).extracting(p -> p.get("code"))
			.containsExactly("temperature", "ph", "gh", "kh", "total_ammonia", "nitrite", "nitrate", "phosphate",
					"conductivity", "iron", "potassium");
		Map<String, Object> temperature = parameters.items().getFirst();
		assertThat(temperature.get("unit")).isEqualTo("°C");
		assertThat(((Number) temperature.get("min")).doubleValue()).isEqualTo(0.0);
		assertThat(((Number) temperature.get("max")).doubleValue()).isEqualTo(45.0);
		assertThat(parameters.items().get(1).get("unit")).isEqualTo("");
	}

	@Test
	void aSingleMeasurementCanBeReadAndOnlyByItsOwner() {
		String id = recordPh(keeper, tankId, 6.8);
		ApiClient intruder = Accounts.loggedInBrowser(port, mail);

		Response read = keeper.get(measurements(tankId) + "/" + id);
		Response foreign = intruder.get(measurements(tankId) + "/" + id);

		assertThat(read.status()).isEqualTo(200);
		assertThat(read.field("parameter")).isEqualTo("ph");
		assertThat(((Number) read.field("value")).doubleValue()).isEqualTo(6.8);
		assertThat(foreign.status()).isEqualTo(404);
		assertThat(keeper.get(measurements(tankId) + "/" + UUID.randomUUID()).status()).isEqualTo(404);
	}

	@Test
	void theListCanBeLimitedToTheNewestMeasurements() {
		keeper.post(measurements(tankId), Map.of("measuredAt", "2026-01-01T08:00:00Z", "values", Map.of("ph", 6.0)));
		keeper.post(measurements(tankId), Map.of("measuredAt", "2026-01-03T08:00:00Z", "values", Map.of("ph", 6.4)));
		keeper.post(measurements(tankId), Map.of("measuredAt", "2026-01-02T08:00:00Z", "values", Map.of("ph", 6.2)));

		Response newest = keeper.get(measurements(tankId) + "?limit=2");

		assertThat(newest.items()).extracting(m -> m.get("measuredAt"))
			.containsExactly("2026-01-03T08:00:00Z", "2026-01-02T08:00:00Z");
		assertThat(keeper.get(measurements(tankId) + "?limit=0").items()).hasSize(1);
		assertThat(keeper.get(measurements(tankId) + "?limit=999999").items()).hasSize(3);
	}

	/** Records a pH value and gives the id of the new Measurement. */
	static String recordPh(ApiClient browser, String tankId, double ph) {
		Response created = browser.post(measurements(tankId), Map.of("measuredAt", "2026-01-10T08:00:00Z", "values",
				Map.of("ph", ph)));
		return (String) created.items().getFirst().get("id");
	}

	static String newTank(ApiClient browser) {
		Map<String, Object> details = new HashMap<>();
		details.put("name", "Blackwater 120");
		details.put("startDate", "2025-03-01");
		return (String) browser.post("/api/tanks", details).field("id");
	}

	static String measurements(String tankId) {
		return "/api/tanks/" + tankId + "/measurements";
	}

	/** The value of one Parameter in a list of Measurements. */
	static double value(Response list, String parameter) {
		return list.items()
			.stream()
			.filter(m -> parameter.equals(m.get("parameter")))
			.map(m -> ((Number) m.get("value")).doubleValue())
			.findFirst()
			.orElseThrow(() -> new AssertionError("No " + parameter + " in " + list.body()));
	}

}
