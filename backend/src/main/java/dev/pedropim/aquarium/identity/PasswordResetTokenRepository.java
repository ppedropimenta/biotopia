package dev.pedropim.aquarium.identity;

import java.util.UUID;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;

interface PasswordResetTokenRepository extends JpaRepository<PasswordResetToken, String> {

	void deleteByUserId(UUID userId);

	/**
	 * Uses up one link. The database deletes a row for only one of two requests that arrive together, so the
	 * answer (1 or 0) says who got the link.
	 */
	@Modifying
	@Query("delete from PasswordResetToken t where t.tokenHash = :tokenHash")
	int claim(String tokenHash);

}
