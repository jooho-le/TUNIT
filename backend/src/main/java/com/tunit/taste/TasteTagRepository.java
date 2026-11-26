package com.tunit.taste;

import org.springframework.data.jpa.repository.JpaRepository;
import java.util.UUID;

public interface TasteTagRepository extends JpaRepository<TasteTag, UUID> {
    java.util.List<TasteTag> findByTypeAndActiveTrue(TagType type);
}
