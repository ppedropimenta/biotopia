package dev.pedropim.aquarium.tanks;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

interface TankRepository extends JpaRepository<Tank, UUID> {

	Optional<Tank> findByIdAndOwnerId(UUID id, UUID ownerId);

	@Query("select t from Tank t where t.ownerId = :ownerId order by t.createdAt, t.id")
	List<Tank> findOwnedBy(UUID ownerId);

}
