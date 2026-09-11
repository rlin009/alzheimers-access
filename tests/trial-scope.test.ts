import test from "node:test";
import assert from "node:assert/strict";
import fixtures from "./fixtures/trial-scope.json";
import reviews from "../src/data/trial-scope-reviews.json";
import { assessTrialScope, scopeHash, TRIAL_SEARCH, type RegistryStudy, type ScopeReview } from "../src/lib/trial-scope";
import { loadCatalogTrials } from "../src/lib/trial-catalog";
import type { SupabaseClient } from "@supabase/supabase-js";
import catalog from "../src/data/trial-catalog.json";
import { triageTrialsForFamily, type FamilyProfile } from "../src/lib/triage";

const study = (id: string): RegistryStudy => structuredClone(fixtures.find(s => s.protocolSection.identificationModule.nctId === id)!);
const reviewed = reviews as Record<string, ScopeReview>;

test("real unrelated trials are excluded even with incorrect generated dementia tags", () => {
  for (const id of ["NCT07766174", "NCT05925101"]) {
    assert.equal(assessTrialScope(study(id)).decision, "exclude", id);
  }
});
test("known Alzheimer, frontotemporal, Lewy body and MCI trials remain included", () => {
  for (const id of ["NCT03809351", "NCT07110207", "NCT06891703", "NCT07449117"]) {
    assert.equal(assessTrialScope(study(id)).decision, "include", id);
  }
});
test("reviewed caregiver and prevention studies do not require dementia in their condition label", () => {
  for (const id of ["NCT05334992", "NCT05106036"]) {
    assert.equal(assessTrialScope(study(id), reviewed[id]).decision, "include", id);
  }
});
test("background mentions require review instead of becoming positive relevance evidence", () => {
  const tinnitus = study("NCT06776705");
  assert.equal(assessTrialScope(tinnitus).decision, "review");
  assert.equal(assessTrialScope(tinnitus, reviewed["NCT06776705"]).decision, "exclude");
});
test("changed scope text invalidates a reviewed decision", () => {
  const s = study("NCT05334992");
  const original = scopeHash(s);
  s.protocolSection.descriptionModule!.briefSummary = "Study changed to a different caregiver population.";
  assert.notEqual(scopeHash(s), original);
  assert.equal(assessTrialScope(s, reviewed["NCT05334992"]).decision, "review");
});
test("closed trials cannot be retained by an include override", () => {
  const s = study("NCT05334992");
  s.protocolSection.statusModule.overallStatus = "COMPLETED";
  assert.equal(assessTrialScope(s, reviewed["NCT05334992"]).decision, "exclude");
});
test("a dementia exclusion alone never establishes study relevance", () => {
  const s = study("NCT07766174");
  s.protocolSection.eligibilityModule!.eligibilityCriteria = "Exclusion Criteria: dementia.";
  assert.equal(assessTrialScope(s).decision, "review");
});
test("discovery never searches broad generated classification fields", () => {
  assert.ok(TRIAL_SEARCH.includes("AREA[Condition]"));
  assert.ok(TRIAL_SEARCH.includes("AREA[BriefSummary]"));
  assert.ok(!/ConditionSearch|ConditionMeshTerm|ConditionAncestorTerm/.test(TRIAL_SEARCH));
});
test("catalog loading retrieves more than 1,000 trials without querying unrelated legacy rows", async () => {
  const entries = Object.fromEntries(Array.from({length: 1205}, (_, i) => [`NCT${String(i).padStart(8, "0")}`, { decision: "include", reason: "fixture" }]));
  const batches: string[][] = [];
  const db = { from: () => ({ select: () => ({ in: (_: string, ids: string[]) => {
    batches.push(ids);
    return { eq: () => ({ order: async () => ({ data: ids.map(nct_id => ({ nct_id, status: "RECRUITING" })), error: null }) }) };
  } }) }) } as unknown as SupabaseClient;
  const result = await loadCatalogTrials(db, { updatedAt: "2026-09-11", entries });
  assert.equal(result.length, 1205);
  assert.equal(new Set(result.map(x => x.nct_id)).size, 1205);
  assert.ok(batches.every(batch => batch.length <= 100));
  assert.equal(batches.length, 13);
});
test("a catalog query failure does not return misleading partial results", async () => {
  const db = { from: () => ({ select: () => ({ in: () => ({ eq: () => ({ order: async () => ({ data: null, error: {message: "unavailable"} }) }) }) }) }) } as unknown as SupabaseClient;
  await assert.rejects(() => loadCatalogTrials(db, { updatedAt: "2026-09-11", entries: { NCT03809351: {decision: "include", reason: "fixture"} } }));
});

test("the published catalog removes known unrelated examples and preserves the UAB study", () => {
  assert.ok(!Object.hasOwn(catalog.entries, "NCT07766174"));
  assert.ok(!Object.hasOwn(catalog.entries, "NCT05925101"));
  assert.ok(Object.hasOwn(catalog.entries, "NCT03809351"));
});

test("uncertain scope is explained in cannot-tell rather than promoted by permissive criteria", async () => {
  const id = Object.entries(catalog.entries).find(([, entry]) => entry.decision === "review")![0];
  const record = { nct_id: id, status: "RECRUITING", min_age_years: null, max_age_years: null, eligibility_text: "Adults", locations: [{country: "United States", status: "RECRUITING"}], criteria: { nct_id: id, requires_study_partner: "not required", requires_imaging: "not required", requires_lumbar_puncture: "not required" } };
  const db = { from: () => ({ select: () => ({ in: (_: string, ids: string[]) => ({ eq: () => ({ order: async () => ({ data: ids.includes(id) ? [record] : [], error: null }) }) }) }) }) } as unknown as SupabaseClient;
  const family: FamilyProfile = { location: { country: "United States" }, relationship: "", diagnosisStage: "", studyPartner: "unknown", willingToTravel: true };
  const result = await triageTrialsForFamily(family, db);
  assert.equal(result.worthAsking.length, 0);
  assert.equal(result.probablyNot.length, 0);
  assert.equal(result.cannotTell.length, 1);
  assert.match(result.cannotTell[0].note!, /could not confirm/);
});
