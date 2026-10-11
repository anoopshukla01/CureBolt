-- ============================================================================
-- MIGRATION: 009_s1_platform_security_and_feature_flags.sql
-- AI Assistant & Platform Services Milestone S1: Security Baseline & Feature Flags
-- PostgreSQL 15+ compatible with Supabase
-- ============================================================================

-- 1. FEATURE FLAGS TABLE (SHARED ACROSS WEB, CUSTOMER, PHARMACY & RIDER APPS)
CREATE TABLE IF NOT EXISTS feature_flags (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    key VARCHAR(100) UNIQUE NOT NULL,
    name VARCHAR(150) NOT NULL,
    description TEXT NOT NULL,
    is_enabled BOOLEAN NOT NULL DEFAULT TRUE,
    client_targets VARCHAR(50)[] DEFAULT ARRAY['customer', 'pharmacy', 'rider', 'admin']::VARCHAR(50)[],
    rollout_percentage INT DEFAULT 100 CHECK (rollout_percentage >= 0 AND rollout_percentage <= 100),
    metadata JSONB DEFAULT '{}'::jsonb,
    updated_by UUID REFERENCES users(id),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_feature_flags_key ON feature_flags(key);

-- 2. SEED DEFAULT OPERATIONAL FEATURE FLAGS
INSERT INTO feature_flags (key, name, description, is_enabled, client_targets, rollout_percentage)
VALUES 
    ('veterinary_ordering_v2', 'Veterinary Healthcare Domain', 'Dedicated animal profile prescription workflows and veterinary products', true, ARRAY['customer', 'pharmacy', 'admin']::VARCHAR(50)[], 100),
    ('ai_symptom_assistant_customer', 'Controlled AI Assistant', 'Assistive non-diagnostic medicine navigation and order status lookup', true, ARRAY['customer', 'admin']::VARCHAR(50)[], 100),
    ('instant_cod_threshold_5000', 'Doorstep COD ₹5000 Limit Guard', 'Statutory cash-in-hand threshold blocking assignments above limit', true, ARRAY['rider', 'admin', 'dispatcher']::VARCHAR(50)[], 100),
    ('fefo_batch_auto_recommend', 'FEFO Batch Recommendation', 'First-Expiry First-Out inventory picking prioritization for partner pharmacies', true, ARRAY['pharmacy', 'admin']::VARCHAR(50)[], 100),
    ('prescription_assistive_ocr', 'Assistive Prescription OCR', 'Machine-read medicine suggestions labeled clearly as unverified hints', true, ARRAY['pharmacy', 'admin']::VARCHAR(50)[], 100),
    ('live_rider_gps_telemetry', 'Live GPS Tracking & Dynamic ETA', 'Real-time telemetry broadcasting with speed-jump and spoof filtering', true, ARRAY['customer', 'rider', 'admin', 'dispatcher']::VARCHAR(50)[], 100)
ON CONFLICT (key) DO UPDATE 
SET 
    is_enabled = EXCLUDED.is_enabled,
    updated_at = NOW();

-- 3. ROW-LEVEL SECURITY POLICIES
ALTER TABLE feature_flags ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
    DROP POLICY IF EXISTS feature_flags_public_read ON feature_flags;
    CREATE POLICY feature_flags_public_read ON feature_flags
        FOR SELECT
        USING (is_enabled = true OR EXISTS (
            SELECT 1 FROM staff_profiles sp WHERE sp.user_id = auth.uid() AND sp.role = 'admin'
        ));

    DROP POLICY IF EXISTS feature_flags_admin_modify ON feature_flags;
    CREATE POLICY feature_flags_admin_modify ON feature_flags
        FOR ALL
        USING (EXISTS (
            SELECT 1 FROM staff_profiles sp WHERE sp.user_id = auth.uid() AND sp.role = 'admin'
        ))
        WITH CHECK (EXISTS (
            SELECT 1 FROM staff_profiles sp WHERE sp.user_id = auth.uid() AND sp.role = 'admin'
        ));
EXCEPTION
    WHEN undefined_table THEN null;
    WHEN undefined_function THEN null;
END $$;
