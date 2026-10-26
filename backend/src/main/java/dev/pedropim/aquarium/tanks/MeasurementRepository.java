package dev.pedropim.aquarium.tanks;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

import org.springframework.data.domain.Limit;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

interface MeasurementRepository extends JpaRepository<Measurement, UUID> {

	List<Measurement> findByTankIdOrderByMeasuredAtDescIdAsc(UUID tankId, Limit limit);

	Optional<Measurement> findByIdAndTankId(UUID id, UUID tankId);

	/** For each Parameter, the Measurement with the latest moment; of two at the same moment, the one with the higher id. */
	@Query("""
			select m from Measurement m where m.tankId = :tankId and not exists (
			  select 1 from Measurement n where n.tankId = m.tankId and n.parameter = m.parameter
			  and (n.measuredAt > m.measuredAt or (n.measuredAt = m.measuredAt and n.id > m.id)))
			""")
	List<Measurement> findLatestByParameter(UUID tankId);

}
