package dev.pedropim.aquarium.tanks;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

import org.springframework.data.domain.Limit;
import org.springframework.data.jpa.repository.JpaRepository;

interface MaintenanceRepository extends JpaRepository<Maintenance, UUID> {

	List<Maintenance> findByTankIdOrderByPerformedAtDescIdAsc(UUID tankId, Limit limit);

	List<Maintenance> findByTankIdAndTypeOrderByPerformedAtDescIdAsc(UUID tankId, MaintenanceType type, Limit limit);

	Optional<Maintenance> findByIdAndTankId(UUID id, UUID tankId);

}
