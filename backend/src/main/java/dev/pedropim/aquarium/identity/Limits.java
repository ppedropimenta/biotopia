package dev.pedropim.aquarium.identity;

/**
 * Sizes for the fields of the open routes. They only stop the app from doing work on absurd values (the JSON
 * parser's own limit is what protects the heap).
 */
final class Limits {

	/** The longest address SMTP allows. */
	static final int EMAIL = 254;

	/**
	 * Counts characters, while bcrypt counts bytes (72, checked in {@code AccountService}). A character takes at
	 * least one byte, so no valid password has more than 72 characters; 128 leaves room and never refuses a valid one.
	 */
	static final int PASSWORD = 128;

	/** A real link token has 43 characters. */
	static final int TOKEN = 200;

	private Limits() {
	}

}
