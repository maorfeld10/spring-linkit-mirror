-- ============================================================================
-- Add status column to sessions table
-- Run this AFTER 001_initial_schema.sql
-- ============================================================================

ALTER TABLE public.sessions
  ADD COLUMN IF NOT EXISTS status TEXT NOT NULL DEFAULT 'IN_PROGRESS'
  CHECK (status IN ('IN_PROGRESS', 'COMPLETED', 'ABANDONED'));

CREATE INDEX IF NOT EXISTS idx_sessions_status ON public.sessions (status);
