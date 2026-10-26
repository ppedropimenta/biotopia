package dev.pedropim.aquarium.web;

import java.util.Map;
import java.util.TreeMap;

import org.springframework.http.ResponseEntity;
import org.springframework.http.converter.HttpMessageNotReadableException;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;

@RestControllerAdvice
class ApiExceptionHandler {

	@ExceptionHandler(ApiException.class)
	ResponseEntity<ApiError> apiException(ApiException exception) {
		return ResponseEntity.status(exception.status()).body(exception.body());
	}

	/** Bean Validation messages on request records are the field codes (for example {@code too_short}). */
	@ExceptionHandler(MethodArgumentNotValidException.class)
	ResponseEntity<ApiError> invalidRequest(MethodArgumentNotValidException exception) {
		Map<String, String> fields = new TreeMap<>();
		exception.getBindingResult()
			.getFieldErrors()
			.forEach(error -> fields.putIfAbsent(error.getField(), String.valueOf(error.getDefaultMessage())));
		return ResponseEntity.badRequest().body(new ApiError("validation_failed", fields));
	}

	@ExceptionHandler(HttpMessageNotReadableException.class)
	ResponseEntity<ApiError> unreadableBody() {
		return ResponseEntity.badRequest().body(new ApiError("malformed_request", Map.of()));
	}

}
