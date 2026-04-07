'use client';

import type { SpeechConfig } from '@/types';

const DEFAULT_CONFIG: SpeechConfig = {
  rate: 0.9,
  pitch: 1,
  volume: 1,
  voice: null,
};

let currentUtterance: SpeechSynthesisUtterance | null = null;

function getSynthesis(): SpeechSynthesis | null {
  if (typeof window === 'undefined') return null;
  return window.speechSynthesis;
}

function findVoice(name: string | null): SpeechSynthesisVoice | null {
  if (!name) return null;
  const synth = getSynthesis();
  if (!synth) return null;
  const voices = synth.getVoices();
  return voices.find((v) => v.name === name) ?? null;
}

export function speak(
  text: string,
  config: Partial<SpeechConfig> = {}
): Promise<void> {
  return new Promise((resolve, reject) => {
    const synth = getSynthesis();
    if (!synth) {
      reject(new Error('Speech synthesis not available'));
      return;
    }

    stop();

    const merged = { ...DEFAULT_CONFIG, ...config };
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.rate = merged.rate;
    utterance.pitch = merged.pitch;
    utterance.volume = merged.volume;

    const voice = findVoice(merged.voice);
    if (voice) {
      utterance.voice = voice;
    }

    utterance.onend = () => {
      currentUtterance = null;
      resolve();
    };

    utterance.onerror = (event) => {
      currentUtterance = null;
      if (event.error === 'canceled') {
        resolve();
      } else {
        reject(new Error(`Speech error: ${event.error}`));
      }
    };

    currentUtterance = utterance;
    synth.speak(utterance);
  });
}

export function stop(): void {
  const synth = getSynthesis();
  if (synth) {
    synth.cancel();
  }
  currentUtterance = null;
}

export function isSpeaking(): boolean {
  const synth = getSynthesis();
  if (!synth) return false;
  return synth.speaking;
}

export function getAvailableVoices(): SpeechSynthesisVoice[] {
  const synth = getSynthesis();
  if (!synth) return [];
  return synth.getVoices();
}
