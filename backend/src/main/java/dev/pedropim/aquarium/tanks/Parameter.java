package dev.pedropim.aquarium.tanks;

import java.math.BigDecimal;
import java.util.Optional;

/**
 * The water properties the platform knows, fixed in code. Each has a stable code for the API, one canonical unit
 * and plausibility bounds. The bounds only catch typos (pH 72); they say nothing about what is good for a tank.
 * Free ammonia (NH3) and CO2 are never stored.
 */
enum Parameter {

	TEMPERATURE("temperature", "°C", 0, 45),
	PH("ph", "", 0, 14),
	GH("gh", "°dH", 0, 100),
	KH("kh", "°dH", 0, 100),
	TOTAL_AMMONIA("total_ammonia", "mg/L", 0, 100),
	NITRITE("nitrite", "mg/L", 0, 100),
	NITRATE("nitrate", "mg/L", 0, 1000),
	PHOSPHATE("phosphate", "mg/L", 0, 100),
	CONDUCTIVITY("conductivity", "µS/cm", 0, 10000),
	IRON("iron", "mg/L", 0, 100),
	POTASSIUM("potassium", "mg/L", 0, 1000);

	private static final int MAX_DECIMALS = 4;

	private final String code;

	private final String unit;

	private final BigDecimal min;

	private final BigDecimal max;

	Parameter(String code, String unit, int min, int max) {
		this.code = code;
		this.unit = unit;
		this.min = BigDecimal.valueOf(min);
		this.max = BigDecimal.valueOf(max);
	}

	String code() {
		return code;
	}

	String unit() {
		return unit;
	}

	BigDecimal min() {
		return min;
	}

	BigDecimal max() {
		return max;
	}

	/**
	 * What is wrong with this value for this Parameter, if anything: {@code invalid} with more than four decimals (the
	 * column keeps four: photometers read nitrite to 0.001 and iron to 0.005 mg/L, and kits to 0.01), or
	 * {@code out_of_range} outside the bounds.
	 */
	Optional<String> problemWith(BigDecimal value) {
		if (value.stripTrailingZeros().scale() > MAX_DECIMALS) {
			return Optional.of("invalid");
		}
		return value.compareTo(min) >= 0 && value.compareTo(max) <= 0 ? Optional.empty() : Optional.of("out_of_range");
	}

	static Optional<Parameter> ofCode(String code) {
		for (Parameter parameter : values()) {
			if (parameter.code.equals(code)) {
				return Optional.of(parameter);
			}
		}
		return Optional.empty();
	}

}
