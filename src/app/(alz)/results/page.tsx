import { toFamilyProfile, type ProfileRow } from '@/lib/family-profile';
import type { Metadata } from "next";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import {
  triageTrialsForFamily,
  sameState,
  type FamilyProfile,
  type Trial,
  type TrialLocation,
} from "@/lib/triage";
import { validProfileId, rowToForm } from "@/lib/profile";
import ResultsList, { type TrialView } from "./results-list";
import PageHeading from "../../components/page-heading";
import Recovery from "../../components/recovery";
import DeleteProfile from "../../components/delete-profile";
import { loadSnapshot } from '@/lib/trial-monitor/store';
import TrialFreshness from '@/app/components/trial-freshness';
export const dynamic = "force-dynamic";
export const metadata: Metadata = {
  title: "Your trial matches",
  robots: { index: false, follow: false },
};
/* -------------------------------------------------------------------------
 * Display helpers
 * ---------------------------------------------------------------------- */

// Same rule as triage.ts: a site with no status of its own is not treated
// as closed, because ClinicalTrials.gov does not always fill it in.
function isSiteOpen(status: string | null | undefined): boolean {
  const s = (status ?? "").trim().toUpperCase();
  return s === "" || s === "RECRUITING";
}

function normalize(value: string | null | undefined): string {
  return (value ?? "").trim().toLowerCase();
}

/** Picks the "closest" open location we can claim from country and state.
 * Prefers a same-state match, then same-country, then the first open site. */
function findNearestSite(
  trial: Trial,
  profile: FamilyProfile,
): TrialLocation | null {
  const open = (trial.locations ?? []).filter((loc) => isSiteOpen(loc.status));
  if (open.length === 0) return null;

  if (profile.location.state) {
    const inState = open.find(
      (loc) =>
        sameState(loc.state, profile.location.state) &&
        normalize(loc.country) === normalize(profile.location.country),
    );
    if (inState) return inState;
  }

  const sameCountry = open.find(
    (loc) => normalize(loc.country) === normalize(profile.location.country),
  );
  if (sameCountry) return sameCountry;

  return open[0];
}

function describeSite(site: TrialLocation | null): string {
  if (!site) return "No open recruiting site listed";
  const s = site as TrialLocation & {
    city?: string | null;
    facility?: string | null;
  };
  return [s.facility, s.city, s.state, s.country].filter(Boolean).join(", ");
}

export default async function ResultsPage({
  searchParams,
}: {
  searchParams: Promise<{ id?: string }>;
}) {
  const { id } = await searchParams;
  if (!validProfileId(id))
    return (
      <Recovery title="We couldn’t open these results">
        This results link is missing or incomplete. You can start a new search,
        and every question is optional.
      </Recovery>
    );
  let profileRow: ProfileRow;
  let results: Awaited<ReturnType<typeof triageTrialsForFamily>>;
  let family: FamilyProfile;
  try {
    const supabase = createServerSupabaseClient();
    const { data, error } = await supabase
      .from("profiles")
      .select(
        "id,location,relationship,diagnosis_stage,age_band,study_partner,willing_to_travel",
      )
      .eq("id", id)
      .single();
    if (error?.code === "PGRST116" || (!error && !data))
      throw new Error("Results link not found");
    if (error || !data) throw new Error("Unable to load profile");
    profileRow = data as ProfileRow;
    family = toFamilyProfile(profileRow);
    const snapshot = await loadSnapshot(supabase);
    results = await triageTrialsForFamily(family, supabase, snapshot);
  } catch (error) {
    if (error instanceof Error && error.message === "Results link not found") {
      return (
        <Recovery title="We couldn’t open these results">
          We couldn’t find the answers connected to this link. You can start a
          new search below.
        </Recovery>
      );
    }
    return (
      <Recovery
        title="Trial listings aren’t available right now"
        retry={"/results?id=" + encodeURIComponent(id)}
      >
        Please try again. You can also check the official registry while the
        listings are unavailable.
      </Recovery>
    );
  }
  const view = (trial: Trial, notes: string[]): TrialView => {
    const site = findNearestSite(trial, family);
    const label =
      site && !(site.status || "").trim()
        ? "Listed site (recruitment not specified)"
        : site &&
            family.location.state &&
            sameState(site.state, family.location.state)
          ? "Recruiting site in your state"
          : "Recruiting site";
    return {
      updated: trial.last_updated,
      id: trial.nct_id,
      title: trial.brief_title || trial.official_title || trial.nct_id,
      site: describeSite(site),
      siteLabel: label,
      notes,
    };
  };
  const groups = [
    {
      id: "worth-asking",
      heading: "Worth asking about",
      defaultOpen: true,
      trials: results.worthAsking.map(({ trial, caveats }) =>
        view(trial, ["The age, location and study-partner details we could check did not rule this listing out. This is not confirmation of eligibility; diagnosis-specific and other requirements still need checking with the coordinator.", ...caveats]),
      ),
    },
    {
      id: "cannot-tell",
      heading: "Can't tell — ask your doctor",
      defaultOpen: true,
      trials: results.cannotTell.map(({ trial, note }) => view(trial, [note || "The listing or parsed criteria do not give us enough reliable information to explain a potential match. Ask the coordinator about age, diagnosis, study-partner requirements and available sites."])),
    },
    {
      id: "probably-not",
      heading: "Probably not",
      defaultOpen: false,
      trials: results.probablyNot.map(({ trial, reason }) =>
        view(trial, [reason]),
      ),
    },
  ];
  return (
    <main id="main-content" className="page-shell results-page">
      <PageHeading title="Your trial matches" />
      <TrialFreshness checkedAt={results.checkedAt!} automatic={!!results.automatic}/>
      <div className="sorting-note">
        <p>
          This is an automatic sort based on what each trial has written in its
          public listing. It gets things wrong, and many listings do not say
          whether a study partner is needed.
        </p>
        <p>
          <strong>
            Calling a trial coordinator is always worth doing, whichever list a
            trial is in.
          </strong>
        </p>
      </div>
      <ResultsList
        groups={groups}
        form={rowToForm(profileRow as unknown as Record<string, unknown>)}
        profileId={id}
      />
    <DeleteProfile id={id} />
    </main>
  );
}
