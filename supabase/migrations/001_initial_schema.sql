-- ============================================================================
-- Spring LinkIt Mirror — Initial Schema
-- Run this in the Supabase SQL Editor (Dashboard → SQL Editor → New Query)
-- ============================================================================

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ─── Questions Table ─────────────────────────────────────────────────────────

CREATE TABLE public.questions (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  subject         TEXT NOT NULL CHECK (subject IN ('ELA', 'MATH')),
  standard_type   TEXT NOT NULL CHECK (standard_type IN (
                    'READING_DECODE', 'READING_COMP', 'LISTENING_COMP', 'MATH_CONCEPT'
                  )),
  difficulty      INT NOT NULL DEFAULT 1 CHECK (difficulty BETWEEN 1 AND 5),
  stem            TEXT NOT NULL,
  passage         TEXT,
  choices         JSONB NOT NULL DEFAULT '{}'::jsonb,
  correct_answer  TEXT NOT NULL CHECK (correct_answer IN ('a', 'b', 'c', 'd')),
  explanation     TEXT NOT NULL DEFAULT '',
  audio_config    JSONB NOT NULL DEFAULT '{"read_passage": false, "read_stem": true, "read_choices": true}'::jsonb,
  status          TEXT NOT NULL DEFAULT 'PENDING_REVIEW'
                  CHECK (status IN ('PENDING_REVIEW', 'APPROVED')),
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_questions_status ON public.questions (status);
CREATE INDEX idx_questions_subject ON public.questions (subject);
CREATE INDEX idx_questions_standard_type ON public.questions (standard_type);

-- ─── Sessions Table ──────────────────────────────────────────────────────────

CREATE TABLE public.sessions (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  child_name      TEXT NOT NULL DEFAULT 'Student',
  mode            TEXT NOT NULL CHECK (mode IN ('MIRROR', 'PRACTICE')),
  subject         TEXT NOT NULL CHECK (subject IN ('ELA', 'MATH')),
  score           INT,
  completed_at    TIMESTAMPTZ,
  responses       JSONB NOT NULL DEFAULT '[]'::jsonb,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_sessions_child ON public.sessions (child_name);
CREATE INDEX idx_sessions_subject ON public.sessions (subject);

-- ─── Row Level Security ──────────────────────────────────────────────────────
-- No auth for now. Permissive policies for the anon key.

ALTER TABLE public.questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sessions  ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow all for anon" ON public.questions
  FOR ALL USING (true) WITH CHECK (true);

CREATE POLICY "Allow all for anon" ON public.sessions
  FOR ALL USING (true) WITH CHECK (true);
