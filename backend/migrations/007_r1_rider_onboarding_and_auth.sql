-- ============================================================================
-- MIGRATION: 007_r1_rider_onboarding_and_auth.sql
-- Delivery Partner (Rider) App Milestone R1: Auth, Onboarding & Device Binding
-- PostgreSQL 15+ compatible with Supabase and PostGIS
-- ============================================================================

-- 1. RIDER ONBOARDING APPLICATIONS
CREATE TABLE IF NOT EXISTS rider_onboarding_applications (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    rider_id UUID REFERENCES rider_profiles(id) ON DELETE SET NULL,
    full_name VARCHAR(150) NOT NULL,
    phone VARCHAR(15) NOT NULL,
    selfie_doc_path TEXT NOT NULL,
    gov_id_type VARCHAR(50) NOT NULL CHECK (gov_id_type IN ('aadhaar', 'pan', 'voter_id')),
    gov_id_number VARCHAR(100) NOT NULL,
    gov_id_doc_path TEXT NOT NULL,
    driving_licence_number VARCHAR(100) NOT NULL,
    driving_licence_doc_path TEXT NOT NULL,
    driving_licence_expiry_date DATE NOT NULL,
    vehicle_type VARCHAR(50) NOT NULL CHECK (vehicle_type IN ('motorcycle', 'scooter', 'ev_scooter', 'bicycle')),
    vehicle_registration_number VARCHAR(50) NOT NULL,
    vehicle_rc_doc_path TEXT NOT NULL,
    vehicle_insurance_doc_path TEXT,
    emergency_contact_name VARCHAR(150) NOT NULL,
    emergency_contact_phone VARCHAR(15) NOT NULL,
    emergency_contact_relation VARCHAR(50) NOT NULL,
    bank_account_masked VARCHAR(30),
    bank_ifsc VARCHAR(15),
    upi_id_masked VARCHAR(50),
    status VARCHAR(30) NOT NULL DEFAULT 'submitted' CHECK (status IN ('submitted', 'needs_changes', 'approved', 'suspended')),
    reviewer_comments TEXT,
    reviewed_by UUID REFERENCES users(id),
    reviewed_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_rider_onboarding_user ON rider_onboarding_applications(user_id);
CREATE INDEX IF NOT EXISTS idx_rider_onboarding_status ON rider_onboarding_applications(status);

-- 2. RIDER BOUND DEVICES & SESSIONS
CREATE TABLE IF NOT EXISTS rider_devices (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    rider_id UUID NOT NULL,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    device_fingerprint VARCHAR(100) NOT NULL,
    device_model VARCHAR(100) NOT NULL,
    os_version VARCHAR(50) NOT NULL,
    app_version VARCHAR(50) NOT NULL,
    push_token TEXT,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    last_active_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_rider_devices_user ON rider_devices(user_id, is_active);
CREATE INDEX IF NOT EXISTS idx_rider_devices_fingerprint ON rider_devices(device_fingerprint);

-- 3. RLS SECURITY POLICIES
ALTER TABLE rider_onboarding_applications ENABLE ROW LEVEL SECURITY;
ALTER TABLE rider_devices ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
    DROP POLICY IF EXISTS rider_onboarding_self_read ON rider_onboarding_applications;
    CREATE POLICY rider_onboarding_self_read ON rider_onboarding_applications
        FOR SELECT
        USING (auth.uid() = user_id);

    DROP POLICY IF EXISTS rider_onboarding_self_insert ON rider_onboarding_applications;
    CREATE POLICY rider_onboarding_self_insert ON rider_onboarding_applications
        FOR INSERT
        WITH CHECK (auth.uid() = user_id);

    DROP POLICY IF EXISTS rider_onboarding_self_update ON rider_onboarding_applications;
    CREATE POLICY rider_onboarding_self_update ON rider_onboarding_applications
        FOR UPDATE
        USING (auth.uid() = user_id)
        WITH CHECK (auth.uid() = user_id);

    DROP POLICY IF EXISTS rider_devices_self_access ON rider_devices;
    CREATE POLICY rider_devices_self_access ON rider_devices
        FOR ALL
        USING (auth.uid() = user_id)
        WITH CHECK (auth.uid() = user_id);
EXCEPTION
    WHEN undefined_table THEN null;
    WHEN undefined_function THEN null;
END $$;
