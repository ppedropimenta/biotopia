package dev.pedropim.aquarium.identity;

import java.lang.annotation.ElementType;
import java.lang.annotation.Retention;
import java.lang.annotation.RetentionPolicy;
import java.lang.annotation.Target;

import jakarta.validation.Constraint;
import jakarta.validation.ConstraintValidator;
import jakarta.validation.ConstraintValidatorContext;
import jakarta.validation.Payload;

/**
 * A password being chosen (sign-up, reset) has the length {@link PasswordRules} asks for. The field problem is
 * {@code too_short} or {@code too_long}, so a form shows it next to the other fields' problems.
 */
@Target(ElementType.FIELD)
@Retention(RetentionPolicy.RUNTIME)
@Constraint(validatedBy = NewPassword.Validator.class)
@interface NewPassword {

	String message() default "too_short";

	Class<?>[] groups() default {};

	Class<? extends Payload>[] payload() default {};

	class Validator implements ConstraintValidator<NewPassword, String> {

		@Override
		public boolean isValid(String password, ConstraintValidatorContext context) {
			if (password == null) {
				return true;
			}
			return PasswordRules.lengthProblem(password).map(problem -> {
				context.disableDefaultConstraintViolation();
				context.buildConstraintViolationWithTemplate(problem).addConstraintViolation();
				return false;
			}).orElse(true);
		}

	}

}
