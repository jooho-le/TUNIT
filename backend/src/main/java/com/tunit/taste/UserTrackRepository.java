package com.tunit.taste;

import org.springframework.data.jpa.repository.JpaRepository;
import java.util.UUID;

public interface UserTrackRepository extends JpaRepository<UserTrack, UserTrackId> {
    java.util.List<UserTrack> findById_UserId(UUID userId);
    @org.springframework.data.jpa.repository.Modifying
    @org.springframework.data.jpa.repository.Query("delete from UserTrack t where t.id.userId = :userId")
    int deleteAllForUser(@org.springframework.data.repository.query.Param("userId") UUID userId);
}
