-- ==============================================================================
-- MERCATO AI — SUPABASE POSTGRESQL SCHEMA MIGRATION
-- Migration: 20260911_initial_schema.sql
-- Description: Multi-tenant schema with Role-Based Access Control (RBAC),
--              inventory movement ledger, business events, and deterministic auditing.
-- ==============================================================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. ENUMS
DO $$ BEGIN
    CREATE TYPE membership_role AS ENUM ('owner', 'manager', 'staff');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE inventory_movement_type AS ENUM ('sale', 'restock', 'return', 'adjustment', 'damage', 'internal_use');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE inventory_reference_type AS ENUM ('transaction', 'expense', 'manual_adjustment', 'stocktake');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE transaction_type AS ENUM ('sale', 'refund');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE payment_method AS ENUM ('cash', 'card', 'transfer', 'digital');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE business_event_type AS ENUM (
        'SALE_RECORDED',
        'EXPENSE_RECORDED',
        'PRODUCT_RESTOCKED',
        'STOCK_ADJUSTED',
        'PRICE_CHANGED',
        'AI_RECOMMENDATION_CREATED',
        'RECOMMENDATION_ACCEPTED',
        'RECOMMENDATION_REJECTED',
        'MEMORY_CREATED'
    );
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE event_severity AS ENUM ('normal', 'warning', 'positive', 'critical');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- 2. USERS TABLE
CREATE TABLE IF NOT EXISTS users (
    id TEXT PRIMARY KEY,
    email TEXT UNIQUE NOT NULL,
    full_name TEXT NOT NULL,
    avatar_url TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 3. BUSINESSES TABLE (TENANTS)
CREATE TABLE IF NOT EXISTS businesses (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    slug TEXT UNIQUE NOT NULL,
    type TEXT NOT NULL DEFAULT 'grocery',
    currency TEXT NOT NULL DEFAULT 'USD',
    currency_symbol TEXT NOT NULL DEFAULT '$',
    target_daily_revenue NUMERIC(12, 2) NOT NULL DEFAULT 500.00,
    operating_hours TEXT NOT NULL DEFAULT '8:00 AM - 7:00 PM',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 4. BUSINESS MEMBERSHIPS (MULTI-TENANT RBAC)
-- A user can belong to multiple businesses with different roles.
CREATE TABLE IF NOT EXISTS business_memberships (
    id TEXT PRIMARY KEY DEFAULT 'bm_' || substr(md5(random()::text), 1, 16),
    user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    business_id TEXT NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
    role membership_role NOT NULL DEFAULT 'staff',
    joined_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT unique_user_business UNIQUE(user_id, business_id)
);

-- 5. PRODUCTS TABLE
CREATE TABLE IF NOT EXISTS products (
    id TEXT PRIMARY KEY DEFAULT 'prod_' || substr(md5(random()::text), 1, 16),
    business_id TEXT NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    sku TEXT,
    category TEXT NOT NULL DEFAULT 'General',
    cost_price NUMERIC(10, 2) NOT NULL DEFAULT 0.00 CHECK (cost_price >= 0),
    selling_price NUMERIC(10, 2) NOT NULL DEFAULT 0.00 CHECK (selling_price >= 0),
    current_stock INTEGER NOT NULL DEFAULT 0 CHECK (current_stock >= 0),
    reorder_point INTEGER NOT NULL DEFAULT 5 CHECK (reorder_point >= 0),
    reorder_quantity INTEGER NOT NULL DEFAULT 20 CHECK (reorder_quantity > 0),
    unit TEXT NOT NULL DEFAULT 'unit',
    supplier TEXT,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 6. TRANSACTIONS TABLE
CREATE TABLE IF NOT EXISTS transactions (
    id TEXT PRIMARY KEY DEFAULT 'tx_' || substr(md5(random()::text), 1, 16),
    business_id TEXT NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
    actor_user_id TEXT REFERENCES users(id) ON DELETE SET NULL,
    type transaction_type NOT NULL DEFAULT 'sale',
    subtotal NUMERIC(12, 2) NOT NULL DEFAULT 0.00,
    tax NUMERIC(10, 2) NOT NULL DEFAULT 0.00,
    total_amount NUMERIC(12, 2) NOT NULL DEFAULT 0.00,
    payment_method payment_method NOT NULL DEFAULT 'card',
    status TEXT NOT NULL DEFAULT 'completed',
    notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 7. TRANSACTION ITEMS TABLE
CREATE TABLE IF NOT EXISTS transaction_items (
    id TEXT PRIMARY KEY DEFAULT 'txi_' || substr(md5(random()::text), 1, 16),
    transaction_id TEXT NOT NULL REFERENCES transactions(id) ON DELETE CASCADE,
    product_id TEXT REFERENCES products(id) ON DELETE SET NULL,
    name TEXT NOT NULL,
    quantity INTEGER NOT NULL CHECK (quantity > 0),
    unit_price NUMERIC(10, 2) NOT NULL DEFAULT 0.00 CHECK (unit_price >= 0),
    cost_price NUMERIC(10, 2) NOT NULL DEFAULT 0.00 CHECK (cost_price >= 0),
    subtotal NUMERIC(12, 2) NOT NULL DEFAULT 0.00
);

-- 8. EXPENSES TABLE
CREATE TABLE IF NOT EXISTS expenses (
    id TEXT PRIMARY KEY DEFAULT 'exp_' || substr(md5(random()::text), 1, 16),
    business_id TEXT NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
    actor_user_id TEXT REFERENCES users(id) ON DELETE SET NULL,
    category TEXT NOT NULL DEFAULT 'inventory',
    amount NUMERIC(12, 2) NOT NULL DEFAULT 0.00 CHECK (amount >= 0),
    vendor TEXT NOT NULL,
    description TEXT NOT NULL,
    receipt_url TEXT,
    payment_method payment_method NOT NULL DEFAULT 'card',
    status TEXT NOT NULL DEFAULT 'cleared',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 9. INVENTORY MOVEMENTS TABLE (LEDGER OF TRUTH)
-- Strictly captures every addition, deduction, or adjustment with previous and resulting stock.
CREATE TABLE IF NOT EXISTS inventory_movements (
    id TEXT PRIMARY KEY DEFAULT 'mov_' || substr(md5(random()::text), 1, 16),
    business_id TEXT NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
    product_id TEXT NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    type inventory_movement_type NOT NULL,
    quantity_delta INTEGER NOT NULL, -- Negative for sales/damage, positive for restock/returns
    resulting_stock INTEGER NOT NULL CHECK (resulting_stock >= 0),
    reference_type inventory_reference_type NOT NULL DEFAULT 'manual_adjustment',
    reference_id TEXT, -- e.g. transaction_id or expense_id
    reason TEXT,
    actor_user_id TEXT REFERENCES users(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 10. BUSINESS EVENTS TABLE (IMMUTABLE AUDIT LOG)
CREATE TABLE IF NOT EXISTS business_events (
    id TEXT PRIMARY KEY DEFAULT 'evt_' || substr(md5(random()::text), 1, 16),
    business_id TEXT NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
    actor_user_id TEXT REFERENCES users(id) ON DELETE SET NULL,
    type business_event_type NOT NULL,
    title TEXT NOT NULL,
    detail TEXT NOT NULL,
    metadata JSONB DEFAULT '{}'::jsonb,
    severity event_severity NOT NULL DEFAULT 'normal',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 11. PERFORMANCE INDEXES
CREATE INDEX IF NOT EXISTS idx_memberships_user ON business_memberships(user_id);
CREATE INDEX IF NOT EXISTS idx_memberships_business ON business_memberships(business_id);
CREATE INDEX IF NOT EXISTS idx_products_business ON products(business_id);
CREATE INDEX IF NOT EXISTS idx_transactions_business ON transactions(business_id);
CREATE INDEX IF NOT EXISTS idx_transaction_items_tx ON transaction_items(transaction_id);
CREATE INDEX IF NOT EXISTS idx_expenses_business ON expenses(business_id);
CREATE INDEX IF NOT EXISTS idx_inventory_movements_prod ON inventory_movements(product_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_inventory_movements_biz ON inventory_movements(business_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_business_events_biz ON business_events(business_id, created_at DESC);

-- 12. ROW LEVEL SECURITY (RLS) FOR SUPABASE
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE businesses ENABLE ROW LEVEL SECURITY;
ALTER TABLE business_memberships ENABLE ROW LEVEL SECURITY;
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE transaction_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE expenses ENABLE ROW LEVEL SECURITY;
ALTER TABLE inventory_movements ENABLE ROW LEVEL SECURITY;
ALTER TABLE business_events ENABLE ROW LEVEL SECURITY;
