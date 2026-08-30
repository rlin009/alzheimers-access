import { notFound } from 'next/navigation';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import {
  triageTrialsForFamily,
  type FamilyProfile,
  type StudyPartnerAvailability,
  type Trial,
  type TrialLocation,
} from '@/lib/triage';

export const dynamic = 'force-dynamic';

/* -------------------------------------------------------------------------
 * Raw profile row -> FamilyProfile
 *
 * The `profiles` table (filled in by src/app/start/page.tsx) stores loose,
 * form-friendly values. triageTrialsForFamily expects a stricter, more
 * structured shape. This section bridges the two — see the chat message
 * this file was delivered with for the assumptions baked in here.
 * ---------------------------------------------------------------------- */

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
  'under-50': { minAge: 0, maxAge: 49 },
  '50-64': { minAge: 50, maxAge: 64 },
  '65-74': { minAge: 65, maxAge: 74 },
  '75-84': { minAge: 75, maxAge: 84 },
  '85-plus': { minAge: 85, maxAge: 150 },
};

// Best-effort match for a two-letter US state abbreviation inside a
// free-text location string like "Charlotte, NC". Does not attempt to
// parse full state names, zip codes, or non-US addresses.
const US_STATE_CODES = new Set([
  'AL','AK','AZ','AR','CA','CO','CT','DE','FL','GA','HI','ID','IL','IN','IA',
  'KS','KY','LA','ME','MD','MA','MI','MN','MS','MO','MT','NE','NV','NH','NJ',
  'NM','NY','NC','ND','OH','OK','OR','PA','RI','SC','SD','TN','TX','UT','VT',
  'VA','WA','WV','WI','WY','DC',
]);

function extractState(location: string | null): string | null {
  if (!location) return null;
  const match = location.toUpperCase().match(/\b([A-Z]{2})\b/);
  if (match && US_STATE_CODES.has(match[1])) return match[1];
  return null;
}

function mapStudyPartner(value: string | null): StudyPartnerAvailability {
  if (value === 'yes') return 'yes';
  if (value === 'no') return 'no';
  return 'unknown'; // covers 'not-sure' and blank/null
}

function mapWillingToTravel(value: string | null): boolean {
  if (value === 'local-only') return false;
  if (value === 'short-drive' || value === 'long-distance') return true;
  // Not answered: default to true so we don't silently drop trials over
  // a skipped question. Flip this if you'd rather default conservatively.
  return true;
}

function toFamilyProfile(row: ProfileRow): FamilyProfile {
  return {
    location: {
      country: 'United States', // assumed — see chat notes
      state: extractState(row.location),
    },
    relationship: row.relationship ?? '',
    diagnosisStage: row.diagnosis_stage ?? '',
    ageBand: row.age_band ? AGE_BAND_RANGES[row.age_band] ?? null : null,
    studyPartner: mapStudyPartner(row.study_partner),
    willingToTravel: mapWillingToTravel(row.willing_to_travel),
  };
}

/* -------------------------------------------------------------------------
 * Display helpers
 * ---------------------------------------------------------------------- */

function ctgovUrl(nctId: string) {
  return `https://clinicaltrials.gov/study/${nctId}`;
}

function isSiteOpen(status: string | null | undefined): boolean {
  return (status ?? '').trim().toUpperCase() === 'RECRUITING';
}

function normalize(value: string | null | undefined): string {
  return (value ?? '').trim().toLowerCase();
}

/** Picks the "closest" open location we can claim given the thin location
 * data available (country/state only — no facility name or city). Prefers
 * a same-state match, then same-country, then just the first open site. */
function findNearestSite(trial: Trial, profile: FamilyProfile): TrialLocation | null {
  const open = (trial.locations ?? []).filter((loc) => isSiteOpen(loc.status));
  if (open.length === 0) return null;

  if (profile.location.state) {
    const sameState = open.find(
      (loc) =>
        normalize(loc.state) === normalize(profile.location.state) &&
        normalize(loc.country) === normalize(profile.location.country),
    );
    if (sameState) return sameState;
  }

  const sameCountry = open.find(
    (loc) => normalize(loc.country) === normalize(profile.location.country),
  );
  if (sameCountry) return sameCountry;

  return open[0];
}

function describeSite(site: TrialLocation | null): string {
  if (!site) return 'No open recruiting site listed';
  return [site.state, site.country].filter(Boolean).join(', ');
}

/* -------------------------------------------------------------------------
 * UI pieces
 * ---------------------------------------------------------------------- */

function TrialCard({
  trial,
  nearestSite,
  notes,
}: {
  trial: Trial;
  nearestSite: TrialLocation | null;
  notes: string[];
}) {
  return (
    <li className="rounded-2xl border-2 border-gray-800 bg-white p-5 mb-4">
      <h3 className="text-2xl font-bold text-gray-950 leading-snug mb-2">
        {trial.title ?? 'Untitled trial'}
      </h3>

      <p className="text-xl text-gray-900 mb-2">
        <span className="font-semibold">Nearest recruiting site: </span>
        {describeSite(nearestSite)}
      </p>

      {notes.length > 0 && (
        <ul className="text-xl text-gray-900 mb-3 list-disc list-inside">
          {notes.map((note, i) => (
            <li key={i}>{note}</li>
          ))}
        </ul>
      )}

      <a
        href={ctgovUrl(trial.nct_id)}
        target="_blank"
        rel="noopener noreferrer"
        className="inline-block text-xl font-semibold underline text-blue-800 focus:outline focus:outline-4 focus:outline-blue-800"
      >
        View on ClinicalTrials.gov
      </a>
    </li>
  );
}

function Section({
  heading,
  count,
  defaultOpen,
  children,
}: {
  heading: string;
  count: number;
  defaultOpen: boolean;
  children: React.ReactNode;
}) {
  if (count === 0) return null;

  return (
    <details open={defaultOpen} className="mb-8">
      <summary className="text-3xl font-extrabold text-gray-950 py-3 cursor-pointer select-none">
        {heading} ({count})
      </summary>
      <ul className="mt-4">{children}</ul>
    </details>
  );
}

/* -------------------------------------------------------------------------
 * Page
 * ---------------------------------------------------------------------- */

export default async function ResultsPage({
  searchParams,
}: {
  searchParams: { id?: string };
}) {
  const profileId = searchParams.id;

  if (!profileId) {
    notFound();
  }

  const supabase = createServerSupabaseClient();

  const { data: profileRow, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', profileId)
    .single();

  if (error || !profileRow) {
    notFound();
  }

  const familyProfile = toFamilyProfile(profileRow as ProfileRow);

  let results: Awaited<ReturnType<typeof triageTrialsForFamily>>;
  try {
    results = await triageTrialsForFamily(familyProfile, supabase);
  } catch (e) {
    console.error(e);
    return (
      <main className="min-h-screen bg-white px-4 py-8 max-w-2xl mx-auto">
        <h1 className="text-3xl font-extrabold text-gray-950 mb-4">
          Something went wrong
        </h1>
        <p className="text-xl text-gray-900">
          We couldn&apos;t match trials right now. Please try again later.
        </p>
      </main>
    );
  }

  const hasAny =
    results.worthAsking.length + results.cannotTell.length + results.probablyNot.length > 0;

  return (
    <main className="min-h-screen bg-white px-4 py-8 max-w-2xl mx-auto">
      <h1 className="text-4xl font-extrabold text-gray-950 mb-8 leading-tight">
        Your trial matches
      </h1>

      {!hasAny && (
        <p className="text-xl text-gray-900 mb-8">
          No matching trials were found. This may change as new trials open.
        </p>
      )}

      <Section heading="Worth asking about" count={results.worthAsking.length} defaultOpen={true}>
        {results.worthAsking.map(({ trial, caveats }) => (
          <TrialCard
            key={trial.id}
            trial={trial}
            nearestSite={findNearestSite(trial, familyProfile)}
            notes={caveats}
          />
        ))}
      </Section>

      <Section heading="Can't tell — ask your doctor" count={results.cannotTell.length} defaultOpen={true}>
        {results.cannotTell.map(({ trial }) => (
          <TrialCard
            key={trial.id}
            trial={trial}
            nearestSite={findNearestSite(trial, familyProfile)}
            notes={[]}
          />
        ))}
      </Section>

      <Section heading="Probably not" count={results.probablyNot.length} defaultOpen={false}>
        {results.probablyNot.map(({ trial, reason }) => (
          <TrialCard
            key={trial.id}
            trial={trial}
            nearestSite={findNearestSite(trial, familyProfile)}
            notes={[reason]}
          />
        ))}
      </Section>
    </main>
  );
}
