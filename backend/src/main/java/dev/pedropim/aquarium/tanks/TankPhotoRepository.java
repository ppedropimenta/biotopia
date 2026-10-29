package dev.pedropim.aquarium.tanks;

import java.util.Collection;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

import org.springframework.data.domain.Limit;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

interface TankPhotoRepository extends JpaRepository<TankPhoto, UUID> {

	List<TankPhoto> findByTankIdOrderByTakenAtDescIdAsc(UUID tankId, Limit limit);

	Optional<TankPhoto> findByIdAndTankId(UUID id, UUID tankId);

	long countByTankId(UUID tankId);

	/**
	 * Takes the user's photo lock until the end of the transaction, so two uploads of one user are checked against
	 * the quota one after the other. The lock is held by the database; the 1 is only there to have a result to read.
	 */
	@Query(value = "select 1 from (select pg_advisory_xact_lock(hashtext(cast(:ownerId as text)))) as locked",
			nativeQuery = true)
	int lockUploadsOf(UUID ownerId);

	/** The bytes of everything a user has stored, across all their Tanks: what the quota counts. */
	@Query("""
			select coalesce(sum(p.sizeBytes), 0) from TankPhoto p
			where p.tankId in (select t.id from Tank t where t.ownerId = :ownerId)
			""")
	long storedBytesOf(UUID ownerId);

	@Query("select p.storageKey from TankPhoto p where p.tankId in :tankIds")
	List<String> storageKeysOf(Collection<UUID> tankIds);

}
