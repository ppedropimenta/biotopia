package dev.pedropim.aquarium.support;

import java.io.IOException;
import java.net.CookieManager;
import java.net.HttpCookie;
import java.net.URI;
import java.net.http.HttpClient;
import java.util.Map;

import org.springframework.http.HttpMethod;
import org.springframework.http.MediaType;
import org.springframework.http.client.JdkClientHttpRequestFactory;
import org.springframework.web.client.RestClient;
import org.springframework.web.client.RestClient.RequestHeadersSpec.ConvertibleClientHttpResponse;

/**
 * A browser stand-in: keeps cookies between calls and sends the CSRF token the way the SPA does. Each client is
 * one browser, so a test can log in as two people at once.
 */
public class ApiClient {

	private final String baseUrl;

	private final CookieManager cookies = new CookieManager();

	private final RestClient http;

	public ApiClient(int port) {
		this.baseUrl = "http://localhost:" + port;
		this.http = RestClient.builder()
			.baseUrl(baseUrl)
			.requestFactory(new JdkClientHttpRequestFactory(HttpClient.newBuilder().cookieHandler(cookies).build()))
			.build();
	}

	public Response get(String path) {
		return http.get().uri(path).exchange((request, response) -> read(response));
	}

	public Response post(String path, Object body) {
		return send(HttpMethod.POST, path, body);
	}

	public Response put(String path, Object body) {
		return send(HttpMethod.PUT, path, body);
	}

	/** A write without the CSRF header, as a page on another site would send it. */
	public Response postWithoutCsrfToken(String path, Object body) {
		get("/api/me");
		return http.post().uri(path).body(body).exchange((request, response) -> read(response));
	}

	private Response send(HttpMethod method, String path, Object body) {
		String token = csrfToken();
		if (token == null) {
			get("/api/me");
			token = csrfToken();
		}
		var request = http.method(method).uri(path).header("X-XSRF-TOKEN", token);
		if (body != null) {
			request.body(body);
		}
		return request.exchange((req, response) -> read(response));
	}

	/** How long the browser would keep a cookie, in seconds; -1 means until the browser closes. */
	public long cookieMaxAge(String name) {
		return cookies.getCookieStore()
			.get(URI.create(baseUrl))
			.stream()
			.filter(cookie -> cookie.getName().equals(name))
			.mapToLong(HttpCookie::getMaxAge)
			.findFirst()
			.orElseThrow(() -> new AssertionError("No cookie named " + name));
	}

	private String csrfToken() {
		return cookies.getCookieStore()
			.get(URI.create(baseUrl))
			.stream()
			.filter(cookie -> cookie.getName().equals("XSRF-TOKEN"))
			.map(HttpCookie::getValue)
			.findFirst()
			.orElse(null);
	}

	@SuppressWarnings("unchecked")
	private static Response read(ConvertibleClientHttpResponse response) throws IOException {
		MediaType type = response.getHeaders().getContentType();
		Map<String, Object> body = type != null && type.isCompatibleWith(MediaType.APPLICATION_JSON)
				? response.bodyTo(Map.class) : null;
		return new Response(response.getStatusCode().value(), body);
	}

	/** Status and JSON body (null when the response has none). */
	public record Response(int status, Map<String, Object> body) {

		public Object field(String name) {
			return body == null ? null : body.get(name);
		}

	}

}
