import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseClient } from '@/lib/supabase';

// ─── GET /api/sessions?child_name=Student ────────────────────────────────────

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const childName = searchParams.get('child_name');

    const supabase = getSupabaseClient();
    let query = supabase
      .from('sessions')
      .select('*')
      .order('created_at', { ascending: false });

    if (childName) {
      query = query.eq('child_name', childName);
    }

    const { data, error } = await query;

    if (error) {
      return NextResponse.json(
        { error: `Supabase query failed: ${error.message}` },
        { status: 500 }
      );
    }

    return NextResponse.json({ sessions: data ?? [] });
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Unknown error';
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

// ─── POST /api/sessions — create a new session ──────────────────────────────
// Body: { child_name: string, mode: string, subject: string }

interface CreateBody {
  child_name: string;
  mode: string;
  subject: string;
}

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as CreateBody;

    if (!body.child_name || !body.mode || !body.subject) {
      return NextResponse.json(
        { error: 'Missing required fields: child_name, mode, subject' },
        { status: 400 }
      );
    }

    const supabase = getSupabaseClient();
    const { data, error } = await supabase
      .from('sessions')
      .insert({
        child_name: body.child_name,
        mode: body.mode,
        subject: body.subject,
        score: null,
        completed_at: null,
        responses: [],
        status: 'IN_PROGRESS',
      } as any)
      .select()
      .single();

    if (error) {
      return NextResponse.json(
        { error: `Supabase insert failed: ${error.message}` },
        { status: 500 }
      );
    }

    return NextResponse.json({ session: data }, { status: 201 });
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Unknown error';
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

// ─── PATCH /api/sessions — update session (sync on completion) ───────────────
// Body: { id: string, status?, score?, responses?, completed_at? }

interface PatchBody {
  id: string;
  status?: string;
  score?: number;
  responses?: unknown;
  completed_at?: string;
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
    const updates: Record<string, unknown> = {};

    if (body.status !== undefined) updates.status = body.status;
    if (body.score !== undefined) updates.score = body.score;
    if (body.responses !== undefined) updates.responses = body.responses;
    if (body.completed_at !== undefined) updates.completed_at = body.completed_at;

    if (Object.keys(updates).length === 0) {
      return NextResponse.json(
        { error: 'No fields to update' },
        { status: 400 }
      );
    }

    const { data, error } = await supabase
      .from('sessions')
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

    return NextResponse.json({ session: data });
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Unknown error';
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseClient } from '@/lib/supabase';

// ─── GET /api/sessions?child_name=Student ────────────────────────────────────

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const childName = searchParams.get('child_name');

    const supabase = getSupabaseClient();
    let query = supabase
      .from('sessions')
      .select('*')
      .order('created_at', { ascending: false });

    if (childName) {
      query = query.eq('child_name', childName);
    }

    const { data, error } = await query;

    if (error) {
      return NextResponse.json(
        { error: `Supabase query failed: ${error.message}` },
        { status: 500 }
      );
    }

    return NextResponse.json({ sessions: data ?? [] });
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Unknown error';
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

// ─── POST /api/sessions — create a new session ──────────────────────────────
// Body: { child_name: string, mode: string, subject: string }

interface CreateBody {
  child_name: string;
  mode: string;
  subject: string;
}

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as CreateBody;

    if (!body.child_name || !body.mode || !body.subject) {
      return NextResponse.json(
        { error: 'Missing required fields: child_name, mode, subject' },
        { status: 400 }
      );
    }

    const supabase = getSupabaseClient();
    const { data, error } = await supabase
      .from('sessions')
      .insert({
        child_name: body.child_name,
        mode: body.mode,
        subject: body.subject,
        score: null,
        completed_at: null,
        responses: [],
        status: 'IN_PROGRESS',
      })
      .select()
      .single();

    if (error) {
      return NextResponse.json(
        { error: `Supabase insert failed: ${error.message}` },
        { status: 500 }
      );
    }

    return NextResponse.json({ session: data }, { status: 201 });
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Unknown error';
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

// ─── PATCH /api/sessions — update session (sync on completion) ───────────────
// Body: { id: string, status?, score?, responses?, completed_at? }

interface PatchBody {
  id: string;
  status?: string;
  score?: number;
  responses?: unknown;
  completed_at?: string;
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
    const updates: Record<string, unknown> = {};

    if (body.status !== undefined) updates.status = body.status;
    if (body.score !== undefined) updates.score = body.score;
    if (body.responses !== undefined) updates.responses = body.responses;
    if (body.completed_at !== undefined) updates.completed_at = body.completed_at;

    if (Object.keys(updates).length === 0) {
      return NextResponse.json(
        { error: 'No fields to update' },
        { status: 400 }
      );
    }

    const { data, error } = await supabase
      .from('sessions')
      .update(updates)
      .eq('id', body.id)
      .select()
      .single();

    if (error) {
      return NextResponse.json(
        { error: `Supabase update failed: ${error.message}` },
        { status: 500 }
      );
    }

    return NextResponse.json({ session: data });
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Unknown error';
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
