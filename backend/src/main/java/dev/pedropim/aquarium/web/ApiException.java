package dev.pedropim.aquarium.web;

import java.util.Map;

import org.springframework.http.HttpStatus;

/**
 * A failure the client should understand. The response carries a stable code, never translated text; the SPA
 * turns codes into messages in the user's language.
 */
public class ApiException extends RuntimeException {

	private final HttpStatus status;

	private final String code;

	private final Map<String, String> fields;

	public ApiException(HttpStatus status, String code) {
		this(status, code, Map.of());
	}

	public ApiException(HttpStatus status, String code, Map<String, String> fields) {
		super(code);
		this.status = status;
		this.code = code;
		this.fields = fields;
	}

	public static ApiException invalidField(String field, String code) {
		return new ApiException(HttpStatus.BAD_REQUEST, "validation_failed", Map.of(field, code));
	}

	HttpStatus status() {
		return status;
	}

	ApiError body() {
		return new ApiError(code, fields);
	}

}
