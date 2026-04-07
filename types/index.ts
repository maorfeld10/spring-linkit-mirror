// ─── Enums ───────────────────────────────────────────────────────────────────

export type Subject = 'ELA' | 'MATH';

export type StandardType =
  | 'READING_DECODE'
  | 'READING_COMP'
  | 'LISTENING_COMP'
  | 'MATH_CONCEPT';

export type QuestionStatus = 'PENDING_REVIEW' | 'APPROVED';

export type SessionMode = 'MIRROR' | 'PRACTICE';

// ─── Core Interfaces ─────────────────────────────────────────────────────────

export interface Choices {
  a: string;
  b: string;
  c: string;
  d: string;
}

export interface AudioConfig {
  read_passage: boolean;
  read_stem: boolean;
  read_choices: boolean;
}

export interface Question {
  id: string;
  subject: Subject;
  standard_type: StandardType;
  difficulty: number;          // 1–5
  stem: string;
  passage: string | null;
  choices: Choices;
  correct_answer: string;      // "a" | "b" | "c" | "d"
  explanation: string;
  audio_config: AudioConfig;
  status: QuestionStatus;
  created_at: string;          // ISO 8601
}

export interface QuestionResponse {
  question_id: string;
  selected_answer: string | null;   // "a" | "b" | "c" | "d" or null if skipped
  is_correct: boolean | null;
  time_spent_ms: number | null;
}

export interface Session {
  id: string;
  child_name: string;
  mode: SessionMode;
  subject: Subject;
  score: number | null;            // NULL until completed
  completed_at: string | null;     // ISO 8601 or NULL
  responses: QuestionResponse[];
  created_at: string;              // ISO 8601
}

// ─── TTS Rules (derived from StandardType) ───────────────────────────────────
// READING_DECODE & READING_COMP → passage TTS DISABLED
// LISTENING_COMP & MATH_CONCEPT → passage TTS ENABLED
// Stem and choices are ALWAYS TTS-enabled

export function getDefaultAudioConfig(standardType: StandardType): AudioConfig {
  const readPassage =
    standardType === 'LISTENING_COMP' || standardType === 'MATH_CONCEPT';

  return {
    read_passage: readPassage,
    read_stem: true,
    read_choices: true,
  };
}

// ─── Speech Synthesis Config (for Web Speech API) ────────────────────────────

export interface SpeechConfig {
  rate: number;    // 0.1–10, default 0.9
  pitch: number;   // 0–2, default 1
  volume: number;  // 0–1, default 1
  voice: string | null;
}

// ─── LocalStorage Session Snapshot ───────────────────────────────────────────

export interface LocalSession {
  sessionId: string;
  childName: string;
  mode: SessionMode;
  subject: Subject;
  questionIds: string[];
  currentIndex: number;
  responses: QuestionResponse[];
  startedAt: string;
}

// ─── API Payloads ────────────────────────────────────────────────────────────

export interface GenerateQuestionsRequest {
  subject: Subject;
  standard_type: StandardType;
  count: number;
  difficulty?: number;
}

export interface GenerateQuestionsResponse {
  questions: Question[];
}

export interface UpdateQuestionStatusRequest {
  question_id: string;
  status: QuestionStatus;
}

export interface CreateSessionRequest {
  child_name: string;
  mode: SessionMode;
  subject: Subject;
}

export interface SyncSessionRequest {
  session: Session;
}
