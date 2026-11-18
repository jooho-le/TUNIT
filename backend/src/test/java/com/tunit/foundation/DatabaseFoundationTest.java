package com.tunit.foundation;

import com.tunit.common.persistence.UuidOrder;
import com.tunit.user.*;
import com.tunit.music.*;
import com.tunit.taste.*;
import com.tunit.invitation.*;
import com.tunit.interest.*;
import com.tunit.connection.*;
import jakarta.persistence.*;
import java.time.Instant;
import java.util.*;
import org.flywaydb.core.Flyway;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.context.ApplicationContext;
import org.springframework.data.repository.CrudRepository;
import org.springframework.data.repository.support.Repositories;
import org.springframework.transaction.PlatformTransactionManager;
import org.springframework.transaction.support.TransactionTemplate;
import org.springframework.dao.DataIntegrityViolationException;
import static org.assertj.core.api.Assertions.*;

class DatabaseFoundationTest extends FoundationIntegrationTest {
    @Autowired Flyway flyway;
    @Autowired PlatformTransactionManager transactions;
    @Autowired ApplicationContext application;
    @Autowired EntityManagerFactory factory;
    @PersistenceContext EntityManager entityManager;

    @Test void flywayCreatesFourteenTablesAndReapplicationIsANoop() {
        assertThat(jdbc.queryForObject("select count(*) from information_schema.tables where table_schema='public' and table_name <> 'flyway_schema_history'", Integer.class)).isEqualTo(14);
        assertThat(flyway.info().current().getVersion().getVersion()).isEqualTo("1");
        flyway.validate();
        assertThat(flyway.migrate().migrationsExecuted).isZero();
        assertThat(jdbc.queryForObject("select count(*) from flyway_schema_history where version='1' and success", Integer.class)).isEqualTo(1);
        assertThat(factory.getMetamodel().getEntities()).hasSize(14);
    }

    @SuppressWarnings("unchecked")
    @Test void allFourteenRepositoriesRoundTripTheRealPostgresSchema() {
        new TransactionTemplate(transactions).executeWithoutResult(transaction -> {
            Instant now = Instant.now();
            var a = new TunitUser(UUID.randomUUID(), UUID.randomUUID() + "@example.test", "test-only-not-login", "사용자 A", now);
            var b = new TunitUser(UUID.randomUUID(), UUID.randomUUID() + "@example.test", "test-only-not-login", "사용자 B", now);
            var artist = new Artist(UUID.randomUUID(), "예시 아티스트", "TEST", null);
            var track = new Track(UUID.randomUUID(), "예시 곡", "TEST", null, null, null, now);
            var tag = new TasteTag(UUID.randomUUID(), "예시 장르", TagType.GENRE, true);
            var profile = new TasteProfile(a, now);
            var trackArtist = new TrackArtist(track, artist, ArtistRole.PRIMARY);
            var userArtist = new UserArtist(a, artist, (short) 3, now);
            var userTrack = new UserTrack(a, track, (short) 2, now);
            var userTag = new UserTasteTag(a, tag, (short) 1, now);
            var artistGenre = new ArtistGenre(artist, tag);
            var trackGenre = new TrackGenre(track, tag);
            var invitation = new Invitation(UUID.randomUUID(), a, "test-hash-" + UUID.randomUUID(), now.plusSeconds(60), now);
            var request = new InterestRequest(UUID.randomUUID(), a, b, now);
            List<Object> entities = List.of(a, b, artist, track, tag, profile, trackArtist, userArtist, userTrack, userTag, artistGenre, trackGenre, invitation, request);
            entities.forEach(entityManager::persist);
            entityManager.flush();
            // Fixture setup only: no interest use-case is implemented by this test.
            entityManager.createNativeQuery("update interest_requests set status='ACCEPTED', resolved_at=now() where id=:id").setParameter("id", request.getId()).executeUpdate();
            var connection = new Connection(UUID.randomUUID(), a, b, request, now);
            entityManager.persist(connection);
            entityManager.flush();
            entityManager.clear();
            var cases = Map.ofEntries(
                Map.entry(TunitUser.class, a.getId()), Map.entry(Artist.class, artist.getId()), Map.entry(Track.class, track.getId()),
                Map.entry(TasteTag.class, tag.getId()), Map.entry(TasteProfile.class, a.getId()),
                Map.entry(TrackArtist.class, trackArtist.getId()), Map.entry(UserArtist.class, userArtist.getId()),
                Map.entry(UserTrack.class, userTrack.getId()), Map.entry(UserTasteTag.class, userTag.getId()),
                Map.entry(ArtistGenre.class, artistGenre.getId()), Map.entry(TrackGenre.class, trackGenre.getId()),
                Map.entry(Invitation.class, invitation.getId()), Map.entry(InterestRequest.class, request.getId()), Map.entry(Connection.class, connection.getId()));
            var repositories = new Repositories(application);
            cases.forEach((type, id) -> {
                var repository = (CrudRepository<Object, Object>) repositories.getRepositoryFor(type).orElseThrow();
                assertThat(repository.findById(id)).as(type.getSimpleName()).isPresent();
            });
            assertThat(entityManager.find(UserTrack.class, userTrack.getId()).getWeight()).isEqualTo((short) 2);
            assertThat(entityManager.find(TrackArtist.class, trackArtist.getId()).getArtistRole()).isEqualTo(ArtistRole.PRIMARY);
            assertThat(entityManager.find(TasteProfile.class, a.getId()).getStatus()).isEqualTo(TasteStatus.INCOMPLETE);
            assertThat(entityManager.find(InterestRequest.class, request.getId()).getVersion()).isZero();
            transaction.setRollbackOnly();
        });
    }

    @Test void normalizedEmailIsUniqueIgnoringCase() {
        var a = user(UUID.randomUUID().toString());
        assertThatThrownBy(() -> jdbc.update("insert into users(id,email,password_hash,nickname) values (?,?,?,?)", UUID.randomUUID(), a.getEmail().toUpperCase(Locale.ROOT), "test-only", "중복"))
            .isInstanceOf(DataIntegrityViolationException.class);
        assertThat(jdbc.queryForObject("select count(*) from users where lower(email)=?", Integer.class, a.getEmail())).isEqualTo(1);
    }

    @Test void compositePrimaryKeyWeightsAndForeignKeysAreEnforced() {
        var user = user(UUID.randomUUID().toString());
        UUID track = UUID.randomUUID();
        jdbc.update("insert into tracks(id,title,source) values (?,'fixture','TEST')", track);
        jdbc.update("insert into user_tracks(user_id,track_id,weight) values (?,?,3)", user.getId(), track);
        assertThatThrownBy(() -> jdbc.update("insert into user_tracks(user_id,track_id) values (?,?)", user.getId(), track)).isInstanceOf(DataIntegrityViolationException.class);
        for (int weight : List.of(0, 6))
            assertThatThrownBy(() -> jdbc.update("update user_tracks set weight=? where user_id=? and track_id=?", weight, user.getId(), track)).isInstanceOf(DataIntegrityViolationException.class);
        assertThatThrownBy(() -> jdbc.update("insert into user_artists(user_id,artist_id) values (?,?)", user.getId(), UUID.randomUUID())).isInstanceOf(DataIntegrityViolationException.class);
        assertThatThrownBy(() -> jdbc.update("delete from tracks where id=?", track)).isInstanceOf(DataIntegrityViolationException.class);
        assertThat(jdbc.queryForObject("select weight from user_tracks where user_id=? and track_id=?", Integer.class, user.getId(), track)).isEqualTo(3);
    }

    @Test void invalidStatesSelfRequestsAndMissingResolutionAreRejected() {
        var a = user(UUID.randomUUID().toString());
        var b = user(UUID.randomUUID().toString());
        assertThatThrownBy(() -> jdbc.update("insert into interest_requests(id,sender_id,recipient_id) values (?,?,?)", UUID.randomUUID(), a.getId(), a.getId())).isInstanceOf(DataIntegrityViolationException.class);
        for (String status : List.of("UNKNOWN", "ACCEPTED"))
            assertThatThrownBy(() -> jdbc.update("insert into interest_requests(id,sender_id,recipient_id,status) values (?,?,?,?)", UUID.randomUUID(), a.getId(), b.getId(), status)).isInstanceOf(DataIntegrityViolationException.class);
        assertThatThrownBy(() -> jdbc.update("insert into invitations(id,inviter_id,token_hash,status,expires_at) values (?,?,'fixture','COMPLETED',now())", UUID.randomUUID(), a.getId())).isInstanceOf(DataIntegrityViolationException.class);
    }

    @Test void postgresOrderingMatchesUnsignedUuidNormalizationAndConnectionsAreUnique() {
        // Keep the signed/unsigned boundary while allowing reruns against one test database.
        UUID low = new UUID(Long.MAX_VALUE, UUID.randomUUID().getLeastSignificantBits());
        UUID high = new UUID(Long.MIN_VALUE, UUID.randomUUID().getLeastSignificantBits());
        jdbc.update("insert into users(id,email,password_hash,nickname) values (?,?,'test-only','ordered')", low, UUID.randomUUID()+"@example.test");
        jdbc.update("insert into users(id,email,password_hash,nickname) values (?,?,'test-only','ordered')", high, UUID.randomUUID()+"@example.test");
        assertThat(low.compareTo(high)).isPositive();
        assertThat(UuidOrder.compare(low, high)).isNegative();
        assertThat(jdbc.queryForObject("select ?::uuid < ?::uuid", Boolean.class, low, high)).isTrue();
        UUID request = UUID.randomUUID();
        jdbc.update("insert into interest_requests(id,sender_id,recipient_id,status,resolved_at) values (?,?,?,'ACCEPTED',now())", request, low, high);
        jdbc.update("insert into connections(id,user_a_id,user_b_id,accepted_request_id) values (?,?,?,?)", UUID.randomUUID(), low, high, request);
        assertThatThrownBy(() -> jdbc.update("insert into connections(id,user_a_id,user_b_id,accepted_request_id) values (?,?,?,?)", UUID.randomUUID(), high, low, request)).isInstanceOf(DataIntegrityViolationException.class);
        assertThatThrownBy(() -> jdbc.update("insert into connections(id,user_a_id,user_b_id,accepted_request_id) values (?,?,?,?)", UUID.randomUUID(), low, high, request)).isInstanceOf(DataIntegrityViolationException.class);
    }

    @Test void optimisticVersionRejectsAStaleWriter() {
        var a = user(UUID.randomUUID().toString()); var b = user(UUID.randomUUID().toString());
        var request = application.getBean(InterestRequestRepository.class).saveAndFlush(new InterestRequest(UUID.randomUUID(), a, b, Instant.now()));
        EntityManager first = factory.createEntityManager(), second = factory.createEntityManager();
        try {
            first.getTransaction().begin(); second.getTransaction().begin();
            var older = second.find(InterestRequest.class, request.getId());
            var newer = first.find(InterestRequest.class, request.getId());
            org.springframework.test.util.ReflectionTestUtils.setField(newer, "updatedAt", Instant.now().plusSeconds(1));
            first.getTransaction().commit();
            org.springframework.test.util.ReflectionTestUtils.setField(older, "updatedAt", Instant.now().plusSeconds(2));
            assertThatThrownBy(second::flush).isInstanceOf(OptimisticLockException.class);
            assertThat(application.getBean(InterestRequestRepository.class).findById(request.getId()).orElseThrow().getVersion()).isEqualTo(1L);
        } finally {
            if (first.getTransaction().isActive()) first.getTransaction().rollback();
            if (second.getTransaction().isActive()) second.getTransaction().rollback();
            first.close(); second.close();
        }
    }

    @Test void transactionFailureRollsBackAllWrites() {
        UUID artist = UUID.randomUUID(), track = UUID.randomUUID();
        assertThatThrownBy(() -> new TransactionTemplate(transactions).executeWithoutResult(transaction -> {
            jdbc.update("insert into artists(id,name,source) values (?,'rollback','TEST')", artist);
            jdbc.update("insert into track_artists(track_id,artist_id) values (?,?)", track, artist);
        })).isInstanceOf(DataIntegrityViolationException.class);
        assertThat(jdbc.queryForObject("select count(*) from artists where id=?", Integer.class, artist)).isZero();
    }

    @Test void genreTypeIsGuardedByEntityConstructionButNotYetByTheDatabase() {
        var artist = new Artist(UUID.randomUUID(), "genre guard", "TEST", null);
        var mood = new TasteTag(UUID.randomUUID(), "mood-"+UUID.randomUUID(), TagType.MOOD, true);
        assertThatThrownBy(() -> new ArtistGenre(artist, mood)).isInstanceOf(com.tunit.common.error.BusinessException.class);
        new TransactionTemplate(transactions).executeWithoutResult(transaction -> {
            jdbc.update("insert into artists(id,name,source) values (?,'guard','TEST')", artist.getId());
            jdbc.update("insert into taste_tags(id,name,type) values (?,?,'MOOD')", mood.getId(), mood.getName());
            jdbc.update("insert into artist_genres(artist_id,tag_id) values (?,?)", artist.getId(), mood.getId());
            transaction.setRollbackOnly(); // Explicit evidence of the documented, deferred DB boundary.
        });
    }
}
