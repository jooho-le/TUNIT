package com.tunit.music;

import org.springframework.data.jpa.repository.JpaRepository;
import java.util.UUID;

public interface ArtistRepository extends JpaRepository<Artist, UUID> {
    org.springframework.data.domain.Page<Artist> findByNameContainingIgnoreCase(String name, org.springframework.data.domain.Pageable pageable);
}
