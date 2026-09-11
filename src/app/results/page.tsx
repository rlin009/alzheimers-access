import type { Metadata } from "next";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import {
  triageTrialsForFamily,
  sameState,
  stateName,
  type FamilyProfile,
  type StudyPartnerAvailability,
  type Trial,
  type TrialLocation,
} from "@/lib/triage";
import { validProfileId, rowToForm } from "@/lib/profile";
import ResultsList, { type TrialView } from "./results-list";
import PageHeading from "../components/page-heading";
import Recovery from "../components/recovery";
export const dynamic = "force-dynamic";
export const metadata: Metadata = {
  title: "Your trial matches",
  robots: { index: false, follow: false },
};
interface ProfileRow {
  id: string;
  location: string | null;
  relationship: string | null;
  diagnosis_stage: string | null;
  age_band: string | null;
  study_partner: string | null;
  willing_to_travel: string | null;
}

const AGE_BAND_RANGES: Record<string, { minAge: number; maxAge: number }> = {
  "under-50": { minAge: 0, maxAge: 49 },
  "50-64": { minAge: 50, maxAge: 64 },
  "65-74": { minAge: 65, maxAge: 74 },
  "75-84": { minAge: 75, maxAge: 84 },
  "85-plus": { minAge: 85, maxAge: 150 },
};

// Recognize a full state name at the end, or the final state abbreviation.
// ZIP codes and driving distances are not inferred.
const US_STATE_CODES = new Set([
  "AL",
  "AK",
  "AZ",
  "AR",
  "CA",
  "CO",
  "CT",
  "DE",
  "FL",
  "GA",
  "HI",
  "ID",
  "IL",
  "IN",
  "IA",
  "KS",
  "KY",
  "LA",
  "ME",
  "MD",
  "MA",
  "MI",
  "MN",
  "MS",
  "MO",
  "MT",
  "NE",
  "NV",
  "NH",
  "NJ",
  "NM",
  "NY",
  "NC",
  "ND",
  "OH",
  "OK",
  "OR",
  "PA",
  "RI",
  "SC",
  "SD",
  "TN",
  "TX",
  "UT",
  "VT",
  "VA",
  "WA",
  "WV",
  "WI",
  "WY",
  "DC",
]);

function extractState(location: string | null): string | null {
  if (!location) return null;
  const text = location.trim().toLowerCase();
  for (const code of US_STATE_CODES) {
    const name = stateName(code);
    if (
      text === name ||
      text.endsWith(", " + name) ||
      text.endsWith(" " + name)
    )
      return code;
  }
  const tokens = location.toUpperCase().match(/\b[A-Z]{2}\b/g) || [];
  return tokens.reverse().find((token) => US_STATE_CODES.has(token)) || null;
}

function mapStudyPartner(value: string | null): StudyPartnerAvailability {
  if (value === "yes") return "yes";
  if (value === "no") return "no";
  return "unknown"; // covers 'not-sure' and blank/null
}

function mapWillingToTravel(value: string | null): boolean {
  if (value === "local-only") return false;
  if (value === "short-drive" || value === "long-distance") return true;
  // Not answered: default to true so we don't silently drop trials over
  // a skipped question. Flip this if you'd rather default conservatively.
  return true;
}

function toFamilyProfile(row: ProfileRow): FamilyProfile {
  return {
    location: {
      country: "United States", // assumed — see chat notes
      state: extractState(row.location),
    },
    relationship: row.relationship ?? "",
    diagnosisStage: row.diagnosis_stage ?? "",
    ageBand: row.age_band ? (AGE_BAND_RANGES[row.age_band] ?? null) : null,
    studyPartner: mapStudyPartner(row.study_partner),
    willingToTravel: mapWillingToTravel(row.willing_to_travel),
  };
}

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
    results = await triageTrialsForFamily(family, supabase);
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
        view(trial, caveats),
      ),
    },
    {
      id: "cannot-tell",
      heading: "Can't tell — ask your doctor",
      defaultOpen: true,
      trials: results.cannotTell.map(({ trial, note }) => view(trial, note ? [note] : [])),
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
    </main>
  );
}
