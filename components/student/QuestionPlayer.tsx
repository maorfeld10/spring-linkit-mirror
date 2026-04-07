'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import type { Question, Choices, QuestionResponse, SessionMode } from '@/types';
import { updateSessionProgress } from '@/lib/session-storage';
import { stop as stopSpeech } from '@/lib/audio';
import AudioButton from '@/components/student/AudioButton';

// ─── Types ──────────────────────────────────────────────────────────────────

interface QuestionPlayerProps {
  questions: Question[];
  mode: SessionMode;
  sessionId: string;
  initialIndex: number;
  initialResponses: QuestionResponse[];
  onComplete: (responses: QuestionResponse[]) => void;
}

type FeedbackState = 'none' | 'correct' | 'incorrect';

const CHOICE_KEYS: (keyof Choices)[] = ['a', 'b', 'c', 'd'];

const CHOICE_LABELS: Record<string, string> = {
  a: 'A',
  b: 'B',
  c: 'C',
  d: 'D',
};

// Calm colors for choices
const CHOICE_DEFAULT = 'bg-white border-2 border-blue-200 text-slate-800 hover:border-blue-400 hover:bg-blue-50';
const CHOICE_SELECTED = 'bg-blue-100 border-2 border-blue-500 text-blue-900';
const CHOICE_CORRECT = 'bg-green-100 border-2 border-green-500 text-green-900';
const CHOICE_INCORRECT = 'bg-red-50 border-2 border-red-300 text-red-800';
const CHOICE_REVEAL_CORRECT = 'bg-green-100 border-2 border-green-500 text-green-900';

// ─── Component ──────────────────────────────────────────────────────────────

export default function QuestionPlayer({
  questions,
  mode,
  sessionId,
  initialIndex,
  initialResponses,
  onComplete,
}: QuestionPlayerProps) {
  const [currentIndex, setCurrentIndex] = useState(initialIndex);
  const [responses, setResponses] = useState<QuestionResponse[]>(initialResponses);
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<FeedbackState>('none');
  const [showNext, setShowNext] = useState(false);
  const [fading, setFading] = useState(false);
  const questionStartTime = useRef(Date.now());

  const question = questions[currentIndex];
  const totalQuestions = questions.length;
  const isLastQuestion = currentIndex === totalQuestions - 1;
  const isPractice = mode === 'PRACTICE';

  // Reset state when question changes
  useEffect(() => {
    setSelectedAnswer(null);
    setFeedback('none');
    setShowNext(false);
    questionStartTime.current = Date.now();
    stopSpeech();
  }, [currentIndex]);

  // Build the text for "Read to Me" — stem + choices
  const stemAndChoicesText = useCallback(() => {
    if (!question) return '';
    const choiceLines = CHOICE_KEYS.map(
      (k) => `${CHOICE_LABELS[k]}: ${question.choices[k]}`
    ).join('. ');
    return `${question.stem} ${choiceLines}`;
  }, [question]);

  // ─── Select an answer ─────────────────────────────────────────────────

  function handleSelect(key: string) {
    if (feedback !== 'none') return; // Already answered
    setSelectedAnswer(key);
  }

  // ─── Confirm answer ───────────────────────────────────────────────────

  function handleConfirm() {
    if (!selectedAnswer || !question) return;

    const isCorrect = selectedAnswer === question.correct_answer;
    const timeSpent = Date.now() - questionStartTime.current;

    const response: QuestionResponse = {
      question_id: question.id,
      selected_answer: selectedAnswer,
      is_correct: isCorrect,
      time_spent_ms: timeSpent,
    };

    const newResponses = [...responses, response];
    setResponses(newResponses);

    // Persist to localStorage
    updateSessionProgress(currentIndex, response);

    if (isPractice) {
      // Show feedback
      setFeedback(isCorrect ? 'correct' : 'incorrect');
      setShowNext(true);
    } else {
      // Mirror mode: advance immediately
      advance(newResponses);
    }
  }

  // ─── Advance to next question ─────────────────────────────────────────

  function advance(currentResponses?: QuestionResponse[]) {
    const allResponses = currentResponses ?? responses;

    if (isLastQuestion) {
      onComplete(allResponses);
      return;
    }

    // Subtle fade
    setFading(true);
    setTimeout(() => {
      setCurrentIndex((prev) => prev + 1);
      setFading(false);
    }, 200);
  }

  function handleNext() {
    advance();
  }

  // ─── Guard: no questions ──────────────────────────────────────────────

  if (!question) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-blue-50 p-8">
        <p className="text-xl text-blue-800">No questions available.</p>
      </div>
    );
  }

  // ─── Choice styling ───────────────────────────────────────────────────

  function choiceStyle(key: string): string {
    if (feedback === 'none') {
      return key === selectedAnswer ? CHOICE_SELECTED : CHOICE_DEFAULT;
    }
    // Feedback shown (PRACTICE mode)
    if (key === question.correct_answer) {
      return CHOICE_CORRECT;
    }
    if (key === selectedAnswer && key !== question.correct_answer) {
      return CHOICE_INCORRECT;
    }
    if (key === question.correct_answer) {
      return CHOICE_REVEAL_CORRECT;
    }
    return 'bg-white border-2 border-slate-200 text-slate-400';
  }

  // ─── Progress ─────────────────────────────────────────────────────────

  const progressPct = ((currentIndex + 1) / totalQuestions) * 100;

  return (
    <div className={`min-h-screen bg-blue-50 transition-opacity duration-200 ${fading ? 'opacity-0' : 'opacity-100'}`}>
      {/* Progress bar */}
      <div className="bg-white px-6 py-4 shadow-sm">
        <div className="mx-auto max-w-2xl">
          <div className="mb-2 flex items-center justify-between">
            <span className="text-base font-semibold text-blue-800">
              Question {currentIndex + 1} of {totalQuestions}
            </span>
            <span className="text-sm text-blue-600">
              {mode === 'PRACTICE' ? 'Practice' : 'Test'}
            </span>
          </div>
          <div className="h-3 w-full overflow-hidden rounded-full bg-blue-100">
            <div
              className="h-full rounded-full bg-green-400 transition-all duration-500"
              style={{ width: `${progressPct}%` }}
            />
          </div>
        </div>
      </div>

      {/* Question area */}
      <div className="mx-auto max-w-2xl px-6 py-8">
        {/* Passage */}
        {question.passage && (
          <div className="mb-6 rounded-2xl bg-white p-6 shadow-sm">
            <div className="mb-3 flex items-center justify-between">
              <span className="text-sm font-semibold text-blue-600">
                {question.audio_config.read_passage ? 'Listen to the story:' : 'Read the story:'}
              </span>
              {question.audio_config.read_passage && (
                <AudioButton
                  text={question.passage}
                  label="Read Story"
                />
              )}
            </div>
            <p className="text-xl leading-relaxed text-slate-800">
              {question.passage}
            </p>
          </div>
        )}

        {/* Stem */}
        <div className="mb-6">
          <div className="flex items-start gap-3">
            <p className="flex-1 text-[28px] font-bold leading-snug text-blue-900">
              {question.stem}
            </p>
            {question.audio_config.read_stem && (
              <AudioButton
                text={stemAndChoicesText()}
                label="Read to Me"
              />
            )}
          </div>
        </div>

        {/* Choices */}
        <div className="mb-8 space-y-3">
          {CHOICE_KEYS.map((key) => (
            <button
              key={key}
              onClick={() => handleSelect(key)}
              disabled={feedback !== 'none'}
              className={`flex w-full min-h-[64px] items-center gap-4 rounded-2xl px-5 py-4
                text-left text-xl font-medium transition-colors
                ${choiceStyle(key)}
                disabled:cursor-default`}
            >
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-blue-200 text-lg font-bold text-blue-800">
                {CHOICE_LABELS[key]}
              </span>
              <span className="flex-1">{question.choices[key]}</span>
              {/* Show check/X icons during feedback */}
              {feedback !== 'none' && key === question.correct_answer && (
                <span className="text-2xl text-green-600" aria-label="Correct answer">
                  &#10003;
                </span>
              )}
              {feedback !== 'none' &&
                key === selectedAnswer &&
                key !== question.correct_answer && (
                  <span className="text-2xl text-red-400" aria-label="Your answer">
                    &#10007;
                  </span>
              )}
            </button>
          ))}
        </div>

        {/* Feedback area (Practice mode only) */}
        {feedback !== 'none' && isPractice && (
          <div
            className={`mb-6 rounded-2xl p-5 text-center ${
              feedback === 'correct'
                ? 'bg-green-100 text-green-800'
                : 'bg-amber-50 text-amber-800'
            }`}
          >
            <p className="text-2xl font-bold">
              {feedback === 'correct' ? 'Great job!' : 'Not quite!'}
            </p>
            <p className="mt-2 text-lg">{question.explanation}</p>
          </div>
        )}

        {/* Action buttons */}
        <div className="flex justify-center gap-4">
          {/* Confirm button — shows when answer selected but not yet confirmed */}
          {selectedAnswer && feedback === 'none' && (
            <button
              onClick={handleConfirm}
              className="min-h-[64px] rounded-2xl bg-green-500 px-10 py-4 text-xl
                font-bold text-white shadow-md hover:bg-green-600 transition-colors"
            >
              {isPractice ? 'Check My Answer' : 'Next'}
            </button>
          )}

          {/* Next button — shows after feedback in Practice mode */}
          {showNext && (
            <button
              onClick={handleNext}
              className="min-h-[64px] rounded-2xl bg-blue-500 px-10 py-4 text-xl
                font-bold text-white shadow-md hover:bg-blue-600 transition-colors"
            >
              {isLastQuestion ? 'All Done!' : 'Next Question'}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
