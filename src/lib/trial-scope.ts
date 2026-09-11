import { createHash } from "node:crypto";

/** Search registrant-authored fields, never generated MeSH or ancestor terms. */
const TERMS = 'EXPANSION[Term](Alzheimer OR Dementia OR "Mild Cognitive Impairment" OR "Lewy Body" OR Frontotemporal OR "Primary Progressive Aphasia" OR "Posterior Cortical Atrophy" OR "Creutzfeldt-Jakob")';
export const TRIAL_SEARCH = ["Condition", "BriefTitle", "OfficialTitle", "BriefSummary", "Keyword"]
  .map((field) => `AREA[${field}]${TERMS}`).join(" OR ");

export interface RegistryStudy {
  protocolSection: {
    identificationModule: { nctId: string; briefTitle?: string; officialTitle?: string };
    statusModule: { overallStatus: string; startDateStruct?: { date?: string }; lastUpdatePostDateStruct?: { date?: string } };
    conditionsModule?: { conditions?: string[]; keywords?: string[] };
    descriptionModule?: { briefSummary?: string; detailedDescription?: string };
    eligibilityModule?: { minimumAge?: string; maximumAge?: string; sex?: string; eligibilityCriteria?: string };
    designModule?: { phases?: string[] };
    sponsorCollaboratorsModule?: { leadSponsor?: { name?: string } };
    contactsLocationsModule?: { locations?: { country?: string; status?: string; [key: string]: unknown }[] };
  };
  derivedSection?: { conditionBrowseModule?: { meshes?: { term: string }[] } };
}
export type ScopeDecision = { decision: "include" | "exclude" | "review"; reason: string };
export type ScopeReview = ScopeDecision & { sourceHash: string; evidence: string };

const TARGET = /\balzheimer\w*|\bdementia\b|\bdementias\b|\blewy bod(?:y|ies)\b|\bfronto[ -]?temporal (?:dementia|degeneration|lobar degeneration)\b|\b(?:mild cognitive impairment|cognitive impairment[, -]+mild|mild neurocognitive disorder|neurocognitive impairment[, -]+mild)\b|\bprimary progressive aphasia\b|\bposterior cortical atrophy\b|\bcreutzfeldt.jakob\b|\bpick.s disease\b/i;

export function scopeText(study: RegistryStudy) {
  const p = study.protocolSection;
  return {
    titles: [p.identificationModule.briefTitle, p.identificationModule.officialTitle].filter(Boolean).join("\n"),
    conditions: (p.conditionsModule?.conditions ?? []).join("\n"),
    meshes: (study.derivedSection?.conditionBrowseModule?.meshes ?? []).map(x => x.term).join("\n"),
    summary: p.descriptionModule?.briefSummary ?? "",
    description: p.descriptionModule?.detailedDescription ?? "",
    keywords: (p.conditionsModule?.keywords ?? []).join("\n"),
    eligibility: p.eligibilityModule?.eligibilityCriteria ?? "",
  };
}
export function scopeHash(study: RegistryStudy) {
  return createHash("sha256").update(JSON.stringify(scopeText(study))).digest("hex");
}

export function assessTrialScope(study: RegistryStudy, review?: ScopeReview): ScopeDecision {
  if (study.protocolSection.statusModule.overallStatus !== "RECRUITING") {
    return { decision: "exclude", reason: "The registry no longer lists this study as recruiting." };
  }
  if (review && review.sourceHash === scopeHash(study)) return review;
  const text = scopeText(study);
  if (TARGET.test(text.conditions) || TARGET.test(text.titles)) {
    return { decision: "include", reason: "A registrant-authored condition or study title names dementia, a related subtype, or mild cognitive impairment." };
  }
  if (review || [text.summary, text.description, text.keywords, text.eligibility].some(value => TARGET.test(value))) {
    return { decision: "review", reason: "The listing mentions dementia or related research, but its relevance needs clarification." };
  }
  return { decision: "exclude", reason: "No explicit dementia, related subtype, or mild cognitive impairment evidence in the study's scope fields; broad registry ancestry is not evidence of relevance." };
}

export function ageStringToYears(age?: string): number | null {
  const match = age?.trim().match(/^(\d+)\s*(Year|Month|Week|Day)s?$/i);
  if (!match) return null;
  const divisor = { year: 1, month: 12, week: 52, day: 365 }[match[2].toLowerCase()]!;
  return Math.floor(Number(match[1]) / divisor);
}
export function flattenStudy(study: RegistryStudy, fetchedAt: string) {
  const p = study.protocolSection, e = p.eligibilityModule;
  const start = p.statusModule.startDateStruct?.date;
  return {
    nct_id: p.identificationModule.nctId,
    brief_title: p.identificationModule.briefTitle ?? null,
    official_title: p.identificationModule.officialTitle ?? null,
    status: p.statusModule.overallStatus,
    phases: p.designModule?.phases ?? [],
    conditions: p.conditionsModule?.conditions ?? [],
    min_age_years: ageStringToYears(e?.minimumAge), max_age_years: ageStringToYears(e?.maximumAge),
    sex: e?.sex ?? null, eligibility_text: e?.eligibilityCriteria ?? null,
    locations: p.contactsLocationsModule?.locations ?? [],
    sponsor: p.sponsorCollaboratorsModule?.leadSponsor?.name ?? null,
    start_date: start ? (start.length === 7 ? `${start}-01` : start) : null,
    start_date_precision: start?.length === 7 ? "month" : start ? "day" : null,
    last_updated: p.statusModule.lastUpdatePostDateStruct?.date ?? null, fetched_at: fetchedAt,
  };
}
