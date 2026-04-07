'use client';

import { useState, useEffect, useCallback } from 'react';
import { speak, stop, isSpeaking } from '@/lib/audio';

interface AudioButtonProps {
  text: string;
  label?: string;       // Accessible label, e.g. "Read the passage"
  disabled?: boolean;
  className?: string;
}

export default function AudioButton({
  text,
  label = 'Read to Me',
  disabled = false,
  className = '',
}: AudioButtonProps) {
  const [speaking, setSpeaking] = useState(false);

  // Poll speaking state (Web Speech API has no reliable event for this)
  useEffect(() => {
    if (!speaking) return;
    const interval = setInterval(() => {
      if (!isSpeaking()) {
        setSpeaking(false);
      }
    }, 200);
    return () => clearInterval(interval);
  }, [speaking]);

  // Stop speech on unmount
  useEffect(() => {
    return () => {
      stop();
    };
  }, []);

  const handleClick = useCallback(async () => {
    if (speaking) {
      stop();
      setSpeaking(false);
      return;
    }

    setSpeaking(true);
    try {
      await speak(text);
    } catch {
      // Speech error — ignore
    } finally {
      setSpeaking(false);
    }
  }, [speaking, text]);

  return (
    <button
      onClick={handleClick}
      disabled={disabled}
      aria-label={speaking ? 'Stop reading' : label}
      className={`inline-flex min-h-[48px] items-center gap-2 rounded-xl px-4 py-2
        text-base font-semibold transition-colors
        ${speaking
          ? 'bg-red-100 text-red-700 hover:bg-red-200'
          : 'bg-blue-100 text-blue-700 hover:bg-blue-200'
        }
        disabled:cursor-not-allowed disabled:opacity-40
        ${className}`}
    >
      <span className="text-xl" aria-hidden="true">
        {speaking ? '\u23F9' : '\uD83D\uDD0A'}
      </span>
      <span className="hidden sm:inline">
        {speaking ? 'Stop' : label}
      </span>
    </button>
  );
}
