package com.tunit.taste;

import org.springframework.data.jpa.repository.JpaRepository;
import java.util.UUID;

public interface UserTrackRepository extends JpaRepository<UserTrack, UserTrackId> {
    java.util.List<UserTrack> findById_UserId(UUID userId);
}
