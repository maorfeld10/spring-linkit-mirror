import { NextResponse } from 'next/server';
import { getSupabaseClient } from '@/lib/supabase';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const supabase = getSupabaseClient();

    // Lightweight query to verify Supabase connectivity
    const { error } = await supabase
      .from('questions')
      .select('id', { count: 'exact', head: true });

    if (error) {
      return NextResponse.json(
        {
          status: 'error',
          service: 'supabase',
          message: error.message,
          timestamp: new Date().toISOString(),
        },
        { status: 503 }
      );
    }

    return NextResponse.json({
      status: 'ok',
      timestamp: new Date().toISOString(),
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    return NextResponse.json(
      { status: 'error', message, timestamp: new Date().toISOString() },
      { status: 500 }
    );
  }
}
