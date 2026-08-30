// src/app/results/page.tsx
//
// ASSUMPTIONS TO VERIFY:
// 1. `@/lib/supabase/server` exports `createClient()` → server-side Supabase client.
// 2. There's a `profiles` table whose row needs to be mapped into the
//    `FamilyProfile` shape that `triageTrialsForFamily` expects. Since I don't
//    have your `profiles` schema, `dbRowToFamilyProfile` below guesses at
//    snake_case column names (location_country, location_state, relationship,
//    diagnosis_stage, age_band_min, age_band_max, study_partner,
//    willing_to_travel). Adjust that one function to match your real columns
//    — nothing else in the file depends on it.
// 3. `trials.nct_id` exists as a column (per your note) even though it isn't
//    on the shared `Trial` type in triage.ts — typed locally below via
//    `TrialRow` rather than editing triage.ts.
// 4. `TrialLocation` (country/state/status only, no facility name) means
//    "nearest site" can only be rendered as a region, not a named site. If
//    your `locations` jsonb actually carries a facility name/city, tell me
//    and I'll wire it in.

import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import {
  triageTrialsForFamily,
  type FamilyProfile,
  type Trial,
  type TrialLocation,
  type WorthAskingTrial,
  type ProbablyNotTrial,
  type CannotTellTrial,
} from "@/lib/triage";

export const dynamic = "force-dynamic";

// `trials.nct_id` isn't on the shared `Trial` type — widen it locally.
type TrialRow = Trial & { nct_id: string };

interface PageProps {
  searchParams: { id?: string };
}

// ---- Page ------------------------------------------------------------

export default async function ResultsPage({ searchParams }: PageProps) {
  const profileId = searchParams.id;

  if (!profileId) {
    return (
      <Shell>
        <ErrorNotice>
          No profile was specified. Check that the link includes{" "}
          <code className="font-mono">?id=</code> followed by a profile id.
        </ErrorNotice>
      </Shell>
    );
  }

  const supabase = createClient();

  const { data: profileRow, error: profileError } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", profileId)
    .single();

  if (profileError || !profileRow) {
    notFound();
  }

  let familyProfile: FamilyProfile;
  try {
    familyProfile = dbRowToFamilyProfile(profileRow);
  } catch {
    return (
      <Shell>
        <ErrorNotice>
          This profile is missing information needed to search for trials.
        </ErrorNotice>
      </Shell>
    );
  }

  let results;
  try {
    results = await triageTrialsForFamily(familyProfile, supabase);
  } catch {
    return (
      <Shell>
        <ErrorNotice>
          Something went wrong while matching trials. Please try again in a
          moment.
        </ErrorNotice>
      </Shell>
    );
  }

  const totalCount =
    results.worthAsking.length +
    results.cannotTell.length +
    results.probablyNot.length;

  return (
    <Shell>
      <h1 className="text-3xl sm:text-4xl font-bold mb-2 text-gray-900">
        Your Trial Matches
      </h1>
      <p className="text-lg text-gray-700 mb-8">
        {totalCount === 0
          ? "No recruiting trials were found to review."
          : `${totalCount} trial${totalCount === 1 ? "" : "s"} reviewed.`}
      </p>

      <Section
        title="Worth asking about"
        description="Nothing rules these out — bring them up with your doctor."
        count={results.worthAsking.length}
        open
        accentClass="border-green-600"
        badgeClass="bg-green-100 text-green-900"
      >
        {results.worthAsking.map((item) => (
          <TrialCard
            key={item.trial.id}
            trial={item.trial as TrialRow}
            familyProfile={familyProfile}
            extraLines={item.caveats}
            extraLinesLabel="Caveats"
          />
        ))}
      </Section>

      <Section
        title="Cannot tell"
        description="Too little eligibility information to say either way — worth a closer look."
        count={results.cannotTell.length}
        open
        accentClass="border-amber-500"
        badgeClass="bg-amber-100 text-amber-900"
      >
        {results.cannotTell.map((item) => (
          <TrialCard
            key={item.trial.id}
            trial={item.trial as TrialRow}
            familyProfile={familyProfile}
          />
        ))}
      </Section>

      <Section
        title="Probably not"
        description="Likely excluded, based on what we know."
        count={results.probablyNot.length}
        open={false}
        accentClass="border-gray-400"
        badgeClass="bg-gray-100 text-gray-800"
      >
        {results.probablyNot.map((item) => (
          <TrialCard
            key={item.trial.id}
            trial={item.trial as TrialRow}
            familyProfile={familyProfile}
            extraLines={[item.reason]}
            extraLinesLabel="Why"
          />
        ))}
      </Section>
    </Shell>
  );
}

// ---- Profile row → FamilyProfile mapping ------------------------------
//
// ADJUST THIS to your real `profiles` table columns — everything else in
// the file only depends on the `FamilyProfile` shape coming out of here.

function dbRowToFamilyProfile(row: Record<string, unknown>): FamilyProfile {
  const hasAgeBand =
    typeof row.age_band_min === "number" && typeof row.age_band_max === "number";

  return {
    location: {
      country: String(row.location_country ?? ""),
      state: row.location_state ? String(row.location_state) : null,
    },
    relationship: String(row.relationship ?? ""),
    diagnosisStage: String(row.diagnosis_stage ?? ""),
    ageBand: hasAgeBand
      ? {
          minAge: row.age_band_min as number,
          maxAge: row.age_band_max as number,
        }
      : null,
    studyPartner: (row.study_partner as FamilyProfile["studyPartner"]) ?? "unknown",
    willingToTravel: Boolean(row.willing_to_travel),
  };
}

// ---- Layout shell -------------------------------------------------------

function Shell({ children }: { children: React.ReactNode }) {
  return (
    <main className="min-h-screen bg-white text-gray-900">
      <div className="max-w-3xl mx-auto px-4 py-6 sm:px-8 sm:py-10 text-lg leading-relaxed">
        {children}
      </div>
    </main>
  );
}

function ErrorNotice({ children }: { children: React.ReactNode }) {
  return (
    <div
      role="alert"
      className="rounded-lg border-2 border-red-600 bg-red-50 text-red-900 p-5 text-lg"
    >
      {children}
    </div>
  );
}

// ---- Section (collapsible via native <details>) --------------------------

function Section({
  title,
  description,
  count,
  open,
  accentClass,
  badgeClass,
  children,
}: {
  title: string;
  description: string;
  count: number;
  open: boolean;
  accentClass: string;
  badgeClass: string;
  children: React.ReactNode;
}) {
  return (
    <details
      open={open}
      className={`mb-6 rounded-xl border-2 ${accentClass} bg-white overflow-hidden`}
    >
      <summary className="cursor-pointer select-none list-none px-5 py-4 flex items-center justify-between gap-4 text-xl sm:text-2xl font-bold text-gray-900 hover:bg-gray-50 focus:outline-none focus-visible:ring-4 focus-visible:ring-blue-400">
        <span className="flex items-center gap-3">
          {title}
          <span
            className={`inline-flex items-center justify-center rounded-full px-3 py-1 text-base font-semibold ${badgeClass}`}
          >
            {count}
          </span>
        </span>
        <span
          aria-hidden="true"
          className="text-2xl transition-transform duration-150 [details[open]_&]:rotate-180"
        >
          ▾
        </span>
      </summary>

      <div className="px-5 pb-5 pt-1 border-t border-gray-200">
        <p className="text-base sm:text-lg text-gray-700 mb-4">{description}</p>
        {count === 0 ? (
          <p className="text-base text-gray-500 italic">
            Nothing in this category.
          </p>
        ) : (
          <ul className="space-y-4">
            {Array.isArray(children)
              ? children.map((child, i) => <li key={i}>{child}</li>)
              : <li>{children}</li>}
          </ul>
        )}
      </div>
    </details>
  );
}

// ---- Site formatting -----------------------------------------------------

function describeNearestSite(
  locations: TrialLocation[] | null | undefined,
  profile: FamilyProfile,
): string {
  const open = (locations ?? []).filter(
    (loc) => (loc.status ?? "").trim().toUpperCase() === "RECRUITING",
  );

  if (open.length === 0) return "No open recruiting site listed";

  const sameCountry = open.filter(
    (loc) =>
      loc.country.trim().toLowerCase() ===
      profile.location.country.trim().toLowerCase(),
  );

  const pool = sameCountry.length > 0 ? sameCountry : open;

  const sameState = profile.location.state
    ? pool.find(
        (loc) =>
          (loc.state ?? "").trim().toLowerCase() ===
          profile.location.state!.trim().toLowerCase(),
      )
    : undefined;

  const site = sameState ?? pool[0];
  return [site.state, site.country].filter(Boolean).join(", ");
}

// ---- Individual trial card ------------------------------------------------

function TrialCard({
  trial,
  familyProfile,
  extraLines,
  extraLinesLabel,
}: {
  trial: TrialRow;
  familyProfile: FamilyProfile;
  extraLines?: string[];
  extraLinesLabel?: string;
}) {
  const studyUrl = `https://clinicaltrials.gov/study/${trial.nct_id}`;
  const site = describeNearestSite(trial.locations, familyProfile);

  return (
    <div className="rounded-lg border border-gray-300 p-4 sm:p-5 bg-gray-50">
      <h3 className="text-xl font-semibold text-gray-900 mb-2 leading-snug">
        {trial.title || trial.nct_id}
      </h3>

      <p className="text-base sm:text-lg text-gray-800 mb-2">
        <span className="font-semibold">Nearest site: </span>
        {site}
      </p>

      {extraLines && extraLines.length > 0 && (
        <div className="mb-2">
          <p className="font-semibold text-base sm:text-lg text-gray-900 mb-1">
            {extraLinesLabel ?? "Caveats"}:
          </p>
          <ul className="list-disc list-inside space-y-1 text-base sm:text-lg text-gray-800">
            {extraLines.map((line, i) => (
              <li key={i}>{line}</li>
            ))}
          </ul>
        </div>
      )}

      
        href={studyUrl}
        target="_blank"
        rel="noopener noreferrer"
        className="inline-block mt-2 text-lg font-semibold text-blue-800 underline underline-offset-2 hover:text-blue-900 focus:outline-none focus-visible:ring-4 focus-visible:ring-blue-400 rounded"
      >
        View on ClinicalTrials.gov ↗
      </a>
    </div>
  );
}