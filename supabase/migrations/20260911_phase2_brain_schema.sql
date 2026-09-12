-- ==============================================================================
-- MERCATO AI — SUPABASE POSTGRESQL SCHEMA MIGRATION
-- Migration: 20260911_phase2_brain_schema.sql
-- Description: Business Memories and AI Recommendations tables with RLS
-- ==============================================================================

-- 1. BUSINESS MEMORIES TABLE
CREATE TABLE IF NOT EXISTS business_memories (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    business_id UUID NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
    fact TEXT NOT NULL,
    type VARCHAR(50) NOT NULL,
    confidence NUMERIC(3,2) NOT NULL DEFAULT 0.85,
    source VARCHAR(30) NOT NULL DEFAULT 'observation',
    status VARCHAR(20) NOT NULL DEFAULT 'active',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    last_referenced_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_business_memories_biz ON business_memories(business_id);
CREATE INDEX IF NOT EXISTS idx_business_memories_status ON business_memories(status);

-- 2. AI RECOMMENDATIONS TABLE
CREATE TABLE IF NOT EXISTS ai_recommendations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    business_id UUID NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
    type VARCHAR(50) NOT NULL,
    title TEXT NOT NULL,
    explanation TEXT NOT NULL,
    priority VARCHAR(20) NOT NULL DEFAULT 'medium',
    recommended_action TEXT NOT NULL,
    action_type VARCHAR(50) NOT NULL,
    action_payload JSONB,
    evidence JSONB NOT NULL DEFAULT '[]'::jsonb,
    status VARCHAR(20) NOT NULL DEFAULT 'pending',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    confirmed_by_user_id UUID REFERENCES users(id),
    confirmed_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_ai_recommendations_biz ON ai_recommendations(business_id);
CREATE INDEX IF NOT EXISTS idx_ai_recommendations_status ON ai_recommendations(status);

-- 3. ROW-LEVEL SECURITY POLICIES
ALTER TABLE business_memories ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_recommendations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can access business memories of authorized businesses"
    ON business_memories FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM business_memberships
            WHERE business_memberships.business_id = business_memories.business_id
            AND business_memberships.user_id = auth.uid()
        )
    );

CREATE POLICY "Users can access recommendations of authorized businesses"
    ON ai_recommendations FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM business_memberships
            WHERE business_memberships.business_id = ai_recommendations.business_id
            AND business_memberships.user_id = auth.uid()
        )
    );
