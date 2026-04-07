'use client';

import { useState, useEffect, useCallback } from 'react';
import type { Question } from '@/types';
import QuestionCard from '@/components/admin/QuestionCard';
import EditModal from '@/components/admin/EditModal';
import BlueprintTuner, {
  loadBlueprint,
  type Blueprint,
} from '@/components/admin/BlueprintTuner';
import ErrorBoundary from '@/components/shared/ErrorBoundary';

// ─── API helpers ────────────────────────────────────────────────────────────

async function fetchQuestions(): Promise<Question[]> {
  const res = await fetch('/api/questions');
  if (!res.ok) throw new Error('Failed to fetch questions');
  const data = (await res.json()) as { questions: Question[] };
  return data.questions;
}

async function approveQuestion(id: string): Promise<Question> {
  const res = await fetch('/api/questions', {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ id, status: 'APPROVED' }),
  });
  if (!res.ok) throw new Error('Failed to approve question');
  const data = (await res.json()) as { question: Question };
  return data.question;
}

async function updateQuestion(
  updates: Partial<Question> & { id: string }
): Promise<Question> {
  const res = await fetch('/api/questions', {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(updates),
  });
  if (!res.ok) throw new Error('Failed to update question');
  const data = (await res.json()) as { question: Question };
  return data.question;
}

async function deleteQuestion(id: string): Promise<void> {
  const res = await fetch(`/api/questions?id=${id}`, { method: 'DELETE' });
  if (!res.ok) throw new Error('Failed to delete question');
}

async function generateQuestions(blueprint: Blueprint): Promise<{
  questions: Question[];
  generated: number;
  accepted: number;
  rejected: number;
}> {
  const res = await fetch('/api/generate', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ subject: 'ELA', count: 10, blueprint }),
  });
  if (!res.ok) {
    const err = (await res.json()) as { error: string };
    throw new Error(err.error ?? 'Generation failed');
  }
  return res.json();
}

// ─── Dashboard Content ──────────────────────────────────────────────────────

function AdminDashboardContent() {
  const [questions, setQuestions] = useState<Question[]>([]);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [editingQuestion, setEditingQuestion] = useState<Question | null>(null);
  const [genResult, setGenResult] = useState<string | null>(null);
  const [blueprint, setBlueprint] = useState<Blueprint>(loadBlueprint());

  const loadQuestions = useCallback(async () => {
    try {
      setError(null);
      const data = await fetchQuestions();
      setQuestions(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadQuestions();
  }, [loadQuestions]);

  const pending = questions.filter((q) => q.status === 'PENDING_REVIEW');
  const approved = questions.filter((q) => q.status === 'APPROVED');

  async function handleGenerate() {
    setGenerating(true);
    setGenResult(null);
    setError(null);
    try {
      const result = await generateQuestions(blueprint);
      setGenResult(
        `Generated ${result.generated}, accepted ${result.accepted}, rejected ${result.rejected}`
      );
      await loadQuestions();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Generation failed');
    } finally {
      setGenerating(false);
    }
  }

  async function handleApprove(id: string) {
    try {
      const updated = await approveQuestion(id);
      setQuestions((prev) => prev.map((q) => (q.id === updated.id ? updated : q)));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Approve failed');
    }
  }

  function handleEdit(question: Question) {
    setEditingQuestion(question);
  }

  async function handleSaveEdit(updates: Partial<Question> & { id: string }) {
    try {
      const updated = await updateQuestion(updates);
      setQuestions((prev) => prev.map((q) => (q.id === updated.id ? updated : q)));
      setEditingQuestion(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Save failed');
    }
  }

  async function handleRegenerate(id: string) {
    try {
      await deleteQuestion(id);
      setQuestions((prev) => prev.filter((q) => q.id !== id));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Delete failed');
    }
  }

  return (
    <main className="min-h-screen bg-slate-50">
      {/* Top bar */}
      <header className="border-b border-slate-200 bg-white px-6 py-4">
        <div className="mx-auto flex max-w-7xl items-center justify-between">
          <div>
            <h1 className="text-xl font-bold text-slate-800">Admin Dashboard</h1>
            <p className="text-sm text-slate-500">
              Question review &amp; generation
            </p>
          </div>
          <button
            onClick={handleGenerate}
            disabled={generating}
            className="rounded-lg bg-slate-800 px-5 py-2.5 text-sm font-semibold text-white hover:bg-slate-900 disabled:opacity-50"
          >
            {generating ? 'Generating...' : 'Generate 10 Questions'}
          </button>
        </div>
      </header>

      <div className="mx-auto max-w-7xl px-6 py-6">
        {/* Status messages */}
        {error && (
          <div className="mb-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
            {error}
            <button onClick={() => setError(null)} className="ml-2 font-semibold underline">
              Dismiss
            </button>
          </div>
        )}

        {genResult && (
          <div className="mb-4 rounded-lg border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-800">
            {genResult}
            <button onClick={() => setGenResult(null)} className="ml-2 font-semibold underline">
              Dismiss
            </button>
          </div>
        )}

        {/* Blueprint Tuner */}
        <div className="mb-6">
          <BlueprintTuner onBlueprintChange={setBlueprint} />
        </div>

        {loading ? (
          <p className="text-sm text-slate-500">Loading questions...</p>
        ) : (
          <>
            {/* Pending Review */}
            <section className="mb-8">
              <div className="mb-4 flex items-center gap-2">
                <h2 className="text-lg font-bold text-slate-700">Pending Review</h2>
                <span className="rounded-full bg-amber-100 px-2.5 py-0.5 text-xs font-semibold text-amber-800">
                  {pending.length}
                </span>
              </div>
              {pending.length === 0 ? (
                <div className="rounded-lg border border-dashed border-slate-300 bg-white p-8 text-center text-sm text-slate-500">
                  No questions pending review. Click &ldquo;Generate 10 Questions&rdquo; to create some.
                </div>
              ) : (
                <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                  {pending.map((q) => (
                    <QuestionCard
                      key={q.id}
                      question={q}
                      onApprove={handleApprove}
                      onEdit={handleEdit}
                      onRegenerate={handleRegenerate}
                    />
                  ))}
                </div>
              )}
            </section>

            {/* Approved */}
            <section>
              <div className="mb-4 flex items-center gap-2">
                <h2 className="text-lg font-bold text-slate-700">Approved</h2>
                <span className="rounded-full bg-green-100 px-2.5 py-0.5 text-xs font-semibold text-green-800">
                  {approved.length}
                </span>
              </div>
              {approved.length === 0 ? (
                <div className="rounded-lg border border-dashed border-slate-300 bg-white p-8 text-center text-sm text-slate-500">
                  No approved questions yet. Review and approve from the queue above.
                </div>
              ) : (
                <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                  {approved.map((q) => (
                    <QuestionCard
                      key={q.id}
                      question={q}
                      onApprove={handleApprove}
                      onEdit={handleEdit}
                      onRegenerate={handleRegenerate}
                    />
                  ))}
                </div>
              )}
            </section>
          </>
        )}
      </div>

      {editingQuestion && (
        <EditModal
          question={editingQuestion}
          onSave={handleSaveEdit}
          onCancel={() => setEditingQuestion(null)}
        />
      )}
    </main>
  );
}

export default function AdminDashboard() {
  return (
    <ErrorBoundary
      fallbackTitle="Dashboard Error"
      fallbackMessage="Something went wrong loading the admin dashboard."
    >
      <AdminDashboardContent />
    </ErrorBoundary>
  );
}
