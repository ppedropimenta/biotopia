package dev.pedropim.aquarium.tanks;

import java.math.BigDecimal;
import java.util.Arrays;
import java.util.List;

import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

/** The fixed list of Parameters, so the client never repeats their units or bounds. Names are the client's to translate. */
@RestController
@RequestMapping("/api/parameters")
class ParameterController {

	@GetMapping
	List<ParameterView> list() {
		return Arrays.stream(Parameter.values()).map(ParameterView::of).toList();
	}

	record ParameterView(String code, String unit, BigDecimal min, BigDecimal max) {

		static ParameterView of(Parameter parameter) {
			return new ParameterView(parameter.code(), parameter.unit(), parameter.min(), parameter.max());
		}

	}

}
