-- ============================================================================
-- MIGRATION: 008_a1_admin_rbac_and_stepup.sql
-- Admin, Dispatcher and Support Dashboard Milestone A1: Auth, RBAC & Two-Person Approval
-- PostgreSQL 15+ compatible with Supabase
-- ============================================================================

-- 1. EXTEND STAFF ROLES & PERMISSIONS
CREATE TYPE IF NOT EXISTS platform_staff_role AS ENUM ('admin', 'dispatcher', 'support_operator');

CREATE TABLE IF NOT EXISTS staff_profiles (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    email VARCHAR(255) NOT NULL UNIQUE,
    full_name VARCHAR(150) NOT NULL,
    role VARCHAR(50) NOT NULL CHECK (role IN ('admin', 'dispatcher', 'support_operator')),
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    ip_allowlist TEXT[] DEFAULT ARRAY[]::TEXT[],
    totp_secret VARCHAR(64) NOT NULL DEFAULT 'JBSWY3DPEHPK3PXP',
    is_totp_enabled BOOLEAN NOT NULL DEFAULT TRUE,
    last_step_up_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_staff_profiles_role ON staff_profiles(role, is_active);

-- 2. TWO-PERSON APPROVAL WORKFLOW FOR HIGH-RISK CONFIGURATIONS
CREATE TABLE IF NOT EXISTS two_person_approvals (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    action_type VARCHAR(100) NOT NULL CHECK (action_type IN ('CATALOGUE_CLASS_CHANGE', 'OTC_DIRECT_TOGGLE', 'REFUND_LIMIT_CHANGE', 'PHARMACY_DEACTIVATE')),
    target_resource_id VARCHAR(100) NOT NULL,
    requested_by UUID NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
    requested_reason TEXT NOT NULL,
    payload JSONB NOT NULL,
    status VARCHAR(30) NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
    approved_by UUID REFERENCES users(id) ON DELETE RESTRICT,
    approval_reason TEXT,
    step_up_verified BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    resolved_at TIMESTAMPTZ,
    -- Core statutory rule: Cannot approve own request!
    CONSTRAINT check_two_person_distinct_users CHECK (approved_by IS NULL OR requested_by <> approved_by)
);

CREATE INDEX IF NOT EXISTS idx_approvals_status ON two_person_approvals(status);

-- 3. AUDITED BREAK-GLASS ACCESS SESSIONS (PRESCRIPTION & PHI ACCESS)
CREATE TABLE IF NOT EXISTS break_glass_sessions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    staff_user_id UUID NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
    resource_type VARCHAR(50) NOT NULL DEFAULT 'prescription',
    resource_id VARCHAR(100) NOT NULL,
    stated_reason TEXT NOT NULL,
    totp_step_up_verified BOOLEAN NOT NULL DEFAULT TRUE,
    expires_at TIMESTAMPTZ NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_break_glass_user ON break_glass_sessions(staff_user_id, resource_id);

-- 4. RLS POLICIES FOR OPERATIONAL DASHBOARD
ALTER TABLE staff_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE two_person_approvals ENABLE ROW LEVEL SECURITY;
ALTER TABLE break_glass_sessions ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
    DROP POLICY IF EXISTS staff_profiles_read ON staff_profiles;
    CREATE POLICY staff_profiles_read ON staff_profiles
        FOR SELECT
        USING (auth.uid() = user_id OR EXISTS (
            SELECT 1 FROM staff_profiles sp WHERE sp.user_id = auth.uid() AND sp.role = 'admin'
        ));

    DROP POLICY IF EXISTS break_glass_admin_only ON break_glass_sessions;
    CREATE POLICY break_glass_admin_only ON break_glass_sessions
        FOR ALL
        USING (EXISTS (
            SELECT 1 FROM staff_profiles sp WHERE sp.user_id = auth.uid() AND sp.role = 'admin'
        ));
EXCEPTION
    WHEN undefined_table THEN null;
    WHEN undefined_function THEN null;
END $$;
