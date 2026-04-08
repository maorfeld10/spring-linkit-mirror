import { NextRequest, NextResponse } from 'next/server';
import { getClaudeClient, CLAUDE_MODEL, MAX_TOKENS } from '@/lib/claude';
import { getSupabaseClient, type Database } from '@/lib/supabase';
import type { Question, Choices, AudioConfig, StandardType } from '@/types';
import { getDefaultAudioConfig } from '@/types';

type QuestionInsert = Database['public']['Tables']['questions']['Insert'];

// âââ Request types ââââââââââââââââââââââââââââââââââââââââââââââââââââââââââ

interface Blueprint {
  READING_DECODE: number;
  READING_COMP: number;
  LISTENING_COMP: number;
}

interface GenerateBody {
  subject: string;
  count: number;
  topic?: string;
  blueprint?: Blueprint;
}

const DEFAULT_BLUEPRINT: Blueprint = {
  READING_DECODE: 34,
  READING_COMP: 33,
  LISTENING_COMP: 33,
};

// âââ Request validation ââââââââââââââââââââââââââââââââââââââââââââââââââââââ

function parseRequestBody(body: unknown): GenerateBody {
  if (typeof body !== 'object' || body === null) {
    throw new Error('Request body must be a JSON object');
  }

  const obj = body as Record<string, unknown>;

  if (obj.subject !== 'ELA') {
    throw new Error('Only subject "ELA" is supported at this time');
  }

  const count = Number(obj.count);
  if (!Number.isInteger(count) || count < 1 || count > 10) {
    throw new Error('count must be an integer between 1 and 10');
  }

  const topic = typeof obj.topic === 'string' ? obj.topic.trim() : undefined;

  // Parse blueprint (optional)
  let blueprint: Blueprint | undefined;
  if (obj.blueprint && typeof obj.blueprint === 'object') {
    const bp = obj.blueprint as Record<string, unknown>;
    const rd = Number(bp.READING_DECODE ?? 0);
    const rc = Number(bp.READING_COMP ?? 0);
    const lc = Number(bp.LISTENING_COMP ?? 0);
    if (rd + rc + lc === 100) {
      blueprint = { READING_DECODE: rd, READING_COMP: rc, LISTENING_COMP: lc };
    }
    // If they don't sum to 100, silently fall back to default
  }

  return { subject: 'ELA', count, topic, blueprint };
}

// âââ System prompt âââââââââââââââââââââââââââââââââââââââââââââââââââââââââââ

function buildSystemPrompt(
  count: number,
  topic?: string,
  blueprint?: Blueprint
): string {
  const bp = blueprint ?? DEFAULT_BLUEPRINT;

  const topicLine = topic
    ? `Use the following topic or theme as inspiration: "${topic}".`
    : 'Choose age-appropriate topics a 6-year-old would enjoy (animals, family, school, seasons, play).';

  // Compute target counts from percentages
  const decodeCount = Math.round((bp.READING_DECODE / 100) * count);
  const compCount = Math.round((bp.READING_COMP / 100) * count);
  const listenCount = Math.max(0, count - decodeCount - compCount); // Remainder goes to LISTENING_COMP

  const mixInstruction =
    `Generate approximately ${decodeCount} READING_DECODE, ${compCount} READING_COMP, and ${listenCount} LISTENING_COMP question(s). ` +
    `This is a target ratio â it is acceptable to be off by 1 if the total is exactly ${count}.`;

  return `You are an expert 1st-grade ELA assessment writer.

TASK: Generate exactly ${count} original ELA question(s) for a 1st-grade student.

TYPE MIX: ${mixInstruction}

HARD RULES â violating ANY of these makes the output invalid:

1. READING LEVEL: ATOS 1.0â1.8. Use only high-frequency Dolch and Fry sight words. Sentences must be short and simple.

2. STANDARD TYPES:
   - READING_DECODE: phonics, letter sounds, rhyming, syllable counting, CVC words.
   - READING_COMP: short passage (2â4 simple sentences) then a comprehension question.
   - LISTENING_COMP: a short passage meant to be read aloud, then a comprehension question.

3. CHOICES: Exactly 4 per question, keyed "a", "b", "c", "d". Exactly ONE correct answer.

4. DISTRACTORS: Must be plausible but clearly wrong to a competent 1st-grader. Never tricky, never mean-spirited, never confusing.

5. EXPLANATION: Exactly one sentence, friendly and encouraging. Must end with a single period. No multi-sentence explanations.

6. DIFFICULTY: Always 1 or 2. We are building confidence, not testing limits.

7. PASSAGE RULES:
   - READING_DECODE: passage is null (no passage needed).
   - READING_COMP: passage is a short paragraph (2â4 sentences, max 80 words).
   - LISTENING_COMP: passage is a short paragraph (2â4 sentences, max 80 words).

8. STEM RULES: The question stem must be 25 words or fewer. Clear, direct, simple.

9. AUDIO CONFIG â set automatically based on standard_type:
   - READING_DECODE:  { "read_passage": false, "read_stem": true, "read_choices": true }
   - READING_COMP:    { "read_passage": false, "read_stem": true, "read_choices": true }
   - LISTENING_COMP:  { "read_passage": true,  "read_stem": true, "read_choices": true }

${topicLine}

RESPONSE FORMAT: Return ONLY a valid JSON array of question objects. No markdown fences, no preamble, no explanation outside the array. Each object must have exactly these fields:

{
  "standard_type": "READING_DECODE" | "READING_COMP" | "LISTENING_COMP",
  "difficulty": 1 | 2,
  "stem": "...",
  "passage": "..." | null,
  "choices": { "a": "...", "b": "...", "c": "...", "d": "..." },
  "correct_answer": "a" | "b" | "c" | "d",
  "explanation": "One friendly sentence ending with a period."
}`;
}

// âââ Question validation âââââââââââââââââââââââââââââââââââââââââââââââââââââ

const VALID_STANDARD_TYPES: StandardType[] = [
  'READING_DECODE',
  'READING_COMP',
  'LISTENING_COMP',
];

const VALID_CHOICE_KEYS = ['a', 'b', 'c', 'd'];

interface ValidationError {
  index: number;
  reasons: string[];
}

function wordCount(text: string): number {
  return text.trim().split(/\s+/).filter(Boolean).length;
}

function validateQuestion(
  raw: Record<string, unknown>,
  index: number
): { valid: true; question: RawQuestion } | { valid: false; error: ValidationError } {
  const reasons: string[] = [];

  const standardType = raw.standard_type as string;
  if (!VALID_STANDARD_TYPES.includes(standardType as StandardType)) {
    reasons.push(`standard_type "${standardType}" is not one of: ${VALID_STANDARD_TYPES.join(', ')}`);
  }

  const difficulty = Number(raw.difficulty);
  if (difficulty !== 1 && difficulty !== 2) {
    reasons.push(`difficulty must be 1 or 2, got ${raw.difficulty}`);
  }

  const stem = String(raw.stem ?? '');
  if (!stem) {
    reasons.push('stem is empty');
  } else if (wordCount(stem) > 25) {
    reasons.push(`stem is ${wordCount(stem)} words (max 25)`);
  }

  const passage = raw.passage;
  if (passage !== null && passage !== undefined) {
    const passageStr = String(passage);
    if (passageStr && wordCount(passageStr) > 80) {
      reasons.push(`passage is ${wordCount(passageStr)} words (max 80)`);
    }
  }

  const choices = raw.choices as Record<string, unknown> | undefined;
  if (!choices || typeof choices !== 'object') {
    reasons.push('choices must be an object with keys a, b, c, d');
  } else {
    const keys = Object.keys(choices).sort();
    if (keys.length < 2 || keys.length > 4) {
      reasons.push(`choices has ${keys.length} keys (need 2â4)`);
    }
    const missing = VALID_CHOICE_KEYS.filter((k) => !keys.includes(k));
    if (missing.length > 0) {
      reasons.push(`choices missing keys: ${missing.join(', ')}`);
    }
    for (const k of keys) {
      if (typeof choices[k] !== 'string' || (choices[k] as string).trim() === '') {
        reasons.push(`choices.${k} must be a non-empty string`);
      }
    }
  }

  const correctAnswer = String(raw.correct_answer ?? '');
  if (!VALID_CHOICE_KEYS.includes(correctAnswer)) {
    reasons.push(`correct_answer "${correctAnswer}" is not one of a, b, c, d`);
  } else if (choices && typeof choices === 'object' && !(correctAnswer in choices)) {
    reasons.push(`correct_answer "${correctAnswer}" does not exist in choices`);
  }

  const explanation = String(raw.explanation ?? '');
  if (!explanation) {
    reasons.push('explanation is empty');
  } else {
    const stripped = explanation.replace(/\.\s*$/, '');
    if (stripped.includes('.')) {
      reasons.push('explanation contains more than one sentence');
    }
  }

  if (reasons.length > 0) {
    return { valid: false, error: { index, reasons } };
  }

  return {
    valid: true,
    question: {
      standard_type: standardType as StandardType,
      difficulty,
      stem,
      passage: passage === null || passage === undefined ? null : String(passage),
      choices: choices as unknown as Choices,
      correct_answer: correctAnswer,
      explanation,
    },
  };
}

interface RawQuestion {
  standard_type: StandardType;
  difficulty: number;
  stem: string;
  passage: string | null;
  choices: Choices;
  correct_answer: string;
  explanation: string;
}

// âââ POST handler ââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââ

export async function POST(request: NextRequest) {
  try {
    const body: unknown = await request.json();
    const { count, topic, blueprint } = parseRequestBody(body);

    const claude = getClaudeClient();
    const message = await claude.messages.create({
      model: CLAUDE_MODEL,
      max_tokens: MAX_TOKENS,
      messages: [
        {
          role: 'user',
          content: `Generate ${count} ELA question(s).${topic ? ` Topic: ${topic}` : ''}`,
        },
      ],
      system: buildSystemPrompt(count, topic, blueprint),
    });

    const textBlock = message.content.find((block) => block.type === 'text');
    if (!textBlock || textBlock.type !== 'text') {
      return NextResponse.json(
        { error: 'Claude returned no text content' },
        { status: 500 }
      );
    }

    let rawText = textBlock.text.trim();
    if (rawText.startsWith('```')) {
      rawText = rawText.replace(/^```(?:json)?\n?/, '').replace(/\n?```$/, '');
    }

    let parsed: unknown;
    try {
      parsed = JSON.parse(rawText);
    } catch {
      return NextResponse.json(
        { error: 'Claude returned invalid JSON', raw: rawText.slice(0, 500) },
        { status: 500 }
      );
    }

    if (!Array.isArray(parsed)) {
      return NextResponse.json(
        { error: 'Claude response is not a JSON array' },
        { status: 500 }
      );
    }

    const validQuestions: RawQuestion[] = [];
    const errors: ValidationError[] = [];

    for (let i = 0; i < parsed.length; i++) {
      const result = validateQuestion(parsed[i] as Record<string, unknown>, i);
      if (result.valid) {
        validQuestions.push(result.question);
      } else {
        errors.push(result.error);
      }
    }

    if (validQuestions.length === 0) {
      return NextResponse.json(
        { error: 'All generated questions failed validation', details: errors },
        { status: 422 }
      );
    }

    const supabase = getSupabaseClient();
    const toInsert = validQuestions.map((q) => ({
      subject: 'ELA' as const,
      standard_type: q.standard_type,
      difficulty: q.difficulty,
      stem: q.stem,
      passage: q.passage,
      choices: q.choices,
      correct_answer: q.correct_answer,
      explanation: q.explanation,
      audio_config: getDefaultAudioConfig(q.standard_type),
      status: 'PENDING_REVIEW' as const,
    }));

    const { data: inserted, error: dbError } = await supabase
      .from('questions')
      .insert(toInsert as QuestionInsert[])
      .select();

    if (dbError) {
      return NextResponse.json(
        { error: `Supabase insert failed: ${dbError.message}` },
        { status: 500 }
      );
    }

    const questions: Question[] = (inserted ?? []).map((row) => ({
      id: row.id,
      subject: row.subject as Question['subject'],
      standard_type: row.standard_type as Question['standard_type'],
      difficulty: row.difficulty,
      stem: row.stem,
      passage: row.passage,
      choices: row.choices as Choices,
      correct_answer: row.correct_answer,
      explanation: row.explanation,
      audio_config: row.audio_config as AudioConfig,
      status: row.status as Question['status'],
      created_at: row.created_at,
    }));

    return NextResponse.json({
      questions,
      generated: parsed.length,
      accepted: validQuestions.length,
      rejected: errors.length,
      validation_errors: errors.length > 0 ? errors : undefined,
    });
  } catch (err) {
    const errMsg = err instanceof Error ? err.message : 'Unknown error';
    return NextResponse.json({ error: errMsg }, { status: 500 });
  }
}
