package com.tunit.music;

import org.springframework.data.jpa.repository.JpaRepository;
import java.util.UUID;

public interface TrackRepository extends JpaRepository<Track, UUID> {
    @org.springframework.data.jpa.repository.Query("select t from Track t where lower(t.title) like lower(:q) escape '!' or exists (select a from TrackArtist a where a.track = t and lower(a.artist.name) like lower(:q) escape '!')")
    org.springframework.data.domain.Page<Track> search(@org.springframework.data.repository.query.Param("q") String query, org.springframework.data.domain.Pageable pageable);
    org.springframework.data.domain.Page<Track> findByTitleContainingIgnoreCase(String title, org.springframework.data.domain.Pageable pageable);
}
