import "dotenv/config";
import { readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";

// Counts research papers per condition per year from Europe PMC and saves
// them to the `attention` table in Supabase and to
// src/data/nameit/attention.json, which the Free the Burp evidence page reads.
//
//   npx tsx scripts/fetch-attention.ts           counts, saves to both
//   npx tsx scripts/fetch-attention.ts --no-db   counts, saves only the JSON
//
// The searches changed after the first run. The bare abbreviation "R-CPD"
// matched dozens of chemistry papers (see docs/attention-notes.md), and
// "cricopharyngeal dysfunction" matched every R-CPD paper as well, so the
// A-CPD search now leaves those out. Only PubMed-indexed papers are counted
// (SRC:MED), which drops conference abstract books.

const RCPD = '"retrograde cricopharyngeus" OR "retrograde cricopharyngeal"';
const TERM_SETS = [
  { condition: "R-CPD", query: `(${RCPD})` },
  {
    condition: "A-CPD",
    query: `("cricopharyngeal achalasia" OR "antegrade cricopharyngeal" OR "cricopharyngeal dysfunction") NOT (${RCPD})`,
  },
  { condition: "Achalasia", query: '("esophageal achalasia" OR "achalasia cardia")' },
  { condition: "Zenker's", query: '("Zenker diverticulum" OR "Zenker\'s diverticulum")' },
  { condition: "Spasm", query: '("diffuse esophageal spasm" OR "jackhammer esophagus")' },
] as const;

const START_YEAR = 1990;
const END_YEAR = 2026;
const DELAY_MS = 200;
const SEARCH_URL = "https://www.ebi.ac.uk/europepmc/webservices/rest/search";
const JSON_PATH = path.join(process.cwd(), "src", "data", "nameit", "attention.json");
const useDb = !process.argv.includes("--no-db");

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function fetchHitCount(query: string): Promise<number> {
  const params = new URLSearchParams({ query: `${query} AND SRC:MED`, format: "json", pageSize: "1" });
  // Europe PMC is a free service and sometimes drops a request. Without a
  // retry, one dropped request stops the whole run partway through and the
  // table is left with only the conditions that finished. Try up to 4 times.
  for (let attempt = 1; ; attempt++) {
    try {
      const res = await fetch(`${SEARCH_URL}?${params.toString()}`, {
        signal: AbortSignal.timeout(30000),
      });
      if (!res.ok) throw new Error(`Europe PMC request failed (${res.status}) for ${query}`);
      const data = (await res.json()) as { hitCount?: number };
      if (typeof data.hitCount !== "number") throw new Error(`Europe PMC response missing hitCount for ${query}`);
      return data.hitCount;
    } catch (error) {
      if (attempt === 4) throw error;
      await sleep(1000 * attempt);
    }
  }
}

async function main() {
  let db: SupabaseClient | null = null;
  if (useDb) {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
    if (!url || !key) throw new Error("NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are required (or pass --no-db).");
    db = createClient(url, key);
  }

  const years = Array.from({ length: END_YEAR - START_YEAR + 1 }, (_, i) => START_YEAR + i);
  const rows: { condition: string; pub_year: number; paper_count: number }[] = [];
  const allTime: Record<string, number> = {};
  const before1990: Record<string, number> = {};

  for (const { condition, query } of TERM_SETS) {
    allTime[condition] = await fetchHitCount(query);
    before1990[condition] = await fetchHitCount(`${query} AND PUB_YEAR:[1000 TO ${START_YEAR - 1}]`);
    for (const year of years) {
      const paperCount = await fetchHitCount(`${query} AND PUB_YEAR:${year}`);
      rows.push({ condition, pub_year: year, paper_count: paperCount });
      if (db) {
        const { error } = await db.from("attention").upsert(
          // fetched_at is set here on purpose. The column default only fires
          // when a row is first created, so a re-run would keep the old date.
          { condition, pub_year: year, paper_count: paperCount, fetched_at: new Date().toISOString() },
          { onConflict: "condition,pub_year" },
        );
        if (error) throw new Error(`Supabase upsert failed for ${condition} ${year}: ${error.message}`);
      }
      console.log(`${condition} ${year}: ${paperCount} papers`);
      await sleep(DELAY_MS);
    }
    console.log(`--- ${condition}: ${allTime[condition]} papers all time\n`);
  }

  // Keep the record of what the original searches found, for the notes.
  const previous = JSON.parse(await readFile(JSON_PATH, "utf8"));
  const out = {
    ...previous,
    fetched: new Date().toISOString().slice(0, 10),
    queries: Object.fromEntries(TERM_SETS.map((t) => [t.condition, t.query])),
    allTime,
    before1990,
    rows,
  };
  await writeFile(JSON_PATH, JSON.stringify(out, null, 2) + "\n");
  console.log(`Finished. ${rows.length} rows${db ? " saved to attention and" : ""} written to ${path.relative(process.cwd(), JSON_PATH)}.`);
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
