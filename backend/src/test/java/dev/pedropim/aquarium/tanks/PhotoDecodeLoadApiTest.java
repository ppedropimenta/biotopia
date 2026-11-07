package dev.pedropim.aquarium.tanks;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.doAnswer;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.concurrent.CountDownLatch;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;
import java.util.concurrent.Future;
import java.util.concurrent.TimeUnit;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.web.server.LocalServerPort;
import org.springframework.test.context.TestPropertySource;
import org.springframework.test.context.bean.override.mockito.MockitoSpyBean;

import dev.pedropim.aquarium.support.Accounts;
import dev.pedropim.aquarium.support.ApiClient;
import dev.pedropim.aquarium.support.ApiClient.Response;
import dev.pedropim.aquarium.support.ApiTest;
import dev.pedropim.aquarium.support.RecordingEmailSender;

import static dev.pedropim.aquarium.tanks.PhotoProcessorTest.Images;

/**
 * Slow decodes must not take anything else down: they hold no database connection, and only two run at a time.
 * The decoder is held by hand here, so the test does not depend on how slow a real picture is.
 */
@ApiTest
@TestPropertySource(properties = "app.photos.decode-wait=1500ms")
class PhotoDecodeLoadApiTest {

	/** More uploads than the 10 connections of the pool, so a decode that held one would empty it. */
	private static final int UPLOADS = 12;

	@LocalServerPort
	int port;

	@Autowired
	RecordingEmailSender mail;

	@MockitoSpyBean
	PhotoProcessor processor;

	@Test
	void slowDecodesLeaveTheRestOfTheSiteServedAndOnlyTwoRunAtATime() throws Exception {
		CountDownLatch decoding = new CountDownLatch(2);
		CountDownLatch release = new CountDownLatch(1);
		doAnswer(call -> {
			decoding.countDown();
			release.await(30, TimeUnit.SECONDS);
			return call.callRealMethod();
		}).when(processor).process(any());

		ApiClient attacker = Accounts.loggedInBrowser(port, mail);
		String tankId = (String) attacker.post("/api/tanks", new HashMap<>(Map.of("name", "A", "startDate", "2025-03-01")))
			.field("id");
		ApiClient other = Accounts.loggedInBrowser(port, mail);
		byte[] picture = Images.jpeg(100, 80);

		ExecutorService clients = Executors.newFixedThreadPool(UPLOADS);
		try {
			List<Future<Response>> uploads = new ArrayList<>();
			for (int i = 0; i < UPLOADS; i++) {
				uploads.add(clients.submit(() -> attacker.postForm("/api/tanks/" + tankId + "/photos", Map.of("file", picture))));
			}
			assertThat(decoding.await(10, TimeUnit.SECONDS)).isTrue();

			long started = System.nanoTime();
			Response tanks = other.get("/api/tanks");
			long tookMs = (System.nanoTime() - started) / 1_000_000;
			assertThat(tanks.status()).isEqualTo(200);
			assertThat(tookMs).isLessThan(1000);

			// Past the two slots, an upload waits 1.5 s and is told to come back later.
			long limit = System.nanoTime() + TimeUnit.SECONDS.toNanos(10);
			while (uploads.stream().filter(Future::isDone).count() < UPLOADS - 2 && System.nanoTime() < limit) {
				Thread.sleep(50);
			}
			List<Response> refused = new ArrayList<>();
			for (Future<Response> upload : uploads) {
				if (upload.isDone()) {
					refused.add(upload.get());
				}
			}
			assertThat(refused).hasSize(UPLOADS - 2).allSatisfy(r -> assertThat(r.status()).isEqualTo(503));
			assertThat(refused.getFirst().field("code")).isEqualTo("photo_busy");

			release.countDown();
			long stored = uploads.stream().map(f -> status(f)).filter(s -> s == 201).count();
			assertThat(stored).isEqualTo(2);
		}
		finally {
			release.countDown();
			clients.shutdownNow();
		}

		// Once the slots are free, an upload works again.
		assertThat(attacker.postForm("/api/tanks/" + tankId + "/photos", Map.of("file", picture)).status()).isEqualTo(201);
	}

	private static int status(Future<Response> upload) {
		try {
			return upload.get(10, TimeUnit.SECONDS).status();
		}
		catch (Exception failed) {
			throw new IllegalStateException(failed);
		}
	}

}
