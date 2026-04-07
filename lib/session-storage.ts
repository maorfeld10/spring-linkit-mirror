'use client';

import type { LocalSession, QuestionResponse, Question } from '@/types';

const STORAGE_KEY = 'linkit_session';
const RESULTS_KEY = 'linkit_results';

export function saveSession(session: LocalSession): void {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(session));
  } catch {
    // Storage full or unavailable — silently fail
  }
}

export function loadSession(): LocalSession | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as LocalSession;
    // Basic shape check
    if (
      !parsed.sessionId ||
      !Array.isArray(parsed.questionIds) ||
      !Array.isArray(parsed.responses) ||
      typeof parsed.currentIndex !== 'number'
    ) {
      clearSession();
      return null;
    }
    return parsed;
  } catch {
    clearSession();
    return null;
  }
}

export function clearSession(): void {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.removeItem(STORAGE_KEY);
  } catch {
    // Silently fail
  }
}

export function updateSessionProgress(
  currentIndex: number,
  response: QuestionResponse
): void {
  const session = loadSession();
  if (!session) return;

  // Update or append the response for this question
  const existingIdx = session.responses.findIndex(
    (r) => r.question_id === response.question_id
  );
  if (existingIdx >= 0) {
    session.responses[existingIdx] = response;
  } else {
    session.responses.push(response);
  }

  session.currentIndex = currentIndex;
  saveSession(session);
}

// ─── Results handoff (student → results page) ──────────────────────────────

export interface ResultsData {
  responses: QuestionResponse[];
  questions: Question[];
  score: number;
  total: number;
  mode: string;
}

export function saveResultsForReview(data: ResultsData): void {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(RESULTS_KEY, JSON.stringify(data));
  } catch {
    // Storage full — silently fail
  }
}

export function loadResults(): ResultsData | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = window.localStorage.getItem(RESULTS_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as ResultsData;
  } catch {
    return null;
  }
}

export function clearResults(): void {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.removeItem(RESULTS_KEY);
  } catch {
    // Silently fail
  }
}
