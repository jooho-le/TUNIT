package com.tunit.taste;

import com.tunit.auth.*;
import com.tunit.common.error.*;
import com.tunit.common.persistence.UuidOrder;
import com.tunit.music.*;
import com.tunit.user.TunitUser;
import jakarta.persistence.EntityManager;
import jakarta.persistence.PersistenceContext;
import java.time.Instant;
import java.util.*;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.*;

@Service
@Transactional(readOnly = true, isolation = Isolation.REPEATABLE_READ)
public class TasteService {
    @PersistenceContext private EntityManager entityManager;
    private final CurrentUser current;
    private final TasteProfileRepository profiles;
    private final UserArtistRepository artists;
    private final UserTrackRepository tracks;
    private final UserTasteTagRepository tags;
    private final ArtistRepository catalogArtists;
    private final TrackRepository catalogTracks;
    private final TasteTagRepository catalogTags;
    public TasteService(CurrentUser current, TasteProfileRepository profiles, UserArtistRepository artists,
                        UserTrackRepository tracks, UserTasteTagRepository tags, ArtistRepository catalogArtists,
                        TrackRepository catalogTracks, TasteTagRepository catalogTags) {
        this.current = current; this.profiles = profiles; this.artists = artists; this.tracks = tracks;
        this.tags = tags; this.catalogArtists = catalogArtists; this.catalogTracks = catalogTracks; this.catalogTags = catalogTags;
    }
    public TasteResponse read(TunitPrincipal principal) { return response(current.read(principal)); }
    public ProfileSettings settings(TunitPrincipal principal) {
        var user = current.read(principal);
        return profiles.findById(user.getId()).map(this::settings).orElse(new ProfileSettings(false, false));
    }
    @Transactional
    public ProfileSettings patch(TunitPrincipal principal, ProfileSettingsPatch input) {
        var user = current.lock(principal); var now = Instant.now();
        var profile = profile(user, now);
        profile.updateSettings(input, now);
        return settings(profiles.saveAndFlush(profile));
    }
    @Transactional
    public TasteResponse replace(TunitPrincipal principal, TasteReplaceRequest input) {
        validateIds(input.artistIds(), 5); validateIds(input.trackIds(), 10); validateIds(input.tagIds(), 6);
        var user = current.lock(principal);
        var selectedArtists = catalogArtists.findAllById(input.artistIds());
        var selectedTracks = catalogTracks.findAllById(input.trackIds());
        var selectedTags = catalogTags.findAllById(input.tagIds());
        if (selectedArtists.size() != input.artistIds().size() || selectedTracks.size() != input.trackIds().size()
            || selectedTags.size() != input.tagIds().size() || selectedTags.stream().anyMatch(tag -> !tag.isActive()))
            throw new BusinessException(ErrorCode.CATALOG_ITEM_NOT_FOUND);
        long genres = selectedTags.stream().filter(tag -> tag.getType() == TagType.GENRE).count();
        long moods = selectedTags.size() - genres;
        if (genres > 3 || moods > 3) throw new BusinessException(ErrorCode.INVALID_TASTE_INPUT);
        var now = Instant.now();
        var previousArtists = artists.findById_UserId(user.getId());
        var previousTracks = tracks.findById_UserId(user.getId());
        var previousTags = tags.findById_UserId(user.getId());
        var oldArtists = new HashSet<>(previousArtists.stream().map(a -> a.getId().getArtistId()).toList());
        var oldTracks = new HashSet<>(previousTracks.stream().map(t -> t.getId().getTrackId()).toList());
        var oldTags = new HashSet<>(previousTags.stream().map(t -> t.getId().getTagId()).toList());
        artists.deleteAll(previousArtists.stream().filter(a -> !input.artistIds().contains(a.getId().getArtistId())).toList());
        tracks.deleteAll(previousTracks.stream().filter(t -> !input.trackIds().contains(t.getId().getTrackId())).toList());
        tags.deleteAll(previousTags.stream().filter(t -> !input.tagIds().contains(t.getId().getTagId())).toList());
        artists.saveAll(selectedArtists.stream().filter(a -> !oldArtists.contains(a.getId())).map(a -> new UserArtist(user, a, (short) 1, now)).toList());
        tracks.saveAll(selectedTracks.stream().filter(t -> !oldTracks.contains(t.getId())).map(t -> new UserTrack(user, t, (short) 1, now)).toList());
        tags.saveAll(selectedTags.stream().filter(t -> !oldTags.contains(t.getId())).map(t -> new UserTasteTag(user, t, (short) 1, now)).toList());
        var profile = profile(user, now);
        var complete = selectedArtists.size() == 5 && selectedTracks.size() == 10 && genres > 0 && moods > 0;
        profile.updateSelections(complete ? TasteStatus.COMPLETE : TasteStatus.INCOMPLETE, now);
        profiles.saveAndFlush(profile);
        return response(user);
    }
    @Transactional
    public void clear(TunitPrincipal principal) {
        var user = current.lock(principal); var now = Instant.now();
        artists.deleteAllForUser(user.getId()); tracks.deleteAllForUser(user.getId()); tags.deleteAllForUser(user.getId());
        var profile = profile(user, now);
        profile.updateSelections(TasteStatus.INCOMPLETE, now);
        profiles.saveAndFlush(profile);
    }
    private void validateIds(List<UUID> ids, int maximum) {
        if (ids == null || ids.size() > maximum || ids.stream().anyMatch(Objects::isNull) || new HashSet<>(ids).size() != ids.size())
            throw new BusinessException(ErrorCode.INVALID_TASTE_INPUT);
    }
    private TasteProfile profile(TunitUser user, Instant now) {
        return profiles.findById(user.getId()).orElseGet(() -> {
            var profile = new TasteProfile(user, now);
            // A new shared-PK @MapsId entity must be persisted, not inferred as an existing row from its assigned ID.
            entityManager.persist(profile);
            return profile;
        });
    }
    private ProfileSettings settings(TasteProfile profile) { return new ProfileSettings(profile.isPublic(), profile.isComparisonConsent()); }
    private TasteResponse response(TunitUser user) {
        var profile = profiles.findById(user.getId());
        return new TasteResponse(
            artists.findById_UserId(user.getId()).stream().map(a -> a.getId().getArtistId()).sorted(UuidOrder::compare).toList(),
            tracks.findById_UserId(user.getId()).stream().map(t -> t.getId().getTrackId()).sorted(UuidOrder::compare).toList(),
            tags.findById_UserId(user.getId()).stream().map(t -> t.getId().getTagId()).sorted(UuidOrder::compare).toList(),
            profile.map(TasteProfile::getStatus).orElse(TasteStatus.INCOMPLETE),
            profile.map(TasteProfile::getUpdatedAt).orElse(user.getUpdatedAt()));
    }
}
