-- ============================================================================
-- 010_a2_admin_overview_and_alerts.sql
-- Medcure Platform Admin Milestone A2: Overview, Live Operations & Alerts
-- ============================================================================

-- 1. Operational Alerts Table
CREATE TABLE IF NOT EXISTS operational_alerts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    alert_type VARCHAR(64) NOT NULL, -- 'SLA_BREACH', 'PHARMACY_UNRESPONSIVE', 'RIDER_OFFLINE', 'PAYMENT_MISMATCH', 'LICENCE_EXPIRING', 'NEAR_EXPIRY_STOCK', 'RECALLED_PRODUCT', 'HIGH_PRIORITY_TICKET'
    severity VARCHAR(16) NOT NULL CHECK (severity IN ('critical', 'warning', 'info')),
    title VARCHAR(255) NOT NULL,
    description TEXT NOT NULL,
    entity_type VARCHAR(64) NOT NULL, -- 'order', 'pharmacy', 'rider', 'payment', 'product', 'ticket'
    entity_id VARCHAR(128) NOT NULL,
    sla_breach_minutes INTEGER DEFAULT 0,
    is_resolved BOOLEAN DEFAULT FALSE,
    resolved_by UUID REFERENCES staff_roles(id),
    resolved_at TIMESTAMPTZ,
    resolution_notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexing for live monitoring
CREATE INDEX IF NOT EXISTS idx_alerts_unresolved ON operational_alerts(is_resolved, severity, created_at);
CREATE INDEX IF NOT EXISTS idx_alerts_entity ON operational_alerts(entity_type, entity_id);

-- 2. Enable Row Level Security (RLS)
ALTER TABLE operational_alerts ENABLE ROW LEVEL SECURITY;

-- 3. RLS Policies
-- Administrators & Dispatchers have read access to operational alerts
CREATE POLICY "staff_read_operational_alerts"
ON operational_alerts
FOR SELECT
TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM staff_roles sr
        WHERE sr.user_id = auth.uid()
        AND sr.role IN ('admin', 'dispatcher', 'support_operator')
    )
);

-- Only Platform Administrators and automated background workers can resolve alerts
CREATE POLICY "admin_resolve_operational_alerts"
ON operational_alerts
FOR UPDATE
TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM staff_roles sr
        WHERE sr.user_id = auth.uid()
        AND sr.role = 'admin'
    )
)
WITH CHECK (
    EXISTS (
        SELECT 1 FROM staff_roles sr
        WHERE sr.user_id = auth.uid()
        AND sr.role = 'admin'
    )
);

-- 4. View for Admin KPI Aggregation
CREATE OR REPLACE VIEW v_admin_kpis AS
SELECT
    COUNT(*) FILTER (WHERE DATE(created_at) = CURRENT_DATE) AS orders_today,
    COUNT(*) FILTER (WHERE status IN ('placed', 'pending_pharmacist_review')) AS awaiting_pharmacy_review,
    COUNT(*) FILTER (WHERE status IN ('pharmacist_approved', 'packing')) AS being_fulfilled,
    COUNT(*) FILTER (WHERE status IN ('rider_assigned', 'out_for_delivery')) AS deliveries_in_progress,
    COUNT(*) FILTER (WHERE status IN ('cancelled', 'failed')) AS failed_and_cancelled,
    COALESCE(SUM(total_amount_paise) FILTER (WHERE payment_status = 'captured'), 0) AS revenue_paise,
    COALESCE(SUM(refunded_amount_paise), 0) AS refunds_paise,
    COALESCE(SUM(total_amount_paise) FILTER (WHERE payment_method = 'cod' AND status = 'delivered' AND cod_settled = false), 0) AS cod_cash_outstanding_paise
FROM orders;
