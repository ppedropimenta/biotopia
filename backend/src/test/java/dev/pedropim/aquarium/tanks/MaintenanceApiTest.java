package dev.pedropim.aquarium.tanks;

import static org.assertj.core.api.Assertions.assertThat;

import java.time.Instant;
import java.util.Collections;
import java.util.HashMap;
import java.util.List;
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
class MaintenanceApiTest {

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
	void aWaterChangeIsRecordedWithItsPercentageAndListedNewestFirst() {
		Response created = keeper.post(maintenance(tankId), Map.of("type", "water_change", "percent", 30,
				"performedAt", "2026-01-10T08:30:00Z", "note", "RO water"));
		keeper.post(maintenance(tankId), Map.of("type", "pruning", "performedAt", "2026-01-12T09:00:00Z"));

		assertThat(created.status()).isEqualTo(201);
		assertThat(created.field("id")).isNotNull();
		Response list = keeper.get(maintenance(tankId));
		assertThat(list.status()).isEqualTo(200);
		assertThat(list.items()).extracting(m -> m.get("type")).containsExactly("pruning", "water_change");
		Map<String, Object> change = list.items().getLast();
		assertThat(((Number) change.get("percent")).doubleValue()).isEqualTo(30.0);
		assertThat(change.get("performedAt")).isEqualTo("2026-01-10T08:30:00Z");
		assertThat(change.get("note")).isEqualTo("RO water");
		assertThat(list.items().getFirst().get("percent")).isNull();
	}

	@Test
	void everyTypeOfMaintenanceCanBeRecorded() {
		for (String type : new String[] { "top_up", "filter_cleaning", "fertilizing", "pruning",
				"substrate_cleaning" }) {
			assertThat(keeper.post(maintenance(tankId), Map.of("type", type)).status()).as(type).isEqualTo(201);
		}
		assertThat(keeper.post(maintenance(tankId), Map.of("type", "other", "note", "Moved the heater")).status())
			.isEqualTo(201);
		assertThat(keeper.get(maintenance(tankId)).items()).hasSize(6);
	}

	@Test
	void aWaterChangeNeedsAPercentageAboveZeroAndAtMostOneHundred() {
		Response missing = keeper.post(maintenance(tankId), Map.of("type", "water_change"));
		Response zero = keeper.post(maintenance(tankId), Map.of("type", "water_change", "percent", 0));
		Response over = keeper.post(maintenance(tankId), Map.of("type", "water_change", "percent", 100.5));
		Response negative = keeper.post(maintenance(tankId), Map.of("type", "water_change", "percent", -5));
		Response tooPrecise = keeper.post(maintenance(tankId), Map.of("type", "water_change", "percent", 33.333));
		Response whole = keeper.post(maintenance(tankId), Map.of("type", "water_change", "percent", 100));
		Response small = keeper.post(maintenance(tankId), Map.of("type", "water_change", "percent", 0.5));

		assertThat(missing.status()).isEqualTo(400);
		assertThat(missing.field("fields")).isEqualTo(Map.of("percent", "required"));
		assertThat(zero.field("fields")).isEqualTo(Map.of("percent", "out_of_range"));
		assertThat(over.field("fields")).isEqualTo(Map.of("percent", "out_of_range"));
		assertThat(negative.field("fields")).isEqualTo(Map.of("percent", "out_of_range"));
		assertThat(tooPrecise.field("fields")).isEqualTo(Map.of("percent", "invalid"));
		assertThat(whole.status()).isEqualTo(201);
		assertThat(small.status()).isEqualTo(201);
		assertThat(keeper.get(maintenance(tankId)).items()).hasSize(2);
	}

	@Test
	void aPercentageMakesNoSenseForAnyOtherType() {
		Response response = keeper.post(maintenance(tankId), Map.of("type", "top_up", "percent", 10));

		assertThat(response.status()).isEqualTo(400);
		assertThat(response.field("fields")).isEqualTo(Map.of("percent", "not_applicable"));
	}

	@Test
	void otherNeedsANoteAndEveryTypeAcceptsOne() {
		Response missing = keeper.post(maintenance(tankId), Map.of("type", "other"));
		Response blank = keeper.post(maintenance(tankId), Map.of("type", "other", "note", "   "));
		Response withNote = keeper.post(maintenance(tankId), Map.of("type", "fertilizing", "note", "Root tabs, 2 under the sword"));

		assertThat(missing.status()).isEqualTo(400);
		assertThat(missing.field("fields")).isEqualTo(Map.of("note", "required"));
		assertThat(blank.field("fields")).isEqualTo(Map.of("note", "required"));
		assertThat(withNote.status()).isEqualTo(201);
		assertThat(withNote.field("note")).isEqualTo("Root tabs, 2 under the sword");
	}

	@Test
	void aTooLongNoteIsRefusedAndABlankNoteMeansNoNote() {
		Response tooLong = keeper.post(maintenance(tankId), Map.of("type", "pruning", "note", "x".repeat(2001)));
		Response blank = keeper.post(maintenance(tankId), Map.of("type", "pruning", "note", "   "));

		assertThat(tooLong.status()).isEqualTo(400);
		assertThat(tooLong.field("fields")).isEqualTo(Map.of("note", "too_long"));
		assertThat(blank.status()).isEqualTo(201);
		assertThat(blank.field("note")).isNull();
	}

	@Test
	void aMissingOrUnknownTypeIsRefused() {
		Response missing = keeper.post(maintenance(tankId), Map.of("note", "something"));
		Response unknown = keeper.post(maintenance(tankId), Map.of("type", "feeding"));

		assertThat(missing.status()).isEqualTo(400);
		assertThat(missing.field("fields")).isEqualTo(Map.of("type", "required"));
		assertThat(unknown.field("fields")).isEqualTo(Map.of("type", "unknown_type"));
	}

	@Test
	void theMomentDefaultsToNowAcceptsThePastAndRefusesTheFuture() {
		Instant now = clock.instant();

		Response defaulted = keeper.post(maintenance(tankId), Map.of("type", "pruning"));
		Response past = keeper.post(maintenance(tankId),
				Map.of("type", "pruning", "performedAt", now.minusSeconds(86400 * 400L).toString()));
		Response future = keeper.post(maintenance(tankId),
				Map.of("type", "pruning", "performedAt", now.plusSeconds(1).toString()));

		assertThat(defaulted.status()).isEqualTo(201);
		assertThat(defaulted.field("performedAt")).isEqualTo(now.toString());
		assertThat(past.status()).isEqualTo(201);
		assertThat(future.status()).isEqualTo(400);
		assertThat(future.field("fields")).isEqualTo(Map.of("performedAt", "in_future"));
		assertThat(keeper.get(maintenance(tankId)).items()).hasSize(2);
	}

	@Test
	void everyProblemOfOneSubmissionIsReportedAtOnce() {
		Response response = keeper.post(maintenance(tankId),
				Map.of("type", "water_change", "percent", 400, "performedAt", clock.instant().plusSeconds(60).toString()));

		assertThat(response.field("code")).isEqualTo("validation_failed");
		assertThat(response.field("fields")).isEqualTo(Map.of("percent", "out_of_range", "performedAt", "in_future"));
	}

	@Test
	void theListCanBeLimitedToTheNewest() {
		keeper.post(maintenance(tankId), Map.of("type", "pruning", "performedAt", "2026-01-01T00:00:00Z"));
		keeper.post(maintenance(tankId), Map.of("type", "top_up", "performedAt", "2026-01-02T00:00:00Z"));

		Response limited = keeper.get(maintenance(tankId) + "?limit=1");

		assertThat(limited.items()).extracting(m -> m.get("type")).containsExactly("top_up");
	}

	@Test
	void theListCanBeLimitedToOneType() {
		keeper.post(maintenance(tankId), Map.of("type", "water_change", "percent", 20, "performedAt", "2026-01-01T00:00:00Z"));
		keeper.post(maintenance(tankId), Map.of("type", "water_change", "percent", 40, "performedAt", "2026-01-03T00:00:00Z"));
		keeper.post(maintenance(tankId), Map.of("type", "pruning", "performedAt", "2026-01-05T00:00:00Z"));

		Response last = keeper.get(maintenance(tankId) + "?type=water_change&limit=1");
		Response unknown = keeper.get(maintenance(tankId) + "?type=feeding");

		assertThat(last.items()).hasSize(1);
		assertThat(((Number) last.items().getFirst().get("percent")).doubleValue()).isEqualTo(40.0);
		assertThat(unknown.status()).isEqualTo(400);
		assertThat(unknown.field("fields")).isEqualTo(Map.of("type", "unknown_type"));
	}

	@Test
	void editingChangesEverythingAndIsValidatedLikeARecording() {
		String id = (String) keeper.post(maintenance(tankId), Map.of("type", "water_change", "percent", 30)).field("id");

		Response edited = keeper.put(maintenance(tankId) + "/" + id, Map.of("type", "top_up",
				"performedAt", "2026-01-09T20:15:00Z", "note", "evaporation"));
		Response refused = keeper.put(maintenance(tankId) + "/" + id, Map.of("type", "water_change", "percent", 0,
				"performedAt", clock.instant().plusSeconds(3600).toString()));

		assertThat(edited.status()).isEqualTo(200);
		Response read = keeper.get(maintenance(tankId) + "/" + id);
		assertThat(read.field("type")).isEqualTo("top_up");
		assertThat(read.field("percent")).isNull();
		assertThat(read.field("performedAt")).isEqualTo("2026-01-09T20:15:00Z");
		assertThat(read.field("note")).isEqualTo("evaporation");
		assertThat(refused.status()).isEqualTo(400);
		assertThat(refused.field("fields")).isEqualTo(Map.of("percent", "out_of_range", "performedAt", "in_future"));
		assertThat(keeper.get(maintenance(tankId)).items()).hasSize(1);
		assertThat(keeper.get(maintenance(tankId)).items().getFirst().get("type")).isEqualTo("top_up");
	}

	@Test
	void severalMaintenanceDoneTogetherAreRecordedAtTheSameMoment() {
		Instant now = clock.instant();

		Response response = keeper.post(maintenance(tankId) + "/batch", List.of(
				Map.of("type", "water_change", "percent", 30, "note", "RO water"),
				Map.of("type", "substrate_cleaning"),
				Map.of("type", "filter_cleaning")));

		assertThat(response.status()).isEqualTo(201);
		assertThat(response.items()).extracting(m -> m.get("type"))
			.containsExactly("water_change", "substrate_cleaning", "filter_cleaning");
		assertThat(response.items()).extracting(m -> m.get("performedAt")).containsOnly(now.toString());
		assertThat(keeper.get(maintenance(tankId)).items()).hasSize(3);
	}

	@Test
	void aBatchKeepsTheMomentTheKeeperGave() {
		Response response = keeper.post(maintenance(tankId) + "/batch", List.of(
				Map.of("type", "top_up", "performedAt", "2026-01-10T08:30:00Z"),
				Map.of("type", "pruning", "performedAt", "2026-01-10T08:30:00Z")));

		assertThat(response.status()).isEqualTo(201);
		assertThat(response.items()).extracting(m -> m.get("performedAt")).containsOnly("2026-01-10T08:30:00Z");
	}

	@Test
	void aBatchWithOneBadEntryRecordsNothing() {
		Response response = keeper.post(maintenance(tankId) + "/batch", List.of(
				Map.of("type", "pruning"),
				Map.of("type", "water_change", "percent", 400)));

		assertThat(response.status()).isEqualTo(400);
		assertThat(response.field("code")).isEqualTo("validation_failed");
		assertThat(response.field("fields")).isEqualTo(Map.of("percent", "out_of_range"));
		assertThat(keeper.get(maintenance(tankId)).items()).isEmpty();
	}

	@Test
	void aBatchNeedsAtLeastOneEntryAndHasALimit() {
		Response empty = keeper.post(maintenance(tankId) + "/batch", List.of());
		Response tooMany = keeper.post(maintenance(tankId) + "/batch", Collections.nCopies(11, Map.of("type", "pruning")));

		assertThat(empty.status()).isEqualTo(400);
		assertThat(empty.field("fields")).isEqualTo(Map.of("entries", "required"));
		assertThat(tooMany.status()).isEqualTo(400);
		assertThat(tooMany.field("fields")).isEqualTo(Map.of("entries", "too_many"));
		assertThat(keeper.get(maintenance(tankId)).items()).isEmpty();
	}

	@Test
	void aBatchOnAnotherKeepersTankIsNotFound() {
		ApiClient intruder = Accounts.loggedInBrowser(port, mail);

		Response response = intruder.post(maintenance(tankId) + "/batch", List.of(Map.of("type", "pruning")));

		assertThat(response.status()).isEqualTo(404);
		assertThat(keeper.get(maintenance(tankId)).items()).isEmpty();
	}

	@Test
	void anEditWithoutAMomentIsRefused() {
		String id = (String) keeper.post(maintenance(tankId), Map.of("type", "pruning")).field("id");

		Response response = keeper.put(maintenance(tankId) + "/" + id, Map.of("type", "pruning"));

		assertThat(response.status()).isEqualTo(400);
		assertThat(response.field("fields")).isEqualTo(Map.of("performedAt", "required"));
	}

	@Test
	void deletingRemovesOnlyThatMaintenance() {
		String id = (String) keeper.post(maintenance(tankId), Map.of("type", "pruning")).field("id");
		keeper.post(maintenance(tankId), Map.of("type", "top_up"));

		Response deleted = keeper.delete(maintenance(tankId) + "/" + id);

		assertThat(deleted.status()).isEqualTo(204);
		assertThat(keeper.get(maintenance(tankId)).items()).extracting(m -> m.get("type")).containsExactly("top_up");
		Response again = keeper.delete(maintenance(tankId) + "/" + id);
		assertThat(again.status()).isEqualTo(404);
		assertThat(again.field("code")).isEqualTo("maintenance_not_found");
	}

	@Test
	void anotherKeepersTankAndMaintenanceAreNotFoundAndStayUntouched() {
		String id = (String) keeper.post(maintenance(tankId), Map.of("type", "pruning")).field("id");
		ApiClient intruder = Accounts.loggedInBrowser(port, mail);
		String path = maintenance(tankId);

		assertThat(intruder.get(path).status()).isEqualTo(404);
		assertThat(intruder.get(path + "/" + id).status()).isEqualTo(404);
		assertThat(intruder.post(path, Map.of("type", "pruning")).status()).isEqualTo(404);
		Response edit = intruder.put(path + "/" + id, Map.of("type", "top_up", "performedAt", "2026-01-01T00:00:00Z"));
		Response delete = intruder.delete(path + "/" + id);

		assertThat(edit.status()).isEqualTo(404);
		assertThat(edit.field("code")).isEqualTo("tank_not_found");
		assertThat(delete.status()).isEqualTo(404);
		assertThat(delete.field("code")).isEqualTo("tank_not_found");
		Response list = keeper.get(path);
		assertThat(list.items()).hasSize(1);
		assertThat(list.items().getFirst().get("type")).isEqualTo("pruning");
	}

	@Test
	void maintenanceOfAnotherTankIsNotFoundEvenForItsOwner() {
		String id = (String) keeper.post(maintenance(tankId), Map.of("type", "pruning")).field("id");
		String otherTank = newTank(keeper);

		Response read = keeper.get(maintenance(otherTank) + "/" + id);
		Response delete = keeper.delete(maintenance(otherTank) + "/" + id);
		Response edit = keeper.put(maintenance(otherTank) + "/" + id,
				Map.of("type", "top_up", "performedAt", "2026-01-01T00:00:00Z"));

		assertThat(read.status()).isEqualTo(404);
		assertThat(delete.status()).isEqualTo(404);
		assertThat(edit.status()).isEqualTo(404);
		assertThat(edit.field("code")).isEqualTo("maintenance_not_found");
		assertThat(keeper.get(maintenance(tankId)).items()).hasSize(1);
	}

	@Test
	void anIdThatIsNotAnIdAndATankThatDoesNotExistAreNotFound() {
		assertThat(keeper.delete(maintenance(tankId) + "/not-an-id").status()).isEqualTo(404);
		assertThat(keeper.get(maintenance(UUID.randomUUID().toString())).status()).isEqualTo(404);
		assertThat(keeper.get(maintenance("not-an-id")).status()).isEqualTo(404);
	}

	@Test
	void withoutALoginTheMaintenanceEndpointsAnswerUnauthorized() {
		ApiClient visitor = new ApiClient(port);

		assertThat(visitor.get(maintenance(tankId)).status()).isEqualTo(401);
		assertThat(visitor.post(maintenance(tankId), Map.of("type", "pruning")).status()).isEqualTo(401);
	}

	private static String maintenance(String tankId) {
		return "/api/tanks/" + tankId + "/maintenance";
	}

	private static String newTank(ApiClient client) {
		Map<String, Object> tank = new HashMap<>();
		tank.put("name", "Maintenance tank");
		tank.put("startDate", "2025-03-01");
		return (String) client.post("/api/tanks", tank).field("id");
	}

}
