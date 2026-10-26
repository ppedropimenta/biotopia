package dev.pedropim.aquarium.identity;

import java.util.Arrays;
import java.util.Optional;

/**
 * The languages of the app. The code is what the API and the database use; it matches the SPA's language tags.
 */
public enum Language {

	EN("en"), PT_BR("pt-BR");

	private final String code;

	Language(String code) {
		this.code = code;
	}

	public String code() {
		return code;
	}

	public static Optional<Language> fromCode(String code) {
		return Arrays.stream(values()).filter(language -> language.code.equals(code)).findFirst();
	}

}
