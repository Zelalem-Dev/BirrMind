-- ==============================================================================
-- BIRRMIND — SUPABASE POSTGRESQL SCHEMA MIGRATION
-- Migration: 20260912_birrmind_auth_rls.sql
-- Description: Integration with Supabase Auth, automatic user creation, and RLS policies
-- ==============================================================================

-- 1. Function and Trigger to sync auth.users with public.users
CREATE OR REPLACE FUNCTION public.handle_new_user() 
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.users (id, email, full_name, avatar_url, created_at, updated_at)
  VALUES (
    new.id::text, -- Cast UUID to text since the original schema used TEXT
    new.email,
    COALESCE(new.raw_user_meta_data->>'full_name', split_part(new.email, '@', 1)),
    new.raw_user_meta_data->>'avatar_url',
    now(),
    now()
  )
  ON CONFLICT (email) DO UPDATE SET 
    id = EXCLUDED.id,
    full_name = EXCLUDED.full_name,
    avatar_url = EXCLUDED.avatar_url,
    updated_at = now();
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Drop trigger if exists to allow re-running
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();


-- 2. Base Row Level Security (RLS) Policies

-- Users
DROP POLICY IF EXISTS "Users can view their own profile" ON users;
CREATE POLICY "Users can view their own profile" 
ON users FOR SELECT 
USING (id = auth.uid()::text);

DROP POLICY IF EXISTS "Users can update their own profile" ON users;
CREATE POLICY "Users can update their own profile" 
ON users FOR UPDATE 
USING (id = auth.uid()::text);

-- Businesses
DROP POLICY IF EXISTS "Users can view businesses they belong to" ON businesses;
CREATE POLICY "Users can view businesses they belong to" 
ON businesses FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM business_memberships 
    WHERE business_memberships.business_id = businesses.id 
    AND business_memberships.user_id = auth.uid()::text
  )
);

DROP POLICY IF EXISTS "Users can insert businesses" ON businesses;
CREATE POLICY "Users can insert businesses" 
ON businesses FOR INSERT 
WITH CHECK (true);

DROP POLICY IF EXISTS "Owners can update their businesses" ON businesses;
CREATE POLICY "Owners can update their businesses" 
ON businesses FOR UPDATE 
USING (
  EXISTS (
    SELECT 1 FROM business_memberships 
    WHERE business_memberships.business_id = businesses.id 
    AND business_memberships.user_id = auth.uid()::text
    AND business_memberships.role = 'owner'
  )
);

-- Business Memberships
DROP POLICY IF EXISTS "Users can view their memberships" ON business_memberships;
CREATE POLICY "Users can view their memberships" 
ON business_memberships FOR SELECT 
USING (user_id = auth.uid()::text);

DROP POLICY IF EXISTS "Users can view other members of their businesses" ON business_memberships;
CREATE POLICY "Users can view other members of their businesses" 
ON business_memberships FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM business_memberships AS my_memberships
    WHERE my_memberships.business_id = business_memberships.business_id
    AND my_memberships.user_id = auth.uid()::text
  )
);

DROP POLICY IF EXISTS "Owners can manage memberships" ON business_memberships;
CREATE POLICY "Owners can manage memberships" 
ON business_memberships FOR ALL 
USING (
  EXISTS (
    SELECT 1 FROM business_memberships AS my_memberships
    WHERE my_memberships.business_id = business_memberships.business_id
    AND my_memberships.user_id = auth.uid()::text
    AND my_memberships.role = 'owner'
  )
);

-- For other tables (products, transactions, expenses, etc.) we use a standard tenant isolation policy
CREATE OR REPLACE FUNCTION user_has_business_access(business_id TEXT)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM business_memberships 
    WHERE business_memberships.business_id = $1 
    AND business_memberships.user_id = auth.uid()::text
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Products
DROP POLICY IF EXISTS "Tenant isolation for products" ON products;
CREATE POLICY "Tenant isolation for products" ON products FOR ALL USING (user_has_business_access(business_id));

-- Transactions
DROP POLICY IF EXISTS "Tenant isolation for transactions" ON transactions;
CREATE POLICY "Tenant isolation for transactions" ON transactions FOR ALL USING (user_has_business_access(business_id));

-- Transaction Items
DROP POLICY IF EXISTS "Tenant isolation for transaction_items" ON transaction_items;
CREATE POLICY "Tenant isolation for transaction_items" ON transaction_items FOR ALL USING (
  EXISTS (
    SELECT 1 FROM transactions 
    WHERE transactions.id = transaction_items.transaction_id 
    AND user_has_business_access(transactions.business_id)
  )
);

-- Expenses
DROP POLICY IF EXISTS "Tenant isolation for expenses" ON expenses;
CREATE POLICY "Tenant isolation for expenses" ON expenses FOR ALL USING (user_has_business_access(business_id));

-- Inventory Movements
DROP POLICY IF EXISTS "Tenant isolation for inventory_movements" ON inventory_movements;
CREATE POLICY "Tenant isolation for inventory_movements" ON inventory_movements FOR ALL USING (user_has_business_access(business_id));

-- Business Events
DROP POLICY IF EXISTS "Tenant isolation for business_events" ON business_events;
CREATE POLICY "Tenant isolation for business_events" ON business_events FOR ALL USING (user_has_business_access(business_id));

-- Note: business_memories and ai_recommendations RLS were set in the phase 2 migration, 
-- but they use auth.uid() directly (which is UUID) comparing against a text business_id via memberships.
-- We will update those here to ensure type safety.

DROP POLICY IF EXISTS "Users can access business memories of authorized businesses" ON business_memories;
CREATE POLICY "Tenant isolation for business_memories" ON business_memories FOR ALL USING (user_has_business_access(business_id::text));

DROP POLICY IF EXISTS "Users can access recommendations of authorized businesses" ON ai_recommendations;
CREATE POLICY "Tenant isolation for ai_recommendations" ON ai_recommendations FOR ALL USING (user_has_business_access(business_id::text));
