package com.tunit.taste;

import org.springframework.data.jpa.repository.JpaRepository;
import java.util.UUID;

public interface UserArtistRepository extends JpaRepository<UserArtist, UserArtistId> {
    java.util.List<UserArtist> findById_UserId(UUID userId);
    @org.springframework.data.jpa.repository.Modifying
    @org.springframework.data.jpa.repository.Query("delete from UserArtist a where a.id.userId = :userId")
    int deleteAllForUser(@org.springframework.data.repository.query.Param("userId") UUID userId);
}
