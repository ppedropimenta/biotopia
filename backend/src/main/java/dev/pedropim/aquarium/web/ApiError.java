package dev.pedropim.aquarium.web;

import java.util.Map;

/**
 * The JSON body of every error: a code, and for validation errors a code per field.
 */
public record ApiError(String code, Map<String, String> fields) {
}
