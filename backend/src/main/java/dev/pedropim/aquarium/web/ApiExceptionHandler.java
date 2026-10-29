package dev.pedropim.aquarium.web;

import java.util.Map;
import java.util.TreeMap;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.http.converter.HttpMessageNotReadableException;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;
import org.springframework.web.multipart.MaxUploadSizeExceededException;

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

	/** An upload over the size the server accepts at all (see {@code spring.servlet.multipart}). */
	@ExceptionHandler(MaxUploadSizeExceededException.class)
	ResponseEntity<ApiError> uploadTooLarge() {
		return ResponseEntity.status(HttpStatus.CONTENT_TOO_LARGE).body(new ApiError("validation_failed", Map.of("file", "too_large")));
	}

	@ExceptionHandler(HttpMessageNotReadableException.class)
	ResponseEntity<ApiError> unreadableBody() {
		return ResponseEntity.badRequest().body(new ApiError("malformed_request", Map.of()));
	}

}
