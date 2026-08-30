import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// Service-role client: only ever used here, server-side.
// Never import this key into a 'use client' file.
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { persistSession: false } }
);

export async function POST(request: Request) {
  const body = await request.json();

  const {
    location,
    relationship,
    diagnosisStage,
    ageBand,
    studyPartner,
    willingToTravel,
  } = body ?? {};

  const { data, error } = await supabase
    .from('profiles')
    .insert([
      {
        location: location || null,
        relationship: relationship || null,
        diagnosis_stage: diagnosisStage || null,
        age_band: ageBand || null,
        study_partner: studyPartner || null,
        willing_to_travel: willingToTravel || null,
      },
    ])
    .select('id')
    .single();

  if (error || !data) {
    console.error(error);
    return NextResponse.json({ error: 'Failed to save profile' }, { status: 500 });
  }

  return NextResponse.json({ id: data.id });
}