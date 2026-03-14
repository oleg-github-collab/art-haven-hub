-- Extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";
CREATE EXTENSION IF NOT EXISTS "btree_gin";
CREATE EXTENSION IF NOT EXISTS "vector";  -- pgvector

-- Enum types
CREATE TYPE user_role AS ENUM ('user', 'artist', 'moderator', 'admin');
CREATE TYPE artwork_status AS ENUM ('draft', 'active', 'sold', 'promoted', 'archived');
CREATE TYPE artwork_condition AS ENUM ('new_artwork', 'new_item', 'used_good', 'used', 'digital');
CREATE TYPE order_status AS ENUM ('pending', 'paid', 'shipped', 'delivered', 'cancelled', 'refunded');
CREATE TYPE chat_type AS ENUM ('private', 'group', 'channel');
CREATE TYPE announcement_type AS ENUM ('offer', 'seek');
CREATE TYPE event_type AS ENUM ('exhibition', 'workshop', 'lecture', 'performance', 'fair');
CREATE TYPE subscription_plan AS ENUM ('free', 'pro', 'gallery');
CREATE TYPE subscription_status AS ENUM ('active', 'cancelled', 'past_due', 'trialing');
CREATE TYPE oauth_provider AS ENUM ('google', 'apple');

-- Auto-update updated_at trigger function
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;
