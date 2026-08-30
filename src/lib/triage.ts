/**
 * src/lib/triage.ts
 *
 * Sorts recruiting clinical trials into three buckets for a family:
 *   - worthAsking:  still a candidate, maybe with caveats to raise with the site
 *   - probablyNot:  a concrete rule excluded it, explained in plain English
 *   - cannotTell:   we don't have enough extracted eligibility info to say either way
 *
 * SCHEMA ASSUMPTIONS
 * -------------------
 * This assumes two Supabase tables:
 *
 *   trials
 *     id                text/uuid   primary key
 *     nct_id            text        e.g. "NCT01234567"
 *     title             text
 *     status            text        e.g. "RECRUITING", "COMPLETED", ...
 *     locations         jsonb       array of TrialLocationSite (see below)
 *     eligibility_text  text        raw/summarized eligibility text, if any
 *
 *   trial_criteria  (one row per trial, foreign key trial_id -> trials.id)
 *     trial_id                        text/uuid
 *     min_age_years                   numeric | null   (null = no lower limit)
 *     max_age_years                   numeric | null   (null = no upper limit)
 *     age_criteria_quote              text | null      (optional verbatim snippet)
 *     requires_study_partner          text | null      'required' | 'not_required' | 'not_mentioned' | 'cannot_tell'
 *     requires_study_partner_quote    text | null
 *     requires_imaging                text | null      same 4-value scheme as above
 *     requires_imaging_quote          text | null
 *     requires_lumbar_puncture        text | null      same 4-value scheme as above
 *     requires_lumbar_puncture_quote  text | null
 *
 * If your actual column/table names differ, adjust the constants and the
 * `select()` string below — the rule logic itself doesn't need to change.
 */

import type { SupabaseClient } from '@supabase/supabase-js';

// ---------------------------------------------------------------------------
// Table names (adjust to match your schema)
// ---------------------------------------------------------------------------

const TRIALS_TABLE = 'trials';
const CRITERIA_RELATION = 'trial_criteria';

// ---------------------------------------------------------------------------
// Public input types
// ---------------------------------------------------------------------------

/** Coarse age buckets a family can pick from in the intake form. */
export type AgeBand = 'under_50' | '50_59' | '60_64' | '65_74' | '75_84' | '85_plus';

export interface FamilyLocation {
  country: string;
  /** State/province, if known. Only required for the "local only" check. */
  state?: string | null;
}

export interface FamilyProfile {
  location: FamilyLocation;
  /** Relationship of the person filling out the form to the patient (not used by any rule yet). */
  relationship: string;
  /** Stage of diagnosis (not used by any rule yet, carried through for future rules/display). */
  diagnosisStage: string;
  /** Age band of the person the trial would be for. Omit/null if unknown — the age rule is skipped. */
  ageBand?: AgeBand | null;
  /**
   * Whether a study partner is available.
   *   true  -> a study partner is available
   *   false -> the family told us no study partner is available
   *   null/undefined -> not asked / not answered, the rule is skipped
   */
  studyPartner?: boolean | null;
  /**
   * true  -> family is willing to travel beyond their home state/province
   * false -> family wants a site local to their state/province ("local only")
   */
  willingToTravel: boolean;
}

// ---------------------------------------------------------------------------
// Supabase row shapes
// ---------------------------------------------------------------------------

type CriteriaFlag = 'required' | 'not_required' | 'not_mentioned' | 'cannot_tell' | null;

interface TrialCriteriaRow {
  min_age_years: number | null;
  max_age_years: number | null;
  age_criteria_quote?: string | null;
  requires_study_partner: CriteriaFlag;
  requires_study_partner_quote?: string | null;
  requires_imaging: CriteriaFlag;
  requires_imaging_quote?: string | null;
  requires_lumbar_puncture: CriteriaFlag;
  requires_lumbar_puncture_quote?: string | null;
}

export interface TrialLocationSite {
  country: string;
  state?: string | null;
  city?: string | null;
  facility?: string | null;
  /** Per-site recruitment status — a trial can be RECRUITING overall while a site is closed. */
  status: string;
}

interface TrialRow {
  id: string;
  nct_id: string | null;
  title: string | null;
  status: string;
  locations: TrialLocationSite[] | null;
  eligibility_text: string | null;
  // Supabase returns the joined relation as an array unless the FK is configured
  // as a strict one-to-one; we defensively handle both shapes.
  trial_criteria: TrialCriteriaRow[] | TrialCriteriaRow | null;
}

// ---------------------------------------------------------------------------
// Public output types
// ---------------------------------------------------------------------------

export interface TrialSummary {
  id: string;
  nctId: string | null;
  title: string | null;
}

export interface WorthAskingTrial {
  trial: TrialSummary;
  /** Things worth flagging to the family before they ask the site coordinator. May be empty. */
  caveats: string[];
}

export interface ProbablyNotTrial {
  trial: TrialSummary;
  /** Plain-English reason naming the rule that excluded this trial. */
  reason: string;
}

export interface CannotTellTrial {
  trial: TrialSummary;
}

export interface TriageResult {
  worthAsking: WorthAskingTrial[];
  probablyNot: ProbablyNotTrial[];
  cannotTell: CannotTellTrial[];
}

// ---------------------------------------------------------------------------
// Age band lookup
// ---------------------------------------------------------------------------

/** [min, max] in years for each band. max === null means no upper bound. */
const AGE_BAND_RANGES: Record<AgeBand, [number, number | null]> = {
  under_50: [0, 49],
  '50_59': [50, 59],
  '60_64': [60, 64],
  '65_74': [65, 74],
  '75_84': [75, 84],
  '85_plus': [85, null],
};

// ---------------------------------------------------------------------------
// Small helpers
// ---------------------------------------------------------------------------

function normalize(value: string | null | undefined): string {
  return (value ?? '').trim().toLowerCase();
}

function isUnknownFlag(value: CriteriaFlag): boolean {
  return value == null || value === 'not_mentioned' || value === 'cannot_tell';
}

function normalizeCriteria(raw: TrialRow['trial_criteria']): TrialCriteriaRow | null {
  if (!raw) return null;
  if (Array.isArray(raw)) return raw.length > 0 ? raw[0] : null;
  return raw;
}

function toSummary(row: TrialRow): TrialSummary {
  return {
    id: row.id,
    nctId: row.nct_id ?? null,
    title: row.title ?? null,
  };
}

// ---------------------------------------------------------------------------
// Rule: age
// ---------------------------------------------------------------------------

function ageReason(criteria: TrialCriteriaRow, band: AgeBand): string {
  const trialMin = criteria.min_age_years;
  const trialMax = criteria.max_age_years;

  let range: string;
  if (trialMin != null && trialMax != null) {
    range = `people between ${trialMin} and ${trialMax} years old`;
  } else if (trialMin != null) {
    range = `people who are at least ${trialMin} years old`;
  } else {
    // trialMax must be non-null to reach here, since a trial with no limits
    // at all never triggers an age exclusion.
    range = `people who are no older than ${trialMax} years old`;
  }

  let sentence = `This trial is only enrolling ${range}, which is outside the age range you gave us.`;
  if (criteria.age_criteria_quote) {
    sentence += ` The trial's own wording says: "${criteria.age_criteria_quote}"`;
  }
  return sentence;
}

function checkAgeExclusion(band: AgeBand, criteria: TrialCriteriaRow | null): string | null {
  if (!criteria) return null; // nothing to check against
  const trialMin = criteria.min_age_years;
  const trialMax = criteria.max_age_years;

  // Empty means "no limit," not "unknown" — a trial with no age fields set
  // at all simply has no age restriction and can't be excluded on age.
  if (trialMin == null && trialMax == null) return null;

  const [bandMin, bandMaxRaw] = AGE_BAND_RANGES[band];
  const bandMax = bandMaxRaw ?? Infinity;
  const effectiveTrialMin = trialMin ?? -Infinity;
  const effectiveTrialMax = trialMax ?? Infinity;

  const overlaps = bandMin <= effectiveTrialMax && bandMax >= effectiveTrialMin;
  if (overlaps) return null;

  return ageReason(criteria, band);
}

// ---------------------------------------------------------------------------
// Rule: location
// ---------------------------------------------------------------------------

function checkLocationExclusion(profile: FamilyProfile, locations: TrialLocationSite[]): string | null {
  const recruitingSites = locations.filter((site) => normalize(site.status) === 'recruiting');

  const inCountry = recruitingSites.filter(
    (site) => normalize(site.country) === normalize(profile.location.country),
  );

  if (inCountry.length === 0) {
    return `There's no recruiting site for this trial in ${profile.location.country}.`;
  }

  if (!profile.willingToTravel) {
    // Can't apply the stricter "local only" check without a state on file —
    // fall back to the country-level result rather than guessing.
    if (!profile.location.state) return null;

    const inState = inCountry.filter(
      (site) => site.state && normalize(site.state) === normalize(profile.location.state),
    );

    if (inState.length === 0) {
      return `This trial is recruiting in ${profile.location.country}, but not in ${profile.location.state}, and you said you'd only consider a trial close to home.`;
    }
  }

  return null;
}

// ---------------------------------------------------------------------------
// Rule: study partner
// ---------------------------------------------------------------------------

function studyPartnerReason(criteria: TrialCriteriaRow): string {
  let sentence = `This trial needs a study partner who can come to appointments with you, and you told us one isn't available.`;
  if (criteria.requires_study_partner_quote) {
    sentence += ` The trial states: "${criteria.requires_study_partner_quote}"`;
  }
  return sentence;
}

function checkStudyPartnerExclusion(profile: FamilyProfile, criteria: TrialCriteriaRow | null): string | null {
  if (profile.studyPartner !== false) return null; // rule only runs if family said "no"
  if (!criteria || criteria.requires_study_partner !== 'required') return null;
  return studyPartnerReason(criteria);
}

// ---------------------------------------------------------------------------
// "Worth asking" caveats
// ---------------------------------------------------------------------------

function imagingCaveat(criteria: TrialCriteriaRow): string {
  let sentence = `This trial requires brain imaging (such as a PET scan or MRI) as part of screening or participation.`;
  if (criteria.requires_imaging_quote) sentence += ` ("${criteria.requires_imaging_quote}")`;
  return sentence;
}

function lumbarPunctureCaveat(criteria: TrialCriteriaRow): string {
  let sentence = `This trial requires a lumbar puncture (spinal tap), usually to test spinal fluid.`;
  if (criteria.requires_lumbar_puncture_quote) sentence += ` ("${criteria.requires_lumbar_puncture_quote}")`;
  return sentence;
}

// ---------------------------------------------------------------------------
// "Cannot tell" rule
// ---------------------------------------------------------------------------

function isCannotTell(eligibilityText: string | null, criteria: TrialCriteriaRow | null): boolean {
  if (!eligibilityText || !eligibilityText.trim()) return true;
  if (!criteria) return true;

  const ageUnknown = criteria.min_age_years == null && criteria.max_age_years == null;

  return (
    ageUnknown &&
    isUnknownFlag(criteria.requires_study_partner) &&
    isUnknownFlag(criteria.requires_imaging) &&
    isUnknownFlag(criteria.requires_lumbar_puncture)
  );
}

// ---------------------------------------------------------------------------
// Main entry point
// ---------------------------------------------------------------------------

/**
 * Fetches recruiting trials (joined to their extracted eligibility criteria)
 * and sorts them into worthAsking / probablyNot / cannotTell for the given
 * family profile.
 *
 * @param supabase  An initialized Supabase client.
 * @param profile   The family's intake answers.
 */
export async function triageTrials(
  supabase: SupabaseClient,
  profile: FamilyProfile,
): Promise<TriageResult> {
  const { data, error } = await supabase
    .from(TRIALS_TABLE)
    .select(
      `
      id,
      nct_id,
      title,
      status,
      locations,
      eligibility_text,
      ${CRITERIA_RELATION} (
        min_age_years,
        max_age_years,
        age_criteria_quote,
        requires_study_partner,
        requires_study_partner_quote,
        requires_imaging,
        requires_imaging_quote,
        requires_lumbar_puncture,
        requires_lumbar_puncture_quote
      )
    `,
    )
    // "Not shown at all" — trials that are no longer recruiting are dropped
    // at the query level and never enter any of the three buckets.
    .eq('status', 'RECRUITING');

  if (error) {
    throw new Error(`Failed to load trials for triage: ${error.message}`);
  }

  const rows = (data ?? []) as unknown as TrialRow[];

  const worthAsking: WorthAskingTrial[] = [];
  const probablyNot: ProbablyNotTrial[] = [];
  const cannotTell: CannotTellTrial[] = [];

  for (const row of rows) {
    // Defensive re-check in case the query filter is ever loosened.
    if (normalize(row.status) !== 'recruiting') continue;

    const criteria = normalizeCriteria(row.trial_criteria);
    const summary = toSummary(row);
    const locations = row.locations ?? [];

    // Rule: age band outside trial's range.
    if (profile.ageBand) {
      const ageExclusion = checkAgeExclusion(profile.ageBand, criteria);
      if (ageExclusion) {
        probablyNot.push({ trial: summary, reason: ageExclusion });
        continue;
      }
    }

    // Rule: no recruiting site in country (or state, if local only).
    const locationExclusion = checkLocationExclusion(profile, locations);
    if (locationExclusion) {
      probablyNot.push({ trial: summary, reason: locationExclusion });
      continue;
    }

    // Rule: study partner required but unavailable.
    const studyPartnerExclusion = checkStudyPartnerExclusion(profile, criteria);
    if (studyPartnerExclusion) {
      probablyNot.push({ trial: summary, reason: studyPartnerExclusion });
      continue;
    }

    // Rule: nothing usable was ever extracted about this trial's eligibility.
    if (isCannotTell(row.eligibility_text, criteria)) {
      cannotTell.push({ trial: summary });
      continue;
    }

    // Otherwise: worth asking about, with any relevant caveats attached.
    const caveats: string[] = [];
    if (criteria?.requires_imaging === 'required') {
      caveats.push(imagingCaveat(criteria));
    }
    if (criteria?.requires_lumbar_puncture === 'required')  {
      caveats.push(lumbarPunctureCaveat(criteria));
    }

    worthAsking.push({ trial: summary, caveats });
  }

  return { worthAsking, probablyNot, cannotTell };
}