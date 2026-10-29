package dev.pedropim.aquarium.tanks;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;

interface TankRepository extends JpaRepository<Tank, UUID> {

	Optional<Tank> findByIdAndOwnerId(UUID id, UUID ownerId);

	@Query("select t from Tank t where t.ownerId = :ownerId order by t.createdAt, t.id")
	List<Tank> findOwnedBy(UUID ownerId);

	@Query("select t.id from Tank t where t.ownerId = :ownerId")
	List<UUID> idsOwnedBy(UUID ownerId);

	Optional<Tank> findByDemoTrue();

	@Modifying
	@Query("update Tank t set t.demo = false where t.demo = true")
	void clearDemo();

	@Modifying
	@Query("update Tank t set t.demo = true where t.id = :id")
	void markDemo(UUID id);

}
