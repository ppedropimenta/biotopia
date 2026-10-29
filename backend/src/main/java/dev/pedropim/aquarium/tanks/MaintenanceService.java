package dev.pedropim.aquarium.tanks;

import java.math.BigDecimal;
import java.time.Clock;
import java.time.Instant;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.TreeMap;
import java.util.UUID;

import org.springframework.data.domain.Limit;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import dev.pedropim.aquarium.web.ApiException;

@Service
class MaintenanceService {

	/** The column keeps two decimals. */
	private static final int MAX_PERCENT_DECIMALS = 2;

	private static final BigDecimal MAX_PERCENT = BigDecimal.valueOf(100);

	private static final int MAX_NOTE_LENGTH = 2000;

	private static final int MAX_LIST = 1000;

	/** The most Maintenance one submission records together. */
	private static final int MAX_BATCH = 10;

	private final TankService tanks;

	private final MaintenanceRepository maintenance;

	private final Clock clock;

	MaintenanceService(TankService tanks, MaintenanceRepository maintenance, Clock clock) {
		this.tanks = tanks;
		this.maintenance = maintenance;
		this.clock = clock;
	}

	/**
	 * The newest Maintenance first, at most {@code limit} of them (kept between 1 and {@value #MAX_LIST}), of one
	 * type when {@code type} is given.
	 */
	List<MaintenanceView> list(UUID ownerId, UUID tankId, String type, int limit) {
		tanks.requireOwned(ownerId, tankId);
		Limit newest = Limit.of(Math.clamp(limit, 1, MAX_LIST));
		List<Maintenance> found = type == null
				? maintenance.findByTankIdOrderByPerformedAtDescIdAsc(tankId, newest)
				: maintenance.findByTankIdAndTypeOrderByPerformedAtDescIdAsc(tankId, ofCode(type), newest);
		return found.stream()
			.map(MaintenanceView::of)
			.toList();
	}

	MaintenanceView read(UUID ownerId, UUID tankId, UUID id) {
		tanks.requireOwned(ownerId, tankId);
		return MaintenanceView.of(find(tankId, id));
	}

	@Transactional
	MaintenanceView record(UUID ownerId, UUID tankId, MaintenanceDetails details) {
		tanks.requireActive(ownerId, tankId);
		return save(tankId, details, clock.instant());
	}

	private MaintenanceView save(UUID tankId, MaintenanceDetails details, Instant now) {
		Instant performedAt = details.performedAt() == null ? now : details.performedAt();
		MaintenanceType type = check(details, performedAt, now);
		return MaintenanceView.of(maintenance
			.save(new Maintenance(tankId, type, details.percent(), performedAt, cleanNote(details.note()), now)));
	}

	/**
	 * Several Maintenance done together, such as a water change and a filter cleaning. All of them are recorded or
	 * none is, and the ones without a moment share the same "now".
	 */
	@Transactional
	List<MaintenanceView> recordAll(UUID ownerId, UUID tankId, List<MaintenanceDetails> entries) {
		tanks.requireActive(ownerId, tankId);
		if (entries == null || entries.isEmpty()) {
			throw ApiException.invalidField("entries", "required");
		}
		if (entries.size() > MAX_BATCH) {
			throw ApiException.invalidField("entries", "too_many");
		}
		Instant now = clock.instant();
		return entries.stream().map(entry -> save(tankId, entry, now)).toList();
	}

	@Transactional
	MaintenanceView edit(UUID ownerId, UUID tankId, UUID id, MaintenanceDetails details) {
		tanks.requireOwned(ownerId, tankId);
		Maintenance found = find(tankId, id);
		MaintenanceType type = check(details, details.performedAt(), clock.instant());
		found.change(type, details.percent(), details.performedAt(), cleanNote(details.note()));
		return MaintenanceView.of(found);
	}

	@Transactional
	void delete(UUID ownerId, UUID tankId, UUID id) {
		tanks.requireOwned(ownerId, tankId);
		maintenance.delete(find(tankId, id));
	}

	private static MaintenanceType ofCode(String code) {
		return MaintenanceType.ofCode(code).orElseThrow(() -> ApiException.invalidField("type", "unknown_type"));
	}

	/** Maintenance of another Tank answers like one that does not exist, even for the owner of both. */
	private Maintenance find(UUID tankId, UUID id) {
		return maintenance.findByIdAndTankId(id, tankId)
			.orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "maintenance_not_found"));
	}

	/**
	 * The type, once everything is right. Otherwise the whole submission is refused with a code per field, so one
	 * form shows every problem at once.
	 */
	private static MaintenanceType check(MaintenanceDetails details, Instant performedAt, Instant now) {
		Map<String, String> problems = new TreeMap<>();
		Optional<MaintenanceType> type = Optional.empty();
		if (details.type() == null) {
			problems.put("type", "required");
		}
		else {
			type = MaintenanceType.ofCode(details.type());
			if (type.isEmpty()) {
				problems.put("type", "unknown_type");
			}
		}
		if (performedAt == null) {
			problems.put("performedAt", "required");
		}
		else if (performedAt.isAfter(now)) {
			problems.put("performedAt", "in_future");
		}
		type.flatMap(known -> percentProblem(known, details.percent())).ifPresent(code -> problems.put("percent", code));
		noteProblem(type.orElse(null), details.note()).ifPresent(code -> problems.put("note", code));
		if (!problems.isEmpty()) {
			throw new ApiException(HttpStatus.BAD_REQUEST, "validation_failed", problems);
		}
		return type.orElseThrow();
	}

	private static Optional<String> percentProblem(MaintenanceType type, BigDecimal percent) {
		if (type != MaintenanceType.WATER_CHANGE) {
			return percent == null ? Optional.empty() : Optional.of("not_applicable");
		}
		if (percent == null) {
			return Optional.of("required");
		}
		if (percent.stripTrailingZeros().scale() > MAX_PERCENT_DECIMALS) {
			return Optional.of("invalid");
		}
		boolean inRange = percent.signum() > 0 && percent.compareTo(MAX_PERCENT) <= 0;
		return inRange ? Optional.empty() : Optional.of("out_of_range");
	}

	private static Optional<String> noteProblem(MaintenanceType type, String note) {
		if (type == MaintenanceType.OTHER && (note == null || note.isBlank())) {
			return Optional.of("required");
		}
		return note != null && note.strip().length() > MAX_NOTE_LENGTH ? Optional.of("too_long") : Optional.empty();
	}

	private static String cleanNote(String note) {
		return note == null || note.isBlank() ? null : note.strip();
	}

}
