-- ============================================================================
-- MIGRATION: 003_v2_features.sql
-- Medcure Platform v2 Extensions:
-- - Server-side Carts
-- - Prescription OCR Results
-- - Cash on Delivery (COD) Collections & Settlements
-- - Realtime Rider Location Snapshots & Dynamic ETA Logs
-- - Product Images, OTC_DIRECT, and Database-Enforced MRP Constraints
-- ============================================================================

-- 1. ADD PAYMENT MODE ENUM & EXTEND ORDERS
DO $$ BEGIN
    CREATE TYPE payment_mode_enum AS ENUM ('ONLINE', 'COD');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE stock_badge_enum AS ENUM ('in_stock', 'low_stock', 'out_of_stock');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

ALTER TABLE orders 
ADD COLUMN IF NOT EXISTS payment_mode payment_mode_enum NOT NULL DEFAULT 'ONLINE';

-- 2. ENFORCE SELLING PRICE CANNOT EXCEED MRP
ALTER TABLE products
ADD COLUMN IF NOT EXISTS mrp DECIMAL(10, 2) NOT NULL DEFAULT 50.00 CHECK (mrp > 0),
ADD COLUMN IF NOT EXISTS is_otc_direct BOOLEAN NOT NULL DEFAULT FALSE;

DO $$ BEGIN
    ALTER TABLE products
    ADD CONSTRAINT chk_otc_direct_safety CHECK (NOT (requires_prescription AND is_otc_direct));
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    ALTER TABLE pharmacy_inventory
    ADD CONSTRAINT chk_price_cannot_exceed_mrp CHECK (selling_price <= mrp);
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- 3. RIDER PROFILES & CASH IN HAND
CREATE TABLE IF NOT EXISTS rider_profiles (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID UNIQUE NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    vehicle_type VARCHAR(50) NOT NULL DEFAULT 'Two Wheeler',
    vehicle_registration_number VARCHAR(50) NOT NULL,
    driving_licence_number VARCHAR(100) NOT NULL,
    is_available BOOLEAN NOT NULL DEFAULT FALSE,
    current_cash_in_hand DECIMAL(10, 2) NOT NULL DEFAULT 0.00 CHECK (current_cash_in_hand >= 0),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 4. SERVER-SIDE CARTS
CREATE TABLE IF NOT EXISTS carts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID UNIQUE NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    pharmacy_id UUID REFERENCES pharmacies(id),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS cart_items (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    cart_id UUID NOT NULL REFERENCES carts(id) ON DELETE CASCADE,
    product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    quantity INT NOT NULL CHECK (quantity > 0),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(cart_id, product_id)
);

-- 5. PRESCRIPTION OCR RESULTS
CREATE TABLE IF NOT EXISTS prescription_ocr_results (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    prescription_id UUID NOT NULL REFERENCES prescriptions(id) ON DELETE CASCADE,
    raw_extracted_text TEXT NOT NULL,
    extracted_doctor_name VARCHAR(150),
    extracted_reg_number VARCHAR(100),
    extracted_date VARCHAR(50),
    candidate_matches JSONB NOT NULL DEFAULT '[]'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 6. MEDICINE REQUESTS (Behind Feature Flag)
CREATE TABLE IF NOT EXISTS medicine_requests (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    pharmacy_id UUID NOT NULL REFERENCES pharmacies(id) ON DELETE CASCADE,
    medicine_name VARCHAR(200) NOT NULL,
    status VARCHAR(50) NOT NULL DEFAULT 'submitted',
    quoted_price DECIMAL(10, 2),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 7. REALTIME RIDER LOCATION SNAPSHOTS & ETA LOGS
CREATE TABLE IF NOT EXISTS rider_location_snapshots (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    rider_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    order_id UUID REFERENCES orders(id) ON DELETE CASCADE,
    latitude DECIMAL(10, 8) NOT NULL,
    longitude DECIMAL(11, 8) NOT NULL,
    heading DECIMAL(5, 2),
    speed_kmh DECIMAL(5, 2),
    recorded_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS eta_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
    predicted_eta_minutes INT NOT NULL,
    actual_duration_minutes INT,
    recorded_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 8. CASH ON DELIVERY (COD) COLLECTIONS & SETTLEMENTS
CREATE TABLE IF NOT EXISTS cod_collections (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    order_id UUID UNIQUE NOT NULL REFERENCES orders(id) ON DELETE RESTRICT,
    rider_id UUID NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
    amount_collected DECIMAL(10, 2) NOT NULL CHECK (amount_collected > 0),
    receipt_number VARCHAR(100) UNIQUE NOT NULL,
    collected_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS cod_settlements (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    rider_id UUID NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
    amount_deposited DECIMAL(10, 2) NOT NULL CHECK (amount_deposited > 0),
    deposit_reference VARCHAR(150) NOT NULL,
    verified_by UUID NOT NULL REFERENCES users(id),
    settled_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS payment_method_settings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    method_name VARCHAR(50) UNIQUE NOT NULL,
    is_enabled BOOLEAN NOT NULL DEFAULT TRUE,
    max_order_limit DECIMAL(10, 2) DEFAULT 5000.00,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS feature_flags (
    key VARCHAR(100) PRIMARY KEY,
    is_enabled BOOLEAN NOT NULL DEFAULT FALSE,
    description TEXT,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- INITIAL SEED FOR PAYMENT METHODS & FEATURE FLAGS
INSERT INTO payment_method_settings (method_name, is_enabled, max_order_limit)
VALUES 
    ('UPI', TRUE, 50000.00),
    ('CARDS', TRUE, 50000.00),
    ('NETBANKING', TRUE, 50000.00),
    ('WALLETS', TRUE, 10000.00),
    ('COD', TRUE, 2000.00)
ON CONFLICT (method_name) DO UPDATE SET is_enabled = EXCLUDED.is_enabled;

INSERT INTO feature_flags (key, is_enabled, description)
VALUES 
    ('MANUAL_MEDICINE_REQUEST', FALSE, 'Allow customers to request unlisted non-prescription medicines'),
    ('REALTIME_RIDER_MAP', TRUE, 'Show live moving rider pin and route on customer tracking screen'),
    ('ASSISTIVE_OCR_READER', TRUE, 'On-device text recognition and candidate medicine matching')
ON CONFLICT (key) DO NOTHING;
