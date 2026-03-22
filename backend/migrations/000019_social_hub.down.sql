DROP TRIGGER IF EXISTS update_workflows_updated_at       ON workflows;
DROP TRIGGER IF EXISTS update_campaigns_updated_at       ON campaigns;
DROP TRIGGER IF EXISTS update_scheduled_posts_updated_at ON scheduled_posts;
DROP TRIGGER IF EXISTS update_social_accounts_updated_at ON social_accounts;

DROP TABLE IF EXISTS workflows;
ALTER TABLE scheduled_posts DROP CONSTRAINT IF EXISTS fk_scheduled_posts_campaign;
DROP TABLE IF EXISTS scheduled_posts;
DROP TABLE IF EXISTS campaigns;
DROP TABLE IF EXISTS social_accounts;

DROP TYPE IF EXISTS campaign_status;
DROP TYPE IF EXISTS scheduled_post_status;
