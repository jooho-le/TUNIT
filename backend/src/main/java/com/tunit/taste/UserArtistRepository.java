package com.tunit.taste;

import org.springframework.data.jpa.repository.JpaRepository;
import java.util.UUID;

public interface UserArtistRepository extends JpaRepository<UserArtist, UserArtistId> {
    java.util.List<UserArtist> findById_UserId(UUID userId);
}
