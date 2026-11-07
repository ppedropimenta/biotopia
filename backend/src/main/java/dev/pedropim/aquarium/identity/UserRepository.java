package dev.pedropim.aquarium.identity;

import java.util.Optional;
import java.util.UUID;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

interface UserRepository extends JpaRepository<User, UUID> {

	Optional<User> findByEmail(String email);

	boolean existsByEmail(String email);

	/**
	 * Empty only when the account does not exist; an account with no reset yet answers a row whose {@code changedAt} is
	 * null. Asked on every request, so it reads one column.
	 */
	@Query("select new dev.pedropim.aquarium.identity.PasswordChange(u.passwordChangedAt) from User u where u.id = :id")
	Optional<PasswordChange> findPasswordChange(UUID id);

}
