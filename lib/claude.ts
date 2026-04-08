import Anthropic from '@anthropic-ai/sdk';
import type { Question } from '@/types';

// ─── Client singleton (server-side only) ─────────────────────────────────────

const apiKey = process.env.ANTHROPIC_API_KEY;

if (!apiKey) {
  throw new Error('Missing ANTHROPIC_API_KEY environment variable');
}

let client: Anthropic | null = null;

export function getClaudeClient(): Anthropic {
  if (!client) {
    client = new Anthropic({ apiKey });
  }
  return client;
}

export const CLAUDE_MODEL = 'claude-3-5-sonnet-20241022';
export const MAX_TOKENS = 4096;

// ─── ELA question generator (calls our own API route) ────────────────────────
// This function is for use in Server Components or other server-side code.
// It calls /api/generate internally, keeping the Anthropic key server-side.

interface GenerateResult {
  questions: Question[];
  generated: number;
  accepted: number;
  rejected: number;
  validation_errors?: Array<{ index: number; reasons: string[] }>;
}

export async function generateELAQuestions(
  count: number,
  topic?: string
): Promise<GenerateResult> {
  // Resolve base URL for internal fetch in server context
  const baseUrl =
    process.env.NEXT_PUBLIC_APP_URL ??
    (process.env.VERCEL_URL
      ? `https://${process.env.VERCEL_URL}`
      : 'http://localhost:3000');

  const response = await fetch(`${baseUrl}/api/generate`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ subject: 'ELA', count, topic }),
  });

  if (!response.ok) {
    const err = (await response.json()) as { error: string };
    throw new Error(err.error ?? `Generate API returned ${response.status}`);
  }

  const data = (await response.json()) as GenerateResult;
  return data;
}
