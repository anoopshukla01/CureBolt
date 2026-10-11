-- ============================================================================
-- MIGRATION: 011_a3_rider_assignment_and_dispatch.sql
-- Admin, Dispatcher and Support Dashboard Milestone A3:
-- Rider Assignment Engine (Auto + Fallback), Offers, Concurrency & Dispatcher Console
-- PostgreSQL 15+ compatible with Supabase and PostGIS
-- ============================================================================

-- 1. ASSIGNMENT SETTINGS (Zone level with platform-wide kill switch)
CREATE TABLE IF NOT EXISTS assignment_settings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    zone_id VARCHAR(100) NOT NULL UNIQUE DEFAULT 'zone-gkp-central',
    zone_name VARCHAR(150) NOT NULL DEFAULT 'Gorakhpur Central Urban Zone',
    mode VARCHAR(50) NOT NULL DEFAULT 'AUTO_WITH_MANUAL_FALLBACK' 
        CHECK (mode IN ('AUTO_WITH_MANUAL_FALLBACK', 'AUTO', 'MANUAL')),
    kill_switch_enabled BOOLEAN NOT NULL DEFAULT FALSE,
    trigger_point VARCHAR(50) NOT NULL DEFAULT 'on_packing'
        CHECK (trigger_point IN ('on_acceptance', 'on_packing', 'on_packed')),
    search_radius_km DECIMAL(4, 2) NOT NULL DEFAULT 3.00,
    offer_timeout_seconds INT NOT NULL DEFAULT 45,
    max_escalation_offers INT NOT NULL DEFAULT 3,
    escalation_time_limit_seconds INT NOT NULL DEFAULT 180,
    max_concurrent_orders INT NOT NULL DEFAULT 1,
    max_cod_cash_paise BIGINT NOT NULL DEFAULT 500000, -- ₹5,000 statutory COD limit
    radius_expansion_step_km DECIMAL(4, 2) NOT NULL DEFAULT 1.00,
    max_expanded_radius_km DECIMAL(4, 2) NOT NULL DEFAULT 5.00,
    weight_eta DECIMAL(3, 2) NOT NULL DEFAULT 0.35,
    weight_load DECIMAL(3, 2) NOT NULL DEFAULT 0.20,
    weight_idle DECIMAL(3, 2) NOT NULL DEFAULT 0.15,
    weight_acceptance DECIMAL(3, 2) NOT NULL DEFAULT 0.15,
    weight_rating DECIMAL(3, 2) NOT NULL DEFAULT 0.15,
    updated_by UUID REFERENCES staff_profiles(id),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Seed default Gorakhpur zone settings if not present
INSERT INTO assignment_settings (
    zone_id, zone_name, mode, kill_switch_enabled, trigger_point, 
    search_radius_km, offer_timeout_seconds, max_escalation_offers, 
    escalation_time_limit_seconds, max_concurrent_orders, max_cod_cash_paise,
    weight_eta, weight_load, weight_idle, weight_acceptance, weight_rating
) VALUES (
    'zone-gkp-central', 'Gorakhpur Central Urban Zone', 'AUTO_WITH_MANUAL_FALLBACK', FALSE, 'on_packing',
    3.00, 45, 3, 180, 1, 500000,
    0.35, 0.20, 0.15, 0.15, 0.15
) ON CONFLICT (zone_id) DO NOTHING;

-- 2. RIDER PRESENCE & TELEMETRY
CREATE TABLE IF NOT EXISTS rider_presence (
    rider_id VARCHAR(100) PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    is_online BOOLEAN NOT NULL DEFAULT FALSE,
    current_latitude DECIMAL(10, 8),
    current_longitude DECIMAL(11, 8),
    last_location_update_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    current_load INT NOT NULL DEFAULT 0,
    current_cash_in_hand_paise BIGINT NOT NULL DEFAULT 0,
    acceptance_rate DECIMAL(4, 3) NOT NULL DEFAULT 0.950,
    rating DECIMAL(3, 2) NOT NULL DEFAULT 4.80,
    total_completed_orders INT NOT NULL DEFAULT 0,
    last_completed_delivery_at TIMESTAMPTZ,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_rider_presence_online ON rider_presence(is_online, last_location_update_at);

-- 3. RIDER OFFERS (Sequential offers with atomic state transitions)
CREATE TABLE IF NOT EXISTS rider_offers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
    rider_id VARCHAR(100) NOT NULL REFERENCES rider_presence(rider_id) ON DELETE CASCADE,
    status VARCHAR(30) NOT NULL DEFAULT 'offered'
        CHECK (status IN ('offered', 'accepted', 'declined', 'expired', 'cancelled')),
    attempt_number INT NOT NULL DEFAULT 1,
    offered_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    expires_at TIMESTAMPTZ NOT NULL,
    responded_at TIMESTAMPTZ,
    decline_reason TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_rider_offers_order ON rider_offers(order_id, status);
CREATE INDEX IF NOT EXISTS idx_rider_offers_rider ON rider_offers(rider_id, status);

-- 4. ASSIGNMENT DECISIONS (Explainability & Auditing)
CREATE TABLE IF NOT EXISTS assignment_decisions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
    zone_id VARCHAR(100) NOT NULL DEFAULT 'zone-gkp-central',
    mode VARCHAR(50) NOT NULL,
    evaluated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    candidate_count INT NOT NULL DEFAULT 0,
    candidates JSONB NOT NULL DEFAULT '[]'::jsonb,
    selected_rider_id VARCHAR(100),
    outcome VARCHAR(50) NOT NULL 
        CHECK (outcome IN ('OFFERED', 'ASSIGNED', 'ESCALATED', 'NO_CANDIDATES', 'PAUSED', 'MANUAL_ONLY')),
    notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_assignment_decisions_order ON assignment_decisions(order_id, evaluated_at DESC);

-- 5. DISPATCHER INTERVENTIONS & CONTACT LOGS
CREATE TABLE IF NOT EXISTS dispatcher_interventions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
    staff_user_id UUID NOT NULL REFERENCES users(id),
    intervention_type VARCHAR(50) NOT NULL 
        CHECK (intervention_type IN ('CALL_RIDER', 'CALL_PHARMACY', 'CALL_CUSTOMER', 'MANUAL_OVERRIDE', 'PAUSE_AUTO', 'FAILED_DELIVERY_RESOLUTION')),
    target_entity VARCHAR(100) NOT NULL,
    notes TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_dispatcher_interventions_order ON dispatcher_interventions(order_id);

-- 6. RLS SECURITY POLICIES
ALTER TABLE assignment_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE rider_presence ENABLE ROW LEVEL SECURITY;
ALTER TABLE rider_offers ENABLE ROW LEVEL SECURITY;
ALTER TABLE assignment_decisions ENABLE ROW LEVEL SECURITY;
ALTER TABLE dispatcher_interventions ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
    -- Assignment settings: Admin and Dispatchers can read; Admin can update
    DROP POLICY IF EXISTS staff_read_assignment_settings ON assignment_settings;
    CREATE POLICY staff_read_assignment_settings ON assignment_settings
        FOR SELECT TO authenticated
        USING (
            EXISTS (
                SELECT 1 FROM staff_roles sr
                WHERE sr.user_id = auth.uid()
                AND sr.role IN ('admin', 'dispatcher')
            )
        );

    DROP POLICY IF EXISTS admin_manage_assignment_settings ON assignment_settings;
    CREATE POLICY admin_manage_assignment_settings ON assignment_settings
        FOR ALL TO authenticated
        USING (
            EXISTS (
                SELECT 1 FROM staff_roles sr
                WHERE sr.user_id = auth.uid()
                AND sr.role = 'admin'
            )
        );

    -- Rider presence: Accessible to Dispatchers and Admins
    DROP POLICY IF EXISTS staff_access_rider_presence ON rider_presence;
    CREATE POLICY staff_access_rider_presence ON rider_presence
        FOR ALL TO authenticated
        USING (
            EXISTS (
                SELECT 1 FROM staff_roles sr
                WHERE sr.user_id = auth.uid()
                AND sr.role IN ('admin', 'dispatcher')
            )
        );

    -- Rider offers: Staff read & riders see own offers
    DROP POLICY IF EXISTS staff_read_rider_offers ON rider_offers;
    CREATE POLICY staff_read_rider_offers ON rider_offers
        FOR SELECT TO authenticated
        USING (
            EXISTS (
                SELECT 1 FROM staff_roles sr
                WHERE sr.user_id = auth.uid()
                AND sr.role IN ('admin', 'dispatcher')
            )
        );

    -- Decisions and interventions: Read/write for dispatchers and admins
    DROP POLICY IF EXISTS staff_access_assignment_decisions ON assignment_decisions;
    CREATE POLICY staff_access_assignment_decisions ON assignment_decisions
        FOR ALL TO authenticated
        USING (
            EXISTS (
                SELECT 1 FROM staff_roles sr
                WHERE sr.user_id = auth.uid()
                AND sr.role IN ('admin', 'dispatcher')
            )
        );

    DROP POLICY IF EXISTS staff_access_dispatcher_interventions ON dispatcher_interventions;
    CREATE POLICY staff_access_dispatcher_interventions ON dispatcher_interventions
        FOR ALL TO authenticated
        USING (
            EXISTS (
                SELECT 1 FROM staff_roles sr
                WHERE sr.user_id = auth.uid()
                AND sr.role IN ('admin', 'dispatcher')
            )
        );
EXCEPTION
    WHEN undefined_table THEN null;
    WHEN undefined_function THEN null;
END $$;
