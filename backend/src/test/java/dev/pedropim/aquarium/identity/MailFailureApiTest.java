package dev.pedropim.aquarium.identity;

import static org.assertj.core.api.Assertions.assertThat;

import java.net.ServerSocket;
import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.time.Duration;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

import javax.sql.DataSource;

import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.builder.SpringApplicationBuilder;
import org.springframework.boot.test.web.server.LocalServerPort;
import org.springframework.boot.web.server.servlet.context.ServletWebServerApplicationContext;
import org.springframework.jdbc.core.JdbcTemplate;

import com.zaxxer.hikari.HikariDataSource;

import dev.pedropim.aquarium.AquariumApplication;
import dev.pedropim.aquarium.support.ApiClient;
import dev.pedropim.aquarium.support.ApiClient.Response;
import dev.pedropim.aquarium.support.ApiTest;
import dev.pedropim.aquarium.support.RecordingEmailSender;

/** The mail server is an outside service: when it fails or hangs, the rest of the site keeps working. */
@ApiTest
class MailFailureApiTest {

	private static final String PASSWORD = "correct horse battery";

	private static final Pattern LINK = Pattern.compile("token=([\\w-]+)");

	@LocalServerPort
	int port;

	@Autowired
	RecordingEmailSender mail;

	@Autowired
	JdbcTemplate jdbc;

	@Autowired
	DataSource dataSource;

	ApiClient browser;

	String email;

	@BeforeEach
	void aNewVisitor() {
		browser = new ApiClient(port);
		email = "fish-" + UUID.randomUUID() + "@example.com";
	}

	@AfterEach
	void theMailServerIsBack() {
		mail.failing(false);
	}

	@Test
	void signUpKeepsTheUnconfirmedAccountWhenTheEmailCannotBeSentAndTheLinkCanBeSentAgainLater() {
		mail.failing(true);

		Response signedUp = signUp();

		assertThat(signedUp.status()).isEqualTo(201);
		assertThat(jdbc.queryForObject("select count(*) from users where email = ?", Integer.class, email)).isEqualTo(1);
		assertThat(mail.sentTo(email)).isEmpty();

		mail.failing(false);
		assertThat(browser.post("/api/auth/resend-confirmation", Map.of("email", email)).status()).isEqualTo(204);
		String token = tokenIn(mail.sentTo(email).getLast().body());
		assertThat(browser.post("/api/auth/confirm", Map.of("token", token)).status()).isEqualTo(204);
		assertThat(browser.post("/api/auth/login", Map.of("email", email, "password", PASSWORD)).status()).isEqualTo(200);
	}

	@Test
	void resendAndForgotPasswordStillAnswer204WhenTheEmailCannotBeSent() {
		signUp();
		mail.failing(true);

		assertThat(browser.post("/api/auth/resend-confirmation", Map.of("email", email)).status()).isEqualTo(204);
		assertThat(browser.post("/api/auth/forgot-password", Map.of("email", email)).status()).isEqualTo(204);
		assertThat(mail.sentTo(email)).hasSize(1);
	}

	@Test
	void theLinksStillWorkAndOnlyTheirHashIsStored() {
		signUp();
		String confirmation = tokenIn(mail.sentTo(email).getLast().body());
		assertThat(jdbc.queryForList("select token_hash from confirmation_tokens", String.class)).isNotEmpty()
			.doesNotContain(confirmation);
		assertThat(browser.post("/api/auth/confirm", Map.of("token", confirmation)).status()).isEqualTo(204);

		browser.post("/api/auth/forgot-password", Map.of("email", email));
		String reset = tokenIn(mail.sentTo(email).getLast().body());
		assertThat(jdbc.queryForList("select token_hash from password_reset_tokens", String.class)).isNotEmpty()
			.doesNotContain(reset);
		assertThat(browser.post("/api/auth/reset-password", Map.of("token", reset, "password", "a brand new passphrase")).status())
			.isEqualTo(204);
	}

	/** The real SmtpEmailSender against a server that accepts the connection and never answers. */
	@Test
	void aMailServerThatHangsDoesNotTakeTheDatabaseConnectionsWithIt() throws Exception {
		signUp();
		HikariDataSource hikari = (HikariDataSource) dataSource;
		HttpClient client = HttpClient.newBuilder().version(HttpClient.Version.HTTP_1_1).build();
		try (ServerSocket silent = new ServerSocket(0);
				var app = new SpringApplicationBuilder(AquariumApplication.class).run("--server.port=0",
						"--spring.datasource.url=" + hikari.getJdbcUrl(), "--spring.datasource.username=" + hikari.getUsername(),
						"--spring.datasource.password=" + hikari.getPassword(), "--spring.mail.host=127.0.0.1",
						"--spring.mail.port=" + silent.getLocalPort(), "--spring.mail.username=x", "--spring.mail.password=x",
						"--spring.main.banner-mode=off")) {
			int appPort = ((ServletWebServerApplicationContext) app).getWebServer().getPort();
			ExecutorService pool = Executors.newFixedThreadPool(10);
			try {
				for (int i = 0; i < 10; i++) {
					pool.submit(() -> client.send(
							HttpRequest.newBuilder(URI.create("http://localhost:" + appPort + "/api/auth/forgot-password"))
								.header("Content-Type", "application/json")
								.header("Cookie", "XSRF-TOKEN=t")
								.header("X-XSRF-TOKEN", "t")
								.timeout(Duration.ofSeconds(30))
								.POST(HttpRequest.BodyPublishers.ofString("{\"email\":\"" + email + "\"}"))
								.build(),
							HttpResponse.BodyHandlers.discarding()));
				}
				Thread.sleep(3000);
				List<Integer> statuses = new ArrayList<>();
				for (int i = 0; i < 3; i++) {
					statuses.add(client
						.send(HttpRequest.newBuilder(URI.create("http://localhost:" + appPort + "/api/demo"))
							.GET()
							.timeout(Duration.ofSeconds(5))
							.build(), HttpResponse.BodyHandlers.discarding())
						.statusCode());
				}
				// A hang (the call times out) or a 500 is the failure; what a visitor gets without a Demo Tank does not matter.
				assertThat(statuses).doesNotContain(500);
			}
			finally {
				pool.shutdownNow();
			}
		}
	}

	private Response signUp() {
		return browser.post("/api/auth/signup", Map.of("email", email, "password", PASSWORD, "language", "en"));
	}

	private static String tokenIn(String body) {
		Matcher link = LINK.matcher(body);
		assertThat(link.find()).isTrue();
		return link.group(1);
	}

}
