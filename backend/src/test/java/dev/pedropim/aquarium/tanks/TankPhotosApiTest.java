package dev.pedropim.aquarium.tanks;

import static org.assertj.core.api.Assertions.assertThat;

import java.nio.charset.StandardCharsets;
import java.util.HashMap;
import java.util.Map;
import java.util.Random;

import javax.imageio.ImageIO;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.web.server.LocalServerPort;

import dev.pedropim.aquarium.support.Accounts;
import dev.pedropim.aquarium.support.ApiClient;
import dev.pedropim.aquarium.support.ApiClient.Download;
import dev.pedropim.aquarium.support.ApiClient.Response;
import dev.pedropim.aquarium.support.ApiTest;
import dev.pedropim.aquarium.support.RecordingEmailSender;

import static dev.pedropim.aquarium.tanks.PhotoProcessorTest.Images;

@ApiTest
class TankPhotosApiTest {

	@LocalServerPort
	int port;

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
	void aPhotoIsUploadedWithItsDateAndNoteAndListedNewestFirst() {
		Response older = upload(Images.jpeg(300, 200), "2026-01-10T08:30:00Z", "First look");
		Response newer = upload(Images.png(120, 90), "2026-01-12T09:00:00Z", null);

		assertThat(older.status()).isEqualTo(201);
		assertThat(older.field("id")).isNotNull();
		assertThat(older.field("takenAt")).isEqualTo("2026-01-10T08:30:00Z");
		assertThat(older.field("note")).isEqualTo("First look");
		assertThat(older.field("width")).isEqualTo(300);
		Response list = keeper.get(photos(tankId));
		assertThat(list.items()).extracting(p -> p.get("id")).containsExactly(newer.field("id"), older.field("id"));
		assertThat(keeper.get(photos(tankId) + "?limit=1").items()).hasSize(1);
	}

	@Test
	void theDateDefaultsToNowAndAcceptsThePastButNotTheFuture() {
		Response now = upload(Images.jpeg(50, 50), null, null);
		Response future = upload(Images.jpeg(50, 50), "2026-02-01T00:00:00Z", null);
		Response malformed = upload(Images.jpeg(50, 50), "yesterday", null);

		assertThat(now.status()).isEqualTo(201);
		assertThat(now.field("takenAt")).isEqualTo("2026-01-15T10:00:00Z");
		assertThat(future.status()).isEqualTo(400);
		assertThat(future.field("fields")).isEqualTo(Map.of("takenAt", "in_future"));
		assertThat(malformed.field("fields")).isEqualTo(Map.of("takenAt", "invalid"));
	}

	@Test
	void theStoredFileIsAJpegOfAtMostTwoThousandPixelsWithNoLocationInIt() throws Exception {
		byte[] withGps = Images.withExif(Images.jpeg(2600, 1300), 1, "GPSLatitude 52.5200N GPSLongitude 13.4050E");
		String id = (String) upload(withGps, null, null).field("id");

		Download file = keeper.download(photos(tankId) + "/" + id + "/file");

		assertThat(file.status()).isEqualTo(200);
		assertThat(file.contentType()).isEqualTo("image/jpeg");
		String text = new String(file.bytes(), StandardCharsets.ISO_8859_1);
		assertThat(text).doesNotContain("GPS").doesNotContain("Exif").doesNotContain("52.52");
		var image = ImageIO.read(new java.io.ByteArrayInputStream(file.bytes()));
		assertThat(image.getWidth()).isEqualTo(2000);
		assertThat(image.getHeight()).isEqualTo(1000);
	}

	@Test
	void somethingThatIsNotAJpegPngOrWebpIsRefusedWithAClearCode() {
		Response text = upload("not a picture".getBytes(StandardCharsets.UTF_8), null, null);
		Response missing = keeper.postForm(photos(tankId), Map.of("note", "no file"));

		assertThat(text.status()).isEqualTo(400);
		assertThat(text.field("fields")).isEqualTo(Map.of("file", "unsupported_type"));
		assertThat(missing.status()).isEqualTo(400);
		assertThat(missing.field("fields")).isEqualTo(Map.of("file", "required"));
		assertThat(keeper.get(photos(tankId)).items()).isEmpty();
	}

	@Test
	void aFileOverTenMegabytesIsRefused() {
		byte[] big = new byte[10 * 1024 * 1024 + 1];
		new Random(1).nextBytes(big);

		Response response = upload(big, null, null);

		assertThat(response.status()).isEqualTo(413);
		assertThat(response.field("fields")).isEqualTo(Map.of("file", "too_large"));
	}

	@Test
	void theDateAndNoteCanBeEditedAndThePhotoDeleted() {
		String id = (String) upload(Images.jpeg(80, 60), "2026-01-10T08:30:00Z", "Typo").field("id");
		String url = photos(tankId) + "/" + id;

		Response edited = keeper.put(url, Map.of("takenAt", "2026-01-05T12:00:00Z", "note", "Fixed"));
		Response missingDate = keeper.put(url, Map.of("note", "no date"));
		Response future = keeper.put(url, Map.of("takenAt", "2026-03-01T00:00:00Z"));
		Response blank = keeper.put(url, Map.of("takenAt", "2026-01-05T12:00:00Z", "note", "  "));

		assertThat(edited.status()).isEqualTo(200);
		assertThat(edited.field("takenAt")).isEqualTo("2026-01-05T12:00:00Z");
		assertThat(edited.field("note")).isEqualTo("Fixed");
		assertThat(missingDate.field("fields")).isEqualTo(Map.of("takenAt", "required"));
		assertThat(future.field("fields")).isEqualTo(Map.of("takenAt", "in_future"));
		assertThat(blank.field("note")).isNull();

		assertThat(keeper.delete(url).status()).isEqualTo(204);
		assertThat(keeper.get(url).status()).isEqualTo(404);
		assertThat(keeper.download(url + "/file").status()).isEqualTo(404);
		assertThat(keeper.get(photos(tankId)).items()).isEmpty();
	}

	@Test
	void theSummaryCountsThePhotosAndNamesTheLatestByDate() {
		assertThat(keeper.get(photos(tankId) + "/summary").field("count")).isEqualTo(0);
		assertThat(keeper.get(photos(tankId) + "/summary").field("latestId")).isNull();
		upload(Images.jpeg(40, 30), "2026-01-12T09:00:00Z", null);
		String latest = (String) upload(Images.jpeg(40, 30), "2026-01-14T09:00:00Z", null).field("id");
		upload(Images.jpeg(40, 30), "2026-01-01T09:00:00Z", null);

		Response summary = keeper.get(photos(tankId) + "/summary");

		assertThat(summary.field("count")).isEqualTo(3);
		assertThat(summary.field("latestId")).isEqualTo(latest);
	}

	@Test
	void theUsageCountsTheStoredBytesAndShrinksWhenAPhotoIsDeleted() {
		assertThat(keeper.get("/api/photo-usage").field("usedBytes")).isEqualTo(0);
		assertThat(keeper.get("/api/photo-usage").field("quotaBytes")).isEqualTo(209715200);
		assertThat(keeper.get("/api/photo-usage").field("maxFileBytes")).isEqualTo(10485760);
		String id = (String) upload(Images.jpeg(400, 300), null, null).field("id");
		Download file = keeper.download(photos(tankId) + "/" + id + "/file");

		assertThat(((Number) keeper.get("/api/photo-usage").field("usedBytes")).longValue()).isEqualTo(file.bytes().length);
		keeper.delete(photos(tankId) + "/" + id);
		assertThat(keeper.get("/api/photo-usage").field("usedBytes")).isEqualTo(0);
	}

	@Test
	void anotherUsersPhotosAndTanksAnswerAsNotFound() {
		String id = (String) upload(Images.jpeg(50, 50), null, null).field("id");
		ApiClient stranger = Accounts.loggedInBrowser(port, mail);
		String url = photos(tankId) + "/" + id;

		assertThat(stranger.get(photos(tankId)).status()).isEqualTo(404);
		assertThat(stranger.get(url).status()).isEqualTo(404);
		assertThat(stranger.download(url + "/file").status()).isEqualTo(404);
		assertThat(stranger.delete(url).status()).isEqualTo(404);
		assertThat(stranger.postForm(photos(tankId), Map.of("file", Images.jpeg(50, 50))).status()).isEqualTo(404);
		// A photo of one tank asked for through another tank of the same owner is not found either.
		String otherTank = newTank(keeper);
		assertThat(keeper.get(photos(otherTank) + "/" + id).status()).isEqualTo(404);
		assertThat(keeper.get("/api/photo-usage").field("usedBytes")).isNotEqualTo(0);
		assertThat(stranger.get("/api/photo-usage").field("usedBytes")).isEqualTo(0);
	}

	private Response upload(byte[] file, String takenAt, String note) {
		Map<String, Object> parts = new HashMap<>();
		parts.put("file", file);
		if (takenAt != null) {
			parts.put("takenAt", takenAt);
		}
		if (note != null) {
			parts.put("note", note);
		}
		return keeper.postForm(photos(tankId), parts);
	}

	private static String photos(String tankId) {
		return "/api/tanks/" + tankId + "/photos";
	}

	private static String newTank(ApiClient client) {
		Map<String, Object> tank = new HashMap<>();
		tank.put("name", "Photo tank");
		tank.put("startDate", "2025-03-01");
		return (String) client.post("/api/tanks", tank).field("id");
	}

}
