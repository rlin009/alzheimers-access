import { sameState, triageOneTrial, type FamilyProfile, type Trial } from '../triage';

export const CONDITIONS = ['Alzheimer’s / dementia', 'R-CPD', 'A-CPD', 'Achalasia', "Zenker's", 'Spasm'] as const;
export type Condition = typeof CONDITIONS[number];
export type Product = 'alz' | 'burp';
export type Preferences = {
  product: Product; condition: Condition; country: string; state: string;
  ageBand: string; studyPartner: 'yes' | 'no' | 'unknown'; localOnly: boolean; newMatches: boolean;
};
export const AGE_RANGES: Record<string, { minAge: number; maxAge: number }> = {
  'under-50': { minAge: 0, maxAge: 49 }, '50-64': { minAge: 50, maxAge: 64 },
  '65-74': { minAge: 65, maxAge: 74 }, '75-84': { minAge: 75, maxAge: 84 }, '85-plus': { minAge: 85, maxAge: 150 },
};
export type MonitorTrial = {
  id: string; title: string; status: string; conditions: Condition[]; summary: string;
  scope: 'include' | 'review' | 'exclude'; updated: string | null; checkedAt: string;
  trial: Trial; contacts: { name: string; phone: string; email: string }[];
  sponsor: string; studyType: string; minAge: string | null; maxAge: string | null;
};
export type Snapshot = { id: string; checkedAt: string; trials: MonitorTrial[] };
export type Notice = { id: string; title: string; changes: string[] };
export type Subscriber = {
  id: string; email: string; preferences: Preferences; follows: Record<string, string>;
  preferences_at: string; created_at: string;
};
export function validatePreferences(input: unknown): Preferences | null {
  if (!input || typeof input !== 'object' || Array.isArray(input)) return null;
  const p = input as Preferences;
  if (!['alz', 'burp'].includes(p.product) || !CONDITIONS.includes(p.condition)) return null;
  if ((p.product === 'alz') !== (p.condition === CONDITIONS[0])) return null;
  if (typeof p.country !== 'string' || p.country.length > 80 || typeof p.state !== 'string' || p.state.length > 80) return null;
  if (typeof p.ageBand !== 'string' || (p.ageBand !== '' && !Object.hasOwn(AGE_RANGES, p.ageBand))) return null;
  if (!['yes', 'no', 'unknown'].includes(p.studyPartner) || typeof p.localOnly !== 'boolean' || typeof p.newMatches !== 'boolean') return null;
  if (p.localOnly && (!p.state.trim() || !p.country.trim())) return null;
  return { product: p.product, condition: p.condition, country: p.country.trim(), state: p.state.trim(), ageBand: p.ageBand, studyPartner: p.studyPartner, localOnly: p.localOnly, newMatches: p.newMatches };
}
export function statusLabel(status: string) {
  return ({ RECRUITING: 'Recruiting', NOT_YET_RECRUITING: 'Not yet recruiting', ACTIVE_NOT_RECRUITING: 'Active, not recruiting', COMPLETED: 'Completed', TERMINATED: 'Terminated', WITHDRAWN: 'Withdrawn', SUSPENDED: 'Suspended', UNKNOWN: 'Status unknown' } as Record<string, string>)[status] ?? status.replaceAll('_', ' ').toLowerCase();
}
export function familyFromPreferences(p: Preferences): FamilyProfile {
  return { location: { country: p.country, state: p.state }, relationship: '', diagnosisStage: '', ageBand: AGE_RANGES[p.ageBand] ?? null, studyPartner: p.studyPartner, willingToTravel: !p.localOnly };
}
export function potentialMatch(t: MonitorTrial, p: Preferences): boolean {
  if (t.status !== 'RECRUITING' || t.scope !== 'include' || !t.conditions.includes(p.condition)) return false;
  const profile = familyFromPreferences(p);
  // Missing location information stays uncertain; it never establishes eligibility.
  if (!p.country || !t.trial.locations?.length) {
    const age = profile.ageBand;
    if (age && ((t.trial.min_age_years != null && age.maxAge < t.trial.min_age_years) || (t.trial.max_age_years != null && age.minAge > t.trial.max_age_years))) return false;
    const criteria = Array.isArray(t.trial.criteria) ? t.trial.criteria[0] : t.trial.criteria;
    return !(p.studyPartner === 'no' && criteria?.requires_study_partner === 'required');
  }
  return triageOneTrial(t.trial, profile).bucket !== 'probablyNot';
}
function locationKey(t: MonitorTrial) {
  return (t.trial.locations ?? []).map(l => JSON.stringify(l, Object.keys(l).sort())).sort().join('\n');
}
export function meaningfulChanges(before: MonitorTrial, after: MonitorTrial): string[] {
  const changes: string[] = [];
  if (before.status !== after.status) changes.push(`Recruitment changed from ${statusLabel(before.status)} to ${statusLabel(after.status)}.`);
  if (before.trial.eligibility_text?.trim() !== after.trial.eligibility_text?.trim() || before.minAge !== after.minAge || before.maxAge !== after.maxAge) changes.push('Eligibility information changed. Check the updated requirements with the study team.');
  if (locationKey(before) !== locationKey(after)) changes.push('Study locations or site recruitment status changed.');
  if (JSON.stringify(before.contacts) !== JSON.stringify(after.contacts)) changes.push('Study contact information changed.');
  return changes;
}
export function noticesFor(sub: Subscriber, before: Snapshot | null, after: Snapshot): Notice[] {
  // First complete sync establishes a baseline, never a flood of old listings.
  if (!before) return [];
  const old = new Map(before.trials.map(t => [t.id, t]));
  const notices: Notice[] = [];
  for (const trial of after.trials) {
    const prev = old.get(trial.id);
    const followedAt = sub.follows[trial.id];
    const changes = followedAt && Date.parse(followedAt) <= Date.parse(before.checkedAt) && prev ? meaningfulChanges(prev, trial) : [];
    if (sub.preferences.newMatches && Date.parse(sub.preferences_at) <= Date.parse(before.checkedAt) && potentialMatch(trial, sub.preferences) && (!prev || !potentialMatch(prev, sub.preferences))) {
      changes.push('A recruiting study is newly listed or newly fits your broad preferences. This is a possible lead, not confirmation of eligibility.');
    }
    if (changes.length) notices.push({ id: trial.id, title: trial.title, changes });
  }
  return notices;
}
export function inState(t: MonitorTrial, state: string) { return t.trial.locations?.some(l => sameState(l.state, state)) ?? false; }
