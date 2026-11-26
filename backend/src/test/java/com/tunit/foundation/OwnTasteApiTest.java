package com.tunit.foundation;

import com.tunit.taste.*;
import com.tunit.user.TunitUserRepository;
import java.util.*;
import java.util.concurrent.*;
import org.junit.jupiter.api.Test;
import org.springframework.mock.web.MockHttpSession;
import org.springframework.test.context.bean.override.mockito.MockitoSpyBean;
import org.springframework.test.web.servlet.ResultActions;
import org.springframework.test.web.servlet.request.MockHttpServletRequestBuilder;
import tools.jackson.databind.JsonNode;
import static org.assertj.core.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

class OwnTasteApiTest extends FoundationIntegrationTest {
    @MockitoSpyBean TunitUserRepository registrationUsers;
    @MockitoSpyBean UserTrackRepository userTracks;
    @MockitoSpyBean UserTasteTagRepository userTags;
    record Browser(UUID user, MockHttpSession session, String header, String token) {}
    record Catalog(List<UUID> artists, List<UUID> tracks, List<UUID> tags) {
        Map<String, Object> full() { return Map.of("artistIds", artists, "trackIds", tracks, "tagIds", tags); }
        Map<String, Object> partial() { return Map.of("artistIds", List.of(artists.getFirst()), "trackIds", List.of(tracks.getFirst()), "tagIds", List.of(tags.getFirst())); }
    }
    Browser csrf(MockHttpSession session, UUID user) throws Exception {
        var request = get("/api/v1/auth/csrf");
        if (session != null) request.session(session);
        var result = mvc.perform(request).andExpect(status().isOk()).andReturn();
        var body = mapper.readTree(result.getResponse().getContentAsString());
        return new Browser(user, (MockHttpSession) result.getRequest().getSession(false), body.get("headerName").asText(), body.get("token").asText());
    }
    Browser login() throws Exception {
        String password = UUID.randomUUID().toString(); var user = user(password); var browser = csrf(null, user.getId());
        send(post("/api/v1/auth/login"), browser, Map.of("email", user.getEmail(), "password", password)).andExpect(status().isOk());
        return csrf(browser.session(), user.getId());
    }
    ResultActions send(MockHttpServletRequestBuilder request, Browser browser, Object body) throws Exception {
        return mvc.perform(request.session(browser.session()).header(browser.header(), browser.token())
            .contentType("application/json").content(mapper.writeValueAsString(body)));
    }
    JsonNode taste(Browser browser) throws Exception {
        return mapper.readTree(mvc.perform(get("/api/v1/me/taste").session(browser.session())).andExpect(status().isOk()).andReturn().getResponse().getContentAsString());
    }
    Catalog catalog() {
        var artists = new ArrayList<UUID>(); var tracks = new ArrayList<UUID>();
        for (int i = 0; i < 5; i++) { var id = UUID.randomUUID(); artists.add(id); jdbc.update("insert into artists(id,name,source) values (?,'fixture artist','TEST')", id); }
        for (int i = 0; i < 10; i++) { var id = UUID.randomUUID(); tracks.add(id); jdbc.update("insert into tracks(id,title,source) values (?,'fixture track','TEST')", id); }
        return new Catalog(artists, tracks, List.of(tag(TagType.GENRE, true), tag(TagType.MOOD, true)));
    }
    UUID tag(TagType type, boolean active) {
        var id = UUID.randomUUID(); jdbc.update("insert into taste_tags(id,name,type,is_active) values (?,?,?,?)", id, "fixture-" + id, type.name(), active); return id;
    }
    @Test void signupNormalizesStoresOnlyHashAndRequiresSeparateLogin() throws Exception {
        var browser = csrf(null, null); String email = UUID.randomUUID() + "@example.test", password = UUID.randomUUID().toString();
        var result = send(post("/api/v1/auth/signup"), browser, Map.of("email", " " + email.toUpperCase(Locale.ROOT) + " ", "password", password, "nickname", " 튠잇 사용자 "))
            .andExpect(status().isCreated()).andExpect(jsonPath("$.email").value(email)).andExpect(jsonPath("$.nickname").value("튠잇 사용자"))
            .andExpect(jsonPath("$.createdAt").isString()).andExpect(jsonPath("$.password").doesNotExist()).andExpect(jsonPath("$.passwordHash").doesNotExist()).andReturn();
        UUID id = UUID.fromString(mapper.readTree(result.getResponse().getContentAsString()).get("id").asText());
        var saved = users.findById(id).orElseThrow();
        assertThat(saved.getPasswordHash()).isNotEqualTo(password); assertThat(encoder.matches(password, saved.getPasswordHash())).isTrue();
        assertThat(browser.session().getAttribute("SPRING_SECURITY_CONTEXT")).isNull();
        mvc.perform(get("/api/v1/auth/me").session(browser.session())).andExpect(status().isUnauthorized());
        send(post("/api/v1/auth/login"), browser, Map.of("email", email, "password", password)).andExpect(status().isOk()).andExpect(jsonPath("$.id").value(id.toString()));
    }
    @Test void signupEnforcesUnicodeCharacterMinimumAndUtf8ByteMaximum() throws Exception {
        var browser = csrf(null, null);
        for (String password : List.of("1234567", "a".repeat(73), "한".repeat(25), "😀".repeat(4))) {
            send(post("/api/v1/auth/signup"), browser, Map.of("email", UUID.randomUUID() + "@example.test", "password", password, "nickname", "fixture"))
                .andExpect(status().isBadRequest()).andExpect(jsonPath("$.code").value("INVALID_INPUT"));
        }
        for (String password : List.of("a".repeat(72), "한".repeat(24), "😀".repeat(8))) {
            var created = send(post("/api/v1/auth/signup"), browser, Map.of("email", UUID.randomUUID() + "@example.test", "password", password, "nickname", "fixture"))
                .andExpect(status().isCreated()).andReturn();
            UUID id = UUID.fromString(mapper.readTree(created.getResponse().getContentAsString()).get("id").asText());
            assertThat(encoder.matches(password, users.findById(id).orElseThrow().getPasswordHash())).isTrue();
        }
        for (String nickname : List.of("   ", "가".repeat(51), "😀".repeat(51)))
            send(post("/api/v1/auth/signup"), browser, Map.of("email", UUID.randomUUID() + "@example.test", "password", "valid-test-only", "nickname", nickname)).andExpect(status().isBadRequest());
        send(post("/api/v1/auth/signup"), browser, Map.of("email", UUID.randomUUID() + "@example.test", "password", "valid-test-only", "nickname", "😀".repeat(50))).andExpect(status().isCreated());
        mvc.perform(post("/api/v1/auth/signup").contentType("application/json").content("{}"))
            .andExpect(status().isForbidden()).andExpect(jsonPath("$.code").value("CSRF_INVALID"));
    }
    @Test void duplicateEmailIncludingDeletedAccountsIsAConflict() throws Exception {
        var user = user(UUID.randomUUID().toString()); var browser = csrf(null, null);
        for (boolean deleted : List.of(false, true)) {
            if (deleted) jdbc.update("update users set deleted_at=now() where id=?", user.getId());
            send(post("/api/v1/auth/signup"), browser, Map.of("email", " " + user.getEmail().toUpperCase(Locale.ROOT) + " ", "password", "valid-test-only", "nickname", "duplicate"))
                .andExpect(status().isConflict()).andExpect(jsonPath("$.code").value("EMAIL_ALREADY_EXISTS"));
        }
    }
    @Test void simultaneousSignupFallsBackToRealPostgresUniqueConstraint() throws Exception {
        String email = UUID.randomUUID() + "@example.test"; var bothChecked = new CountDownLatch(2);
        doAnswer(call -> { bothChecked.countDown(); if (!bothChecked.await(10, TimeUnit.SECONDS)) throw new IllegalStateException("fixture timeout"); return false; })
            .when(registrationUsers).existsByEmailIgnoreCase(email);
        var executor = Executors.newFixedThreadPool(2);
        try {
            Callable<Integer> signup = () -> send(post("/api/v1/auth/signup"), csrf(null, null), Map.of("email", email, "password", "valid-test-only", "nickname", "race"))
                .andReturn().getResponse().getStatus();
            var first = executor.submit(signup); var second = executor.submit(signup);
            assertThat(List.of(first.get(20, TimeUnit.SECONDS), second.get(20, TimeUnit.SECONDS))).containsExactlyInAnyOrder(201, 409);
            assertThat(jdbc.queryForObject("select count(*) from users where email=?", Integer.class, email)).isEqualTo(1);
        } finally { executor.shutdownNow(); }
    }
    @Test void emptyReadsDoNotCreateProfilesOrFabricateSelections() throws Exception {
        var browser = login();
        assertThat(taste(browser).get("artistIds").isEmpty()).isTrue();
        assertThat(taste(browser).get("tasteStatus").asText()).isEqualTo("INCOMPLETE");
        mvc.perform(get("/api/v1/me/profile/settings").session(browser.session())).andExpect(status().isOk())
            .andExpect(jsonPath("$.isPublic").value(false)).andExpect(jsonPath("$.comparisonConsent").value(false));
        assertThat(jdbc.queryForObject("select count(*) from taste_profiles where user_id=?", Integer.class, browser.user())).isZero();
    }
    @Test void fullReplacementPersistsAndRecalculatesCompletionThenAllowsEmptySelection() throws Exception {
        var browser = login(); var catalog = catalog();
        var saved = send(put("/api/v1/me/taste"), browser, catalog.full()).andExpect(status().isOk())
            .andExpect(jsonPath("$.tasteStatus").value("COMPLETE")).andExpect(jsonPath("$.artistIds.length()").value(5)).andExpect(jsonPath("$.trackIds.length()").value(10)).andReturn();
        assertThat(taste(browser)).isEqualTo(mapper.readTree(saved.getResponse().getContentAsString()));
        mvc.perform(get("/api/v1/auth/me").session(browser.session())).andExpect(jsonPath("$.tasteStatus").value("COMPLETE"));
        send(put("/api/v1/me/taste"), browser, catalog.partial()).andExpect(status().isOk()).andExpect(jsonPath("$.tasteStatus").value("INCOMPLETE"));
        assertThat(taste(browser).get("trackIds").size()).isEqualTo(1);
        send(put("/api/v1/me/taste"), browser, Map.of("artistIds", List.of(), "trackIds", List.of(), "tagIds", List.of()))
            .andExpect(status().isOk()).andExpect(jsonPath("$.artistIds").isEmpty()).andExpect(jsonPath("$.tasteStatus").value("INCOMPLETE"));
    }
    @Test void invalidReplacementNeverChangesStoredTaste() throws Exception {
        var browser = login(); var catalog = catalog(); send(put("/api/v1/me/taste"), browser, catalog.partial()).andExpect(status().isOk());
        var before = taste(browser);
        var bodies = List.of("{}", "{\"artistIds\":null,\"trackIds\":[],\"tagIds\":[]}", "{\"artistIds\":[null],\"trackIds\":[],\"tagIds\":[]}", "{\"artistIds\":[\"bad-uuid\"],\"trackIds\":[],\"tagIds\":[]}");
        for (String body : bodies) mvc.perform(put("/api/v1/me/taste").session(browser.session()).header(browser.header(), browser.token()).contentType("application/json").content(body)).andExpect(status().isBadRequest());
        send(put("/api/v1/me/taste"), browser, Map.of("artistIds", List.of(catalog.artists().getFirst(), catalog.artists().getFirst()), "trackIds", List.of(), "tagIds", List.of()))
            .andExpect(status().isBadRequest()).andExpect(jsonPath("$.code").value("INVALID_TASTE_INPUT"));
        send(put("/api/v1/me/taste"), browser, Map.of("artistIds", List.of(UUID.randomUUID()), "trackIds", List.of(), "tagIds", List.of()))
            .andExpect(status().isNotFound()).andExpect(jsonPath("$.code").value("CATALOG_ITEM_NOT_FOUND"));
        send(put("/api/v1/me/taste"), browser, Map.of("artistIds", List.of(), "trackIds", List.of(), "tagIds", List.of(tag(TagType.MOOD, false))))
            .andExpect(status().isNotFound());
        var excessive = new ArrayList<>(catalog.artists()); excessive.add(UUID.randomUUID());
        send(put("/api/v1/me/taste"), browser, Map.of("artistIds", excessive, "trackIds", List.of(), "tagIds", List.of())).andExpect(status().isBadRequest());
        var genres = List.of(tag(TagType.GENRE, true), tag(TagType.GENRE, true), tag(TagType.GENRE, true), tag(TagType.GENRE, true));
        send(put("/api/v1/me/taste"), browser, Map.of("artistIds", List.of(), "trackIds", List.of(), "tagIds", genres)).andExpect(status().isBadRequest());
        assertThat(taste(browser)).isEqualTo(before);
    }
    @Test void retainedWeightsSurviveReplacementAndNewRowsUseSchemaDefault() throws Exception {
        var browser = login(); var catalog = catalog(); send(put("/api/v1/me/taste"), browser, catalog.partial()).andExpect(status().isOk());
        jdbc.update("update user_artists set weight=4 where user_id=?", browser.user());
        send(put("/api/v1/me/taste"), browser, catalog.full()).andExpect(status().isOk());
        assertThat(jdbc.queryForObject("select weight from user_artists where user_id=? and artist_id=?", Integer.class, browser.user(), catalog.artists().getFirst())).isEqualTo(4);
        assertThat(jdbc.queryForObject("select weight from user_artists where user_id=? and artist_id=?", Integer.class, browser.user(), catalog.artists().get(1))).isEqualTo(1);
    }
    @Test void settingsPatchIsPartialAndRejectsNullCoercionAndUnrelatedFields() throws Exception {
        var browser = login();
        send(patch("/api/v1/me/profile/settings"), browser, Map.of("isPublic", true)).andExpect(status().isOk()).andExpect(jsonPath("$.comparisonConsent").value(false));
        send(patch("/api/v1/me/profile/settings"), browser, Map.of("comparisonConsent", true)).andExpect(status().isOk()).andExpect(jsonPath("$.isPublic").value(true));
        for (String body : List.of("{}", "null", "[]", "{\"isPublic\":null}", "{\"isPublic\":1}", "{\"isPublic\":\"true\"}", "{\"isPublic\":false,\"userId\":\"other\"}")) {
            mvc.perform(patch("/api/v1/me/profile/settings").session(browser.session()).header(browser.header(), browser.token()).contentType("application/json").content(body)).andExpect(status().isBadRequest());
        }
        mvc.perform(get("/api/v1/me/profile/settings").session(browser.session())).andExpect(jsonPath("$.isPublic").value(true)).andExpect(jsonPath("$.comparisonConsent").value(true));
        send(patch("/api/v1/me/profile/settings"), browser, Map.of("isPublic", false)).andExpect(status().isOk()).andExpect(jsonPath("$.comparisonConsent").value(true));
    }
    @Test void clearOnlyAffectsAuthenticatedOwnerAndPreservesCatalogAndSettings() throws Exception {
        var a = login(); var b = login(); var catalog = catalog();
        send(put("/api/v1/me/taste"), a, catalog.full()).andExpect(status().isOk()); send(put("/api/v1/me/taste"), b, catalog.partial()).andExpect(status().isOk());
        var otherBefore = taste(b);
        send(patch("/api/v1/me/profile/settings"), a, Map.of("isPublic", true, "comparisonConsent", true)).andExpect(status().isOk());
        jdbc.update("update taste_profiles set summary='old fixture summary' where user_id=?", a.user());
        send(delete("/api/v1/me/taste").queryParam("userId", b.user().toString()), a, Map.of()).andExpect(status().isNoContent()).andExpect(content().string(""));
        assertThat(taste(a).get("artistIds").isEmpty()).isTrue(); assertThat(taste(b)).isEqualTo(otherBefore);
        assertThat(jdbc.queryForObject("select summary from taste_profiles where user_id=?", String.class, a.user())).isNull();
        mvc.perform(get("/api/v1/me/profile/settings").session(a.session())).andExpect(jsonPath("$.isPublic").value(true)).andExpect(jsonPath("$.comparisonConsent").value(true));
        assertThat(jdbc.queryForObject("select count(*) from artists where id=?", Integer.class, catalog.artists().getFirst())).isEqualTo(1);
        send(delete("/api/v1/me/taste"), a, Map.of()).andExpect(status().isNoContent());
    }
    @Test void csrfAndDeletedAccountChecksApplyToEveryNewProtectedMutation() throws Exception {
        var browser = login(); var catalog = catalog(); send(put("/api/v1/me/taste"), browser, catalog.partial()).andExpect(status().isOk()); var before = taste(browser);
        for (var request : List.of(put("/api/v1/me/taste"), patch("/api/v1/me/profile/settings"), delete("/api/v1/me/taste")))
            mvc.perform(request.session(browser.session()).contentType("application/json").content("{}"))
                .andExpect(status().isForbidden()).andExpect(jsonPath("$.code").value("CSRF_INVALID"));
        assertThat(taste(browser)).isEqualTo(before);
        jdbc.update("update users set deleted_at=now() where id=?", browser.user());
        for (String path : List.of("/api/v1/me/taste", "/api/v1/me/profile/settings", "/api/v1/catalog/tags?type=GENRE"))
            mvc.perform(get(path).session(browser.session())).andExpect(status().isUnauthorized());
        send(put("/api/v1/me/taste"), browser, catalog.partial()).andExpect(status().isUnauthorized());
        send(patch("/api/v1/me/profile/settings"), browser, Map.of("isPublic", true)).andExpect(status().isUnauthorized());
        send(delete("/api/v1/me/taste"), browser, Map.of()).andExpect(status().isUnauthorized());
    }
    @Test void databaseFailureDuringReplacementRollsBackAllRelations() throws Exception {
        var browser = login(); var catalog = catalog(); send(put("/api/v1/me/taste"), browser, catalog.partial()).andExpect(status().isOk()); var before = taste(browser);
        doAnswer(call -> { jdbc.update("insert into user_tracks(user_id,track_id) values (?,?)", browser.user(), UUID.randomUUID()); return null; }).when(userTracks).saveAll(anyIterable());
        send(put("/api/v1/me/taste"), browser, Map.of("artistIds", List.of(catalog.artists().get(1)), "trackIds", List.of(catalog.tracks().get(1)), "tagIds", List.of(catalog.tags().get(1))))
            .andExpect(status().isInternalServerError()).andExpect(jsonPath("$.code").value("INTERNAL_ERROR"));
        assertThat(taste(browser)).isEqualTo(before);
    }
    @Test void failureAfterTwoBulkDeletesRestoresAllSelections() throws Exception {
        var browser = login(); var catalog = catalog(); send(put("/api/v1/me/taste"), browser, catalog.partial()).andExpect(status().isOk()); var before = taste(browser);
        doThrow(new org.springframework.dao.DataAccessResourceFailureException("fixture unavailable")).when(userTags).deleteAllForUser(browser.user());
        send(delete("/api/v1/me/taste"), browser, Map.of()).andExpect(status().isServiceUnavailable());
        assertThat(taste(browser)).isEqualTo(before);
    }
    @Test void concurrentReplacementsLeaveOneWholeSelectionSet() throws Exception {
        var browser = login(); var a = catalog(); var b = catalog(); var ready = new CountDownLatch(2);
        var executor = Executors.newFixedThreadPool(2);
        try {
            var futures = new ArrayList<Future<?>>();
            for (var catalog : List.of(a, b)) futures.add(executor.submit(() -> {
                ready.countDown(); if (!ready.await(10, TimeUnit.SECONDS)) throw new IllegalStateException("fixture timeout");
                send(put("/api/v1/me/taste"), browser, catalog.full()).andExpect(status().isOk()); return null;
            }));
            for (var future : futures) future.get(20, TimeUnit.SECONDS);
            var saved = taste(browser); var ids = new HashSet<String>(); saved.get("artistIds").forEach(id -> ids.add(id.asText()));
            boolean first = ids.contains(a.artists().getFirst().toString()); var expected = first ? a : b;
            assertThat(ids).containsExactlyInAnyOrderElementsOf(expected.artists().stream().map(UUID::toString).toList());
            var trackIds = new HashSet<String>(); saved.get("trackIds").forEach(id -> trackIds.add(id.asText()));
            assertThat(trackIds).containsExactlyInAnyOrderElementsOf(expected.tracks().stream().map(UUID::toString).toList());
            var tagIds = new HashSet<String>(); saved.get("tagIds").forEach(id -> tagIds.add(id.asText()));
            assertThat(tagIds).containsExactlyInAnyOrderElementsOf(expected.tags().stream().map(UUID::toString).toList());
            assertThat(saved.get("tasteStatus").asText()).isEqualTo("COMPLETE");
        } finally { executor.shutdownNow(); }
    }
    @Test void tagCatalogReturnsOnlyActiveRequestedTypeAndUsesDirectArray() throws Exception {
        var browser = login(); UUID active = tag(TagType.GENRE, true), inactive = tag(TagType.GENRE, false), mood = tag(TagType.MOOD, true);
        var result = mvc.perform(get("/api/v1/catalog/tags").param("type", "GENRE").session(browser.session())).andExpect(status().isOk()).andReturn();
        var body = mapper.readTree(result.getResponse().getContentAsString()); assertThat(body.isArray()).isTrue();
        var ids = new HashSet<String>(); body.forEach(item -> { ids.add(item.get("id").asText()); assertThat(item.get("type").asText()).isEqualTo("GENRE"); });
        assertThat(ids).contains(active.toString()).doesNotContain(inactive.toString(), mood.toString());
        for (String type : List.of("UNKNOWN", "genre")) mvc.perform(get("/api/v1/catalog/tags").param("type", type).session(browser.session())).andExpect(status().isBadRequest());
        mvc.perform(get("/api/v1/catalog/tags").session(browser.session())).andExpect(status().isBadRequest());
        mvc.perform(get("/api/v1/catalog/tags").param("type", "GENRE")).andExpect(status().isUnauthorized());
    }
}
