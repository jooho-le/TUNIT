package com.tunit.music;

import org.springframework.data.jpa.repository.JpaRepository;
import java.util.UUID;

public interface TrackGenreRepository extends JpaRepository<TrackGenre, TrackGenreId> {
    java.util.List<TrackGenre> findById_TrackId(UUID trackId);
}
