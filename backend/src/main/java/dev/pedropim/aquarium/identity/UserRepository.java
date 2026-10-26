package dev.pedropim.aquarium.identity;

import java.time.Instant;
import java.util.Optional;
import java.util.UUID;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

interface UserRepository extends JpaRepository<User, UUID> {

	Optional<User> findByEmail(String email);

	boolean existsByEmail(String email);

	/** Empty when the account has no reset yet (or does not exist). Asked on every request, so it reads one column. */
	@Query("select u.passwordChangedAt from User u where u.id = :id")
	Optional<Instant> findPasswordChangedAt(UUID id);

}
