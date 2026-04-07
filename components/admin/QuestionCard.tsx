'use client';

import type { Question, Choices } from '@/types';

// ─── Badge colors by standard_type ──────────────────────────────────────────

const TYPE_COLORS: Record<string, string> = {
  READING_DECODE: 'bg-violet-100 text-violet-800',
  READING_COMP: 'bg-amber-100 text-amber-800',
  LISTENING_COMP: 'bg-teal-100 text-teal-800',
  MATH_CONCEPT: 'bg-blue-100 text-blue-800',
};

const TYPE_LABELS: Record<string, string> = {
  READING_DECODE: 'Decode',
  READING_COMP: 'Read Comp',
  LISTENING_COMP: 'Listen Comp',
  MATH_CONCEPT: 'Math',
};

const DIFF_COLORS: Record<number, string> = {
  1: 'bg-green-100 text-green-800',
  2: 'bg-lime-100 text-lime-800',
  3: 'bg-yellow-100 text-yellow-800',
  4: 'bg-orange-100 text-orange-800',
  5: 'bg-red-100 text-red-800',
};

const CHOICE_KEYS: (keyof Choices)[] = ['a', 'b', 'c', 'd'];

// ─── Audio config icons ─────────────────────────────────────────────────────

function AudioFlags({ config }: { config: Question['audio_config'] }) {
  return (
    <div className="flex gap-2 text-xs text-slate-500">
      <span title="Read passage aloud">
        {config.read_passage ? '📖 Passage' : '🔇 Passage'}
      </span>
      <span title="Read stem aloud">
        {config.read_stem ? '🔊 Stem' : '🔇 Stem'}
      </span>
      <span title="Read choices aloud">
        {config.read_choices ? '🔊 Choices' : '🔇 Choices'}
      </span>
    </div>
  );
}

// ─── Props ──────────────────────────────────────────────────────────────────

interface QuestionCardProps {
  question: Question;
  onApprove: (id: string) => void;
  onEdit: (question: Question) => void;
  onRegenerate: (id: string) => void;
}

export default function QuestionCard({
  question,
  onApprove,
  onEdit,
  onRegenerate,
}: QuestionCardProps) {
  const typeColor = TYPE_COLORS[question.standard_type] ?? 'bg-slate-100 text-slate-800';
  const typeLabel = TYPE_LABELS[question.standard_type] ?? question.standard_type;
  const diffColor = DIFF_COLORS[question.difficulty] ?? 'bg-slate-100 text-slate-800';

  return (
    <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
      {/* Header row: badges */}
      <div className="mb-3 flex flex-wrap items-center gap-2">
        <span className={`rounded px-2 py-0.5 text-xs font-semibold ${typeColor}`}>
          {typeLabel}
        </span>
        <span className={`rounded px-2 py-0.5 text-xs font-semibold ${diffColor}`}>
          Diff {question.difficulty}
        </span>
        <span className="rounded bg-slate-100 px-2 py-0.5 text-xs text-slate-600">
          {question.status}
        </span>
      </div>

      {/* Passage (truncated) */}
      {question.passage && (
        <div className="mb-2 rounded bg-slate-50 p-2 text-sm text-slate-700">
          <p className="line-clamp-2">{question.passage}</p>
        </div>
      )}

      {/* Stem */}
      <p className="mb-3 text-sm font-semibold text-slate-900">
        {question.stem}
      </p>

      {/* Choices */}
      <div className="mb-3 grid grid-cols-1 gap-1 sm:grid-cols-2">
        {CHOICE_KEYS.map((key) => {
          const isCorrect = key === question.correct_answer;
          return (
            <div
              key={key}
              className={`rounded px-2 py-1 text-sm ${
                isCorrect
                  ? 'bg-green-50 font-semibold text-green-800 ring-1 ring-green-300'
                  : 'bg-slate-50 text-slate-700'
              }`}
            >
              <span className="mr-1 font-mono text-xs uppercase text-slate-400">
                {key}.
              </span>
              {question.choices[key]}
            </div>
          );
        })}
      </div>

      {/* Explanation */}
      <p className="mb-3 text-xs italic text-slate-500">
        {question.explanation}
      </p>

      {/* Audio flags */}
      <div className="mb-3">
        <AudioFlags config={question.audio_config} />
      </div>

      {/* Actions */}
      <div className="flex gap-2 border-t border-slate-100 pt-3">
        {question.status === 'PENDING_REVIEW' && (
          <button
            onClick={() => onApprove(question.id)}
            className="rounded bg-green-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-green-700"
          >
            Approve
          </button>
        )}
        <button
          onClick={() => onEdit(question)}
          className="rounded bg-slate-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-slate-700"
        >
          Edit
        </button>
        <button
          onClick={() => onRegenerate(question.id)}
          className="rounded bg-orange-500 px-3 py-1.5 text-xs font-semibold text-white hover:bg-orange-600"
        >
          Regenerate
        </button>
      </div>
    </div>
  );
}
