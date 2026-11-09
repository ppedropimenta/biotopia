package dev.pedropim.aquarium.tanks;

import java.math.BigDecimal;
import java.time.Clock;
import java.time.Instant;
import java.util.Comparator;
import java.util.EnumMap;
import java.util.List;
import java.util.Map;
import java.util.Objects;
import java.util.Optional;
import java.util.TreeMap;
import java.util.UUID;

import org.springframework.data.domain.Limit;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import dev.pedropim.aquarium.web.ApiException;

@Service
class MeasurementService {

	private static final int MAX_NOTE_LENGTH = 2000;

	private static final int MAX_LIST = 1000;

	private final TankAccess access;

	private final MeasurementRepository measurements;

	private final Clock clock;

	MeasurementService(TankAccess access, MeasurementRepository measurements, Clock clock) {
		this.access = access;
		this.measurements = measurements;
		this.clock = clock;
	}

	/** The newest Measurements first, at most {@code limit} of them (kept between 1 and {@value #MAX_LIST}). */
	List<MeasurementView> list(UUID viewerId, UUID tankId, int limit) {
		access.readable(viewerId, tankId);
		return measurements.findByTankIdOrderByMeasuredAtDescIdAsc(tankId, Limit.of(Math.clamp(limit, 1, MAX_LIST)))
			.stream()
			.map(MeasurementView::of)
			.toList();
	}

	MeasurementView read(UUID viewerId, UUID tankId, UUID id) {
		access.readable(viewerId, tankId);
		return MeasurementView.of(find(tankId, id));
	}

	/** One Measurement per Parameter that has any, in the order the Parameters are listed. */
	List<MeasurementView> latest(UUID viewerId, UUID tankId) {
		access.readable(viewerId, tankId);
		return measurements.findLatestByParameter(tankId)
			.stream()
			.sorted(Comparator.comparing(Measurement::parameter))
			.map(MeasurementView::of)
			.toList();
	}

	@Transactional
	List<MeasurementView> record(UUID ownerId, UUID tankId, NewMeasurements request) {
		access.active(ownerId, tankId);
		Instant now = clock.instant();
		Instant measuredAt = request.measuredAt() == null ? now : request.measuredAt();
		Map<String, String> problems = new TreeMap<>();
		checkMoment(measuredAt, now, problems);
		checkNote(request.note(), problems);
		Map<Parameter, BigDecimal> values = checkValues(request.values(), problems);
		refuseIfAny(problems);
		String note = cleanNote(request.note());
		return values.entrySet()
			.stream()
			.map(entry -> new Measurement(tankId, entry.getKey(), entry.getValue(), measuredAt, note, now))
			.map(measurements::save)
			.map(MeasurementView::of)
			.toList();
	}

	@Transactional
	MeasurementView edit(UUID ownerId, UUID tankId, UUID id, MeasurementChange change) {
		access.owned(ownerId, tankId);
		Measurement measurement = find(tankId, id);
		Map<String, String> problems = new TreeMap<>();
		if (change.measuredAt() == null) {
			problems.put("measuredAt", "required");
		}
		else {
			checkMoment(change.measuredAt(), clock.instant(), problems);
		}
		if (change.value() == null) {
			problems.put("value", "required");
		}
		else {
			measurement.parameter().problemWith(change.value()).ifPresent(code -> problems.put("value", code));
		}
		checkNote(change.note(), problems);
		refuseIfAny(problems);
		measurement.change(change.value(), change.measuredAt(), cleanNote(change.note()));
		return MeasurementView.of(measurement);
	}

	@Transactional
	void delete(UUID ownerId, UUID tankId, UUID id) {
		access.owned(ownerId, tankId);
		measurements.delete(find(tankId, id));
	}

	/** A Measurement of another Tank answers like one that does not exist, even for the owner of both. */
	private Measurement find(UUID tankId, UUID id) {
		return measurements.findByIdAndTankId(id, tankId)
			.orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "measurement_not_found"));
	}

	private static void checkMoment(Instant measuredAt, Instant now, Map<String, String> problems) {
		if (measuredAt.isAfter(now)) {
			problems.put("measuredAt", "in_future");
		}
	}

	private static void checkNote(String note, Map<String, String> problems) {
		if (note != null && note.strip().length() > MAX_NOTE_LENGTH) {
			problems.put("note", "too_long");
		}
	}

	private static String cleanNote(String note) {
		return note == null || note.isBlank() ? null : note.strip();
	}

	/** The Parameters filled in on a submission. A Parameter sent as null was left empty. */
	private static Map<Parameter, BigDecimal> checkValues(Map<String, BigDecimal> sent, Map<String, String> problems) {
		Map<Parameter, BigDecimal> values = new EnumMap<>(Parameter.class);
		Map<String, BigDecimal> filled = sent == null ? Map.of() : sent;
		filled.forEach((code, value) -> {
			if (value == null) {
				return;
			}
			Optional<Parameter> parameter = Parameter.ofCode(code);
			if (parameter.isEmpty()) {
				problems.put("values." + code, "unknown_parameter");
			}
			else {
				parameter.get().problemWith(value).ifPresentOrElse(problem -> problems.put("values." + code, problem),
						() -> values.put(parameter.get(), value));
			}
		});
		if (filled.values().stream().allMatch(Objects::isNull)) {
			problems.put("values", "required");
		}
		return values;
	}

	/** Refuses the whole submission with a code per field, so one form shows every problem at once. */
	private static void refuseIfAny(Map<String, String> problems) {
		if (!problems.isEmpty()) {
			throw new ApiException(HttpStatus.BAD_REQUEST, "validation_failed", problems);
		}
	}

}
