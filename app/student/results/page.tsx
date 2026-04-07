'use client';

import { useState, useEffect } from 'react';
import type { Question, QuestionResponse, Choices } from '@/types';
import { loadResults, clearResults } from '@/lib/session-storage';
import ErrorBoundary from '@/components/shared/ErrorBoundary';

// ─── Constants ──────────────────────────────────────────────────────────────

const CHOICE_KEYS: (keyof Choices)[] = ['a', 'b', 'c', 'd'];

// ─── Answer Review Item ─────────────────────────────────────────────────────

function AnswerItem({
  index,
  question,
  response,
}: {
  index: number;
  question: Question;
  response: QuestionResponse;
}) {
  const picked = response.selected_answer;
  const correct = question.correct_answer;
  const isCorrect = picked === correct;

  return (
    <div className={`rounded-2xl border-2 p-4 ${
      isCorrect ? 'border-green-200 bg-green-50' : 'border-red-200 bg-red-50'
    }`}>
      <div className="mb-2 flex items-center gap-2">
        <span className="flex h-8 w-8 items-center justify-center rounded-full bg-blue-200 text-sm font-bold text-blue-800">
          {index + 1}
        </span>
        <span className={`text-lg font-bold ${isCorrect ? 'text-green-700' : 'text-red-700'}`}>
          {isCorrect ? 'Correct!' : 'Not quite'}
        </span>
      </div>

      <p className="mb-3 text-lg font-semibold text-slate-800">
        {question.stem}
      </p>

      <div className="mb-2 space-y-1">
        {CHOICE_KEYS.map((key) => {
          const isPickedChoice = key === picked;
          const isCorrectChoice = key === correct;
          let style = 'text-slate-600';
          let marker = '';

          if (isCorrectChoice && isPickedChoice) {
            style = 'font-semibold text-green-700';
            marker = ' \u2713';
          } else if (isCorrectChoice) {
            style = 'font-semibold text-green-700';
            marker = ' \u2190 correct';
          } else if (isPickedChoice) {
            style = 'text-red-600 line-through';
            marker = ' \u2717';
          }

          return (
            <p key={key} className={`text-base ${style}`}>
              <span className="mr-1 font-mono text-xs uppercase text-slate-400">
                {key}.
              </span>
              {question.choices[key]}
              {marker}
            </p>
          );
        })}
      </div>

      <p className="text-sm italic text-slate-500">{question.explanation}</p>
    </div>
  );
}

// ─── Results Page Content ───────────────────────────────────────────────────

function ResultsContent() {
  const [data, setData] = useState<{
    responses: QuestionResponse[];
    questions: Question[];
    score: number;
    total: number;
    mode: string;
  } | null>(null);
  const [showAnswers, setShowAnswers] = useState(false);

  useEffect(() => {
    setData(loadResults());
  }, []);

  if (!data) {
    return (
      <main className="flex min-h-screen flex-col items-center justify-center bg-blue-50 p-8">
        <p className="mb-6 text-xl text-blue-800">No results to show.</p>
        <a
          href="/student"
          className="min-h-[64px] rounded-2xl bg-blue-500 px-8 py-4
            text-xl font-bold text-white shadow-lg hover:bg-blue-600"
        >
          Go Practice
        </a>
      </main>
    );
  }

  const { score, total, responses, questions, mode } = data;
  const pct = total > 0 ? Math.round((score / total) * 100) : 0;
  const incorrect = total - score;
  const questionMap = new Map(questions.map((q) => [q.id, q]));

  function handleTryAgain() {
    clearResults();
    window.location.href = '/student';
  }

  return (
    <main className="min-h-screen bg-blue-50">
      <div className="mx-auto max-w-2xl px-6 py-10">
        {/* Hero score */}
        <div className="mb-8 text-center">
          <div className="mb-4 text-7xl">&#11088;</div>
          <h1 className="mb-2 text-4xl font-bold text-blue-900">All Done!</h1>
          <p className="text-3xl font-bold text-blue-800">
            You got {score} out of {total} right!
          </p>
          <p className="mt-2 text-xl font-semibold text-green-600">
            {pct}% —{' '}
            {pct >= 80
              ? 'Amazing work!'
              : pct >= 60
                ? 'Great job!'
                : 'Keep practicing!'}
          </p>
          <p className="mt-1 text-sm text-blue-500">
            {mode === 'PRACTICE' ? 'Practice Mode' : 'Test Mode'}
          </p>
        </div>

        {/* Score bar */}
        <div className="mb-8">
          <div className="mb-2 flex justify-between text-sm font-semibold">
            <span className="text-green-700">{score} correct</span>
            <span className="text-red-600">{incorrect} missed</span>
          </div>
          <div className="flex h-6 w-full overflow-hidden rounded-full">
            {score > 0 && (
              <div
                className="bg-green-400"
                style={{ width: `${(score / total) * 100}%` }}
              />
            )}
            {incorrect > 0 && (
              <div
                className="bg-red-300"
                style={{ width: `${(incorrect / total) * 100}%` }}
              />
            )}
          </div>
        </div>

        {/* Action buttons */}
        <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:justify-center">
          <button
            onClick={handleTryAgain}
            className="min-h-[64px] rounded-2xl bg-green-500 px-8 py-4
              text-xl font-bold text-white shadow-lg hover:bg-green-600"
          >
            Try Again
          </button>
          <button
            onClick={() => setShowAnswers(!showAnswers)}
            className="min-h-[64px] rounded-2xl bg-blue-500 px-8 py-4
              text-xl font-bold text-white shadow-lg hover:bg-blue-600"
          >
            {showAnswers ? 'Hide My Answers' : 'Show My Answers'}
          </button>
        </div>

        {/* Answer review */}
        {showAnswers && (
          <div className="space-y-4">
            <h2 className="text-xl font-bold text-blue-900">Your Answers</h2>
            {responses.map((resp, i) => {
              const question = questionMap.get(resp.question_id);
              if (!question) return null;
              return (
                <AnswerItem
                  key={resp.question_id}
                  index={i}
                  question={question}
                  response={resp}
                />
              );
            })}
          </div>
        )}
      </div>
    </main>
  );
}

export default function ResultsPage() {
  return (
    <ErrorBoundary
      fallbackTitle="Oops!"
      fallbackMessage="We couldn't load your results. Try going back to practice."
    >
      <ResultsContent />
    </ErrorBoundary>
  );
}
