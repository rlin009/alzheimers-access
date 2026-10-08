import { assessTrialScope, flattenStudy, TRIAL_SEARCH, type RegistryStudy, type ScopeReview } from '../trial-scope';
import reviews from '../../data/trial-scope-reviews.json';
import burpCatalog from '../../data/nameit/trials.json';
import type { Condition, MonitorTrial } from './model';
import type { TrialCriteria, TrialLocation } from '../triage';

const API = 'https://clinicaltrials.gov/api/v2/studies';
export const SEARCHES: [Condition, string][] = [
  ['Alzheimer’s / dementia', TRIAL_SEARCH],
  ['R-CPD', '"retrograde cricopharyngeus" OR "retrograde cricopharyngeal" OR "inability to belch" OR abelchia'],
  ['A-CPD', '"cricopharyngeal dysfunction" OR "cricopharyngeal achalasia" OR "cricopharyngeal bar" OR "upper esophageal sphincter dysfunction"'],
  ['Achalasia', 'achalasia'], ["Zenker's", '"Zenker diverticulum" OR "Zenker\'s diverticulum" OR "pharyngeal pouch"'],
  ['Spasm', '"esophageal spasm" OR "jackhammer esophagus" OR "hypercontractile esophagus"'],
];
const TARGETS: Partial<Record<Condition, RegExp>> = {
  'R-CPD': /retrograde cricopharyng|inability to (?:belch|burp)|abelchia/i,
  'A-CPD': /cricopharyngeal (?:dysfunction|achalasia|bar)|upper esophageal sphincter dysfunction/i,
  Achalasia: /achalasia/i, "Zenker's": /zenker|pharyngeal pouch/i,
  Spasm: /esophageal spasm|jackhammer esophagus|hypercontractile esophagus/i,
};
type ExtendedStudy = RegistryStudy & { protocolSection: { designModule?: { studyType?: string }; contactsLocationsModule?: { centralContacts?: { name?: string; phone?: string; email?: string }[] } } };
export async function registryJson(url: string, fetcher: typeof fetch = fetch) {
  for (let attempt = 0; ; attempt++) {
    try {
      const response = await fetcher(url, { signal: AbortSignal.timeout(60000), headers: { Accept: 'application/json' } });
      if (!response.ok) throw new Error(`Registry request failed (${response.status}).`);
      return await response.json();
    } catch (error) { if (attempt >= 2) throw error; await new Promise(resolve => setTimeout(resolve, 500 * (attempt + 1))); }
  }
}
export async function searchRegistry(condition: Condition, query: string, fetcher: typeof fetch = fetch): Promise<RegistryStudy[]> {
  const studies: RegistryStudy[] = [], tokens = new Set<string>(), ids = new Set<string>();
  let token: string | undefined, total: number | undefined;
  do {
    const params = new URLSearchParams({ [condition === 'Alzheimer’s / dementia' ? 'query.term' : 'query.cond']: query, 'filter.overallStatus': 'RECRUITING,NOT_YET_RECRUITING', pageSize: '1000', countTotal: 'true' });
    if (token) params.set('pageToken', token);
    const data = await registryJson(`${API}?${params}`, fetcher) as { studies?: RegistryStudy[]; nextPageToken?: string; totalCount?: number };
    if (!Array.isArray(data.studies) || (data.nextPageToken && !data.studies.length)) throw new Error('Incomplete registry response.');
    if (total === undefined) total = data.totalCount;
    for (const study of data.studies) {
      const id = study.protocolSection?.identificationModule?.nctId;
      if (!/^NCT\d{8}$/.test(id ?? '') || ids.has(id)) throw new Error('Invalid or duplicate registry record.');
      ids.add(id); studies.push(study);
    }
    token = data.nextPageToken;
    if (token && tokens.has(token)) throw new Error('Registry pagination repeated.');
    if (token) tokens.add(token);
    if (tokens.size > 100) throw new Error('Registry pagination exceeded safety limit.');
  } while (token);
  if (typeof total !== 'number' || studies.length !== total) throw new Error('Registry count did not reconcile; previous snapshot retained.');
  return studies;
}
export function normalizeStudy(study: RegistryStudy, labels: Condition[], checkedAt: string, prior?: MonitorTrial): MonitorTrial {
  const p = (study as ExtendedStudy).protocolSection, id = p.identificationModule.nctId;
  const flat = flattenStudy(study, checkedAt);
  const curated = burpCatalog.trials.find(t => t.nctId === id);
  const explicit = [p.identificationModule.briefTitle, p.identificationModule.officialTitle, ...(p.conditionsModule?.conditions ?? [])].join('\n');
  const conditions = labels.filter(label => {
    if (label === 'Alzheimer’s / dementia') return true;
    if (curated?.conditions.includes(label)) return true;
    // The upper-sphincter terms must not become lower-esophagus or antegrade matches just by substring.
    if (label === 'A-CPD' && /retrograde cricopharyng/i.test(explicit)) return false;
    if (label === 'Achalasia' && !/achalasia/i.test(explicit.replace(/cricopharyngeal achalasia/gi,''))) return false;
    return !!TARGETS[label]?.test(explicit);
  });
  // Search hits and old human summaries alone never override a scope exclusion.
  let scope: MonitorTrial['scope'] = conditions.length ? 'include' : 'review';
  if (labels.includes('Alzheimer’s / dementia')) {
    const recruiting = { ...study, protocolSection: { ...study.protocolSection, statusModule: { ...p.statusModule, overallStatus: 'RECRUITING' } } };
    scope = assessTrialScope(recruiting, (reviews as Record<string, ScopeReview>)[id]).decision;
  }
  if (burpCatalog.excluded.some(t => t.nctId === id)) scope = 'exclude';
  const criteria: TrialCriteria | TrialCriteria[] | null = prior?.trial.eligibility_text === flat.eligibility_text ? prior.trial.criteria : null;
  return {
    id, title: flat.brief_title || flat.official_title || id, status: flat.status, conditions, scope,
    // Current registry text avoids presenting an old hand-written summary after an amendment.
    summary: p.descriptionModule?.briefSummary ?? '', updated: flat.last_updated, checkedAt,
    trial: { ...flat, locations: flat.locations as TrialLocation[], criteria },
    contacts: (p.contactsLocationsModule?.centralContacts ?? []).map(c => ({ name: c.name ?? '', phone: c.phone ?? '', email: c.email ?? '' })).sort((a,b) => a.email.localeCompare(b.email)),
    sponsor: flat.sponsor ?? '', studyType: p.designModule?.studyType ?? '', minAge: p.eligibilityModule?.minimumAge ?? null, maxAge: p.eligibilityModule?.maximumAge ?? null,
  };
}
export async function collectRegistry(previous: MonitorTrial[], followedIds: string[], checkedAt: string, fetcher: typeof fetch = fetch): Promise<MonitorTrial[]> {
  const found = new Map<string, { study: RegistryStudy; labels: Set<Condition> }>();
  for (const [label, query] of SEARCHES) {
    for (const study of await searchRegistry(label, query, fetcher)) {
      const id = study.protocolSection.identificationModule.nctId;
      const entry = found.get(id) ?? { study, labels: new Set<Condition>() };
      entry.labels.add(label); found.set(id, entry);
    }
  }
  const prior = new Map(previous.map(t => [t.id, t]));
  // Missing from search never means closed. Check each previously active/followed record directly.
  const toCheck = new Set([...previous.filter(t => ['RECRUITING', 'NOT_YET_RECRUITING'].includes(t.status)).map(t => t.id), ...followedIds]);
  for (const id of toCheck) if (!found.has(id)) {
    const study = await registryJson(`${API}/${id}`, fetcher) as RegistryStudy;
    if (study.protocolSection?.identificationModule?.nctId !== id) throw new Error('Direct registry lookup returned a different study.');
    found.set(id, { study, labels: new Set(prior.get(id)?.conditions ?? []) });
  }
  const result = [...found].map(([id, hit]) => normalizeStudy(hit.study, [...hit.labels], checkedAt, prior.get(id)));
  for (const old of previous) if (!found.has(old.id)) result.push(old); // retain confirmed closed records, with their original check time
  return result.sort((a,b) => a.id.localeCompare(b.id));
}
