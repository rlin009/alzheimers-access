import { config } from "dotenv";
import { createClient } from "@supabase/supabase-js";
import { mkdir, readFile, writeFile, rename } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { assessTrialScope, flattenStudy, scopeHash, TRIAL_SEARCH, type RegistryStudy, type ScopeReview } from "../src/lib/trial-scope";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
config({ path: path.join(root, ".env.local"), quiet: true });
config({ path: path.join(root, ".env"), quiet: true });
const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!url || !key) throw new Error("Supabase environment variables are required.");
const db = createClient(url, key);
const apply = process.argv.includes("--apply");
const BASE = "https://clinicaltrials.gov/api/v2/studies";

async function fetchStudies(params: Record<string, string>) {
  const studies: RegistryStudy[] = [];
  let pageToken: string | undefined;
  let expected: number | undefined;
  const tokens = new Set<string>();
  do {
    const query = new URLSearchParams({ ...params, pageSize: "1000", countTotal: "true" });
    if (pageToken) query.set("pageToken", pageToken);
    const res = await fetch(`${BASE}?${query}`, { signal: AbortSignal.timeout(60000) });
    if (!res.ok) throw new Error(`Registry request failed: ${res.status}`);
    const data = await res.json() as { studies: RegistryStudy[]; totalCount?: number; nextPageToken?: string };
    expected ??= data.totalCount;
    if (!Array.isArray(data.studies)) throw new Error("Invalid registry response.");
    studies.push(...data.studies);
    pageToken = data.nextPageToken;
    if (pageToken && tokens.has(pageToken)) throw new Error("Registry pagination loop.");
    if (pageToken) tokens.add(pageToken);
  } while (pageToken);
  const ids = new Set(studies.map(s => s.protocolSection.identificationModule.nctId));
  if (ids.size !== studies.length || (expected !== undefined && expected !== ids.size)) throw new Error("Registry count mismatch; catalog will not be published.");
  return studies;
}

async function main() {
  const now = new Date().toISOString();
  const folder = path.join(root, ".trial-audit", now.replace(/[:.]/g, "-"));
  await mkdir(folder, { recursive: true });
  const reviews = JSON.parse(await readFile(path.join(root, "src/data/trial-scope-reviews.json"), "utf8")) as Record<string, ScopeReview>;
  const oldRows: Record<string, unknown>[] = [];
  // Read ALL pages. Supabase's default response cap must not truncate the audit.
  for (let offset = 0; ; offset += 500) {
    const { data, error } = await db.from("trials").select("*, criteria(*)").order("nct_id").range(offset, offset + 499);
    if (error) throw new Error("Could not back up existing recruiting trials.");
    oldRows.push(...data);
    if (data.length < 500) break;
  }
  await writeFile(path.join(folder, "before.json"), JSON.stringify(oldRows, null, 2));
  const studies = await fetchStudies({ "query.term": TRIAL_SEARCH, "filter.overallStatus": "RECRUITING" });
  const found = new Set(studies.map(s => s.protocolSection.identificationModule.nctId));
  const missing = oldRows.filter(r => r.status === "RECRUITING").map(r => String(r.nct_id)).filter(id => !found.has(id));
  // Refresh legacy rows individually by ID so narrower discovery never silently
  // loses a relevant old record, and closed studies receive their true status.
  for (let i = 0; i < missing.length; i += 100) {
    const batch = missing.slice(i, i + 100);
    const legacy = await fetchStudies({ "filter.ids": batch.join(",") });
    if (legacy.length !== batch.length) throw new Error("A legacy registry record was unavailable; no publication attempted.");
    studies.push(...legacy);
  }
  await writeFile(path.join(folder, "registry.json"), JSON.stringify(studies));
  const audit = studies.map(study => ({
    id: study.protocolSection.identificationModule.nctId,
    title: study.protocolSection.identificationModule.briefTitle,
    ...assessTrialScope(study, reviews[study.protocolSection.identificationModule.nctId]),
    sourceHash: scopeHash(study),
  }));
  const active = audit.filter(row => row.decision !== "exclude");
  const entries = Object.fromEntries(active.map(row => [row.id, { decision: row.decision, reason: row.reason }]));
  if (active.length === 0) throw new Error("Empty catalog refused.");
  const catalog = { updatedAt: now, query: TRIAL_SEARCH, entries };
  await writeFile(path.join(folder, "audit.json"), JSON.stringify(audit, null, 2));
  await writeFile(path.join(folder, "catalog.json"), JSON.stringify(catalog, null, 2));
  console.log(JSON.stringify({ mode: apply ? "apply" : "dry-run", backedUp: oldRows.length, checked: studies.length, included: audit.filter(r => r.decision === "include").length, uncertain: audit.filter(r => r.decision === "review").length, excluded: audit.filter(r => r.decision === "exclude").length, evidence: path.relative(root, folder) }, null, 2));
  if (!apply) return;
  const oldById = new Map(oldRows.map(row => [String(row.nct_id), row]));
  let invalidated = 0;
  for (const study of studies) {
    const id = study.protocolSection.identificationModule.nctId;
    const previous = oldById.get(id);
    if (previous && previous.eligibility_text !== (study.protocolSection.eligibilityModule?.eligibilityCriteria ?? null)) {
      // Parsed requirements must not survive a change in their source text.
      // The full previous criteria row is recoverable in before.json.
      const { error } = await db.from("criteria").update({ requires_study_partner: "cannot tell", requires_imaging: "cannot tell", requires_lumbar_puncture: "cannot tell" }).eq("nct_id", id);
      if (error) throw new Error(`Could not invalidate stale criteria for ${id}.`);
      invalidated++;
    }
  }
  for (let i = 0; i < studies.length; i += 100) {
    const { error } = await db.from("trials").upsert(studies.slice(i, i + 100).map(s => flattenStudy(s, now)), { onConflict: "nct_id" });
    if (error) throw new Error(`Trial refresh failed in batch ${i / 100 + 1}; catalog not published.`);
  }
  // Verify every catalog entry exists after writes, even above the default cap.
  const activeIds = active.map(row => row.id);
  for (let i = 0; i < activeIds.length; i += 100) {
    const ids = activeIds.slice(i, i + 100);
    const { data, error } = await db.from("trials").select("nct_id").in("nct_id", ids).eq("status", "RECRUITING");
    if (error || data.length !== ids.length) throw new Error("Post-refresh verification failed; catalog not published.");
  }
  const target = path.join(root, "src/data/trial-catalog.json");
  try { await writeFile(path.join(folder, "previous-catalog.json"), await readFile(target)); } catch (error) { if ((error as NodeJS.ErrnoException).code !== "ENOENT") throw error; }
  await writeFile(`${target}.tmp`, JSON.stringify(catalog, null, 2) + "\n");
  await rename(`${target}.tmp`, target);
  await writeFile(path.join(root, "docs/trial-scope-audit.json"), JSON.stringify({ updatedAt: now, query: TRIAL_SEARCH, studies: audit }, null, 2) + "\n");
  console.log(`Catalog published; ${invalidated} changed eligibility texts had old parsed requirements invalidated. No trial rows deleted.`);
}
main().catch(error => { console.error(error instanceof Error ? error.message : "Trial refresh failed."); process.exitCode = 1; });
