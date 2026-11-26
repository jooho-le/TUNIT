package com.tunit.taste;

import org.springframework.data.jpa.repository.JpaRepository;
import java.util.UUID;

public interface UserTasteTagRepository extends JpaRepository<UserTasteTag, UserTasteTagId> {
    java.util.List<UserTasteTag> findById_UserId(UUID userId);
    @org.springframework.data.jpa.repository.Modifying
    @org.springframework.data.jpa.repository.Query("delete from UserTasteTag t where t.id.userId = :userId")
    int deleteAllForUser(@org.springframework.data.repository.query.Param("userId") UUID userId);
}
