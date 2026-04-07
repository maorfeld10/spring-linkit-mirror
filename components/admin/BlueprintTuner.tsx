'use client';

import { useState, useEffect } from 'react';

// ─── Types ──────────────────────────────────────────────────────────────────

export interface Blueprint {
  READING_DECODE: number;
  READING_COMP: number;
  LISTENING_COMP: number;
}

const STORAGE_KEY = 'linkit_blueprint';

const DEFAULT_BLUEPRINT: Blueprint = {
  READING_DECODE: 34,
  READING_COMP: 33,
  LISTENING_COMP: 33,
};

const LABELS: Record<keyof Blueprint, string> = {
  READING_DECODE: 'Reading Decode',
  READING_COMP: 'Reading Comp',
  LISTENING_COMP: 'Listening Comp',
};

const BADGE_COLORS: Record<keyof Blueprint, string> = {
  READING_DECODE: 'bg-violet-100 text-violet-800',
  READING_COMP: 'bg-amber-100 text-amber-800',
  LISTENING_COMP: 'bg-teal-100 text-teal-800',
};

// ─── Persistence ────────────────────────────────────────────────────────────

export function loadBlueprint(): Blueprint {
  if (typeof window === 'undefined') return DEFAULT_BLUEPRINT;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return DEFAULT_BLUEPRINT;
    const parsed = JSON.parse(raw) as Blueprint;
    if (
      typeof parsed.READING_DECODE === 'number' &&
      typeof parsed.READING_COMP === 'number' &&
      typeof parsed.LISTENING_COMP === 'number'
    ) {
      return parsed;
    }
    return DEFAULT_BLUEPRINT;
  } catch {
    return DEFAULT_BLUEPRINT;
  }
}

function saveBlueprint(bp: Blueprint): void {
  if (typeof window === 'undefined') return;
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(bp));
}

// ─── Component ──────────────────────────────────────────────────────────────

interface BlueprintTunerProps {
  onBlueprintChange?: (bp: Blueprint) => void;
}

export default function BlueprintTuner({ onBlueprintChange }: BlueprintTunerProps) {
  const [blueprint, setBlueprint] = useState<Blueprint>(DEFAULT_BLUEPRINT);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const loaded = loadBlueprint();
    setBlueprint(loaded);
  }, []);

  const total =
    blueprint.READING_DECODE +
    blueprint.READING_COMP +
    blueprint.LISTENING_COMP;

  const isValid = total === 100;

  function handleChange(key: keyof Blueprint, value: number) {
    const clamped = Math.max(0, Math.min(100, value));
    const next = { ...blueprint, [key]: clamped };
    setBlueprint(next);
  }

  function handleSave() {
    if (!isValid) return;
    saveBlueprint(blueprint);
    onBlueprintChange?.(blueprint);
  }

  function handleReset() {
    setBlueprint(DEFAULT_BLUEPRINT);
    saveBlueprint(DEFAULT_BLUEPRINT);
    onBlueprintChange?.(DEFAULT_BLUEPRINT);
  }

  const keys: (keyof Blueprint)[] = ['READING_DECODE', 'READING_COMP', 'LISTENING_COMP'];

  return (
    <div className="rounded-lg border border-slate-200 bg-white">
      <button
        onClick={() => setOpen(!open)}
        className="flex w-full items-center justify-between px-4 py-3 text-left"
      >
        <span className="text-sm font-semibold text-slate-700">
          Blueprint Tuner
        </span>
        <span className="text-xs text-slate-400">{open ? '▲' : '▼'}</span>
      </button>

      {open && (
        <div className="border-t border-slate-100 px-4 py-4">
          <p className="mb-3 text-xs text-slate-500">
            Set the % mix of question types. Must total 100%.
          </p>

          <div className="space-y-3">
            {keys.map((key) => (
              <div key={key}>
                <div className="mb-1 flex items-center justify-between">
                  <span className={`rounded px-2 py-0.5 text-xs font-semibold ${BADGE_COLORS[key]}`}>
                    {LABELS[key]}
                  </span>
                  <span className="text-xs font-mono text-slate-500">
                    {blueprint[key]}%
                  </span>
                </div>
                <input
                  type="range"
                  min={0}
                  max={100}
                  step={1}
                  value={blueprint[key]}
                  onChange={(e) => handleChange(key, Number(e.target.value))}
                  className="w-full accent-slate-600"
                />
              </div>
            ))}
          </div>

          {/* Total indicator */}
          <div className={`mt-3 rounded px-3 py-1.5 text-center text-xs font-semibold ${
            isValid
              ? 'bg-green-50 text-green-700'
              : 'bg-red-50 text-red-700'
          }`}>
            Total: {total}%{' '}
            {isValid ? '— Ready' : `— Must be 100% (off by ${total - 100 > 0 ? '+' : ''}${total - 100})`}
          </div>

          {/* Buttons */}
          <div className="mt-3 flex gap-2">
            <button
              onClick={handleSave}
              disabled={!isValid}
              className="flex-1 rounded bg-slate-800 px-3 py-1.5 text-xs font-semibold text-white hover:bg-slate-900 disabled:opacity-40"
            >
              Save Blueprint
            </button>
            <button
              onClick={handleReset}
              className="rounded border border-slate-300 px-3 py-1.5 text-xs font-medium text-slate-600 hover:bg-slate-50"
            >
              Reset
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
