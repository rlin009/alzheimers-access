import { NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { validateForm, validProfileId } from "@/lib/profile";
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
          relationship: null,
          diagnosis_stage: null,
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

// The existing random results link is a bearer capability. Never accept deletion
// by email, location, or a guessed sequential identifier.
export async function DELETE(request: Request) {
  if (request.headers.get("origin") !== new URL(request.url).origin)
    return NextResponse.json({ error: "Open your results page to delete answers." }, { status: 403 });
  let body;
  try { body = await request.json(); } catch { return NextResponse.json({ error: "Invalid request." }, { status: 400 }); }
  if (!validProfileId(body?.id)) return NextResponse.json({ error: "Invalid results link." }, { status: 400 });
  try {
    const { error } = await createServerSupabaseClient().from("profiles").delete().eq("id", body.id);
    if (error) throw error;
    return NextResponse.json({ deleted: true }, { headers: { "Cache-Control": "no-store" } });
  } catch { return NextResponse.json({ error: "Unable to delete answers." }, { status: 503 }); }
}
