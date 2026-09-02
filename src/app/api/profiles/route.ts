import { NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase/server';

// Service-role client, created inside the handler so the build does not
// need the environment variables just to compile this route.
// Never import this key into a 'use client' file.
export async function POST(request: Request) {
  const supabase = createServerSupabaseClient();
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