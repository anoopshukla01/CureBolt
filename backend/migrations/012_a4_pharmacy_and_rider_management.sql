-- ============================================================================
-- MIGRATION: 012_a4_pharmacy_and_rider_management.sql
-- Admin Milestone A4: Pharmacy and Rider Management, Compliance & Cash Settlement
-- PostgreSQL 15+ compatible with Supabase and PostGIS
-- ============================================================================

-- 1. PHARMACY VERIFICATION CHECKLISTS
CREATE TABLE IF NOT EXISTS pharmacy_verification_checklists (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    application_id UUID NOT NULL REFERENCES pharmacy_onboarding_applications(id) ON DELETE CASCADE,
    licence_validity_verified BOOLEAN NOT NULL DEFAULT FALSE,
    registration_verified BOOLEAN NOT NULL DEFAULT FALSE,
    physical_address_verified BOOLEAN NOT NULL DEFAULT FALSE,
    authorised_persons_verified BOOLEAN NOT NULL DEFAULT FALSE,
    pharmacist_credentials_verified BOOLEAN NOT NULL DEFAULT FALSE,
    verification_notes TEXT,
    verified_by UUID REFERENCES users(id),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT uq_pharmacy_checklist_app UNIQUE (application_id)
);

CREATE INDEX IF NOT EXISTS idx_pharma_checklist_app ON pharmacy_verification_checklists(application_id);

-- 2. PHARMACY COMPLIANCE EXCEPTIONS LOG
CREATE TABLE IF NOT EXISTS pharmacy_compliance_exceptions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    pharmacy_id UUID NOT NULL REFERENCES pharmacies(id) ON DELETE CASCADE,
    order_id UUID REFERENCES orders(id) ON DELETE SET NULL,
    exception_type VARCHAR(50) NOT NULL CHECK (exception_type IN (
        'DISPENSING_DISCREPANCY',
        'MISSING_PHARMACIST_SIGNATURE',
        'TEMPERATURE_EXCURSION',
        'DELAYED_HANDOVER',
        'STOCK_MISMATCH',
        'EXPIRED_STOCK_ATTEMPT',
        'CUSTOMER_COMPLAINT',
        'REGULATORY_NOTICE'
    )),
    severity VARCHAR(20) NOT NULL CHECK (severity IN ('LOW', 'MEDIUM', 'HIGH', 'CRITICAL')),
    description TEXT NOT NULL,
    reported_by UUID NOT NULL REFERENCES users(id),
    resolution_notes TEXT,
    is_resolved BOOLEAN NOT NULL DEFAULT FALSE,
    resolved_by UUID REFERENCES users(id),
    resolved_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_pharma_exceptions_pharmacy ON pharmacy_compliance_exceptions(pharmacy_id, is_resolved);

-- 3. PHARMACY COMMISSION & SETTLEMENT CONFIGURATION
CREATE TABLE IF NOT EXISTS pharmacy_commission_settings (
    pharmacy_id UUID PRIMARY KEY REFERENCES pharmacies(id) ON DELETE CASCADE,
    commission_rate_pct DECIMAL(5, 2) NOT NULL DEFAULT 8.50 CHECK (commission_rate_pct >= 0 AND commission_rate_pct <= 50),
    fixed_platform_fee_paise BIGINT NOT NULL DEFAULT 1500 CHECK (fixed_platform_fee_paise >= 0),
    payout_cycle VARCHAR(20) NOT NULL DEFAULT 'WEEKLY' CHECK (payout_cycle IN ('DAILY', 'WEEKLY', 'BIWEEKLY', 'MONTHLY')),
    min_payout_threshold_paise BIGINT NOT NULL DEFAULT 50000,
    bank_account_masked VARCHAR(30),
    bank_ifsc VARCHAR(15),
    upi_id_masked VARCHAR(50),
    beneficiary_name VARCHAR(150),
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    updated_by UUID REFERENCES users(id),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 4. RIDER VERIFICATION CHECKLISTS
CREATE TABLE IF NOT EXISTS rider_verification_checklists (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    application_id UUID NOT NULL REFERENCES rider_onboarding_applications(id) ON DELETE CASCADE,
    driving_licence_verified BOOLEAN NOT NULL DEFAULT FALSE,
    vehicle_rc_verified BOOLEAN NOT NULL DEFAULT FALSE,
    identity_verified BOOLEAN NOT NULL DEFAULT FALSE,
    background_check_cleared BOOLEAN NOT NULL DEFAULT FALSE,
    verification_notes TEXT,
    verified_by UUID REFERENCES users(id),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT uq_rider_checklist_app UNIQUE (application_id)
);

CREATE INDEX IF NOT EXISTS idx_rider_checklist_app ON rider_verification_checklists(application_id);

-- 5. RIDER INCIDENT REPORTS
CREATE TABLE IF NOT EXISTS rider_incident_reports (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    rider_id UUID NOT NULL REFERENCES rider_profiles(id) ON DELETE CASCADE,
    order_id UUID REFERENCES orders(id) ON DELETE SET NULL,
    incident_type VARCHAR(50) NOT NULL CHECK (incident_type IN (
        'ACCIDENT',
        'SPILL_DAMAGE',
        'CUSTOMER_DISPUTE',
        'DELAYED_DELIVERY',
        'VEHICLE_BREAKDOWN',
        'CASH_DISCREPANCY',
        'BEHAVIOURAL_ISSUE',
        'OTHER'
    )),
    severity VARCHAR(20) NOT NULL CHECK (severity IN ('LOW', 'MEDIUM', 'HIGH', 'CRITICAL')),
    description TEXT NOT NULL,
    reported_by UUID NOT NULL REFERENCES users(id),
    status VARCHAR(30) NOT NULL DEFAULT 'OPEN' CHECK (status IN ('OPEN', 'INVESTIGATING', 'RESOLVED', 'CLOSED')),
    resolution_notes TEXT,
    resolved_by UUID REFERENCES users(id),
    resolved_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_rider_incidents_rider ON rider_incident_reports(rider_id, status);

-- 6. RIDER CASH DEPOSITS & SETTLEMENT
CREATE TABLE IF NOT EXISTS rider_cash_deposits (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    rider_id UUID NOT NULL REFERENCES rider_profiles(id) ON DELETE CASCADE,
    amount_paise BIGINT NOT NULL CHECK (amount_paise > 0),
    deposit_method VARCHAR(30) NOT NULL CHECK (deposit_method IN ('BANK_DEPOSIT', 'UPI_TRANSFER', 'HUB_CASH')),
    reference_number VARCHAR(100),
    notes TEXT,
    status VARCHAR(30) NOT NULL DEFAULT 'SUBMITTED' CHECK (status IN ('SUBMITTED', 'CONFIRMED', 'REJECTED')),
    confirmed_by UUID REFERENCES users(id),
    confirmed_at TIMESTAMPTZ,
    rejection_reason TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_rider_deposits_rider ON rider_cash_deposits(rider_id, status);

-- 7. RIDER PAYOUT BATCHES
CREATE TABLE IF NOT EXISTS rider_payout_batches (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    period_start DATE NOT NULL,
    period_end DATE NOT NULL,
    total_riders INT NOT NULL DEFAULT 0,
    total_amount_paise BIGINT NOT NULL DEFAULT 0,
    status VARCHAR(30) NOT NULL DEFAULT 'DRAFT' CHECK (status IN ('DRAFT', 'APPROVED', 'PROCESSED')),
    created_by UUID REFERENCES users(id),
    processed_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 8. ROW LEVEL SECURITY
ALTER TABLE pharmacy_verification_checklists ENABLE ROW LEVEL SECURITY;
ALTER TABLE pharmacy_compliance_exceptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE pharmacy_commission_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE rider_verification_checklists ENABLE ROW LEVEL SECURITY;
ALTER TABLE rider_incident_reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE rider_cash_deposits ENABLE ROW LEVEL SECURITY;
ALTER TABLE rider_payout_batches ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
    DROP POLICY IF EXISTS admin_manage_pharma_checklists ON pharmacy_verification_checklists;
    CREATE POLICY admin_manage_pharma_checklists ON pharmacy_verification_checklists
        FOR ALL USING (auth.jwt() ->> 'role' = 'platform_admin');

    DROP POLICY IF EXISTS admin_manage_pharma_exceptions ON pharmacy_compliance_exceptions;
    CREATE POLICY admin_manage_pharma_exceptions ON pharmacy_compliance_exceptions
        FOR ALL USING (auth.jwt() ->> 'role' IN ('platform_admin', 'dispatcher'));

    DROP POLICY IF EXISTS admin_manage_pharma_commissions ON pharmacy_commission_settings;
    CREATE POLICY admin_manage_pharma_commissions ON pharmacy_commission_settings
        FOR ALL USING (auth.jwt() ->> 'role' = 'platform_admin');

    DROP POLICY IF EXISTS admin_manage_rider_checklists ON rider_verification_checklists;
    CREATE POLICY admin_manage_rider_checklists ON rider_verification_checklists
        FOR ALL USING (auth.jwt() ->> 'role' = 'platform_admin');

    DROP POLICY IF EXISTS admin_manage_rider_incidents ON rider_incident_reports;
    CREATE POLICY admin_manage_rider_incidents ON rider_incident_reports
        FOR ALL USING (auth.jwt() ->> 'role' IN ('platform_admin', 'dispatcher'));

    DROP POLICY IF EXISTS admin_manage_rider_deposits ON rider_cash_deposits;
    CREATE POLICY admin_manage_rider_deposits ON rider_cash_deposits
        FOR ALL USING (auth.jwt() ->> 'role' IN ('platform_admin', 'dispatcher'));

    DROP POLICY IF EXISTS admin_manage_payouts ON rider_payout_batches;
    CREATE POLICY admin_manage_payouts ON rider_payout_batches
        FOR ALL USING (auth.jwt() ->> 'role' = 'platform_admin');
EXCEPTION
    WHEN undefined_table THEN null;
    WHEN undefined_function THEN null;
END $$;
