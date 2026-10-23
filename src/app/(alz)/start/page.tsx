import type { Metadata } from "next";
import PageHeading from "../../components/page-heading";
import ProfileForm from "./profile-form";
import { emptyForm, rowToForm, validProfileId } from "@/lib/profile";
import { createServerSupabaseClient } from "@/lib/supabase/server";
export const metadata: Metadata = {
  title: "Your situation",
  robots: { index: false, follow: false },
};
export default async function StartPage({
  searchParams,
}: {
  searchParams: Promise<{ id?: string; deleted?: string }>;
}) {
  const { id, deleted } = await searchParams;
  let initial = emptyForm;
  let notice: string | undefined = deleted === "1" ? "Your saved answers were deleted. That results link no longer works." : undefined;
  let loadedId: string | undefined;
  if (id) {
    try {
      if (!validProfileId(id)) throw new Error("Invalid link");
      const { data, error } = await createServerSupabaseClient()
        .from("profiles")
        .select(
          "location,relationship,diagnosis_stage,age_band,study_partner,willing_to_travel",
        )
        .eq("id", id)
        .single();
      if (error || !data) throw new Error("Unavailable");
      initial = rowToForm(data);
      loadedId = id;
    } catch {
      notice =
        "We couldn’t load your previous answers. You can start again below, or return to your results and try once more.";
    }
  }
  return (
    <main id="main-content" className="page-shell form-page">
      <PageHeading title="Tell us about your situation">
        <p>
          Every question below is optional. Answer only what feels safe to share
          right now.
        </p>
      </PageHeading>
      <ProfileForm
        key={loadedId || "new"}
        initial={initial}
        profileId={loadedId}
        notice={notice}
      />
    </main>
  );
}
