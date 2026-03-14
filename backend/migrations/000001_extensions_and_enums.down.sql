DROP FUNCTION IF EXISTS update_updated_at() CASCADE;

DROP TYPE IF EXISTS oauth_provider;
DROP TYPE IF EXISTS subscription_status;
DROP TYPE IF EXISTS subscription_plan;
DROP TYPE IF EXISTS event_type;
DROP TYPE IF EXISTS announcement_type;
DROP TYPE IF EXISTS chat_type;
DROP TYPE IF EXISTS order_status;
DROP TYPE IF EXISTS artwork_condition;
DROP TYPE IF EXISTS artwork_status;
DROP TYPE IF EXISTS user_role;

DROP EXTENSION IF EXISTS "vector";
DROP EXTENSION IF EXISTS "btree_gin";
DROP EXTENSION IF EXISTS "pg_trgm";
DROP EXTENSION IF EXISTS "uuid-ossp";
