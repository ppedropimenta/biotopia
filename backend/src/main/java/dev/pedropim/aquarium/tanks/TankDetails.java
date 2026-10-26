package dev.pedropim.aquarium.tanks;

import java.lang.annotation.Documented;
import java.lang.annotation.ElementType;
import java.lang.annotation.Retention;
import java.lang.annotation.RetentionPolicy;
import java.lang.annotation.Target;
import java.math.BigDecimal;
import java.time.LocalDate;

import jakarta.validation.Constraint;
import jakarta.validation.Payload;
import jakarta.validation.ReportAsSingleViolation;
import jakarta.validation.constraints.DecimalMax;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.Digits;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

/**
 * What an owner writes about a Tank, on creation and on every edit. Dimensions are in cm and Net Volume in
 * liters; each is optional. The limits are generous: they only catch typos, and the columns hold them.
 */
record TankDetails(@NotBlank(message = "required") @Size(max = 100, message = "too_long") String name,
		@NotNull(message = "required") LocalDate startDate, @Dimension BigDecimal lengthCm,
		@Dimension BigDecimal widthCm, @Dimension BigDecimal heightCm, @NetVolume BigDecimal netVolumeLiters,
		@Size(max = 2000, message = "too_long") String note) {

	TankDetails {
		name = name == null ? null : name.strip();
		note = note == null || note.isBlank() ? null : note.strip();
	}

	/** A length in cm: above 0, up to 10 000, at most two decimals. */
	@DecimalMin(value = "0", inclusive = false, message = "invalid")
	@DecimalMax(value = "10000", message = "invalid")
	@Digits(integer = 5, fraction = 2, message = "invalid")
	@Constraint(validatedBy = {})
	@ReportAsSingleViolation
	@Target({ ElementType.RECORD_COMPONENT, ElementType.FIELD, ElementType.METHOD, ElementType.PARAMETER })
	@Retention(RetentionPolicy.RUNTIME)
	@Documented
	@interface Dimension {

		String message() default "invalid";

		Class<?>[] groups() default {};

		Class<? extends Payload>[] payload() default {};

	}

	/** An amount of water in liters: above 0, up to 1 000 000, at most two decimals. */
	@DecimalMin(value = "0", inclusive = false, message = "invalid")
	@DecimalMax(value = "1000000", message = "invalid")
	@Digits(integer = 7, fraction = 2, message = "invalid")
	@Constraint(validatedBy = {})
	@ReportAsSingleViolation
	@Target({ ElementType.RECORD_COMPONENT, ElementType.FIELD, ElementType.METHOD, ElementType.PARAMETER })
	@Retention(RetentionPolicy.RUNTIME)
	@Documented
	@interface NetVolume {

		String message() default "invalid";

		Class<?>[] groups() default {};

		Class<? extends Payload>[] payload() default {};

	}

}
