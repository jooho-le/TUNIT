package com.tunit.match;

import com.tunit.auth.*;
import com.tunit.common.api.*;
import com.tunit.common.error.*;
import com.tunit.common.persistence.UuidOrder;
import com.tunit.music.*;
import com.tunit.taste.*;
import com.tunit.user.*;
import java.util.*;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.*;

@Service
@Transactional(readOnly = true, isolation = Isolation.REPEATABLE_READ)
public class MatchingService {
    private final CurrentUser current;
    private final TunitUserRepository users;
    private final TasteProfileRepository profiles;
    private final TasteFeatureLoader features;
    private final SimilarityCalculator calculator;
    private final CatalogMapper catalog;
    public MatchingService(CurrentUser current, TunitUserRepository users, TasteProfileRepository profiles,
                           TasteFeatureLoader features, SimilarityCalculator calculator, CatalogMapper catalog) {
        this.current = current; this.users = users; this.profiles = profiles; this.features = features; this.calculator = calculator; this.catalog = catalog;
    }
    public PageResponse<MatchCard> list(TunitPrincipal principal, int page, int size) {
        QueryBounds.page(page, size, org.springframework.data.domain.Sort.unsorted());
        var own = features.load(current.read(principal)); requireComplete(own);
        var cards = profiles.findByStatusAndIsPublicTrue(TasteStatus.COMPLETE).stream()
            .filter(p -> !p.getUserId().equals(own.user().getId()) && p.getUser().getDeletedAt() == null)
            .map(p -> features.load(p.getUser())).map(other -> card(own, other))
            .sorted(Comparator.comparing(MatchCard::similarityScore, Comparator.nullsLast(Comparator.reverseOrder()))
                .thenComparing(MatchCard::userId, UuidOrder::compare)).toList();
        return QueryBounds.slice(cards, page, size);
    }
    public MatchDetailResponse detail(TunitPrincipal principal, UUID id) {
        var own = features.load(current.read(principal)); requireComplete(own);
        if (own.user().getId().equals(id)) throw new BusinessException(ErrorCode.SELF_REQUEST);
        var other = features.load(users.findByIdAndDeletedAtIsNull(id).orElseThrow(() -> new BusinessException(ErrorCode.RESOURCE_NOT_FOUND)));
        if (!other.complete() || !other.isPublic()) throw new BusinessException(ErrorCode.RESOURCE_NOT_FOUND);
        return compare(own, other);
    }
    public MatchDetailResponse compare(TasteFeatures own, TasteFeatures other) {
        var result = score(own, other); var artists = own.artistIds(); var tracks = own.trackIds();
        return new MatchDetailResponse(other.user().getId(), other.user().getNickname(), result.score(),
            other.artists().stream().filter(a -> artists.contains(a.getId())).sorted(Comparator.comparing(Artist::getId, UuidOrder::compare)).map(catalog::artist).toList(),
            other.tracks().stream().filter(t -> tracks.contains(t.getId())).sorted(Comparator.comparing(Track::getId, UuidOrder::compare)).map(catalog::track).toList(),
            commonGenres(own, other), other.tracks().stream().filter(t -> !tracks.contains(t.getId()))
                .sorted(Comparator.comparing(Track::getId, UuidOrder::compare)).map(catalog::track).toList(), reason(own, other));
    }
    private MatchCard card(TasteFeatures own, TasteFeatures other) {
        var result = score(own, other);
        return new MatchCard(other.user().getId(), other.user().getNickname(), result.score(), result.breakdown(), commonGenres(own,other), reason(own,other));
    }
    private SimilarityCalculator.Result score(TasteFeatures a, TasteFeatures b) { return calculator.compare(a.artistIds(),b.artistIds(),a.trackIds(),b.trackIds(),a.genres(),b.genres()); }
    private List<TagSummary> commonGenres(TasteFeatures a, TasteFeatures b) {
        return a.genres().keySet().stream().filter(b.genres()::containsKey).sorted(UuidOrder::compare).map(a.genreTags()::get).toList();
    }
    private String reason(TasteFeatures a, TasteFeatures b) {
        long artists = a.artistIds().stream().filter(b.artistIds()::contains).count(), tracks = a.trackIds().stream().filter(b.trackIds()::contains).count();
        return "공통 아티스트 " + artists + "명 · 공통곡 " + tracks + "곡 · 공통 장르 " + commonGenres(a,b).size() + "개를 비교한 취향 유사도";
    }
    public static void requireComplete(TasteFeatures f) {
        if (!f.complete()) throw new BusinessException(ErrorCode.TASTE_INCOMPLETE);
    }
}
