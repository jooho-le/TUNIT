package com.tunit.foundation;

import com.tunit.auth.TunitPrincipal;
import com.tunit.user.TunitUser;
import com.tunit.invitation.InvitationTokens;
import java.time.*;
import java.util.*;
import java.util.concurrent.*;
import org.junit.jupiter.api.*;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.web.servlet.request.MockHttpServletRequestBuilder;
import tools.jackson.databind.JsonNode;
import static org.assertj.core.api.Assertions.*;
import static org.mockito.Mockito.*;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

/** Real Spring filters/controllers/transactions/PostgreSQL. No HTTP listener or production data. */
class P0WorkflowTest extends FoundationIntegrationTest {
    private static final Instant NOW=Instant.parse("2026-11-27T00:00:00Z");
    @MockitoBean Clock clock;
    @Autowired InvitationTokens tokens;
    TunitUser a,b,c; UUID genre,mood; List<UUID> aArtists,aTracks;
    @BeforeEach void fixtures() {
        jdbc.execute("TRUNCATE users, artists, tracks, taste_tags CASCADE");
        when(clock.instant()).thenReturn(NOW);
        a=person("A"); b=person("B"); c=person("C");
        genre=UUID.randomUUID(); mood=UUID.randomUUID();
        jdbc.update("insert into taste_tags(id,name,type) values (?,'Rock','GENRE'), (?,'Calm','MOOD')",genre,mood);
        ready(a,true); ready(b,true); ready(c,false);
    }
    TunitUser person(String name) { return users.saveAndFlush(new TunitUser(UUID.randomUUID(),UUID.randomUUID()+"@example.test","test-principal-not-a-password-hash",name,NOW)); }
    void ready(TunitUser user,boolean isPublic) {
        var artists=new ArrayList<UUID>(); var tracks=new ArrayList<UUID>();
        for(int i=0;i<5;i++) {
            var id=UUID.randomUUID(); artists.add(id);
            jdbc.update("insert into artists(id,name,source) values (?,?,'TEST')",id,"artist-"+user.getNickname()+"-"+i);
            jdbc.update("insert into artist_genres(artist_id,tag_id) values (?,?)",id,genre);
            jdbc.update("insert into user_artists(user_id,artist_id) values (?,?)",user.getId(),id);
        }
        for(int i=0;i<10;i++) {
            var id=UUID.randomUUID(); tracks.add(id);
            jdbc.update("insert into tracks(id,title,source,external_url) values (?,?,'TEST','https://unreviewed.example.test/song')",id,"track-"+user.getNickname()+"-"+i);
            jdbc.update("insert into track_artists(track_id,artist_id) values (?,?)",id,artists.get(i%5));
            jdbc.update("insert into track_genres(track_id,tag_id) values (?,?)",id,genre);
            jdbc.update("insert into user_tracks(user_id,track_id) values (?,?)",user.getId(),id);
        }
        jdbc.update("insert into user_taste_tags(user_id,tag_id) values (?,?),(?,?)",user.getId(),genre,user.getId(),mood);
        jdbc.update("insert into taste_profiles(user_id,status,is_public,comparison_consent,updated_at) values (?,'COMPLETE',?,true,?)",user.getId(),isPublic,java.time.OffsetDateTime.ofInstant(NOW,java.time.ZoneOffset.UTC));
        if(user.getId().equals(a.getId())) {aArtists=artists; aTracks=tracks;}
    }
    MockHttpServletRequestBuilder as(MockHttpServletRequestBuilder request,TunitUser user) { return request.with(org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.user(new TunitPrincipal(user))).with(csrf()); }
    JsonNode json(MockHttpServletRequestBuilder request,TunitUser user,int expected) throws Exception {
        var result=mvc.perform(as(request,user)).andExpect(status().is(expected)).andReturn();
        return mapper.readTree(result.getResponse().getContentAsString());
    }
    UUID interest(TunitUser from,TunitUser to) throws Exception {
        return UUID.fromString(json(post("/api/v1/interests").contentType("application/json").content("{\"recipientId\":\""+to.getId()+"\"}"),from,201).get("id").asText());
    }
    String invite() throws Exception {
        var result=json(post("/api/v1/invitations"),a,201);
        String url=result.get("invitationUrl").asText();
        assertThat(result.get("expiresAt").asText()).isEqualTo(NOW.plusSeconds(86400).toString());
        return url.substring(url.lastIndexOf('/')+1);
    }
    int count(String table) { return jdbc.queryForObject("select count(*) from "+table,Integer.class); }
    @Test void catalogSearchReturnsOnlyRealGenresParticipantsAndReviewedLinks() throws Exception {
        var artists=json(get("/api/v1/catalog/artists").param("q","artist-A"),a,200);
        assertThat(artists.get("totalElements").asInt()).isEqualTo(5);
        assertThat(artists.get("items").get(0).get("genres").get(0).get("type").asText()).isEqualTo("GENRE");
        var tracks=json(get("/api/v1/catalog/tracks").param("q","artist-A-0"),a,200);
        assertThat(tracks.get("totalElements").asInt()).isEqualTo(2);
        assertThat(tracks.get("items").get(0).get("artists").get(0).get("name").asText()).isEqualTo("artist-A-0");
        assertThat(tracks.get("items").get(0).get("externalUrl").isNull()).isTrue();
        assertThat(json(get("/api/v1/catalog/tracks").param("q","%"),a,200).get("items").isEmpty()).isTrue();
    }
    @Test void multipleGenreRelationsReturnOnlyRealTrackArtistIntersectionWithoutStoringFlags() throws Exception {
        UUID pop=UUID.randomUUID(), jazz=UUID.randomUUID();
        jdbc.update("insert into taste_tags(id,name,type) values (?,'Pop','GENRE'),(?,'Jazz','GENRE')",pop,jazz);
        jdbc.update("insert into artist_genres(artist_id,tag_id) values (?,?)",aArtists.get(0),jazz);
        jdbc.update("insert into track_genres(track_id,tag_id) values (?,?)",aTracks.get(0),pop);
        var item=json(get("/api/v1/catalog/tracks").param("q","track-A-0"),a,200).get("items").get(0);
        assertThat(item.get("genres").size()).isEqualTo(2);
        assertThat(item.get("artists").get(0).get("genres").size()).isEqualTo(2);
        assertThat(item.get("commonArtistGenres").size()).isEqualTo(1);
        assertThat(item.get("commonArtistGenres").get(0).get("id").asText()).isEqualTo(genre.toString());
        assertThat(jdbc.queryForObject("select count(*) from information_schema.columns where table_schema='public' and table_name='track_artists' and column_name='is_same_genre'",Integer.class)).isZero();
    }
    @Test void concurrentGenreRegistrationCannotCreateDuplicateRelations() throws Exception {
        UUID extra=UUID.randomUUID();
        jdbc.update("insert into taste_tags(id,name,type) values (?,'Extra','GENRE')",extra);
        for(String relation:List.of("artist_genres","track_genres")) {
            String column=relation.equals("artist_genres") ? "artist_id" : "track_id";
            UUID owner=relation.equals("artist_genres") ? aArtists.get(0) : aTracks.get(0);
            Callable<Integer> insert=() -> {
                try { jdbc.update("insert into "+relation+"("+column+",tag_id) values (?,?)",owner,extra); return 201; }
                catch(DataIntegrityViolationException duplicate) { return 409; }
            };
            assertThat(race(insert,insert)).containsExactlyInAnyOrder(201,409);
            assertThat(jdbc.queryForObject("select count(*) from "+relation+" where "+column+"=? and tag_id=?",Integer.class,owner,extra)).isEqualTo(1);
        }
    }
    @Test void queryBoundsAndMissingPagesAreValidatedWithoutFakeRows() throws Exception {
        for(var value:List.of("0","51","-1")) json(get("/api/v1/catalog/artists").param("size",value),a,400);
        json(get("/api/v1/catalog/tracks").param("page","-1"),a,400);
        json(get("/api/v1/catalog/artists").param("q","x".repeat(256)),a,400);
        json(get("/api/v1/catalog/tracks").param("page","2147483647"),a,400);
        assertThat(json(get("/api/v1/catalog/tracks").param("page","9999"),a,200).get("items").isEmpty()).isTrue();
    }
    @Test void profileDistributionNormalizesRepeatedGenresAcrossThreeSourcesWithoutWrites() throws Exception {
        int profiles=count("taste_profiles");
        var result=json(get("/api/v1/me/profile"),a,200);
        assertThat(result.get("artistCount").asInt()).isEqualTo(5);
        assertThat(result.get("trackCount").asInt()).isEqualTo(10);
        assertThat(result.get("topGenres").size()).isEqualTo(1);
        assertThat(result.get("topGenres").get(0).get("weight").asDouble()).isEqualTo(1d);
        assertThat(count("taste_profiles")).isEqualTo(profiles);
    }
    @Test void emptyProfileReadsDoNotCreateAnything() throws Exception {
        var empty=person("empty"); int before=count("taste_profiles");
        var result=json(get("/api/v1/me/profile"),empty,200);
        assertThat(result.get("summary").isNull()).isTrue(); assertThat(result.get("topGenres").isEmpty()).isTrue();
        assertThat(result.get("status").asText()).isEqualTo("INCOMPLETE"); assertThat(count("taste_profiles")).isEqualTo(before);
        assertThat(json(get("/api/v1/matches"),empty,409).get("code").asText()).isEqualTo("TASTE_INCOMPLETE");
    }
    @Test void commonGenreFindsRealPeopleWithNoCommonArtistOrTrack() throws Exception {
        var result=json(get("/api/v1/matches"),a,200);
        assertThat(result.get("totalElements").asInt()).isEqualTo(1);
        assertThat(result.get("items").get(0).get("userId").asText()).isEqualTo(b.getId().toString());
        assertThat(result.get("items").get(0).get("similarityScore").asDouble()).isEqualTo(.4d);
        var detail=json(get("/api/v1/matches/"+b.getId()),a,200);
        assertThat(detail.get("commonTracks").isEmpty()).isTrue(); assertThat(detail.get("onlyOtherTracks").size()).isEqualTo(10);
        assertThat(detail.has("passwordHash")).isFalse();
    }
    @Test void noCandidateMeansEmpty200AndPrivateOrDeletedProfilesAreHiddenImmediately() throws Exception {
        jdbc.update("update taste_profiles set is_public=false where user_id=?",b.getId());
        assertThat(json(get("/api/v1/matches"),a,200).get("items").isEmpty()).isTrue();
        json(get("/api/v1/matches/"+b.getId()),a,404);
        jdbc.update("update taste_profiles set is_public=true where user_id=?",b.getId());
        jdbc.update("update users set deleted_at=now() where id=?",b.getId());
        json(get("/api/v1/matches/"+b.getId()),a,404);
        assertThat(json(get("/api/v1/matches"),a,200).get("totalElements").asInt()).isZero();
    }
    @Test void missingGenreStaysNullAndDiscoveryDoesNotReturnOwnSelectedTracks() throws Exception {
        jdbc.execute("delete from artist_genres; delete from track_genres");
        jdbc.update("delete from user_taste_tags where tag_id=?",genre);
        var result=json(get("/api/v1/matches"),a,200).get("items").get(0);
        assertThat(result.get("breakdown").get("genre").isNull()).isTrue();
        assertThat(result.get("similarityScore").asDouble()).isZero();
        var discovery=json(get("/api/v1/discover/tracks").param("size","50"),a,200);
        for(var row:discovery.get("items")) assertThat(aTracks).doesNotContain(UUID.fromString(row.get("id").asText()));
    }
    @Test void interestCreationRejectsSpoofingSelfPrivateMissingAndCsrf() throws Exception {
        json(post("/api/v1/interests").contentType("application/json").content("{\"recipientId\":\""+a.getId()+"\"}"),a,400);
        json(post("/api/v1/interests").contentType("application/json").content("{\"recipientId\":\""+c.getId()+"\"}"),a,404);
        json(post("/api/v1/interests").contentType("application/json").content("{\"recipientId\":\""+UUID.randomUUID()+"\"}"),a,404);
        json(post("/api/v1/interests").contentType("application/json").content("{\"recipientId\":\""+b.getId()+"\",\"senderId\":\""+c.getId()+"\"}"),a,400);
        mvc.perform(post("/api/v1/interests").with(org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.user(new TunitPrincipal(a))).contentType("application/json").content("{}"))
            .andExpect(status().isForbidden()).andExpect(jsonPath("$.code").value("CSRF_INVALID"));
        assertThat(count("interest_requests")).isZero();
    }
    @Test void sentInboxAndPendingUniquenessIncludeReverseDirection() throws Exception {
        var id=interest(a,b);
        json(post("/api/v1/interests").contentType("application/json").content("{\"recipientId\":\""+a.getId()+"\"}"),b,409);
        assertThat(json(get("/api/v1/interests/sent"),a,200).get("items").get(0).get("id").asText()).isEqualTo(id.toString());
        assertThat(json(get("/api/v1/interests/inbox"),b,200).get("totalElements").asInt()).isEqualTo(1);
        assertThat(json(get("/api/v1/interests/inbox"),c,200).get("items").isEmpty()).isTrue();
        assertThatThrownBy(() -> jdbc.update("insert into interest_requests(id,sender_id,recipient_id) values (?,?,?)",UUID.randomUUID(),b.getId(),a.getId()))
            .isInstanceOf(DataIntegrityViolationException.class);
    }
    @Test void actionOwnershipIsCheckedBeforeStateAndAcceptCreatesOneConnection() throws Exception {
        var id=interest(a,b);
        json(post("/api/v1/interests/"+id+"/accept"),a,403);
        json(post("/api/v1/interests/"+id+"/reject"),c,403);
        json(post("/api/v1/interests/"+id+"/cancel"),b,403);
        var accepted=json(post("/api/v1/interests/"+id+"/accept"),b,200);
        assertThat(accepted.get("status").asText()).isEqualTo("ACCEPTED"); assertThat(accepted.get("connectionId").isTextual()).isTrue();
        assertThat(count("connections")).isEqualTo(1);
        for(String action:List.of("accept","reject")) json(post("/api/v1/interests/"+id+"/"+action),b,409);
        json(post("/api/v1/interests/"+id+"/cancel"),a,409);
    }
    @Test void rejectionAndCancellationPreserveHistoryAndAllowFreshRequests() throws Exception {
        var first=interest(a,b); json(post("/api/v1/interests/"+first+"/reject"),b,200);
        var second=interest(b,a); json(post("/api/v1/interests/"+second+"/cancel"),b,200);
        var third=interest(a,b);
        assertThat(first).isNotEqualTo(second).isNotEqualTo(third); assertThat(count("interest_requests")).isEqualTo(3); assertThat(count("connections")).isZero();
    }
    @Test void connectionFailureRollsBackAlreadyFlushedAcceptedState() throws Exception {
        var id=interest(a,b);
        jdbc.execute("CREATE FUNCTION tunit_test_fail_connection() RETURNS trigger LANGUAGE plpgsql AS $$ BEGIN RAISE EXCEPTION 'injected test failure' USING ERRCODE='23514'; END; $$");
        jdbc.execute("CREATE TRIGGER tunit_test_fail_connection BEFORE INSERT ON connections FOR EACH ROW EXECUTE FUNCTION tunit_test_fail_connection()");
        try {
            json(post("/api/v1/interests/"+id+"/accept"),b,500);
            assertThat(jdbc.queryForObject("select status from interest_requests where id=?",String.class,id)).isEqualTo("PENDING");
            assertThat(jdbc.queryForObject("select version from interest_requests where id=?",Long.class,id)).isZero();
            assertThat(count("connections")).isZero();
        } finally { jdbc.execute("DROP TRIGGER tunit_test_fail_connection ON connections"); jdbc.execute("DROP FUNCTION tunit_test_fail_connection()"); }
    }
    List<Integer> race(Callable<Integer> first,Callable<Integer> second) throws Exception {
        var start=new CyclicBarrier(2); var pool=Executors.newFixedThreadPool(2);
        try {
            var one=pool.submit(() -> {start.await(5,TimeUnit.SECONDS); return first.call();});
            var two=pool.submit(() -> {start.await(5,TimeUnit.SECONDS); return second.call();});
            return List.of(one.get(15,TimeUnit.SECONDS),two.get(15,TimeUnit.SECONDS));
        } finally {pool.shutdownNow();}
    }
    int result(MockHttpServletRequestBuilder r,TunitUser u) throws Exception {return mvc.perform(as(r,u)).andReturn().getResponse().getStatus();}
    @Test void simultaneousReverseCreationProduces201And409WithOneRow() throws Exception {
        var statuses=race(() -> result(post("/api/v1/interests").contentType("application/json").content("{\"recipientId\":\""+b.getId()+"\"}"),a),
            () -> result(post("/api/v1/interests").contentType("application/json").content("{\"recipientId\":\""+a.getId()+"\"}"),b));
        assertThat(statuses).containsExactlyInAnyOrder(201,409); assertThat(count("interest_requests")).isEqualTo(1);
    }
    @Test void simultaneousAcceptCancelHasOneWinnerAndConsistentConnection() throws Exception {
        var id=interest(a,b);
        assertThat(race(() -> result(post("/api/v1/interests/"+id+"/accept"),b), () -> result(post("/api/v1/interests/"+id+"/cancel"),a)))
            .containsExactlyInAnyOrder(200,409);
        var status=jdbc.queryForObject("select status from interest_requests where id=?",String.class,id);
        assertThat(count("connections")).isEqualTo("ACCEPTED".equals(status)?1:0);
    }
    UUID connected() throws Exception {return UUID.fromString(json(post("/api/v1/interests/"+interest(a,b)+"/accept"),b,200).get("connectionId").asText());}
    @Test void disconnectOnlyRemovesCurrentConnectionFromBothSidesAndAllowsReconnection() throws Exception {
        var connection=connected();
        mvc.perform(as(delete("/api/v1/connections/"+connection),c)).andExpect(status().isForbidden());
        mvc.perform(as(delete("/api/v1/connections/"+connection),a)).andExpect(status().isNoContent()).andExpect(content().string(""));
        for(var user:List.of(a,b,c)) assertThat(json(get("/api/v1/connections"),user,200).get("items").isEmpty()).isTrue();
        assertThat(jdbc.queryForObject("select status from interest_requests",String.class)).isEqualTo("ACCEPTED");
        assertThat(count("users")).isEqualTo(3); assertThat(count("user_tracks")).isEqualTo(30);
        json(delete("/api/v1/connections/"+connection),b,404);
        interest(b,a); assertThat(count("interest_requests")).isEqualTo(2);
    }
    @Test void concurrentDisconnectReturnsOne204AndOne404WithoutTouchingHistory() throws Exception {
        var id=connected();
        assertThat(race(() -> result(delete("/api/v1/connections/"+id),a), () -> result(delete("/api/v1/connections/"+id),b)))
            .containsExactlyInAnyOrder(204,404);
        assertThat(count("connections")).isZero(); assertThat(jdbc.queryForObject("select status from interest_requests",String.class)).isEqualTo("ACCEPTED");
    }
    @Test void reconnectRacingWithUnlinkPreservesAcceptedHistoryAndOnlyOneNewPendingRequest() throws Exception {
        var old=interest(a,b);
        var accepted=json(post("/api/v1/interests/"+old+"/accept"),b,200);
        var id=accepted.get("connectionId").asText();
        var results=race(() -> result(delete("/api/v1/connections/"+id),a),
            () -> result(post("/api/v1/interests").contentType("application/json").content("{\"recipientId\":\""+a.getId()+"\"}"),b));
        assertThat(results.get(0)).isEqualTo(204); assertThat(results.get(1)).isIn(201,409);
        assertThat(count("connections")).isZero();
        assertThat(jdbc.queryForObject("select status from interest_requests where id=?",String.class,old)).isEqualTo("ACCEPTED");
        if(results.get(1)==409) interest(b,a);
        assertThat(jdbc.queryForObject("select count(*) from interest_requests where status='PENDING'",Integer.class)).isEqualTo(1);
        assertThat(count("interest_requests")).isEqualTo(2);
    }
    @Test void invitationStoresHashOnlyAndAnonymousGetHasNoPersonalInformationOrSideEffect() throws Exception {
        var raw=invite();
        assertThat(jdbc.queryForObject("select token_hash from invitations",String.class)).isEqualTo(tokens.hash(raw)).doesNotContain(raw);
        var result=mvc.perform(get("/api/v1/invitations/"+raw)).andExpect(status().isOk()).andExpect(jsonPath("$.requiresLogin").value(true))
            .andExpect(jsonPath("$.readyToCompare").value(false)).andReturn().getResponse().getContentAsString();
        assertThat(result).doesNotContain(a.getId().toString(),a.getEmail(),"nickname","tokenHash",raw);
        assertThat(jdbc.queryForObject("select accepted_by from invitations",UUID.class)).isNull();
        mvc.perform(get("/api/v1/invitations/"+raw+"/compare")).andExpect(status().isUnauthorized());
    }
    @Test void invitationRequiresBothConsentsRejectsReuseAndThirdPartyComparison() throws Exception {
        var raw=invite();
        json(post("/api/v1/invitations/"+raw+"/complete"),a,400);
        jdbc.update("update taste_profiles set comparison_consent=false where user_id=?",b.getId());
        json(post("/api/v1/invitations/"+raw+"/complete"),b,403);
        jdbc.update("update taste_profiles set comparison_consent=true where user_id=?",b.getId());
        json(post("/api/v1/invitations/"+raw+"/complete"),b,200);
        json(post("/api/v1/invitations/"+raw+"/complete"),b,409);
        json(get("/api/v1/invitations/"+raw+"/compare"),c,403);
        assertThat(json(get("/api/v1/invitations/"+raw+"/compare"),a,200).get("userId").asText()).isEqualTo(b.getId().toString());
        jdbc.update("update taste_profiles set is_public=false where user_id=?",b.getId());
        json(get("/api/v1/invitations/"+raw+"/compare"),a,403);
        assertThat(json(get("/api/v1/invitations/"+raw),a,200).get("readyToCompare").asBoolean()).isFalse();
    }
    @Test void expiryAtBoundaryBlocksPreviouslyCompletedComparisonWithoutChangingGetState() throws Exception {
        var raw=invite(); json(post("/api/v1/invitations/"+raw+"/complete"),b,200);
        when(clock.instant()).thenReturn(NOW.plusSeconds(86400));
        var state=json(get("/api/v1/invitations/"+raw),a,200);
        assertThat(state.get("valid").asBoolean()).isFalse(); assertThat(state.get("status").asText()).isEqualTo("EXPIRED");
        var error=json(get("/api/v1/invitations/"+raw+"/compare"),a,404);
        assertThat(error.get("path").asText()).contains("{token}").doesNotContain(raw);
        assertThat(jdbc.queryForObject("select status from invitations",String.class)).isEqualTo("COMPLETED");
    }
    @Test void simultaneousInvitationCompletionBindsOnlyOneRecipient() throws Exception {
        jdbc.update("update taste_profiles set is_public=true where user_id=?",c.getId()); var raw=invite();
        assertThat(race(() -> result(post("/api/v1/invitations/"+raw+"/complete"),b), () -> result(post("/api/v1/invitations/"+raw+"/complete"),c)))
            .containsExactlyInAnyOrder(200,409);
        assertThat(count("invitations")).isEqualTo(1); assertThat(jdbc.queryForObject("select accepted_by from invitations",UUID.class)).isIn(b.getId(),c.getId());
    }
    @Test void nicknameUpdateTouchesOnlySessionOwnerAndKeepsUnicodePolicy() throws Exception {
        json(patch("/api/v1/me/profile").contentType("application/json").content(mapper.writeValueAsString(Map.of("nickname"," 😀".strip().repeat(50)+" "))),a,200);
        assertThat(users.findById(a.getId()).orElseThrow().getNickname()).isEqualTo("😀".repeat(50));
        assertThat(users.findById(b.getId()).orElseThrow().getNickname()).isEqualTo("B");
        json(patch("/api/v1/me/profile").contentType("application/json").content(mapper.writeValueAsString(Map.of("nickname","x".repeat(51)))),a,400);
    }
}
