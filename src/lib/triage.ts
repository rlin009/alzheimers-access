import type { SupabaseClient } from '@supabase/supabase-js';

/* -------------------------------------------------------------------------
 * Types
 *
 * These reflect the assumed shape of the `trials` and `criteria` tables.
 * `trials` has a `locations` jsonb column (array of per-site records, each
 * with its own status) and a one-to-one related `criteria` row reachable
 * via a Supabase nested select (`criteria(*)`), which is where the
 * eligibility fields and the raw eligibility text live.
 *
 * Adjust these to match your actual generated Supabase types if they
 * differ — the triage logic below only depends on the field names, not on
 * where the types come from.
 * ---------------------------------------------------------------------- */

/** How a yes/no eligibility criterion was extracted from the trial text. */
export type CriterionValue = 'required' | 'not_required' | 'not_mentioned' | 'cannot_tell';

export interface TrialLocation {
  country: string;
  state?: string | null;
  /** Status of this specific site — a trial can be RECRUITING overall while
   * an individual site is closed, so this is checked separately from
   * `Trial.status`. */
  status?: string | null;
}

export interface TrialCriteria {
  id: string;
  trial_id: string;
  /** No lower limit if null/undefined — not "unknown". */
  min_age_years: number | null;
  /** No upper limit if null/undefined — not "unknown". */
  max_age_years: number | null;
  requires_study_partner: CriterionValue | null;
  requires_imaging: CriterionValue | null;
  requires_lumbar_puncture: CriterionValue | null;
  eligibility_text: string | null;
}

export interface Trial {
  id: string;
  title?: string | null;
  status: string;
  locations: TrialLocation[] | null;
  /** Supabase returns an array for a nested select unless the relationship
   * is declared as one-to-one; we accept either shape defensively. */
  criteria: TrialCriteria[] | TrialCriteria | null;
}

export interface AgeBand {
  minAge: number;
  maxAge: number;
}

export type StudyPartnerAvailability = 'yes' | 'no' | 'unknown';

export interface FamilyProfile {
  location: {
    country: string;
    state?: string | null;
  };
  relationship: string;
  diagnosisStage: string;
  /** Omit/null if the family did not give an age — the age rule is skipped
   * entirely in that case. */
  ageBand?: AgeBand | null;
  studyPartner: StudyPartnerAvailability;
  /** false === "local only". */
  willingToTravel: boolean;
}

export interface WorthAskingTrial {
  trial: Trial;
  /** Plain-English notes about extra participation burden. Empty if none. */
  caveats: string[];
}

export interface ProbablyNotTrial {
  trial: Trial;
  /** Plain-English sentence naming the rule that excluded this trial. */
  reason: string;
}

export interface CannotTellTrial {
  trial: Trial;
}

export interface TriageResult {
  worthAsking: WorthAskingTrial[];
  probablyNot: ProbablyNotTrial[];
  cannotTell: CannotTellTrial[];
}

/* -------------------------------------------------------------------------
 * Small helpers
 * ---------------------------------------------------------------------- */

function normalizeStatus(status: string | null | undefined): string {
  return (status ?? '').trim().toUpperCase();
}

function isSiteOpen(status: string | null | undefined): boolean {
  return normalizeStatus(status) === 'RECRUITING';
}

function normalizeText(value: string | null | undefined): string {
  return (value ?? '').trim().toLowerCase();
}

function isUnknownCriterion(value: CriterionValue | null | undefined): boolean {
  return value == null || value === 'not_mentioned' || value === 'cannot_tell';
}

/** Pull the first sentence from the eligibility text that mentions one of
 * the given keywords, so exclusion reasons can quote the trial's own
 * wording where possible. */
function findEligibilityPhrase(
  eligibilityText: string | null | undefined,
  keywords: string[],
): string | null {
  if (!eligibilityText) return null;
  const sentences = eligibilityText.split(/(?<=[.!?])\s+/);
  const lowerKeywords = keywords.map((k) => k.toLowerCase());
  for (const sentence of sentences) {
    const lower = sentence.toLowerCase();
    if (lowerKeywords.some((k) => lower.includes(k))) {
      const trimmed = sentence.trim();
      if (trimmed.length > 0) return trimmed;
    }
  }
  return null;
}

function withQuote(reason: string, phrase: string | null): string {
  return phrase ? `${reason} The trial's eligibility criteria say: "${phrase}"` : reason;
}

/** Supabase returns either an array or a single object for a nested
 * select depending on how the relationship is declared — normalize it. */
function getCriteria(trial: Trial): TrialCriteria | null {
  if (!trial.criteria) return null;
  if (Array.isArray(trial.criteria)) return trial.criteria[0] ?? null;
  return trial.criteria;
}

/* -------------------------------------------------------------------------
 * Individual rules
 *
 * Each rule returns a plain-English reason string when it excludes the
 * trial, or null when it doesn't apply / doesn't exclude.
 * ---------------------------------------------------------------------- */

/** Rule: the person's age band falls outside the trial's allowed range.
 * Skipped entirely if the family didn't give an age. */
function checkAgeBand(profile: FamilyProfile, criteria: TrialCriteria | null): string | null {
  if (!profile.ageBand) return null;
  if (!criteria) return null;

  const { minAge, maxAge } = profile.ageBand;
  const trialMin = criteria.min_age_years; // null = no lower limit
  const trialMax = criteria.max_age_years; // null = no upper limit

  const phrase = findEligibilityPhrase(criteria.eligibility_text, ['age', 'years old', 'aged']);

  if (trialMin != null && maxAge < trialMin) {
    const upper = trialMax != null ? `${trialMin}–${trialMax}` : `${trialMin} or older`;
    return withQuote(
      `This trial only accepts participants age ${upper}, which is younger than the age range you gave.`,
      phrase,
    );
  }

  if (trialMax != null && minAge > trialMax) {
    const lower = trialMin != null ? `${trialMin}–${trialMax}` : `up to age ${trialMax}`;
    return withQuote(
      `This trial only accepts participants ${lower}, which is older than the age range you gave.`,
      phrase,
    );
  }

  return null;
}

/** Rule: no recruiting site in the person's country, or — if they're local
 * only — no recruiting site in their state. Looks at each location's own
 * status, since a trial can be RECRUITING overall while a given site is
 * closed. */
function checkLocation(profile: FamilyProfile, trial: Trial): string | null {
  const locations = trial.locations ?? [];
  const openLocations = locations.filter((loc) => isSiteOpen(loc.status));

  const openInCountry = openLocations.filter(
    (loc) => normalizeText(loc.country) === normalizeText(profile.location.country),
  );

  if (openInCountry.length === 0) {
    return `This trial doesn't currently have an open, recruiting site in ${profile.location.country}.`;
  }

  if (!profile.willingToTravel && profile.location.state) {
    const openInState = openInCountry.filter(
      (loc) => normalizeText(loc.state) === normalizeText(profile.location.state),
    );
    if (openInState.length === 0) {
      return `This trial doesn't have an open, recruiting site in ${profile.location.state}, and you said you'd only consider trials close to home.`;
    }
  }

  return null;
}

/** Rule: the trial requires a study partner and the family said none is
 * available. */
function checkStudyPartner(profile: FamilyProfile, criteria: TrialCriteria | null): string | null {
  if (!criteria) return null;
  if (criteria.requires_study_partner === 'required' && profile.studyPartner === 'no') {
    const phrase = findEligibilityPhrase(criteria.eligibility_text, [
      'study partner',
      'care partner',
      'caregiver',
      'informant',
    ]);
    return withQuote(
      'This trial needs a study partner who can come to appointments with you.',
      phrase,
    );
  }
  return null;
}

/** Caveats: the trial stays in "worth asking about" but requires imaging
 * and/or a lumbar puncture, which are worth flagging up front. */
function collectCaveats(criteria: TrialCriteria | null): string[] {
  if (!criteria) return [];
  const caveats: string[] = [];

  if (criteria.requires_imaging === 'required') {
    const phrase = findEligibilityPhrase(criteria.eligibility_text, ['imaging', 'pet scan', 'mri']);
    caveats.push(
      withQuote('This trial requires imaging (such as a PET or MRI scan) as part of taking part.', phrase),
    );
  }

  if (criteria.requires_lumbar_puncture === 'required') {
    const phrase = findEligibilityPhrase(criteria.eligibility_text, ['lumbar puncture', 'spinal tap']);
    caveats.push(
      withQuote('This trial requires a lumbar puncture (spinal tap) as part of taking part.', phrase),
    );
  }

  return caveats;
}

/** "Cannot tell": there's no eligibility text at all, or every field the
 * rules actually depend on (study partner / imaging / lumbar puncture —
 * age is never "unknown", since an empty age field means "no limit", not
 * "not mentioned") came back not_mentioned or cannot_tell. */
function isCannotTell(criteria: TrialCriteria | null): boolean {
  if (!criteria) return true;
  if (!criteria.eligibility_text || criteria.eligibility_text.trim().length === 0) return true;

  const relevantFields: (CriterionValue | null | undefined)[] = [
    criteria.requires_study_partner,
    criteria.requires_imaging,
    criteria.requires_lumbar_puncture,
  ];

  return relevantFields.every(isUnknownCriterion);
}

/* -------------------------------------------------------------------------
 * Per-trial triage
 * ---------------------------------------------------------------------- */

type TriageOutcome =
  | { bucket: 'probablyNot'; reason: string }
  | { bucket: 'cannotTell' }
  | { bucket: 'worthAsking'; caveats: string[] };

function triageOneTrial(trial: Trial, profile: FamilyProfile): TriageOutcome {
  const criteria = getCriteria(trial);

  // Every trial starts in "worth asking about"; each rule below can only
  // move it to "probably not" (in this order), or — if nothing excludes
  // it but the data is too thin to say anything — to "cannot tell".

  const ageReason = checkAgeBand(profile, criteria);
  if (ageReason) return { bucket: 'probablyNot', reason: ageReason };

  const locationReason = checkLocation(profile, trial);
  if (locationReason) return { bucket: 'probablyNot', reason: locationReason };

  const partnerReason = checkStudyPartner(profile, criteria);
  if (partnerReason) return { bucket: 'probablyNot', reason: partnerReason };

  if (isCannotTell(criteria)) {
    return { bucket: 'cannotTell' };
  }

  return { bucket: 'worthAsking', caveats: collectCaveats(criteria) };
}

/* -------------------------------------------------------------------------
 * Public entry point
 * ---------------------------------------------------------------------- */

/**
 * Fetches currently recruiting trials (joined to their criteria row) and
 * sorts them into three buckets for a family based on their profile:
 *
 *  - worthAsking: nothing rules it out; may carry caveats (e.g. imaging,
 *    lumbar puncture) worth flagging before they ask.
 *  - probablyNot: excluded by a specific rule; carries a plain-English
 *    reason naming that rule.
 *  - cannotTell: too little eligibility data to say either way.
 *
 * Trials whose overall status is no longer RECRUITING are not returned at
 * all — they're filtered out at the query level.
 */
export async function triageTrialsForFamily(
  profile: FamilyProfile,
  supabase: SupabaseClient,
): Promise<TriageResult> {
  const { data, error } = await supabase
    .from('trials')
    .select('*, criteria(*)')
    .eq('status', 'RECRUITING');

  if (error) {
    throw new Error(`Failed to load recruiting trials: ${error.message}`);
  }

  const trials = (data ?? []) as Trial[];

  const worthAsking: WorthAskingTrial[] = [];
  const probablyNot: ProbablyNotTrial[] = [];
  const cannotTell: CannotTellTrial[] = [];

  for (const trial of trials) {
    // Defensive re-check in case the query ever returns a stale row —
    // trials that are no longer RECRUITING are excluded entirely, not
    // placed in any bucket.
    if (normalizeStatus(trial.status) !== 'RECRUITING') continue;

    const outcome = triageOneTrial(trial, profile);

    if (outcome.bucket === 'probablyNot') {
      probablyNot.push({ trial, reason: outcome.reason });
    } else if (outcome.bucket === 'cannotTell') {
      cannotTell.push({ trial });
    } else {
      worthAsking.push({ trial, caveats: outcome.caveats });
    }
  }

  return { worthAsking, probablyNot, cannotTell };
}