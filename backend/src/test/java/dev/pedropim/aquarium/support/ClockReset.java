package dev.pedropim.aquarium.support;

import org.junit.jupiter.api.extension.BeforeEachCallback;
import org.junit.jupiter.api.extension.ExtensionContext;
import org.springframework.test.context.junit.jupiter.SpringExtension;

/**
 * Puts the shared clock back at {@link TestSubstitutes#START} before every API test. The app, and so the clock, is
 * shared by all the test classes of a run, and some tests move it; without this a test that reads "now" would pass or
 * fail depending on which tests ran before it.
 */
class ClockReset implements BeforeEachCallback {

	@Override
	public void beforeEach(ExtensionContext context) {
		SpringExtension.getApplicationContext(context).getBean(MutableClock.class).set(TestSubstitutes.START);
	}

}
