package dev.pedropim.aquarium.tanks;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.fail;

import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.TreeSet;
import java.util.UUID;

import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.boot.test.web.server.LocalServerPort;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.web.servlet.mvc.method.annotation.RequestMappingHandlerMapping;

import dev.pedropim.aquarium.support.Accounts;
import dev.pedropim.aquarium.support.ApiClient;
import dev.pedropim.aquarium.support.ApiClient.Response;
import dev.pedropim.aquarium.support.ApiTest;
import dev.pedropim.aquarium.support.RecordingEmailSender;

import static dev.pedropim.aquarium.tanks.PhotoProcessorTest.Images;

/**
 * No keeper or visitor can reach another keeper's data. The open GET in the security configuration leaves that
 * protection to each route, so every route under /api is listed here and compared with what Spring really maps:
 * a new route without a row fails the first test. Add it to TANK_ROUTES (or OTHER_ROUTES if it takes no Tank).
 */
@ApiTest
class TankAccessApiTest {

	/** Every route that takes a Tank in its path. {t} tank, {m} measurement, {k} maintenance, {p} photo. */
	private static final List<Route> TANK_ROUTES = List.of(
			new Route("GET", "/api/tanks/{id}", "/api/tanks/{t}", null),
			new Route("PUT", "/api/tanks/{id}", "/api/tanks/{t}", Body.TANK),
			new Route("POST", "/api/tanks/{id}/archive", "/api/tanks/{t}/archive", Body.EMPTY),
			new Route("POST", "/api/tanks/{id}/restore", "/api/tanks/{t}/restore", Body.EMPTY),
			new Route("DELETE", "/api/tanks/{id}", "/api/tanks/{t}", null),
			new Route("GET", "/api/tanks/{tankId}/measurements", "/api/tanks/{t}/measurements", null),
			new Route("GET", "/api/tanks/{tankId}/measurements/latest", "/api/tanks/{t}/measurements/latest", null),
			new Route("GET", "/api/tanks/{tankId}/measurements/{id}", "/api/tanks/{t}/measurements/{m}", null),
			new Route("POST", "/api/tanks/{tankId}/measurements", "/api/tanks/{t}/measurements", Body.NEW_MEASUREMENT),
			new Route("PUT", "/api/tanks/{tankId}/measurements/{id}", "/api/tanks/{t}/measurements/{m}", Body.MEASUREMENT),
			new Route("DELETE", "/api/tanks/{tankId}/measurements/{id}", "/api/tanks/{t}/measurements/{m}", null),
			new Route("GET", "/api/tanks/{tankId}/maintenance", "/api/tanks/{t}/maintenance", null),
			new Route("GET", "/api/tanks/{tankId}/maintenance/{id}", "/api/tanks/{t}/maintenance/{k}", null),
			new Route("POST", "/api/tanks/{tankId}/maintenance", "/api/tanks/{t}/maintenance", Body.MAINTENANCE),
			new Route("POST", "/api/tanks/{tankId}/maintenance/batch", "/api/tanks/{t}/maintenance/batch", Body.BATCH),
			new Route("PUT", "/api/tanks/{tankId}/maintenance/{id}", "/api/tanks/{t}/maintenance/{k}", Body.MAINTENANCE_EDIT),
			new Route("DELETE", "/api/tanks/{tankId}/maintenance/{id}", "/api/tanks/{t}/maintenance/{k}", null),
			new Route("GET", "/api/tanks/{tankId}/photos", "/api/tanks/{t}/photos", null),
			new Route("GET", "/api/tanks/{tankId}/photos/summary", "/api/tanks/{t}/photos/summary", null),
			new Route("GET", "/api/tanks/{tankId}/photos/{id}", "/api/tanks/{t}/photos/{p}", null),
			new Route("GET", "/api/tanks/{tankId}/photos/{id}/file", "/api/tanks/{t}/photos/{p}/file", null),
			new Route("POST", "/api/tanks/{tankId}/photos", "/api/tanks/{t}/photos", Body.UPLOAD),
			new Route("PUT", "/api/tanks/{tankId}/photos/{id}", "/api/tanks/{t}/photos/{p}", Body.PHOTO),
			new Route("DELETE", "/api/tanks/{tankId}/photos/{id}", "/api/tanks/{t}/photos/{p}", null));

	/** Routes that take no Tank: they answer for the session itself, or are open on purpose. */
	private static final Set<String> OTHER_ROUTES = Set.of("GET /api/tanks", "POST /api/tanks", "GET /api/demo",
			"GET /api/parameters", "GET /api/photo-usage", "GET /api/me", "PUT /api/me/language",
			"POST /api/me/deletion", "POST /api/auth/login", "POST /api/auth/signup", "POST /api/auth/confirm",
			"POST /api/auth/resend-confirmation", "POST /api/auth/forgot-password", "POST /api/auth/reset-password");

	@LocalServerPort
	int port;

	@Autowired
	RecordingEmailSender mail;

	@Autowired
	JdbcTemplate jdbc;

	@Autowired
	@Qualifier("requestMappingHandlerMapping")
	RequestMappingHandlerMapping mappings;

	ApiClient owner;

	ApiClient stranger;

	ApiClient visitor;

	Ids ownerTank;

	Ids ownerSecondTank;

	Ids strangerTank;

	@BeforeEach
	void twoKeepersEachWithATankAndHistory() {
		jdbc.update("update tanks set demo = false");
		owner = Accounts.loggedInBrowser(port, mail);
		stranger = Accounts.loggedInBrowser(port, mail);
		visitor = new ApiClient(port);
		ownerTank = fullTank(owner, "Owner private");
		ownerSecondTank = fullTank(owner, "Owner second");
		strangerTank = fullTank(stranger, "Stranger");
	}

	@AfterEach
	void noDemoLeftBehind() {
		jdbc.update("update tanks set demo = false");
	}

	@Test
	void everyRouteOfTheApiIsListedHere() {
		Set<String> mapped = new TreeSet<>();
		mappings.getHandlerMethods().keySet().forEach(info -> info.getPatternValues().forEach(pattern -> {
			if (pattern.startsWith("/api/")) {
				info.getMethodsCondition().getMethods().forEach(method -> mapped.add(method + " " + pattern));
			}
		}));
		Set<String> listed = new TreeSet<>(OTHER_ROUTES);
		TANK_ROUTES.forEach(route -> listed.add(route.method + " " + route.mapping));
		assertThat(listed).isEqualTo(mapped);
	}

	@Test
	void aLoggedInStrangerGetsNotFoundOnEveryRouteAndChangesNothing() {
		Map<String, Object> before = snapshot(ownerTank);
		for (Route route : TANK_ROUTES) {
			int status = route.call(stranger, ownerTank);
			assertThat(status).as(route.method + " " + route.mapping).isEqualTo(404);
		}
		assertThat(snapshot(ownerTank)).isEqualTo(before);
	}

	@Test
	void aVisitorGetsUnauthorizedOnEveryRouteAndChangesNothing() {
		Map<String, Object> before = snapshot(ownerTank);
		for (Route route : TANK_ROUTES) {
			int status = route.call(visitor, ownerTank);
			assertThat(status).as(route.method + " " + route.mapping).isEqualTo(401);
		}
		assertThat(snapshot(ownerTank)).isEqualTo(before);
	}

	@Test
	void aStrangersOwnTankInThePathDoesNotOpenAnotherKeepersRecords() {
		Map<String, Object> before = snapshot(ownerTank);
		Ids mixed = new Ids(strangerTank.tank, ownerTank.measurement, ownerTank.maintenance, ownerTank.photo);
		for (Route route : TANK_ROUTES) {
			if (route.path.contains("{m}") || route.path.contains("{k}") || route.path.contains("{p}")) {
				int status = route.call(stranger, mixed);
				assertThat(status).as(route.method + " " + route.mapping).isEqualTo(404);
			}
		}
		assertThat(snapshot(ownerTank)).isEqualTo(before);
	}

	@Test
	void aRecordOfAnotherTankOfTheSameOwnerIsNotFound() {
		Map<String, Object> before = snapshot(ownerTank);
		Ids mixed = new Ids(ownerSecondTank.tank, ownerTank.measurement, ownerTank.maintenance, ownerTank.photo);
		for (Route route : TANK_ROUTES) {
			if (route.path.contains("{m}") || route.path.contains("{k}") || route.path.contains("{p}")) {
				assertThat(route.call(owner, mixed)).as(route.method + " " + route.mapping).isEqualTo(404);
			}
		}
		assertThat(snapshot(ownerTank)).isEqualTo(before);
	}

	/** The Demo Tank opens reads. Its id in the path must not open the records of any other Tank. */
	@Test
	void theDemoTankInThePathDoesNotOpenThePrivateRecordsOfItsOwnerOrOfAnyoneElse() {
		jdbc.update("update tanks set demo = true where id = ?", UUID.fromString(ownerSecondTank.tank));
		Map<String, Object> before = snapshot(ownerTank);
		Ids demoPathPrivateRecords = new Ids(ownerSecondTank.tank, ownerTank.measurement, ownerTank.maintenance,
				ownerTank.photo);
		Ids demoPathStrangerRecords = new Ids(ownerSecondTank.tank, strangerTank.measurement, strangerTank.maintenance,
				strangerTank.photo);
		for (Route route : TANK_ROUTES) {
			boolean hasRecord = route.path.contains("{m}") || route.path.contains("{k}") || route.path.contains("{p}");
			if (hasRecord && route.method.equals("GET")) {
				assertThat(route.call(visitor, demoPathPrivateRecords)).as("visitor " + route.path).isEqualTo(404);
				assertThat(route.call(visitor, demoPathStrangerRecords)).as("visitor " + route.path).isEqualTo(404);
				assertThat(route.call(stranger, demoPathPrivateRecords)).as("stranger " + route.path).isEqualTo(404);
			}
		}
		assertThat(snapshot(ownerTank)).isEqualTo(before);
	}

	@Test
	void theDemoTankTakesNoWriteFromAStrangerOrAVisitor() {
		jdbc.update("update tanks set demo = true where id = ?", UUID.fromString(ownerSecondTank.tank));
		Map<String, Object> before = snapshot(ownerSecondTank);
		for (Route route : TANK_ROUTES) {
			if (!route.method.equals("GET")) {
				assertThat(route.call(stranger, ownerSecondTank)).as("stranger " + route.method + " " + route.path)
					.isEqualTo(404);
				assertThat(route.call(visitor, ownerSecondTank)).as("visitor " + route.method + " " + route.path)
					.isEqualTo(401);
			}
		}
		assertThat(snapshot(ownerSecondTank)).isEqualTo(before);
	}

	@Test
	void theBodyCannotChooseTheOwnerTheIdOrTheDemoFlag() {
		UUID ownerId = jdbc.queryForObject("select owner_id from tanks where id = ?", UUID.class,
				UUID.fromString(ownerTank.tank));
		String chosenId = UUID.randomUUID().toString();
		Map<String, Object> body = new HashMap<>(Map.of("name", "Sneaky", "startDate", "2025-03-01", "ownerId",
				ownerId.toString(), "owner_id", ownerId.toString(), "demo", true, "id", chosenId, "archivedAt",
				"2025-01-01T00:00:00Z", "readOnly", true));

		Response created = stranger.post("/api/tanks", body);

		assertThat(created.status()).isEqualTo(201);
		assertThat(created.field("id")).isNotEqualTo(chosenId);
		assertThat(created.field("demo")).isEqualTo(false);
		assertThat(created.field("archivedAt")).isNull();
		String id = (String) created.field("id");
		assertThat(jdbc.queryForObject("select owner_id from tanks where id = ?", UUID.class, UUID.fromString(id)))
			.isNotEqualTo(ownerId);

		Response edited = stranger.put("/api/tanks/" + id, body);
		assertThat(edited.status()).isEqualTo(200);
		assertThat(edited.field("demo")).isEqualTo(false);
		assertThat(jdbc.queryForObject("select owner_id from tanks where id = ?", UUID.class, UUID.fromString(id)))
			.isNotEqualTo(ownerId);

		Map<String, Object> measurement = Map.of("values", Map.of("ph", 7), "tankId", ownerTank.tank, "id", chosenId);
		assertThat(stranger.post("/api/tanks/" + id + "/measurements", measurement).status()).isEqualTo(201);
		assertThat(jdbc.queryForObject("select count(*) from measurements where tank_id = ?", Integer.class,
				UUID.fromString(ownerTank.tank))).isEqualTo(1);
	}

	@Test
	void theRoutesWithoutATankAnswerOnlyForTheSession() {
		long ownerBytes = ((Number) owner.get("/api/photo-usage").field("usedBytes")).longValue();
		long strangerBytes = ((Number) stranger.get("/api/photo-usage").field("usedBytes")).longValue();
		assertThat(ownerBytes).isGreaterThan(0);
		assertThat(strangerBytes).isGreaterThan(0);
		// The owner has two Tanks with the same picture, the stranger one: each counts only their own.
		assertThat(ownerBytes).isEqualTo(2 * strangerBytes);
		assertThat(owner.get("/api/tanks").items()).extracting(t -> t.get("id"))
			.containsExactlyInAnyOrder(ownerTank.tank, ownerSecondTank.tank);
		assertThat(stranger.get("/api/tanks").items()).extracting(t -> t.get("id")).containsExactly(strangerTank.tank);
		assertThat(owner.get("/api/me").field("email")).isNotEqualTo(stranger.get("/api/me").field("email"));
		for (String path : List.of("/api/tanks", "/api/photo-usage", "/api/me")) {
			assertThat(visitor.get(path).status()).as(path).isEqualTo(401);
		}
	}

	/** Other spellings of a path, sent raw so no client tidies them up. None may give a visitor the private Tank. */
	@Test
	void otherSpellingsOfAPathGiveAVisitorNothing() throws Exception {
		String t = ownerTank.tank;
		List<String> spellings = List.of("/api/tanks/", "/api/tanks//", "/api/tanks/" + t + "/", "/api/TANKS/" + t,
				"//api/tanks/" + t, "/api//tanks/" + t, "/api/tanks/" + t + "%2f", "/api/tanks/%2e%2e/tanks/" + t,
				"/api/tanks/x/../" + t, "/api/tanks/" + t + ";x=1", "/api/tanks/" + t + "/measurements/",
				"/api/tanks/" + t.toUpperCase(), "/api/tanks/" + t + ".json", "/api/tanks/" + t + "/photos/" + ownerTank.photo + "/file/",
				"/api/photo-usage/", "/api/me/");
		HttpClient client = HttpClient.newHttpClient();
		for (String spelling : spellings) {
			HttpRequest request = HttpRequest.newBuilder(URI.create("http://localhost:" + port + spelling)).GET().build();
			HttpResponse<String> response = client.send(request, HttpResponse.BodyHandlers.ofString());
			assertThat(response.statusCode()).as(spelling).isNotEqualTo(200);
			assertThat(response.body()).as(spelling).doesNotContain("Owner private");
		}
		for (String method : List.of("HEAD", "OPTIONS", "TRACE", "PATCH")) {
			HttpRequest request = HttpRequest.newBuilder(URI.create("http://localhost:" + port + "/api/tanks/" + t))
				.method(method, HttpRequest.BodyPublishers.noBody())
				.build();
			HttpResponse<String> response = client.send(request, HttpResponse.BodyHandlers.ofString());
			assertThat(response.body()).doesNotContain("Owner private");
		}
	}

	/** What the owner sees of a Tank, and the row counts, to prove that nothing moved. */
	private Map<String, Object> snapshot(Ids ids) {
		Map<String, Object> seen = new HashMap<>();
		seen.put("tank", owner.get("/api/tanks/" + ids.tank).body());
		seen.put("measurements", owner.get("/api/tanks/" + ids.tank + "/measurements").body());
		seen.put("maintenance", owner.get("/api/tanks/" + ids.tank + "/maintenance").body());
		seen.put("photos", owner.get("/api/tanks/" + ids.tank + "/photos").body());
		seen.put("file", owner.download("/api/tanks/" + ids.tank + "/photos/" + ids.photo + "/file").status());
		return seen;
	}

	private static Ids fullTank(ApiClient client, String name) {
		String tank = (String) client.post("/api/tanks", Map.of("name", name, "startDate", "2025-03-01")).field("id");
		String measurement = (String) client.post("/api/tanks/" + tank + "/measurements", Map.of("values", Map.of("ph", 6.5)))
			.items()
			.getFirst()
			.get("id");
		String maintenance = (String) client
			.post("/api/tanks/" + tank + "/maintenance", Map.of("type", "water_change", "percent", 30))
			.field("id");
		String photo = (String) client.postForm("/api/tanks/" + tank + "/photos", Map.of("file", Images.jpeg(60, 40)))
			.field("id");
		return new Ids(tank, measurement, maintenance, photo);
	}

	record Ids(String tank, String measurement, String maintenance, String photo) {
	}

	enum Body {

		EMPTY, TANK, NEW_MEASUREMENT, MEASUREMENT, MAINTENANCE, MAINTENANCE_EDIT, BATCH, UPLOAD, PHOTO;

		Object content() {
			return switch (this) {
				case EMPTY -> Map.of();
				case TANK -> Map.of("name", "Hijacked", "startDate", "2025-03-01");
				case NEW_MEASUREMENT -> Map.of("values", Map.of("ph", 9));
				case MEASUREMENT -> Map.of("value", 9, "measuredAt", "2025-03-01T00:00:00Z", "note", "Hijacked");
				case MAINTENANCE -> Map.of("type", "top_up", "note", "Hijacked");
				case MAINTENANCE_EDIT -> Map.of("type", "top_up", "performedAt", "2025-03-01T00:00:00Z", "note", "Hijacked");
				case BATCH -> List.of(Map.of("type", "top_up"));
				case PHOTO -> Map.of("takenAt", "2025-03-01T00:00:00Z", "note", "Hijacked");
				case UPLOAD -> throw new IllegalStateException("multipart");
			};
		}

	}

	record Route(String method, String mapping, String path, Body body) {

		int call(ApiClient client, Ids ids) {
			String resolved = path.replace("{t}", ids.tank)
				.replace("{m}", ids.measurement)
				.replace("{k}", ids.maintenance)
				.replace("{p}", ids.photo);
			return switch (method) {
				case "GET" -> path.endsWith("/file") ? client.download(resolved).status() : client.get(resolved).status();
				case "DELETE" -> client.delete(resolved).status();
				case "PUT" -> client.put(resolved, body.content()).status();
				case "POST" -> body == Body.UPLOAD
						? client.postForm(resolved, Map.of("file", Images.jpeg(20, 20))).status()
						: client.post(resolved, body.content()).status();
				default -> {
					fail("unknown method " + method);
					yield 0;
				}
			};
		}

	}


}
