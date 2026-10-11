-- ============================================================================
-- MIGRATION: 015_c1_customer_profile_and_age_gating.sql
-- Customer App Milestone 1: Authentication, Profile Setup & Age Verification
-- PostgreSQL 15+ compatible with Supabase RLS and Audit Trail
-- ============================================================================

-- 1. Ensure user profile columns for age gating and terms consent
ALTER TABLE users 
ADD COLUMN IF NOT EXISTS date_of_birth DATE,
ADD COLUMN IF NOT EXISTS terms_version VARCHAR(50) DEFAULT 'v1.0.0',
ADD COLUMN IF NOT EXISTS terms_accepted_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS is_minor_blocked BOOLEAN NOT NULL DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW();

-- 2. Create customer audit log for profile modifications and age-gate rejections
CREATE TABLE IF NOT EXISTS customer_profile_audit_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id VARCHAR(100) NOT NULL,
    action VARCHAR(50) NOT NULL, -- 'PROFILE_CREATED', 'TERMS_ACCEPTED', 'UNDERAGE_REJECTED', 'NAME_UPDATED'
    details JSONB NOT NULL DEFAULT '{}'::jsonb,
    ip_address VARCHAR(50),
    user_agent TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_customer_audit_user_id ON customer_profile_audit_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_customer_audit_action ON customer_profile_audit_logs(action);

-- 3. SQL helper function for calculating age and validating adulthood (18+)
CREATE OR REPLACE FUNCTION is_adult(dob DATE) 
RETURNS BOOLEAN AS $$
BEGIN
    IF dob IS NULL THEN
        RETURN FALSE;
    END IF;
    RETURN age(CURRENT_DATE, dob) >= INTERVAL '18 years';
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- 4. RLS for profile audit logs
ALTER TABLE customer_profile_audit_logs ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
    DROP POLICY IF EXISTS customer_audit_self_read ON customer_profile_audit_logs;
    CREATE POLICY customer_audit_self_read ON customer_profile_audit_logs
        FOR SELECT
        USING (auth.uid()::text = user_id);
EXCEPTION
    WHEN undefined_table THEN null;
    WHEN undefined_function THEN null;
END $$;
