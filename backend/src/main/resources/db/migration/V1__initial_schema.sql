-- backend/src/main/resources/db/migration/V1__initial_schema.sql

CREATE TABLE users (
  id UUID PRIMARY KEY,
  email VARCHAR(255) NOT NULL UNIQUE,
  password_hash VARCHAR(255) NOT NULL,
  nickname VARCHAR(50) NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  deleted_at TIMESTAMPTZ
);

CREATE TABLE artists (
  id UUID PRIMARY KEY,
  name VARCHAR(200) NOT NULL,
  source VARCHAR(30) NOT NULL,
  external_id VARCHAR(255)
);

CREATE TABLE tracks (
  id UUID PRIMARY KEY,
  title VARCHAR(255) NOT NULL,
  source VARCHAR(30) NOT NULL,
  external_id VARCHAR(255),
  external_url TEXT,
  artwork_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE taste_tags (
  id UUID PRIMARY KEY,
  name VARCHAR(80) NOT NULL,
  type VARCHAR(20) NOT NULL,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  CONSTRAINT uq_taste_tag_name_type UNIQUE (type, name),
  CONSTRAINT chk_taste_tag_type CHECK (type IN ('GENRE', 'MOOD'))
);

CREATE TABLE track_artists (
  track_id UUID NOT NULL REFERENCES tracks(id) ON DELETE RESTRICT,
  artist_id UUID NOT NULL REFERENCES artists(id) ON DELETE RESTRICT,
  artist_role VARCHAR(20) NOT NULL DEFAULT 'PRIMARY',
  PRIMARY KEY (track_id, artist_id),
  CONSTRAINT chk_artist_role CHECK (artist_role IN ('PRIMARY', 'FEATURED'))
);

CREATE TABLE user_artists (
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  artist_id UUID NOT NULL REFERENCES artists(id) ON DELETE RESTRICT,
  weight SMALLINT NOT NULL DEFAULT 1,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (user_id, artist_id),
  CONSTRAINT chk_user_artist_weight CHECK (weight BETWEEN 1 AND 5)
);

CREATE TABLE user_tracks (
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  track_id UUID NOT NULL REFERENCES tracks(id) ON DELETE RESTRICT,
  weight SMALLINT NOT NULL DEFAULT 1,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (user_id, track_id),
  CONSTRAINT chk_user_track_weight CHECK (weight BETWEEN 1 AND 5)
);

CREATE TABLE user_taste_tags (
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  tag_id UUID NOT NULL REFERENCES taste_tags(id) ON DELETE RESTRICT,
  weight SMALLINT NOT NULL DEFAULT 1,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (user_id, tag_id),
  CONSTRAINT chk_user_tag_weight CHECK (weight BETWEEN 1 AND 5)
);

CREATE TABLE artist_genres (
  artist_id UUID NOT NULL REFERENCES artists(id) ON DELETE RESTRICT,
  tag_id UUID NOT NULL REFERENCES taste_tags(id) ON DELETE RESTRICT,
  PRIMARY KEY (artist_id, tag_id)
);

CREATE TABLE track_genres (
  track_id UUID NOT NULL REFERENCES tracks(id) ON DELETE RESTRICT,
  tag_id UUID NOT NULL REFERENCES taste_tags(id) ON DELETE RESTRICT,
  PRIMARY KEY (track_id, tag_id)
);

CREATE TABLE taste_profiles (
  user_id UUID PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
  status VARCHAR(20) NOT NULL DEFAULT 'INCOMPLETE',
  summary TEXT,
  is_public BOOLEAN NOT NULL DEFAULT FALSE,
  comparison_consent BOOLEAN NOT NULL DEFAULT FALSE,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT chk_taste_status CHECK (status IN ('INCOMPLETE','COMPLETE'))
);

CREATE TABLE invitations (
  id UUID PRIMARY KEY,
  inviter_id UUID NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
  token_hash VARCHAR(128) NOT NULL UNIQUE,
  status VARCHAR(20) NOT NULL DEFAULT 'PENDING',
  accepted_by UUID REFERENCES users(id) ON DELETE RESTRICT,
  expires_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  completed_at TIMESTAMPTZ,
  CONSTRAINT chk_invitation_status CHECK
    (status IN ('PENDING','COMPLETED','EXPIRED','REVOKED')),
  CONSTRAINT chk_invitation_self CHECK
    (accepted_by IS NULL OR accepted_by <> inviter_id),
  CONSTRAINT chk_invitation_completion CHECK
    (status <> 'COMPLETED' OR (accepted_by IS NOT NULL AND completed_at IS NOT NULL))
);

CREATE TABLE interest_requests (
  id UUID PRIMARY KEY,
  sender_id UUID NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
  recipient_id UUID NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
  status VARCHAR(20) NOT NULL DEFAULT 'PENDING',
  version BIGINT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  resolved_at TIMESTAMPTZ,
  CONSTRAINT chk_interest_self CHECK (sender_id <> recipient_id),
  CONSTRAINT chk_interest_status CHECK
    (status IN ('PENDING','ACCEPTED','REJECTED','CANCELLED')),
  CONSTRAINT chk_interest_version CHECK (version >= 0),
  CONSTRAINT chk_interest_resolution CHECK
    ((status = 'PENDING' AND resolved_at IS NULL)
     OR (status <> 'PENDING' AND resolved_at IS NOT NULL))
);

CREATE TABLE connections (
  id UUID PRIMARY KEY,
  user_a_id UUID NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
  user_b_id UUID NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
  accepted_request_id UUID NOT NULL UNIQUE REFERENCES interest_requests(id) ON DELETE RESTRICT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT chk_connection_order CHECK (user_a_id < user_b_id),
  CONSTRAINT uq_connection_pair UNIQUE (user_a_id, user_b_id)
);

-- users.email은 서버에서 소문자화; DB에서도 대소문자 중복 방지.
CREATE UNIQUE INDEX uq_users_email_lower ON users (LOWER(email));

-- source/external_id 조합이 있는 데이터만 외부 ID 기준 중복 방지.
CREATE UNIQUE INDEX uq_artist_external
  ON artists (source, external_id) WHERE external_id IS NOT NULL;
CREATE UNIQUE INDEX uq_track_external
  ON tracks (source, external_id) WHERE external_id IS NOT NULL;

CREATE INDEX ix_user_artist_artist ON user_artists (artist_id);
CREATE INDEX ix_user_track_track ON user_tracks (track_id);
CREATE INDEX ix_artist_genre_tag ON artist_genres (tag_id);
CREATE INDEX ix_track_genre_tag ON track_genres (tag_id);
CREATE INDEX ix_interest_received
  ON interest_requests (recipient_id, status, created_at DESC);
CREATE INDEX ix_interest_sent
  ON interest_requests (sender_id, status, created_at DESC);
CREATE INDEX ix_invitation_expiry ON invitations (expires_at);
