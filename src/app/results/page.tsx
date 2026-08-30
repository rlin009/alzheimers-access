// src/app/results/page.tsx
//
// ASSUMPTIONS — read before trusting this fully:
//
// 1. Supabase server client import. Assumed:
//      import { createClient } from '@/lib/supabase/server'
//    Change the path if yours lives elsewhere.
//
// 2. ClinicalTrials.gov link: assumes trial.id IS the NCT number
//    (e.g. "NCT01234567"). If your `trials.id` is an internal UUID
//    instead, change ctgovUrl() below to use the real NCT column.
//
// 3. mapProfileToFamilyProfile() below converts your actual saved columns
//    (free-text `location`, string `age_band`, etc.) into the structured
//    shape triage.ts expects. See the comments on that function — the
//    state-extraction and "prefer not to say -> travel" defaults are
//    judgment calls, not certainties, because the form only collects
//    free text / bucketed strings.

import { createClient } from '@/lib/supabase/server';
import {
  triageTrialsForFamily,
  type FamilyProfile,
  type Trial,
  type WorthAskingTrial,
  type ProbablyNotTrial,
  type CannotTellTrial,
} from '@/lib/triage';
import Link from 'next/link';

export const dynamic = 'force-dynamic';

// --- Raw Supabase row shape (matches src/app/start/page.tsx's insert) ---

interface ProfileRow {
  id: string;
  location: string | null;
  relationship: string | null;
  diagnosis_stage: string | null;
  age_band: string | null;
  study_partner: string | null;
  willing_to_travel: string | null;
}

// US state abbreviations, used to pull a state out of free-text location
// like "Charlotte, NC". Not exhaustive of every valid input a person could
// type (a bare zip code won't match), but covers the common case.
const US_STATE_CODES = new Set([
  'AL','AK','AZ','AR','CA','CO','CT','DE','FL','GA','HI','ID','IL','IN','IA',
  'KS','KY','LA','ME','MD','MA','MI','MN','MS','MO','MT','NE','NV','NH','NJ',
  'NM','NY','NC','ND','OH','OK','OR','PA','RI','SC','SD','TN','TX','UT','VT',
  'VA','WA','WV','WI','WY','DC',
]);

function parseLocation(raw: string | null): FamilyProfile['location'] {
  if (!raw) return { country: 'United States' };
  const match = raw.toUpperCase().match(/\b([A-Z]{2})\b/);
  const state = match && US_STATE_CODES.has(match[1]) ? match[1] : undefined;
  return { country: 'United States', state };
}

function parseAgeBand(raw: string | null): FamilyProfile['ageBand'] {
  switch (raw) {
    case 'under-50':
      return { minAge: 0, maxAge: 49 };
    case '50-64':
      return { minAge: 50, maxAge: 64 };
    case '65-74':
      return { minAge: 65, maxAge: 74 };
    case '75-84':
      return { minAge: 75, maxAge: 84 };
    case '85-plus':
      return { minAge: 85, maxAge: 120 };
    default:
      // No age given -> triage.ts skips the age rule entirely, which is
      // the correct behavior for "prefer not to say."
      return null;
  }
}

function parseStudyPartner(raw: string | null): FamilyProfile['studyPartner'] {
  if (raw === 'yes') return 'yes';
  if (raw === 'no') return 'no';
  return 'unknown'; // covers 'not-sure' and blank
}

function parseWillingToTravel(raw: string | null): boolean {
  if (raw === 'local-only') return false;
  // 'short-drive', 'long-distance', and blank/"prefer not to say" all
  // default to true (permissive) rather than excluding people who didn't
  // answer. Flip this default if you'd rather treat "blank" as local-only.
  return true;
}

function mapProfileToFamilyProfile(row: ProfileRow): FamilyProfile {
  return {
    location: parseLocation(row.location),
    relationship: row.relationship ?? '',
    diagnosisStage: row.diagnosis_stage ?? '',
    ageBand: parseAgeBand(row.age_band),
    studyPartner: parseStudyPartner(row.study_partner),
    willingToTravel: parseWillingToTravel(row.willing_to_travel),
  };
}

// --- Display helpers ---------------------------------------------------

function ctgovUrl(trial: Trial): string {
  return `https://clinicaltrials.gov/study/${trial.id}`;
}

function nearestSiteText(trial: Trial, profile: FamilyProfile): string {
  const locations = trial.locations ?? [];
  const open = locations.filter((loc) => (loc.status ?? '').trim().toUpperCase() === 'RECRUITING');

  if (open.length === 0) return 'No open site listed';

  const inState = profile.location.state
    ? open.find((loc) => (loc.state ?? '').toLowerCase() === profile.location.state!.toLowerCase())
    : undefined;
  const inCountry = open.find(
    (loc) => loc.country.toLowerCase() === profile.location.country.toLowerCase(),
  );
  const site = inState ?? inCountry ?? open[0];

  return site.state ? `${site.state}, ${site.country}` : site.country;
}

function trialTitle(trial: Trial): string {
  return trial.title?.trim() || 'Untitled trial';
}

// --- Page ----------------------------------------------------------------

export default async function ResultsPage({
  searchParams,
}: {
  searchParams: Promise<{ id?: string }>;
}) {
  const { id } = await searchParams;

  if (!id) {
    return <ErrorState message="No profile was specified. Please go back and submit the form again." />;
  }

  const supabase = await createClient();

  const { data: profileRow, error: profileError } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', id)
    .single();

  if (profileError || !profileRow) {
    return <ErrorState message="We couldn't find that profile. Please go back and submit the form again." />;
  }

  const profile = mapProfileToFamilyProfile(profileRow as ProfileRow);

  let results;
  try {
    results = await triageTrialsForFamily(profile, supabase);
  } catch (e) {
    console.error('Triage failed:', e);
    return (
      <ErrorState message="Something went wrong while matching trials. Please try again, or call a trial coordinator directly." />
    );
  }

  return (
    <main className="min-h-screen bg-white text-gray-900">
      <div className="mx-auto max-w-2xl px-4 py-8 sm:px-6">
        <Disclaimer />

        <Section
          heading="Worth asking about"
          emptyText="No trials matched well enough to put in this section."
        >
          {results.worthAsking.map((item: WorthAskingTrial) => (
            <TrialCard
              key={item.trial.id}
              title={trialTitle(item.trial)}
              nearestSite={nearestSiteText(item.trial, profile)}
              caveats={item.caveats}
              url={ctgovUrl(item.trial)}
            />
          ))}
        </Section>

        <Section
          heading="Can't tell from what's on file"
          emptyText="No trials landed here — the form couldn't tell either way."
        >
          {results.cannotTell.map((item: CannotTellTrial) => (
            <TrialCard
              key={item.trial.id}
              title={trialTitle(item.trial)}
              nearestSite={nearestSiteText(item.trial, profile)}
              caveats={["There isn't enough written down about this trial's criteria to say either way."]}
              url={ctgovUrl(item.trial)}
            />
          ))}
        </Section>

        <Section
          heading="Probably not a match"
          emptyText="No trials were ruled out."
          collapsible
          collapsedByDefault
          subtext="These are shown so nothing disappears silently — but they're the least likely to be useful."
        >
          {results.probablyNot.map((item: ProbablyNotTrial) => (
            <TrialCard
              key={item.trial.id}
              title={trialTitle(item.trial)}
              nearestSite={nearestSiteText(item.trial, profile)}
              caveats={[item.reason]}
              url={ctgovUrl(item.trial)}
            />
          ))}
        </Section>
      </div>
    </main>
  );
}

// --- Disclaimer ----------------------------------------------------------

function Disclaimer() {
  return (
    <p className="mb-8 rounded-lg bg-yellow-50 border border-yellow-300 px-4 py-4 text-lg leading-relaxed text-gray-900">
      This is an automatic sort based on what each trial has written down —
      it gets things wrong, and calling a trial coordinator is always worth
      doing.
    </p>
  );
}

// --- Section ---------------------------------------------------------------

function Section({
  heading,
  emptyText,
  subtext,
  collapsible = false,
  collapsedByDefault = false,
  children,
}: {
  heading: string;
  emptyText: string;
  subtext?: string;
  collapsible?: boolean;
  collapsedByDefault?: boolean;
  children: React.ReactNode;
}) {
  const items = Array.isArray(children) ? children : [children];
  const count = items.filter(Boolean).length;

  const body = (
    <>
      {subtext && <p className="mb-4 text-base text-gray-700">{subtext}</p>}
      {count === 0 ? (
        <p className="text-base text-gray-600 italic">{emptyText}</p>
      ) : (
        <ul className="space-y-4">{children}</ul>
      )}
    </>
  );

  if (collapsible) {
    return (
      <details className="mb-8 rounded-lg border border-gray-300" open={!collapsedByDefault}>
        <summary className="cursor-pointer select-none px-4 py-4 text-2xl font-bold text-gray-900">
          {heading} ({count})
        </summary>
        <div className="px-4 pb-4">{body}</div>
      </details>
    );
  }

  return (
    <section className="mb-8" aria-label={heading}>
      <h2 className="mb-3 text-2xl font-bold text-gray-900">
        {heading} ({count})
      </h2>
      {body}
    </section>
  );
}

// --- Trial card --------------------------------------------------------

function TrialCard({
  title,
  nearestSite,
  caveats,
  url,
}: {
  title: string;
  nearestSite: string;
  caveats: string[];
  url: string;
}) {
  return (
    <li className="rounded-lg border border-gray-300 px-4 py-4">
      <h3 className="text-xl font-semibold text-gray-900 leading-snug">{title}</h3>

      <p className="mt-2 text-lg text-gray-800">
        <span className="font-medium">Nearest site:</span> {nearestSite}
      </p>

      {caveats.length > 0 && (
        <ul className="mt-2 list-disc pl-5 text-base text-gray-700">
          {caveats.map((c, i) => (
            <li key={i}>{c}</li>
          ))}
        </ul>
      )}

      <Link
        href={url}
        target="_blank"
        rel="noopener noreferrer"
        className="mt-3 inline-block text-lg font-medium text-blue-700 underline underline-offset-2"
      >
        View on ClinicalTrials.gov →
      </Link>
    </li>
  );
}

// --- Error state -----------------------------------------------------------

function ErrorState({ message }: { message: string }) {
  return (
    <main className="min-h-screen bg-white text-gray-900">
      <div className="mx-auto max-w-2xl px-4 py-8 sm:px-6">
        <p className="text-xl leading-relaxed">{message}</p>
      </div>
    </main>
  );
}
