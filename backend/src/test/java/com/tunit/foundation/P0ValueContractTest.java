package com.tunit.foundation;

import com.tunit.match.SimilarityCalculator;
import com.tunit.music.SafeCatalogLinks;
import java.nio.file.*;
import java.util.*;
import org.junit.jupiter.api.Test;
import tools.jackson.databind.json.JsonMapper;
import static org.assertj.core.api.Assertions.*;

class P0ValueContractTest {
    private final SimilarityCalculator calculator=new SimilarityCalculator();
    @Test void missingFeaturesAreNullRatherThanFakeZerosAndAvailableWeightsAreNormalized() {
        var id=UUID.randomUUID();
        var none=calculator.compare(Set.of(),Set.of(),Set.of(),Set.of(),Map.of(),Map.of());
        assertThat(none.score()).isNull(); assertThat(none.breakdown().genre()).isNull();
        var artistsOnly=calculator.compare(Set.of(id),Set.of(id),Set.of(),Set.of(),Map.of(),Map.of());
        assertThat(artistsOnly.score()).isEqualTo(1d); assertThat(artistsOnly.breakdown().track()).isNull();
    }
    @Test void jaccardAndCosineAreSymmetricFiniteAndDoNotTreatAbsentGenreAsDislike() {
        var a=UUID.randomUUID(); var b=UUID.randomUUID();
        var first=calculator.compare(Set.of(a,b),Set.of(a),Set.of(a),Set.of(b),Map.of(a,1d),Map.of(a,.5,b,.5));
        var reverse=calculator.compare(Set.of(a),Set.of(a,b),Set.of(b),Set.of(a),Map.of(a,.5,b,.5),Map.of(a,1d));
        assertThat(first.score()).isEqualTo(reverse.score()).isBetween(0d,1d);
        assertThat(first.breakdown().artist()).isEqualTo(.5d); assertThat(first.breakdown().track()).isZero();
        assertThat(first.breakdown().genre()).isCloseTo(1/Math.sqrt(2),within(1e-12));
    }
    @Test void onlyExplicitlyReviewedHttpsHostsAreReturnedWithoutFetchingAnything() {
        var safe=new SafeCatalogLinks("music.example.test","art.example.test");
        assertThat(safe.external("https://music.example.test/listen?id=1")).isEqualTo("https://music.example.test/listen?id=1");
        for(String url:List.of("http://music.example.test/a","https://music.example.test.evil.test/a","https://u:p@music.example.test/a","https://music.example.test:8443/a","javascript:alert(1)","/relative"))
            assertThat(safe.external(url)).isNull();
        assertThat(safe.artwork("https://music.example.test/a")).isNull();
        assertThat(new SafeCatalogLinks("","").external("https://music.example.test/a")).isNull();
    }
    @Test void openApiSchemaPropertiesMatchEveryPublicJavaRecord() throws Exception {
        var document=JsonMapper.builder().build().readTree(Files.readString(Path.of("../contracts/backend-foundation.openapi.json")));
        var records=Map.of(
            "music",List.of("ArtistSummary","TrackSummary","TagSummary"),
            "taste",List.of("TasteProfileResponse","GenreWeight","TasteResponse","ProfileSettings"),
            "match",List.of("MatchCard","MatchDetailResponse","SimilarityBreakdown"),
            "interest",List.of("InterestResponse","InterestCreateRequest","InterestActionResponse"),
            "invitation",List.of("InvitationCreateResponse","InvitationStatusResponse"),
            "connection",List.of("ConnectionSummary"),
            "user",List.of("NicknamePatch"));
        for(var entry:records.entrySet()) for(var name:entry.getValue()) {
            var type=Class.forName("com.tunit."+entry.getKey()+"."+name);
            var actual=Arrays.stream(type.getRecordComponents()).map(java.lang.reflect.RecordComponent::getName).toList();
            var schema=document.get("components").get("schemas").get(name);
            assertThat(schema).as(name).isNotNull();
            assertThat(actual).as(name).containsExactlyInAnyOrderElementsOf(schema.get("properties").propertyNames());
        }
    }
}
