package dev.pedropim.aquarium.web;

import org.springframework.boot.jackson.autoconfigure.JsonFactoryBuilderCustomizer;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

import tools.jackson.core.StreamReadConstraints;

/**
 * The JSON parser refuses a document over 1 MB while it reads, before the body is held whole. Bean Validation runs
 * only after parsing, so it cannot protect the heap from a huge body; this can. The largest real request (ten
 * Maintenance records with 2,000-character notes) is about 25 KB. Caddy has the same limit in front of the app; this
 * one stays so the app is safe on its own and a test can prove it.
 */
@Configuration(proxyBeanMethods = false)
class JsonLimits {

	static final long MAX_DOCUMENT_BYTES = 1_000_000;

	@Bean
	JsonFactoryBuilderCustomizer jsonDocumentLimit() {
		return builder -> builder
			.streamReadConstraints(StreamReadConstraints.builder().maxDocumentLength(MAX_DOCUMENT_BYTES).build());
	}

}
