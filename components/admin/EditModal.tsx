'use client';

import { useState } from 'react';
import type { Question, Choices, StandardType } from '@/types';

// ─── Props ──────────────────────────────────────────────────────────────────

interface EditModalProps {
  question: Question;
  onSave: (updated: Partial<Question> & { id: string }) => void;
  onCancel: () => void;
}

const STANDARD_TYPE_OPTIONS: { value: StandardType; label: string }[] = [
  { value: 'READING_DECODE', label: 'Reading Decode' },
  { value: 'READING_COMP', label: 'Reading Comprehension' },
  { value: 'LISTENING_COMP', label: 'Listening Comprehension' },
];

const CHOICE_KEYS: (keyof Choices)[] = ['a', 'b', 'c', 'd'];

export default function EditModal({ question, onSave, onCancel }: EditModalProps) {
  const [standardType, setStandardType] = useState<StandardType>(question.standard_type);
  const [difficulty, setDifficulty] = useState(question.difficulty);
  const [stem, setStem] = useState(question.stem);
  const [passage, setPassage] = useState(question.passage ?? '');
  const [choices, setChoices] = useState<Choices>({ ...question.choices });
  const [correctAnswer, setCorrectAnswer] = useState(question.correct_answer);
  const [explanation, setExplanation] = useState(question.explanation);
  const [saving, setSaving] = useState(false);

  function updateChoice(key: keyof Choices, value: string) {
    setChoices((prev) => ({ ...prev, [key]: value }));
  }

  async function handleSave() {
    setSaving(true);
    onSave({
      id: question.id,
      standard_type: standardType,
      difficulty,
      stem,
      passage: passage.trim() === '' ? null : passage.trim(),
      choices,
      correct_answer: correctAnswer,
      explanation,
    });
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-lg bg-white p-6 shadow-xl">
        <h2 className="mb-4 text-lg font-bold text-slate-800">Edit Question</h2>

        {/* Standard type + difficulty row */}
        <div className="mb-4 grid grid-cols-2 gap-4">
          <div>
            <label className="mb-1 block text-xs font-semibold text-slate-600">
              Standard Type
            </label>
            <select
              value={standardType}
              onChange={(e) => setStandardType(e.target.value as StandardType)}
              className="w-full rounded border border-slate-300 px-3 py-2 text-sm text-slate-800 focus:border-slate-500 focus:outline-none"
            >
              {STANDARD_TYPE_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="mb-1 block text-xs font-semibold text-slate-600">
              Difficulty (1–5)
            </label>
            <input
              type="number"
              min={1}
              max={5}
              value={difficulty}
              onChange={(e) => setDifficulty(Number(e.target.value))}
              className="w-full rounded border border-slate-300 px-3 py-2 text-sm text-slate-800 focus:border-slate-500 focus:outline-none"
            />
          </div>
        </div>

        {/* Passage */}
        <div className="mb-4">
          <label className="mb-1 block text-xs font-semibold text-slate-600">
            Passage (leave blank for none)
          </label>
          <textarea
            rows={3}
            value={passage}
            onChange={(e) => setPassage(e.target.value)}
            className="w-full rounded border border-slate-300 px-3 py-2 text-sm text-slate-800 focus:border-slate-500 focus:outline-none"
            placeholder="Short reading or listening passage..."
          />
        </div>

        {/* Stem */}
        <div className="mb-4">
          <label className="mb-1 block text-xs font-semibold text-slate-600">
            Stem (question)
          </label>
          <input
            type="text"
            value={stem}
            onChange={(e) => setStem(e.target.value)}
            className="w-full rounded border border-slate-300 px-3 py-2 text-sm text-slate-800 focus:border-slate-500 focus:outline-none"
          />
        </div>

        {/* Choices */}
        <fieldset className="mb-4">
          <legend className="mb-1 text-xs font-semibold text-slate-600">
            Choices (select the correct answer)
          </legend>
          <div className="space-y-2">
            {CHOICE_KEYS.map((key) => (
              <div key={key} className="flex items-center gap-2">
                <input
                  type="radio"
                  name="correctAnswer"
                  value={key}
                  checked={correctAnswer === key}
                  onChange={() => setCorrectAnswer(key)}
                  className="h-4 w-4 accent-green-600"
                />
                <span className="w-5 text-xs font-mono uppercase text-slate-400">
                  {key}.
                </span>
                <input
                  type="text"
                  value={choices[key]}
                  onChange={(e) => updateChoice(key, e.target.value)}
                  className={`flex-1 rounded border px-3 py-1.5 text-sm focus:outline-none ${
                    correctAnswer === key
                      ? 'border-green-400 bg-green-50 text-green-900'
                      : 'border-slate-300 text-slate-800'
                  }`}
                />
              </div>
            ))}
          </div>
        </fieldset>

        {/* Explanation */}
        <div className="mb-6">
          <label className="mb-1 block text-xs font-semibold text-slate-600">
            Explanation (one sentence)
          </label>
          <input
            type="text"
            value={explanation}
            onChange={(e) => setExplanation(e.target.value)}
            className="w-full rounded border border-slate-300 px-3 py-2 text-sm text-slate-800 focus:border-slate-500 focus:outline-none"
          />
        </div>

        {/* Action buttons */}
        <div className="flex justify-end gap-3 border-t border-slate-100 pt-4">
          <button
            onClick={onCancel}
            className="rounded border border-slate-300 px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-50"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={saving}
            className="rounded bg-slate-800 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-900 disabled:opacity-50"
          >
            {saving ? 'Saving...' : 'Save Changes'}
          </button>
        </div>
      </div>
    </div>
  );
}
