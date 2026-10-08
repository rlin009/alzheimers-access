import { readFile, writeFile } from "node:fs/promises";
import path from "node:path";

// Refreshes src/data/nameit/trials.json from ClinicalTrials.gov.
//
//   npx tsx scripts/fetch-nameit-trials.ts           report only
//   npx tsx scripts/fetch-nameit-trials.ts --apply   update the file
//
// Each listed trial has a one-sentence summary written by a person, so this
// script never adds a trial by itself. It updates the facts (status, sites,
// dates) for trials already listed, drops ones that stopped recruiting, and
// prints any new trial so someone can read it and write its summary.
//
// The five searches run separately. One combined search pulled in reflux
// surgery trials that have nothing to do with these conditions.

const SEARCHES: Record<string, string> = {
  "R-CPD": '"retrograde cricopharyngeus" OR "retrograde cricopharyngeal" OR "inability to belch" OR abelchia',
  "A-CPD": '"cricopharyngeal dysfunction" OR "cricopharyngeal achalasia" OR "cricopharyngeal bar" OR "upper esophageal sphincter dysfunction"',
  Achalasia: "achalasia",
  "Zenker's": '"Zenker diverticulum" OR "Zenker\'s diverticulum" OR "pharyngeal pouch" OR "hypopharyngeal diverticulum"',
  Spasm: '"esophageal spasm" OR "jackhammer esophagus" OR "hypercontractile esophagus"',
};
const API = "https://clinicaltrials.gov/api/v2/studies";
const FILE = path.join(process.cwd(), "src", "data", "nameit", "trials.json");
const apply = process.argv.includes("--apply");

type Location = { city?: string; state?: string; country?: string };
type Study = {
  protocolSection: {
    identificationModule: { nctId: string; briefTitle: string };
    statusModule: { overallStatus: string; lastUpdatePostDateStruct?: { date: string } };
    designModule?: { studyType?: string; phases?: string[]; enrollmentInfo?: { count?: number } };
    eligibilityModule?: { minimumAge?: string; maximumAge?: string };
    sponsorCollaboratorsModule?: { leadSponsor?: { name?: string } };
    contactsLocationsModule?: { locations?: Location[] };
  };
};

async function search(cond: string): Promise<Study[]> {
  const params = new URLSearchParams({
    "query.cond": cond,
    "filter.overallStatus": "RECRUITING,NOT_YET_RECRUITING",
    pageSize: "200",
  });
  const res = await fetch(`${API}?${params}`, { signal: AbortSignal.timeout(60000) });
  if (!res.ok) throw new Error(`ClinicalTrials.gov answered ${res.status}`);
  const data = (await res.json()) as { studies: Study[] };
  return data.studies;
}

function place(l: Location) {
  return [l.city, l.country === "United States" ? l.state : undefined, l.country].filter(Boolean).join(", ");
}

async function main() {
  const file = JSON.parse(await readFile(FILE, "utf8")) as {
    fetched: string;
    source: string;
    excluded: { nctId: string; reason: string }[];
    trials: ({ nctId: string } & Record<string, unknown>)[];
  };
  // Trials someone read and decided are not really about these conditions.
  const excluded = new Set(file.excluded.map((e) => e.nctId));
  const listed = new Map(file.trials.map((t) => [t.nctId, t]));
  const found = new Map<string, { study: Study; conditions: Set<string> }>();

  for (const [label, cond] of Object.entries(SEARCHES)) {
    const studies = await search(cond);
    console.log(`${label}: ${studies.length} recruiting or not yet recruiting`);
    for (const s of studies) {
      const id = s.protocolSection.identificationModule.nctId;
      const entry = found.get(id) ?? { study: s, conditions: new Set<string>() };
      entry.conditions.add(label);
      found.set(id, entry);
    }
  }

  const kept = [];
  for (const t of file.trials) {
    const hit = found.get(t.nctId);
    if (!hit) {
      console.log(`No longer recruiting, removed: ${t.nctId}`);
      continue;
    }
    const ps = hit.study.protocolSection;
    const locs = ps.contactsLocationsModule?.locations ?? [];
    const us = locs.filter((l) => l.country === "United States");
    const rest = locs.filter((l) => l.country !== "United States");
    kept.push({
      ...t,
      status: ps.statusModule.overallStatus,
      enrollment: ps.designModule?.enrollmentInfo?.count ?? null,
      minAge: ps.eligibilityModule?.minimumAge ?? null,
      maxAge: ps.eligibilityModule?.maximumAge ?? null,
      siteCount: locs.length,
      sites: [...us, ...rest].map(place).slice(0, 6),
      countries: [...new Set(locs.map((l) => l.country).filter(Boolean))].sort(),
      lastUpdate: ps.statusModule.lastUpdatePostDateStruct?.date ?? null,
    });
  }

  const fresh = [...found.entries()].filter(([id]) => !listed.has(id) && !excluded.has(id));
  if (fresh.length) {
    console.log(`\n${fresh.length} studies are not listed yet. Read each one before adding it, since some only mention these conditions in passing:`);
    for (const [id, { study, conditions }] of fresh)
      console.log(`  ${id} [${[...conditions].join(", ")}] ${study.protocolSection.identificationModule.briefTitle}`);
  }

  if (!apply) {
    console.log("\nReport only. Run with --apply to update the file.");
    return;
  }
  file.fetched = new Date().toISOString().slice(0, 10);
  file.trials = kept;
  await writeFile(FILE, JSON.stringify(file, null, 2) + "\n");
  console.log(`\nUpdated ${path.relative(process.cwd(), FILE)}: ${kept.length} trials.`);
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
