package dev.pedropim.aquarium.tanks;

import java.util.Optional;

/** The kinds of care work the platform knows, fixed in code. Each has a stable code for the API. */
enum MaintenanceType {

	WATER_CHANGE("water_change"),
	TOP_UP("top_up"),
	FILTER_CLEANING("filter_cleaning"),
	FERTILIZING("fertilizing"),
	PRUNING("pruning"),
	SUBSTRATE_CLEANING("substrate_cleaning"),
	OTHER("other");

	private final String code;

	MaintenanceType(String code) {
		this.code = code;
	}

	String code() {
		return code;
	}

	static Optional<MaintenanceType> ofCode(String code) {
		for (MaintenanceType type : values()) {
			if (type.code.equals(code)) {
				return Optional.of(type);
			}
		}
		return Optional.empty();
	}

}
