package dev.pedropim.aquarium.support;

import java.lang.annotation.ElementType;
import java.lang.annotation.Retention;
import java.lang.annotation.RetentionPolicy;
import java.lang.annotation.Target;

import org.junit.jupiter.api.extension.ExtendWith;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.context.SpringBootTest.WebEnvironment;
import org.springframework.context.annotation.Import;
import org.springframework.test.context.TestPropertySource;

/**
 * Boots the whole app on a random port against a real PostgreSQL. Tests talk to it over HTTP only. Every test starts
 * with the clock at {@link TestSubstitutes#START}.
 */
@Target(ElementType.TYPE)
@Retention(RetentionPolicy.RUNTIME)
@SpringBootTest(webEnvironment = WebEnvironment.RANDOM_PORT)
@TestPropertySource(properties = "app.photos.dir=target/test-photos")
@Import({ TestcontainersConfiguration.class, TestSubstitutes.class })
@ExtendWith(ClockReset.class)
public @interface ApiTest {
}
