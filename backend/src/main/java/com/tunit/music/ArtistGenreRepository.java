package com.tunit.music;

import org.springframework.data.jpa.repository.JpaRepository;
import java.util.UUID;

public interface ArtistGenreRepository extends JpaRepository<ArtistGenre, ArtistGenreId> {
    java.util.List<ArtistGenre> findById_ArtistId(UUID artistId);
}
