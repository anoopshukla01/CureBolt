-- ============================================================================
-- MIGRATION: 005_m5_checkout_and_reservations.sql
-- Medcure Milestone 5: Checkout, Inventory Reservations & Idempotent Order Creation
-- PostGIS & Supabase PostgreSQL 15+ compatible
-- ============================================================================

-- 1. ADD PAISE AND METADATA COLUMNS TO ORDERS & ORDER ITEMS
ALTER TABLE orders
ADD COLUMN IF NOT EXISTS item_total_paise BIGINT NOT NULL DEFAULT 0,
ADD COLUMN IF NOT EXISTS delivery_fee_paise BIGINT NOT NULL DEFAULT 0,
ADD COLUMN IF NOT EXISTS handling_fee_paise BIGINT NOT NULL DEFAULT 0,
ADD COLUMN IF NOT EXISTS discount_paise BIGINT NOT NULL DEFAULT 0,
ADD COLUMN IF NOT EXISTS payable_amount_paise BIGINT NOT NULL DEFAULT 0,
ADD COLUMN IF NOT EXISTS delivery_note VARCHAR(200),
ADD COLUMN IF NOT EXISTS receiver_name VARCHAR(150),
ADD COLUMN IF NOT EXISTS receiver_phone VARCHAR(15),
ADD COLUMN IF NOT EXISTS pharmacy_name_snapshot VARCHAR(200),
ADD COLUMN IF NOT EXISTS delivery_address_snapshot JSONB,
ADD COLUMN IF NOT EXISTS idempotency_key VARCHAR(255);

CREATE INDEX IF NOT EXISTS idx_orders_idempotency_key ON orders(idempotency_key);

ALTER TABLE order_items
ADD COLUMN IF NOT EXISTS pack_size_snapshot VARCHAR(100),
ADD COLUMN IF NOT EXISTS unit_price_paise BIGINT NOT NULL DEFAULT 0,
ADD COLUMN IF NOT EXISTS unit_mrp_paise BIGINT NOT NULL DEFAULT 0,
ADD COLUMN IF NOT EXISTS line_total_paise BIGINT NOT NULL DEFAULT 0,
ADD COLUMN IF NOT EXISTS requires_prescription BOOLEAN NOT NULL DEFAULT FALSE;

-- 2. INVENTORY RESERVATIONS TABLE
CREATE TABLE IF NOT EXISTS inventory_reservations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
    pharmacy_id UUID NOT NULL REFERENCES pharmacies(id) ON DELETE RESTRICT,
    product_id UUID NOT NULL REFERENCES products(id) ON DELETE RESTRICT,
    quantity INT NOT NULL CHECK (quantity > 0),
    expires_at TIMESTAMPTZ NOT NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'ACTIVE' CHECK (status IN ('ACTIVE', 'CONFIRMED', 'RELEASED')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_reservations_order ON inventory_reservations(order_id);
CREATE INDEX IF NOT EXISTS idx_reservations_expiry ON inventory_reservations(expires_at, status);

-- 3. ORDER STATUS HISTORY TABLE
CREATE TABLE IF NOT EXISTS order_status_history (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
    from_state VARCHAR(50),
    to_state VARCHAR(50) NOT NULL,
    actor_id UUID REFERENCES users(id),
    actor_role VARCHAR(50) DEFAULT 'system',
    reason TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_order_status_history_order ON order_status_history(order_id);

-- 4. IDEMPOTENCY KEYS STORE
CREATE TABLE IF NOT EXISTS idempotency_keys (
    key VARCHAR(255) PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    request_hash VARCHAR(64) NOT NULL,
    response_status INT NOT NULL,
    response_body JSONB NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    expires_at TIMESTAMPTZ NOT NULL DEFAULT (NOW() + INTERVAL '24 hours')
);

CREATE INDEX IF NOT EXISTS idx_idempotency_keys_user ON idempotency_keys(user_id);

-- 5. ROW LEVEL SECURITY (RLS) FOR ORDER HISTORY & RESERVATIONS
ALTER TABLE inventory_reservations ENABLE ROW LEVEL SECURITY;
ALTER TABLE order_status_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE idempotency_keys ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
    DROP POLICY IF EXISTS order_status_history_customer_view ON order_status_history;
    CREATE POLICY order_status_history_customer_view ON order_status_history
        FOR SELECT
        USING (EXISTS (
            SELECT 1 FROM orders 
            WHERE orders.id = order_status_history.order_id 
            AND orders.user_id = auth.uid()
        ));

    DROP POLICY IF EXISTS idempotency_keys_self_manage ON idempotency_keys;
    CREATE POLICY idempotency_keys_self_manage ON idempotency_keys
        FOR ALL
        USING (auth.uid() = user_id)
        WITH CHECK (auth.uid() = user_id);
EXCEPTION
    WHEN undefined_table THEN null;
    WHEN undefined_function THEN null;
END $$;
