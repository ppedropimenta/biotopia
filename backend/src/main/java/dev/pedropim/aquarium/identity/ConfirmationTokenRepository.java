package dev.pedropim.aquarium.identity;

import java.util.UUID;

import org.springframework.data.jpa.repository.JpaRepository;

interface ConfirmationTokenRepository extends JpaRepository<ConfirmationToken, String> {

	void deleteByUserId(UUID userId);

}
