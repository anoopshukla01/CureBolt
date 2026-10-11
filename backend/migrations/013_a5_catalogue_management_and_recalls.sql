-- ============================================================================
-- 013_a5_catalogue_management_and_recalls.sql
-- Milestone A5: Master Catalogue Management, Statutory Controls & Batch Recalls
-- ============================================================================

-- 1. Extend products table with catalogue controls & safeguards
ALTER TABLE products 
ADD COLUMN IF NOT EXISTS max_order_quantity INT DEFAULT 10,
ADD COLUMN IF NOT EXISTS is_active_in_catalogue BOOLEAN DEFAULT true;

-- 2. Two-Person Approval Requests for Safety-Critical Modifications
-- Required for: Schedule classification changes, OTC_DIRECT allow-list toggles, Max Qty overrides
CREATE TABLE IF NOT EXISTS two_person_approvals (
    id VARCHAR(64) PRIMARY KEY,
    action_type VARCHAR(64) NOT NULL, -- 'OTC_DIRECT_TOGGLE', 'SCHEDULE_CHANGE', 'MAX_QUANTITY_CHANGE', 'PRICE_MRP_OVERRIDE'
    target_product_id VARCHAR(64) NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    target_product_name VARCHAR(255) NOT NULL,
    proposed_changes JSONB NOT NULL, -- e.g. {"field": "isOtcDirect", "oldValue": false, "newValue": true}
    justification TEXT NOT NULL,
    requested_by VARCHAR(64) NOT NULL REFERENCES users(id),
    requested_by_name VARCHAR(255) NOT NULL,
    requested_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    reviewed_by VARCHAR(64) REFERENCES users(id),
    reviewed_by_name VARCHAR(255),
    reviewed_at TIMESTAMPTZ,
    status VARCHAR(32) NOT NULL DEFAULT 'PENDING', -- 'PENDING', 'APPROVED', 'REJECTED', 'CANCELLED'
    rejection_reason TEXT,
    CONSTRAINT chk_two_person_distinct_actors CHECK (reviewed_by IS NULL OR reviewed_by <> requested_by)
);

CREATE INDEX IF NOT EXISTS idx_two_person_approvals_status ON two_person_approvals(status);
CREATE INDEX IF NOT EXISTS idx_two_person_approvals_product ON two_person_approvals(target_product_id);

-- 3. Product and Batch Recalls (Statutory Drug Safety Directives)
CREATE TABLE IF NOT EXISTS product_batch_recalls (
    id VARCHAR(64) PRIMARY KEY,
    product_id VARCHAR(64) NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    product_name VARCHAR(255) NOT NULL,
    batch_number VARCHAR(64) NOT NULL, -- 'ALL' for complete product recall, or specific batch number
    manufacturer_notice_ref VARCHAR(128) NOT NULL,
    recall_class VARCHAR(32) NOT NULL, -- 'CLASS_1_CRITICAL', 'CLASS_2_DEFECT', 'CLASS_3_MINOR'
    reason TEXT NOT NULL,
    issued_by VARCHAR(64) NOT NULL REFERENCES users(id),
    issued_by_name VARCHAR(255) NOT NULL,
    issued_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    status VARCHAR(32) NOT NULL DEFAULT 'ACTIVE', -- 'ACTIVE', 'RESOLVED', 'CANCELLED'
    resolution_notes TEXT,
    resolved_by VARCHAR(64) REFERENCES users(id),
    resolved_at TIMESTAMPTZ,
    affected_inventory_units INT NOT NULL DEFAULT 0,
    affected_active_orders_count INT NOT NULL DEFAULT 0
);

CREATE INDEX IF NOT EXISTS idx_product_batch_recalls_status ON product_batch_recalls(status);
CREATE INDEX IF NOT EXISTS idx_product_batch_recalls_product ON product_batch_recalls(product_id);
CREATE INDEX IF NOT EXISTS idx_product_batch_recalls_batch ON product_batch_recalls(batch_number);

-- 4. Catalogue Image Moderation Queue (Vendor/Pharmacy Image Verification)
CREATE TABLE IF NOT EXISTS catalogue_image_moderations (
    id VARCHAR(64) PRIMARY KEY,
    product_id VARCHAR(64) NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    product_name VARCHAR(255) NOT NULL,
    submitted_by_pharmacy_id VARCHAR(64) NOT NULL REFERENCES pharmacies(id),
    pharmacy_name VARCHAR(255) NOT NULL,
    image_url TEXT NOT NULL,
    submitted_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    status VARCHAR(32) NOT NULL DEFAULT 'PENDING', -- 'PENDING', 'APPROVED', 'REJECTED'
    reviewed_by VARCHAR(64) REFERENCES users(id),
    reviewed_at TIMESTAMPTZ,
    rejection_reason TEXT
);

CREATE INDEX IF NOT EXISTS idx_catalogue_image_moderations_status ON catalogue_image_moderations(status);
CREATE INDEX IF NOT EXISTS idx_catalogue_image_moderations_product ON catalogue_image_moderations(product_id);
