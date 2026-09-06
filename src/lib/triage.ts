import type { SupabaseClient } from '@supabase/supabase-js';

/* -------------------------------------------------------------------------
 * Types
 *
 * These match the real `trials` and `criteria` tables (see the week 1 and
 * week 2 SQL). `trials` holds the title, status, age limits, eligibility
 * text and a `locations` jsonb array of per-site records, each with its own
 * status. `criteria` is one row per trial keyed by nct_id and holds only the
 * parsed fields. It is reached through a nested select (`criteria(*)`).
 *
 * If a column is renamed in the database, rename it here too. Everything
 * below depends on these field names.
 * ---------------------------------------------------------------------- */

/** How a yes/no eligibility criterion was extracted from the trial text.
 * These are the exact words the parser writes into the `criteria` table
 * (see scripts/parse-criteria.ts STATE_ENUM): spaces, not underscores. */
export type CriterionValue = 'required' | 'not required' | 'not mentioned' | 'cannot tell';

export interface TrialLocation {
  country: string;
  state?: string | null;
  /** Status of this specific site — a trial can be RECRUITING overall while
   * an individual site is closed, so this is checked separately from
   * `Trial.status`. */
  status?: string | null;
}

/** One row of the `criteria` table. Keyed by nct_id; the age limits and the
 * eligibility text are NOT here, they are columns on `trials`. */
export interface TrialCriteria {
  nct_id: string;
  requires_study_partner: CriterionValue | string | null;
  requires_imaging: CriterionValue | string | null;
  requires_lumbar_puncture: CriterionValue | string | null;
  cognitive_scale?: string | null;
  parse_confidence?: string | null;
}

/** One row of the `trials` table, with its criteria row nested in. */
export interface Trial {
  /** This IS the trial's primary key — the `trials` table has no separate
   * `id` column, only `nct_id` (e.g. "NCT01234567"). */
  nct_id: string;
  brief_title?: string | null;
  official_title?: string | null;
  status: string;
  /** No lower limit if null — not "unknown". */
  min_age_years: number | null;
  /** No upper limit if null — not "unknown". */
  max_age_years: number | null;
  eligibility_text: string | null;
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

/** A site counts as open if its own status is RECRUITING, or if it has no
 * status at all. ClinicalTrials.gov does not always fill in per-site status,
 * and treating "unknown" as "closed" would silently hide trials, which is the
 * harmful direction. The trial's overall status is already RECRUITING by the
 * time we get here. */
function isSiteOpen(status: string | null | undefined): boolean {
  const s = normalizeStatus(status);
  return s === '' || s === 'RECRUITING';
}

function normalizeText(value: string | null | undefined): string {
  return (value ?? '').trim().toLowerCase();
}

/** Turn whatever is in the database into one of the four state words.
 * Tolerates underscores and capitals so a future re-parse cannot silently
 * break the rules. */
function normalizeCriterion(value: string | null | undefined): CriterionValue | null {
  if (value == null) return null;
  const v = value.trim().toLowerCase().replace(/_/g, ' ');
  if (v === 'required' || v === 'not required' || v === 'not mentioned' || v === 'cannot tell') {
    return v;
  }
  return null;
}

function isRequired(value: string | null | undefined): boolean {
  return normalizeCriterion(value) === 'required';
}

function isUnknownCriterion(value: string | null | undefined): boolean {
  const v = normalizeCriterion(value);
  return v == null || v === 'not mentioned' || v === 'cannot tell';
}

/** ClinicalTrials.gov stores US states by full name ("North Carolina"); the
 * form may give a two-letter code ("NC"). Compare through the full name. */
const US_STATE_NAMES: Record<string, string> = {
  AL: 'alabama', AK: 'alaska', AZ: 'arizona', AR: 'arkansas', CA: 'california',
  CO: 'colorado', CT: 'connecticut', DE: 'delaware', FL: 'florida', GA: 'georgia',
  HI: 'hawaii', ID: 'idaho', IL: 'illinois', IN: 'indiana', IA: 'iowa',
  KS: 'kansas', KY: 'kentucky', LA: 'louisiana', ME: 'maine', MD: 'maryland',
  MA: 'massachusetts', MI: 'michigan', MN: 'minnesota', MS: 'mississippi', MO: 'missouri',
  MT: 'montana', NE: 'nebraska', NV: 'nevada', NH: 'new hampshire', NJ: 'new jersey',
  NM: 'new mexico', NY: 'new york', NC: 'north carolina', ND: 'north dakota', OH: 'ohio',
  OK: 'oklahoma', OR: 'oregon', PA: 'pennsylvania', RI: 'rhode island', SC: 'south carolina',
  SD: 'south dakota', TN: 'tennessee', TX: 'texas', UT: 'utah', VT: 'vermont',
  VA: 'virginia', WA: 'washington', WV: 'west virginia', WI: 'wisconsin', WY: 'wyoming',
  DC: 'district of columbia',
};

export function stateName(value: string | null | undefined): string {
  const v = (value ?? '').trim();
  if (v.length === 2 && US_STATE_NAMES[v.toUpperCase()]) return US_STATE_NAMES[v.toUpperCase()];
  return v.toLowerCase();
}

export function sameState(a: string | null | undefined, b: string | null | undefined): boolean {
  const x = stateName(a);
  const y = stateName(b);
  return x.length > 0 && x === y;
}

/** Which half of the eligibility text a quoted sentence came from. Used so
 * a caveat pulled from the exclusion list can be labeled as such — an
 * exclusion criterion reads very differently from an inclusion one. */
export type EligibilitySection = 'inclusion' | 'exclusion';

export interface EligibilityPhrase {
  sentence: string;
  section: EligibilitySection;
}

/** Splits the eligibility text into an inclusion part and an exclusion
 * part using the "Inclusion Criteria" / "Exclusion Criteria" headings that
 * ClinicalTrials.gov eligibility text conventionally uses. If no exclusion
 * heading is found, the whole text is treated as the inclusion part so
 * nothing is silently dropped. */
function splitEligibilitySections(
  eligibilityText: string,
): { inclusion: string; exclusion: string } {
  const exclusionHeadingRe = /exclusion\s*criteria\s*:?/i;
  const inclusionHeadingRe = /inclusion\s*criteria\s*:?/i;

  const exclusionMatch = exclusionHeadingRe.exec(eligibilityText);

  if (!exclusionMatch) {
    return { inclusion: eligibilityText, exclusion: '' };
  }

  const exclusionStart = exclusionMatch.index;
  let inclusionPart = eligibilityText.slice(0, exclusionStart);
  const exclusionPart = eligibilityText.slice(exclusionStart + exclusionMatch[0].length);

  // If there's an explicit "Inclusion Criteria" heading before the
  // exclusion heading, drop everything before it too so the heading text
  // itself doesn't get treated as part of a sentence.
  const inclusionMatch = inclusionHeadingRe.exec(inclusionPart);
  if (inclusionMatch) {
    inclusionPart = inclusionPart.slice(inclusionMatch.index + inclusionMatch[0].length);
  }

  return { inclusion: inclusionPart, exclusion: exclusionPart };
}

/** Removes a trailing list-numbering artifact (e.g. "1.", "2)", "- 3.",
 * "a)") left over at the end of a sentence after naive splitting on
 * sentence punctuation, without touching numbers that are part of the
 * sentence's actual content. */
function stripTrailingListNumbering(sentence: string): string {
  return sentence
    .replace(/\s*[-•*]?\s*\(?(?:[0-9]{1,2}|[a-zA-Z]|[ivxlcdm]{1,4})[.)]\s*$/i, '')
    .trim();
}

/** Searches one half of the eligibility text (inclusion or exclusion) for
 * the first sentence mentioning one of the given keywords. */
function findPhraseInSection(text: string, lowerKeywords: string[]): string | null {
  if (!text) return null;
  const sentences = text.split(/(?<=[.!?])\s+/);
  for (const sentence of sentences) {
    const lower = sentence.toLowerCase();
    if (lowerKeywords.some((k) => lower.includes(k))) {
      const trimmed = stripTrailingListNumbering(sentence.trim());
      if (trimmed.length > 0) return trimmed;
    }
  }
  return null;
}

/** Pull the first sentence from the eligibility text that mentions one of
 * the given keywords, so exclusion reasons can quote the trial's own
 * wording where possible. The eligibility text is first split into its
 * inclusion and exclusion halves (using the "Inclusion Criteria" /
 * "Exclusion Criteria" headings); the inclusion half is searched first,
 * then the exclusion half, and the returned result says which half the
 * quote came from. */
function findEligibilityPhrase(
  eligibilityText: string | null | undefined,
  keywords: string[],
): EligibilityPhrase | null {
  if (!eligibilityText) return null;

  const { inclusion, exclusion } = splitEligibilitySections(eligibilityText);
  const lowerKeywords = keywords.map((k) => k.toLowerCase());

  const inclusionPhrase = findPhraseInSection(inclusion, lowerKeywords);
  if (inclusionPhrase) return { sentence: inclusionPhrase, section: 'inclusion' };

  const exclusionPhrase = findPhraseInSection(exclusion, lowerKeywords);
  if (exclusionPhrase) return { sentence: exclusionPhrase, section: 'exclusion' };

  return null;
}

function withQuote(reason: string, phrase: EligibilityPhrase | null): string {
  if (!phrase) return reason;
  if (phrase.section === 'exclusion') {
    return `${reason} From the trial's exclusion list: "${phrase.sentence}"`;
  }
  return `${reason} The trial's eligibility criteria say: "${phrase.sentence}"`;
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
function checkAgeBand(profile: FamilyProfile, trial: Trial): string | null {
  if (!profile.ageBand) return null;

  const { minAge, maxAge } = profile.ageBand;
  const trialMin = trial.min_age_years ?? null; // null = no lower limit
  const trialMax = trial.max_age_years ?? null; // null = no upper limit

  const phrase = findEligibilityPhrase(trial.eligibility_text, ['age', 'years old', 'aged']);

  if (trialMin != null && maxAge < trialMin) {
    const range = trialMax != null ? `aged ${trialMin} to ${trialMax}` : `aged ${trialMin} or older`;
    return withQuote(
      `This trial only accepts participants ${range}, and the age range you gave is below that.`,
      phrase,
    );
  }

  if (trialMax != null && minAge > trialMax) {
    const range = trialMin != null ? `aged ${trialMin} to ${trialMax}` : `aged ${trialMax} or younger`;
    return withQuote(
      `This trial only accepts participants ${range}, and the age range you gave is above that.`,
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
    const openInState = openInCountry.filter((loc) => sameState(loc.state, profile.location.state));
    if (openInState.length === 0) {
      return `This trial doesn't have an open, recruiting site in ${profile.location.state}, and you said you'd only consider trials close to home.`;
    }
  }

  return null;
}

/** Rule: the trial requires a study partner and the family said none is
 * available. */
function checkStudyPartner(
  profile: FamilyProfile,
  trial: Trial,
  criteria: TrialCriteria | null,
): string | null {
  if (!criteria) return null;
  if (isRequired(criteria.requires_study_partner) && profile.studyPartner === 'no') {
    const phrase = findEligibilityPhrase(trial.eligibility_text, [
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
function collectCaveats(trial: Trial, criteria: TrialCriteria | null): string[] {
  if (!criteria) return [];
  const caveats: string[] = [];

  if (isRequired(criteria.requires_imaging)) {
    const phrase = findEligibilityPhrase(trial.eligibility_text, ['imaging', 'pet scan', 'mri']);
    caveats.push(
      withQuote('This trial requires imaging (such as a PET or MRI scan) as part of taking part.', phrase),
    );
  }

  if (isRequired(criteria.requires_lumbar_puncture)) {
    const phrase = findEligibilityPhrase(trial.eligibility_text, ['lumbar puncture', 'spinal tap']);
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
function isCannotTell(trial: Trial, criteria: TrialCriteria | null): boolean {
  if (!criteria) return true;
  if (!trial.eligibility_text || trial.eligibility_text.trim().length === 0) return true;

  const relevantFields: (string | null | undefined)[] = [
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

  const ageReason = checkAgeBand(profile, trial);
  if (ageReason) return { bucket: 'probablyNot', reason: ageReason };

  const locationReason = checkLocation(profile, trial);
  if (locationReason) return { bucket: 'probablyNot', reason: locationReason };

  const partnerReason = checkStudyPartner(profile, trial, criteria);
  if (partnerReason) return { bucket: 'probablyNot', reason: partnerReason };

  if (isCannotTell(trial, criteria)) {
    return { bucket: 'cannotTell' };
  }

  return { bucket: 'worthAsking', caveats: collectCaveats(trial, criteria) };
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