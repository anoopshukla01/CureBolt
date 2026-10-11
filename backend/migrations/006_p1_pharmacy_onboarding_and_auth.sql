-- ============================================================================
-- MIGRATION: 006_p1_pharmacy_onboarding_and_auth.sql
-- Merchant (Pharmacy) App Milestone P1: Auth, MFA, Onboarding Application, Licences & RBAC
-- PostgreSQL 15+ compatible with Supabase and PostGIS
-- ============================================================================

-- 1. EXTEND PHARMACY USERS & SESSIONS
CREATE TABLE IF NOT EXISTS user_mfa_credentials (
    user_id UUID PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
    totp_secret VARCHAR(64) NOT NULL,
    is_totp_enabled BOOLEAN NOT NULL DEFAULT FALSE,
    backup_codes VARCHAR(20)[] DEFAULT ARRAY[]::VARCHAR(20)[],
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS user_sessions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    device_info VARCHAR(255) NOT NULL,
    ip_address VARCHAR(50),
    token_hash VARCHAR(64) NOT NULL,
    expires_at TIMESTAMPTZ NOT NULL,
    is_revoked BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    last_active_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_user_sessions_user ON user_sessions(user_id, is_revoked);

-- 2. PHARMACY ONBOARDING APPLICATIONS
CREATE TABLE IF NOT EXISTS pharmacy_onboarding_applications (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    pharmacy_id UUID REFERENCES pharmacies(id) ON DELETE SET NULL,
    owner_user_id UUID NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
    business_name VARCHAR(200) NOT NULL,
    legal_entity_name VARCHAR(200) NOT NULL,
    gstin VARCHAR(15),
    address_line1 TEXT NOT NULL,
    city VARCHAR(50) NOT NULL DEFAULT 'Gorakhpur',
    pincode VARCHAR(10) NOT NULL,
    latitude DECIMAL(10, 8) NOT NULL,
    longitude DECIMAL(11, 8) NOT NULL,
    operating_hours JSONB DEFAULT '{"open": "08:00", "close": "22:00"}'::jsonb,
    delivery_radius_m INT NOT NULL DEFAULT 5000,
    authorised_representative_name VARCHAR(150) NOT NULL,
    authorised_representative_phone VARCHAR(15) NOT NULL,
    -- Regulatory Licences
    licence_form_20 VARCHAR(100) NOT NULL, -- Retail Drug Sale Form 20
    licence_form_21 VARCHAR(100),          -- Form 21 (Specified Schedule C/C1 drugs)
    licence_expiry_date DATE NOT NULL,
    licence_doc_path TEXT NOT NULL,
    premises_doc_path TEXT NOT NULL,
    id_doc_path TEXT NOT NULL,
    -- Qualified Registered Pharmacist
    pharmacist_name VARCHAR(150) NOT NULL,
    pharmacist_reg_number VARCHAR(100) NOT NULL,
    pharmacist_council VARCHAR(100) NOT NULL DEFAULT 'Uttar Pradesh Pharmacy Council',
    pharmacist_reg_doc_path TEXT NOT NULL,
    -- Masked Settlement Details
    bank_account_masked VARCHAR(30),
    bank_ifsc VARCHAR(15),
    -- Lifecycle state
    status VARCHAR(30) NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'submitted', 'needs_changes', 'verified', 'suspended')),
    reviewer_comments TEXT,
    reviewed_by UUID REFERENCES users(id),
    reviewed_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_onboarding_owner ON pharmacy_onboarding_applications(owner_user_id);
CREATE INDEX IF NOT EXISTS idx_onboarding_status ON pharmacy_onboarding_applications(status);

-- 3. RLS SECURITY POLICIES
ALTER TABLE user_mfa_credentials ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE pharmacy_onboarding_applications ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
    DROP POLICY IF EXISTS mfa_self_manage ON user_mfa_credentials;
    CREATE POLICY mfa_self_manage ON user_mfa_credentials
        FOR ALL
        USING (auth.uid() = user_id)
        WITH CHECK (auth.uid() = user_id);

    DROP POLICY IF EXISTS sessions_self_manage ON user_sessions;
    CREATE POLICY sessions_self_manage ON user_sessions
        FOR ALL
        USING (auth.uid() = user_id)
        WITH CHECK (auth.uid() = user_id);

    DROP POLICY IF EXISTS onboarding_owner_access ON pharmacy_onboarding_applications;
    CREATE POLICY onboarding_owner_access ON pharmacy_onboarding_applications
        FOR ALL
        USING (auth.uid() = owner_user_id)
        WITH CHECK (auth.uid() = owner_user_id);
EXCEPTION
    WHEN undefined_table THEN null;
    WHEN undefined_function THEN null;
END $$;
