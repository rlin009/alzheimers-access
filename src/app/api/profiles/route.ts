import { NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { validateForm } from "@/lib/profile";
export async function POST(request: Request) {
  let input: unknown;
  try {
    input = await request.json();
  } catch {
    return NextResponse.json(
      { error: "Please check your answers and try again." },
      { status: 400 },
    );
  }
  const form = validateForm(input);
  if (!form)
    return NextResponse.json(
      { error: "Please check your answers and try again." },
      { status: 400 },
    );
  try {
    const { data, error } = await createServerSupabaseClient()
      .from("profiles")
      .insert([
        {
          location: form.location || null,
          relationship: form.relationship || null,
          diagnosis_stage: form.diagnosisStage || null,
          age_band: form.ageBand || null,
          study_partner: form.studyPartner || null,
          willing_to_travel: form.willingToTravel || null,
        },
      ])
      .select("id")
      .single();
    if (error || !data) throw new Error("Profile unavailable");
    return NextResponse.json(
      { id: data.id },
      { headers: { "Cache-Control": "no-store" } },
    );
  } catch {
    return NextResponse.json(
      { error: "We couldn’t save your answers. Please try again." },
      { status: 503 },
    );
  }
}
