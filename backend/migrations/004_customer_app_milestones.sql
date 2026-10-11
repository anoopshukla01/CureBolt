-- ============================================================================
-- MIGRATION: 004_customer_app_milestones.sql
-- Customer Mobile App: Auth, Profile, Location, PostGIS Zones, Catalogue & Cart
-- Compatible with Supabase / PostgreSQL 15+ with PostGIS and Row Level Security
-- ============================================================================

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "postgis";

-- 1. EXTEND USERS TABLE (Milestone 1)
ALTER TABLE users
ADD COLUMN IF NOT EXISTS date_of_birth DATE,
ADD COLUMN IF NOT EXISTS terms_version VARCHAR(50),
ADD COLUMN IF NOT EXISTS terms_accepted_at TIMESTAMPTZ;

-- Add age constraint rule check (configured at minimum 18 years)
DO $$ BEGIN
    ALTER TABLE users
    ADD CONSTRAINT chk_user_min_age 
    CHECK (date_of_birth IS NULL OR date_of_birth <= CURRENT_DATE - INTERVAL '18 years');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- 2. DELIVERY ZONES FOR POSTGIS PILOT (Milestone 2)
CREATE TABLE IF NOT EXISTS delivery_zones (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    city VARCHAR(50) NOT NULL DEFAULT 'Gorakhpur',
    name VARCHAR(100) NOT NULL,
    polygon GEOMETRY(Polygon, 4326) NOT NULL,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_delivery_zones_geom ON delivery_zones USING GIST (polygon);

-- 3. CUSTOMER ADDRESSES EXTENSIONS (Milestone 2)
ALTER TABLE customer_addresses
ADD COLUMN IF NOT EXISTS label VARCHAR(30) DEFAULT 'Home',
ADD COLUMN IF NOT EXISTS accuracy_m DECIMAL(6, 2) DEFAULT 10.0,
ADD COLUMN IF NOT EXISTS receiver_name VARCHAR(150),
ADD COLUMN IF NOT EXISTS receiver_phone VARCHAR(15),
ADD COLUMN IF NOT EXISTS location GEOMETRY(Point, 4326);

CREATE INDEX IF NOT EXISTS idx_customer_addresses_loc ON customer_addresses USING GIST (location);

-- 4. SERVER CARTS EXTENSION (Milestone 4)
ALTER TABLE carts
ADD COLUMN IF NOT EXISTS address_id UUID REFERENCES customer_addresses(id);

-- Ensure 1 active cart per user
CREATE UNIQUE INDEX IF NOT EXISTS idx_one_cart_per_user ON carts(user_id);

-- 5. ROW LEVEL SECURITY (RLS) POLICIES
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE customer_addresses ENABLE ROW LEVEL SECURITY;
ALTER TABLE carts ENABLE ROW LEVEL SECURITY;
ALTER TABLE cart_items ENABLE ROW LEVEL SECURITY;

-- Helper to safely recreate RLS policies
DO $$ BEGIN
    DROP POLICY IF EXISTS users_self_manage ON users;
    CREATE POLICY users_self_manage ON users
        FOR ALL
        USING (auth.uid() = id)
        WITH CHECK (auth.uid() = id);

    DROP POLICY IF EXISTS addresses_self_manage ON customer_addresses;
    CREATE POLICY addresses_self_manage ON customer_addresses
        FOR ALL
        USING (auth.uid() = user_id)
        WITH CHECK (auth.uid() = user_id);

    DROP POLICY IF EXISTS carts_self_manage ON carts;
    CREATE POLICY carts_self_manage ON carts
        FOR ALL
        USING (auth.uid() = user_id)
        WITH CHECK (auth.uid() = user_id);

    DROP POLICY IF EXISTS cart_items_self_manage ON cart_items;
    CREATE POLICY cart_items_self_manage ON cart_items
        FOR ALL
        USING (EXISTS (
            SELECT 1 FROM carts 
            WHERE carts.id = cart_items.cart_id 
            AND carts.user_id = auth.uid()
        ))
        WITH CHECK (EXISTS (
            SELECT 1 FROM carts 
            WHERE carts.id = cart_items.cart_id 
            AND carts.user_id = auth.uid()
        ));
EXCEPTION
    WHEN undefined_table THEN null;
    WHEN undefined_function THEN null;
END $$;

-- 6. SEED GORAKHPUR PILOT DELIVERY ZONE
INSERT INTO delivery_zones (id, city, name, polygon, is_active)
VALUES (
    '88888888-8888-8888-8888-888888888881',
    'Gorakhpur',
    'Gorakhpur Core Urban Cluster (Golghar - Medical College - Taramandal)',
    ST_SetSRID(ST_GeomFromGeoJSON('{
        "type": "Polygon",
        "coordinates": [[
            [83.3300, 26.7200],
            [83.4300, 26.7200],
            [83.4300, 26.8200],
            [83.3300, 26.8200],
            [83.3300, 26.7200]
        ]]
    }'), 4326),
    TRUE
)
ON CONFLICT (id) DO NOTHING;
