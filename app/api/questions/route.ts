import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseClient } from '@/lib/supabase';
import type { Question, Choices, AudioConfig } from '@/types';
import { getDefaultAudioConfig } from '@/types';

// ─── Helpers ─────────────────────────────────────────────────────────────────

function rowToQuestion(row: Record<string, unknown>): Question {
  return {
    id: row.id as string,
    subject: row.subject as Question['subject'],
    standard_type: row.standard_type as Question['standard_type'],
    difficulty: row.difficulty as number,
    stem: row.stem as string,
    passage: row.passage as string | null,
    choices: row.choices as Choices,
    correct_answer: row.correct_answer as string,
    explanation: row.explanation as string,
    audio_config: row.audio_config as AudioConfig,
    status: row.status as Question['status'],
    created_at: row.created_at as string,
  };
}

// ─── GET /api/questions?status=PENDING_REVIEW&subject=ELA ────────────────────

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');
    const subject = searchParams.get('subject');

    const supabase = getSupabaseClient();
    let query = supabase
      .from('questions')
      .select('*')
      .order('created_at', { ascending: false });

    if (status) {
      query = query.eq('status', status);
    }
    if (subject) {
      query = query.eq('subject', subject);
    }

    const { data, error } = await query;

    if (error) {
      return NextResponse.json(
        { error: `Supabase query failed: ${error.message}` },
        { status: 500 }
      );
    }

    const questions = ((data ?? []) as any[]).map((row: any) =>
      rowToQuestion(row as unknown as Record<string, unknown>)
    );

    return NextResponse.json({ questions });
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Unknown error';
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

// ─── PATCH /api/questions ────────────────────────────────────────────────────
// Body: { id: string, ...fieldsToUpdate }

interface PatchBody {
  id: string;
  status?: string;
  stem?: string;
  passage?: string | null;
  choices?: Choices;
  correct_answer?: string;
  explanation?: string;
  difficulty?: number;
  standard_type?: string;
}

export async function PATCH(request: NextRequest) {
  try {
    const body = (await request.json()) as PatchBody;

    if (!body.id || typeof body.id !== 'string') {
      return NextResponse.json(
        { error: 'Missing required field: id' },
        { status: 400 }
      );
    }

    const supabase = getSupabaseClient();

    // Build update payload — only include fields that were sent
    const updates: Record<string, unknown> = {};

    if (body.status !== undefined) updates.status = body.status;
    if (body.stem !== undefined) updates.stem = body.stem;
    if (body.passage !== undefined) updates.passage = body.passage;
    if (body.choices !== undefined) updates.choices = body.choices;
    if (body.correct_answer !== undefined) updates.correct_answer = body.correct_answer;
    if (body.explanation !== undefined) updates.explanation = body.explanation;
    if (body.difficulty !== undefined) updates.difficulty = body.difficulty;

    // If standard_type changes, recalculate audio_config
    if (body.standard_type !== undefined) {
      updates.standard_type = body.standard_type;
      const validTypes = ['READING_DECODE', 'READING_COMP', 'LISTENING_COMP', 'MATH_CONCEPT'];
      if (validTypes.includes(body.standard_type)) {
        updates.audio_config = getDefaultAudioConfig(
          body.standard_type as Question['standard_type']
        );
      }
    }

    if (Object.keys(updates).length === 0) {
      return NextResponse.json(
        { error: 'No fields to update' },
        { status: 400 }
      );
    }

    const { data, error } = await supabase
      .from('questions')
      .update(updates as any)
      .eq('id', body.id)
      .select()
      .single();

    if (error) {
      return NextResponse.json(
        { error: `Supabase update failed: ${error.message}` },
        { status: 500 }
      );
    }

    const question = rowToQuestion((data as any) as Record<string, unknown>);
    return NextResponse.json({ question });
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Unknown error';
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

// ─── DELETE /api/questions?id=uuid ───────────────────────────────────────────

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json(
        { error: 'Missing required query param: id' },
        { status: 400 }
      );
    }

    const supabase = getSupabaseClient();
    const { error } = await supabase
      .from('questions')
      .delete()
      .eq('id', id);

    if (error) {
      return NextResponse.json(
        { error: `Supabase delete failed: ${error.message}` },
        { status: 500 }
      );
    }

    return NextResponse.json({ deleted: id });
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Unknown error';
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
