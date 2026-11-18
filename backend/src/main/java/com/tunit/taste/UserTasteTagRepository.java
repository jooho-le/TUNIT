package com.tunit.taste;

import org.springframework.data.jpa.repository.JpaRepository;
import java.util.UUID;

public interface UserTasteTagRepository extends JpaRepository<UserTasteTag, UserTasteTagId> {
    java.util.List<UserTasteTag> findById_UserId(UUID userId);
}
