package dev.pedropim.aquarium.support;

import java.io.IOException;
import java.net.CookieManager;
import java.net.HttpCookie;
import java.net.URI;
import java.net.http.HttpClient;
import java.util.List;
import java.util.Map;
import java.util.concurrent.atomic.AtomicInteger;

import org.springframework.core.io.ByteArrayResource;
import org.springframework.http.HttpMethod;
import org.springframework.http.MediaType;
import org.springframework.http.client.JdkClientHttpRequestFactory;
import org.springframework.util.LinkedMultiValueMap;
import org.springframework.util.MultiValueMap;
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

	private static final AtomicInteger NEXT_ADDRESS = new AtomicInteger();

	/**
	 * Each client is one browser with an address of its own, sent the way Caddy sends it (X-Forwarded-For), so the
	 * per-address limits count a test's browsers apart. The addresses are in 198.18.0.0/15, which the server does not
	 * treat as a proxy.
	 */
	public ApiClient(int port) {
		this(port, nextAddress());
	}

	public ApiClient(int port, String clientAddress) {
		this.baseUrl = "http://localhost:" + port;
		this.http = RestClient.builder()
			.baseUrl(baseUrl)
			.defaultHeader("X-Forwarded-For", clientAddress)
			.requestFactory(new JdkClientHttpRequestFactory(HttpClient.newBuilder().cookieHandler(cookies).build()))
			.build();
	}

	public static String nextAddress() {
		int n = NEXT_ADDRESS.incrementAndGet();
		return "198.18." + (n / 250 % 250) + "." + (n % 250 + 1);
	}

	/** The Set-Cookie and Strict-Transport-Security headers of a response, to see what the server tells a browser. */
	public Headers headersOf(String path, String forwardedProto) {
		return http.get()
			.uri(path)
			.header("X-Forwarded-Proto", forwardedProto)
			.exchange((request, response) -> new Headers(response.getHeaders().getOrDefault("Set-Cookie", List.of()),
					response.getHeaders().getFirst("Strict-Transport-Security")));
	}

	public record Headers(List<String> setCookies, String strictTransportSecurity) {
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

	public Response delete(String path) {
		return send(HttpMethod.DELETE, path, null);
	}

	/** A multipart form: a part that is a byte array is sent as a file named {@code upload.bin}, the rest as fields. */
	public Response postForm(String path, Map<String, Object> parts) {
		MultiValueMap<String, Object> form = new LinkedMultiValueMap<>();
		parts.forEach((name, value) -> form.add(name, value instanceof byte[] bytes ? new ByteArrayResource(bytes) {
			@Override
			public String getFilename() {
				return "upload.bin";
			}
		} : value));
		String token = csrfToken();
		if (token == null) {
			get("/api/me");
			token = csrfToken();
		}
		return http.post()
			.uri(path)
			.header("X-XSRF-TOKEN", token)
			.contentType(MediaType.MULTIPART_FORM_DATA)
			.body(form)
			.exchange((request, response) -> read(response));
	}

	/** A response that is not JSON: the status, the content type and the bytes. */
	public Download download(String path) {
		return http.get().uri(path).exchange((request, response) -> new Download(response.getStatusCode().value(),
				String.valueOf(response.getHeaders().getContentType()), response.getBody().readAllBytes()));
	}

	public record Download(int status, String contentType, byte[] bytes) {
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
		Object body = type != null && type.isCompatibleWith(MediaType.APPLICATION_JSON)
				? response.bodyTo(Object.class) : null;
		return new Response(response.getStatusCode().value(), body);
	}

	/** Status and JSON body: a map for an object, a list for an array, null when the response has none. */
	public record Response(int status, Object body) {

		public Object field(String name) {
			return body instanceof Map<?, ?> map ? map.get(name) : null;
		}

		@SuppressWarnings("unchecked")
		public List<Map<String, Object>> items() {
			return (List<Map<String, Object>>) body;
		}

	}

}
