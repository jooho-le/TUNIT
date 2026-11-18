package com.tunit.music;

import org.springframework.data.jpa.repository.JpaRepository;
import java.util.UUID;

public interface TrackRepository extends JpaRepository<Track, UUID> {
    org.springframework.data.domain.Page<Track> findByTitleContainingIgnoreCase(String title, org.springframework.data.domain.Pageable pageable);
}
