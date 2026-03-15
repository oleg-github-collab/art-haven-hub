CREATE TABLE events (
    id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organizer_id  UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    title         TEXT NOT NULL,
    description   TEXT NOT NULL,
    event_type    event_type NOT NULL DEFAULT 'exhibition',
    location      TEXT,
    address       TEXT,
    city          TEXT,
    country       TEXT,
    is_online     BOOLEAN DEFAULT FALSE,
    online_url    TEXT,
    cover_image   TEXT,
    images        TEXT[] DEFAULT '{}',

    starts_at     TIMESTAMPTZ NOT NULL,
    ends_at       TIMESTAMPTZ,
    price_cents   BIGINT DEFAULT 0,
    currency      TEXT DEFAULT 'EUR',
    max_attendees INT,
    attendee_count INT DEFAULT 0,

    tags          TEXT[] DEFAULT '{}',
    is_featured   BOOLEAN DEFAULT FALSE,

    created_at    TIMESTAMPTZ DEFAULT NOW(),
    updated_at    TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE event_attendees (
    id         UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    event_id   UUID NOT NULL REFERENCES events(id) ON DELETE CASCADE,
    user_id    UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    status     TEXT NOT NULL DEFAULT 'going',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(event_id, user_id)
);

CREATE INDEX idx_events_organizer ON events(organizer_id);
CREATE INDEX idx_events_starts ON events(starts_at);
CREATE INDEX idx_events_starts_desc ON events(starts_at DESC);
CREATE INDEX idx_events_city ON events(city);
CREATE INDEX idx_events_type ON events(event_type);
CREATE INDEX idx_events_featured ON events(is_featured) WHERE is_featured = TRUE;
CREATE INDEX idx_events_title_trgm ON events USING gin(title gin_trgm_ops);
CREATE INDEX idx_event_attendees_event ON event_attendees(event_id);
CREATE INDEX idx_event_attendees_user ON event_attendees(user_id);

CREATE TRIGGER events_updated_at
    BEFORE UPDATE ON events
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();
