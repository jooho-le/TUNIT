package com.tunit.music;

import org.springframework.data.jpa.repository.JpaRepository;
import java.util.UUID;

public interface TrackArtistRepository extends JpaRepository<TrackArtist, TrackArtistId> {
    java.util.List<TrackArtist> findById_TrackId(UUID trackId);
}
