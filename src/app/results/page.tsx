import { notFound } from 'next/navigation';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { triage } from '@/lib/triage';

export const dynamic = 'force-dynamic';

interface TrialSite {
  name: string;
  city?: string;
  state?: string;
}

interface TriageResult {
  title: string;
  nctId: string;
  nearestSite?: TrialSite | null;
  caveats?: string[];
}

interface TriageOutput {
  ask: TriageResult[];
  unclear: TriageResult[];
  no: TriageResult[];
}

function ctgovUrl(nctId: string) {
  return `https://clinicaltrials.gov/study/${nctId}`;
}

function TrialCard({ trial }: { trial: TriageResult }) {
  return (
    <li className="rounded-2xl border-2 border-gray-800 bg-white p-5 mb-4">
      <h3 className="text-2xl font-bold text-gray-950 leading-snug mb-2">
        {trial.title}
      </h3>

      <p className="text-xl text-gray-900 mb-2">
        <span className="font-semibold">Nearest site: </span>
        {trial.nearestSite
          ? [trial.nearestSite.name, trial.nearestSite.city, trial.nearestSite.state]
              .filter(Boolean)
              .join(', ')
          : 'Not listed'}
      </p>

      {trial.caveats && trial.caveats.length > 0 && (
        <ul className="text-xl text-gray-900 mb-3 list-disc list-inside">
          {trial.caveats.map((c, i) => (
            <li key={i}>{c}</li>
          ))}
        </ul>
      )}

      
        href={ctgovUrl(trial.nctId)}
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
  trials,
  defaultOpen,
}: {
  heading: string;
  trials: TriageResult[];
  defaultOpen: boolean;
}) {
  if (trials.length === 0) return null;

  return (
    <details open={defaultOpen} className="mb-8">
      <summary className="text-3xl font-extrabold text-gray-950 py-3 cursor-pointer select-none">
        {heading} ({trials.length})
      </summary>
      <ul className="mt-4">
        {trials.map((t) => (
          <TrialCard key={t.nctId} trial={t} />
        ))}
      </ul>
    </details>
  );
}

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

  const { data: profile, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', profileId)
    .single();

  if (error || !profile) {
    notFound();
  }

  let results: TriageOutput;
  try {
    results = await triage(profile);
  } catch (e) {
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
    results.ask.length + results.unclear.length + results.no.length > 0;

  return (
    <main className="min-h-screen bg-white px-4 py-8 max-w-2xl mx-auto">
      <h1 className="text-4xl font-extrabold text-gray-950 mb-8 leading-tight">
        Your trial matches
      </h1>

      {!hasAny && (
        <p className="text-xl text-gray-900">
          No matching trials were found. This may change as new trials open.
        </p>
      )}

      <Section
        heading="Worth asking about"
        trials={results.ask}
        defaultOpen={true}
      />
      <Section
        heading="Can't tell — ask your doctor"
        trials={results.unclear}
        defaultOpen={true}
      />
      <Section
        heading="Probably not"
        trials={results.no}
        defaultOpen={false}
      />
    </main>
  );
}