'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import type { Question, SessionMode, QuestionResponse, LocalSession } from '@/types';
import { saveSession, loadSession, clearSession, saveResultsForReview } from '@/lib/session-storage';
import QuestionPlayer from '@/components/student/QuestionPlayer';
import ErrorBoundary from '@/components/shared/ErrorBoundary';

// ─── Shuffle utility ────────────────────────────────────────────────────────

function shuffle<T>(arr: T[]): T[] {
  const copy = [...arr];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

// ─── Page states ────────────────────────────────────────────────────────────

type PageState =
  | { screen: 'home' }
  | { screen: 'resume'; saved: LocalSession }
  | { screen: 'loading' }
  | { screen: 'playing'; questions: Question[]; session: LocalSession }
  | { screen: 'error'; message: string };

// ─── API helpers ────────────────────────────────────────────────────────────

async function fetchApprovedQuestions(): Promise<Question[]> {
  const res = await fetch('/api/questions?status=APPROVED&subject=ELA');
  if (!res.ok) throw new Error('Failed to fetch questions');
  const data = (await res.json()) as { questions: Question[] };
  return data.questions;
}

async function createSession(
  childName: string,
  mode: SessionMode,
  subject: 'ELA'
): Promise<string> {
  const res = await fetch('/api/sessions', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ child_name: childName, mode, subject }),
  });
  if (!res.ok) throw new Error('Failed to create session');
  const data = (await res.json()) as { session: { id: string } };
  return data.session.id;
}

async function completeSession(
  sessionId: string,
  responses: QuestionResponse[],
  score: number
): Promise<void> {
  await fetch('/api/sessions', {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      id: sessionId,
      status: 'COMPLETED',
      score,
      responses,
      completed_at: new Date().toISOString(),
    }),
  });
}

// ─── Component ──────────────────────────────────────────────────────────────

function StudentPageContent() {
  const router = useRouter();
  const [state, setState] = useState<PageState>({ screen: 'home' });
  // Store questions at page level so we can pass them to results
  const [allSessionQuestions, setAllSessionQuestions] = useState<Question[]>([]);

  // Check for saved session on mount
  useEffect(() => {
    const saved = loadSession();
    if (saved && saved.currentIndex < saved.questionIds.length) {
      setState({ screen: 'resume', saved });
    }
  }, []);

  // ─── Start a new session ──────────────────────────────────────────────

  const startSession = useCallback(async (mode: SessionMode) => {
    setState({ screen: 'loading' });
    try {
      const questions = await fetchApprovedQuestions();
      if (questions.length === 0) {
        setState({
          screen: 'error',
          message: 'No approved questions yet. Ask a parent to generate and approve some first!',
        });
        return;
      }

      const shuffled = shuffle(questions);
      const sessionId = await createSession('Student', mode, 'ELA');

      const local: LocalSession = {
        sessionId,
        childName: 'Student',
        mode,
        subject: 'ELA',
        questionIds: shuffled.map((q) => q.id),
        currentIndex: 0,
        responses: [],
        startedAt: new Date().toISOString(),
      };

      saveSession(local);
      setAllSessionQuestions(shuffled);
      setState({ screen: 'playing', questions: shuffled, session: local });
    } catch (err) {
      setState({
        screen: 'error',
        message: err instanceof Error ? err.message : 'Something went wrong',
      });
    }
  }, []);

  // ─── Resume saved session ─────────────────────────────────────────────

  const resumeSession = useCallback(async (saved: LocalSession) => {
    setState({ screen: 'loading' });
    try {
      const allQuestions = await fetchApprovedQuestions();
      const questionMap = new Map(allQuestions.map((q) => [q.id, q]));
      const orderedQuestions = saved.questionIds
        .map((id) => questionMap.get(id))
        .filter((q): q is Question => q !== undefined);

      if (orderedQuestions.length === 0) {
        clearSession();
        setState({
          screen: 'error',
          message: 'The saved questions are no longer available. Starting fresh.',
        });
        return;
      }

      setAllSessionQuestions(orderedQuestions);
      setState({
        screen: 'playing',
        questions: orderedQuestions,
        session: saved,
      });
    } catch (err) {
      setState({
        screen: 'error',
        message: err instanceof Error ? err.message : 'Failed to resume',
      });
    }
  }, []);

  // ─── Handle completion — save results and navigate ────────────────────

  const handleComplete = useCallback(
    async (responses: QuestionResponse[]) => {
      if (state.screen !== 'playing') return;

      const correct = responses.filter((r) => r.is_correct === true).length;
      const total = responses.length;

      // Sync to Supabase
      try {
        await completeSession(state.session.sessionId, responses, correct);
      } catch {
        // Sync failed — data still in localStorage results
      }

      // Save results for the results page
      saveResultsForReview({
        responses,
        questions: allSessionQuestions,
        score: correct,
        total,
        mode: state.session.mode,
      });

      clearSession();
      router.push('/student/results');
    },
    [state, allSessionQuestions, router]
  );

  // ─── Render ───────────────────────────────────────────────────────────

  if (state.screen === 'home') {
    return (
      <main className="flex min-h-screen flex-col items-center justify-center bg-blue-50 p-8">
        <div className="w-full max-w-md text-center">
          <h1 className="mb-2 text-4xl font-bold text-blue-900">
            Hi! Ready to Practice?
          </h1>
          <p className="mb-10 text-xl text-blue-600">
            Pick how you want to learn today.
          </p>
          <div className="flex flex-col gap-5">
            <button
              onClick={() => startSession('PRACTICE')}
              className="min-h-[80px] w-full rounded-2xl bg-green-500 px-8 py-5
                text-2xl font-bold text-white shadow-lg hover:bg-green-600 transition-colors"
            >
              Practice Reading
            </button>
            <button
              onClick={() => startSession('MIRROR')}
              className="min-h-[80px] w-full rounded-2xl bg-blue-500 px-8 py-5
                text-2xl font-bold text-white shadow-lg hover:bg-blue-600 transition-colors"
            >
              Take a Test
            </button>
          </div>
        </div>
      </main>
    );
  }

  if (state.screen === 'resume') {
    const { saved } = state;
    const answered = saved.responses.length;
    const total = saved.questionIds.length;

    return (
      <main className="flex min-h-screen flex-col items-center justify-center bg-blue-50 p-8">
        <div className="w-full max-w-md text-center">
          <h1 className="mb-2 text-3xl font-bold text-blue-900">Welcome back!</h1>
          <p className="mb-8 text-xl text-blue-600">
            You answered {answered} of {total} questions last time.
            <br />
            Want to keep going?
          </p>
          <div className="flex flex-col gap-4">
            <button
              onClick={() => resumeSession(saved)}
              className="min-h-[72px] w-full rounded-2xl bg-green-500 px-8 py-4
                text-2xl font-bold text-white shadow-lg hover:bg-green-600 transition-colors"
            >
              Yes, keep going!
            </button>
            <button
              onClick={() => { clearSession(); setState({ screen: 'home' }); }}
              className="min-h-[72px] w-full rounded-2xl bg-slate-400 px-8 py-4
                text-2xl font-bold text-white shadow-lg hover:bg-slate-500 transition-colors"
            >
              Start over
            </button>
          </div>
        </div>
      </main>
    );
  }

  if (state.screen === 'loading') {
    return (
      <main className="flex min-h-screen items-center justify-center bg-blue-50 p-8">
        <p className="text-2xl font-semibold text-blue-700">
          Getting your questions ready...
        </p>
      </main>
    );
  }

  if (state.screen === 'error') {
    return (
      <main className="flex min-h-screen flex-col items-center justify-center bg-blue-50 p-8">
        <div className="w-full max-w-md text-center">
          <p className="mb-6 text-xl text-red-600">{state.message}</p>
          <button
            onClick={() => setState({ screen: 'home' })}
            className="min-h-[64px] rounded-2xl bg-blue-500 px-8 py-4
              text-xl font-bold text-white shadow-lg hover:bg-blue-600 transition-colors"
          >
            Go Back
          </button>
        </div>
      </main>
    );
  }

  if (state.screen === 'playing') {
    return (
      <QuestionPlayer
        questions={state.questions}
        mode={state.session.mode}
        sessionId={state.session.sessionId}
        initialIndex={state.session.currentIndex}
        initialResponses={state.session.responses}
        onComplete={handleComplete}
      />
    );
  }

  return null;
}

export default function StudentPage() {
  return (
    <ErrorBoundary
      fallbackTitle="Oops!"
      fallbackMessage="Something went wrong. Try refreshing the page."
    >
      <StudentPageContent />
    </ErrorBoundary>
  );
}
