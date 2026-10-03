import "dotenv/config";
import { createClient } from "@supabase/supabase-js";

const TERM_SETS = [
        { condition: "R-CPD", terms: '"retrograde cricopharyngeus" OR "retrograde cricopharyngeal" OR "R-CPD"' },
        { condition: "A-CPD", terms: '"cricopharyngeal achalasia" OR "antegrade cricopharyngeal" OR "cricopharyngeal dysfunction"' },
        { condition: "Achalasia", terms: '"esophageal achalasia" OR "achalasia cardia"' },
        { condition: "Zenker's", terms: '"Zenker diverticulum" OR "Zenker\'s diverticulum"' },
        { condition: "Spasm", terms: '"diffuse esophageal spasm" OR "jackhammer esophagus"' },
] as const;

const START_YEAR = 1990;
const END_YEAR = 2026;
const DELAY_MS = 200;
const SEARCH_URL = "https://www.ebi.ac.uk/europepmc/webservices/rest/search";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!url || !key) {
  throw new Error("NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are required.");
}
const db = createClient(url, key);

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function fetchHitCount(terms: string, year: number): Promise<number> {
  const query = `(${terms}) AND PUB_YEAR:${year}`;
  const params = new URLSearchParams({
    query,
    format: "json",
    pageSize: "1",
  });
  // Europe PMC is a free service and sometimes drops a request. Without a
  // retry, one dropped request stops the whole run partway through and the
  // table is left with only the conditions that finished. Try up to 4 times.
  for (let attempt = 1; ; attempt++) {
    try {
      const res = await fetch(`${SEARCH_URL}?${params.toString()}`, {
        signal: AbortSignal.timeout(30000),
      });
      if (!res.ok) {
        throw new Error(`Europe PMC request failed (${res.status}) for ${query}`);
      }
      const data = (await res.json()) as { hitCount?: number };
      if (typeof data.hitCount !== "number") {
        throw new Error(`Europe PMC response missing hitCount for ${query}`);
      }
      return data.hitCount;
    } catch (error) {
      if (attempt === 4) throw error;
      await sleep(1000 * attempt);
    }
  }
}

async function main() {
  const years = Array.from({ length: END_YEAR - START_YEAR + 1 }, (_, i) => START_YEAR + i);
  const total = TERM_SETS.length * years.length;
  let done = 0;

  for (const { condition, terms } of TERM_SETS) {
    for (const year of years) {
      done += 1;
      const paperCount = await fetchHitCount(terms, year);
      const { error } = await db.from("attention").upsert(
        // fetched_at is set here on purpose. The column default only fires
        // when a row is first created, so a re-run would keep the old date.
        { condition, pub_year: year, paper_count: paperCount, fetched_at: new Date().toISOString() },
        { onConflict: "condition,pub_year" },
      );
      if (error) {
        throw new Error(
          `Supabase upsert failed for ${condition} ${year}: ${error.message}`,
        );
      }
      console.log(
        `[${done}/${total}] ${condition} ${year}: ${paperCount} papers`,
      );
      if (done < total) await sleep(DELAY_MS);
    }
  }

  console.log(`Finished. Upserted ${total} rows into attention.`);
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
