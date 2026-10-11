-- ============================================================================
-- 014_b1_app_versions_and_feature_flags.sql
-- Milestone B1: Monorepo Multi-App Architecture, Versioning & App-Session Gates
-- ============================================================================

CREATE TABLE IF NOT EXISTS app_config (
    app_id VARCHAR(64) PRIMARY KEY, -- 'com.medcure.customer', 'com.medcure.rider', 'com.medcure.shop', 'in.medcure.merchant'
    app_name VARCHAR(128) NOT NULL,
    min_supported_version VARCHAR(32) NOT NULL DEFAULT '1.0.0',
    latest_version VARCHAR(32) NOT NULL DEFAULT '1.0.0',
    force_update_title VARCHAR(255) NOT NULL DEFAULT 'Update Required',
    force_update_message TEXT NOT NULL DEFAULT 'A critical update is required to continue using this application. Please update from the app store.',
    store_url_android TEXT NOT NULL DEFAULT 'https://play.google.com/store/apps/details?id=',
    store_url_ios TEXT NOT NULL DEFAULT 'https://apps.apple.com/app/id',
    allowed_roles VARCHAR(64)[] NOT NULL,
    maintenance_mode BOOLEAN NOT NULL DEFAULT false,
    maintenance_message TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Seed defaults for the three apps
INSERT INTO app_config (app_id, app_name, min_supported_version, latest_version, allowed_roles, store_url_android)
VALUES
    ('com.medcure.customer', 'Medcure Customer App', '1.0.0', '1.0.0', ARRAY['customer', 'platform_admin'], 'https://play.google.com/store/apps/details?id=com.medcure.customer'),
    ('com.medcure.rider', 'Medcure Delivery Partner App', '1.0.0', '1.0.0', ARRAY['rider', 'delivery_partner', 'platform_admin'], 'https://play.google.com/store/apps/details?id=com.medcure.rider'),
    ('com.medcure.shop', 'Medcure Pharmacy Counter App', '1.0.0', '1.0.0', ARRAY['pharmacy_owner', 'pharmacist', 'pharmacy_staff', 'platform_admin'], 'https://play.google.com/store/apps/details?id=com.medcure.shop'),
    ('in.medcure.merchant', 'Medcure Pharmacy Counter App (Alt)', '1.0.0', '1.0.0', ARRAY['pharmacy_owner', 'pharmacist', 'pharmacy_staff', 'platform_admin'], 'https://play.google.com/store/apps/details?id=in.medcure.merchant')
ON CONFLICT (app_id) DO NOTHING;

-- App Sessions Audit Table
CREATE TABLE IF NOT EXISTS app_sessions (
    id VARCHAR(64) PRIMARY KEY,
    user_id VARCHAR(64) NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    app_id VARCHAR(64) NOT NULL REFERENCES app_config(app_id),
    app_version VARCHAR(32) NOT NULL,
    platform VARCHAR(32) NOT NULL, -- 'android', 'ios', 'web'
    device_info VARCHAR(255) NOT NULL,
    ip_address VARCHAR(50),
    granted_role VARCHAR(64) NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    expires_at TIMESTAMPTZ NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_app_sessions_user_app ON app_sessions(user_id, app_id);
