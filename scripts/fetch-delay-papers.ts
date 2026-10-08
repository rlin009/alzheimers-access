import "dotenv/config";
import { createClient } from "@supabase/supabase-js";

const TERM_SETS = [
  { condition: "R-CPD", terms: '"retrograde cricopharyngeus" OR "retrograde cricopharyngeal" OR "R-CPD"' },
  { condition: "A-CPD", terms: '"cricopharyngeal achalasia" OR "antegrade cricopharyngeal" OR "cricopharyngeal dysfunction"' },
  { condition: "Achalasia", terms: '"esophageal achalasia" OR "achalasia cardia"' },
  { condition: "Zenker's", terms: '"Zenker diverticulum" OR "Zenker\'s diverticulum"' },
  { condition: "Spasm", terms: '"diffuse esophageal spasm" OR "jackhammer esophagus"' },
] as const;

const DELAY_TERMS =
  '"diagnostic delay" OR "time to diagnosis" OR "misdiagnosis" OR "misdiagnosed"';
const DELAY_MS = 300;
const PAGE_SIZE = 100;
const SEARCH_URL = "https://www.ebi.ac.uk/europepmc/webservices/rest/search";

const url = process.env.SUPABASE_URL ?? process.env.NEXT_PUBLIC_SUPABASE_URL;
const key =
  process.env.SUPABASE_SERVICE_ROLE_KEY ?? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
if (!url || !key) {
  throw new Error(
    "SUPABASE_URL (or NEXT_PUBLIC_SUPABASE_URL) and SUPABASE_SERVICE_ROLE_KEY (or NEXT_PUBLIC_SUPABASE_ANON_KEY) are required.",
  );
}
const db = createClient(url, key);

type EuropePmcResult = {
  pmid?: string;
  title?: string;
  abstractText?: string;
  journalTitle?: string;
  pubYear?: string | number;
  journalInfo?: {
    yearOfPublication?: string | number;
    journal?: { title?: string };
  };
};

type EuropePmcSearchResponse = {
  hitCount?: number;
  nextCursorMark?: string;
  resultList?: { result?: EuropePmcResult[] };
};

type DelayPaper = {
  pmid: string;
  condition: string;
  title: string | null;
  journal: string | null;
  pub_year: number | null;
  abstract: string | null;
};

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function parseYear(value: string | number | undefined): number | null {
  if (typeof value === "number" && Number.isInteger(value)) return value;
  if (typeof value === "string" && /^\d+$/.test(value)) return Number.parseInt(value, 10);
  return null;
}

function toPaper(result: EuropePmcResult, condition: string): DelayPaper | null {
  if (!result.pmid) return null;
  return {
    pmid: String(result.pmid),
    condition,
    title: result.title ?? null,
    journal: result.journalTitle ?? result.journalInfo?.journal?.title ?? null,
    pub_year: parseYear(result.pubYear) ?? parseYear(result.journalInfo?.yearOfPublication),
    abstract: result.abstractText ?? null,
  };
}

async function fetchPage(query: string, cursorMark: string): Promise<EuropePmcSearchResponse> {
  const params = new URLSearchParams({
    query,
    resultType: "core",
    pageSize: String(PAGE_SIZE),
    format: "json",
    cursorMark,
  });
  for (let attempt = 1; ; attempt++) {
    try {
      const res = await fetch(`${SEARCH_URL}?${params.toString()}`, {
        signal: AbortSignal.timeout(30000),
      });
      if (!res.ok) {
        throw new Error(`Europe PMC request failed (${res.status}) for ${query}`);
      }
      return (await res.json()) as EuropePmcSearchResponse;
    } catch (error) {
      if (attempt === 4) throw error;
      await sleep(1000 * attempt);
    }
  }
}

async function fetchPapers(condition: string, terms: string): Promise<DelayPaper[]> {
  const query = `(${terms}) AND (${DELAY_TERMS})`;
  const papers: DelayPaper[] = [];
  const seen = new Set<string>();
  let cursorMark = "*";

  while (true) {
    const data = await fetchPage(query, cursorMark);
    const results = data.resultList?.result ?? [];
    for (const result of results) {
      const paper = toPaper(result, condition);
      if (!paper || seen.has(paper.pmid)) continue;
      seen.add(paper.pmid);
      papers.push(paper);
    }
    const next = data.nextCursorMark;
    if (!next || next === cursorMark || results.length === 0) break;
    cursorMark = next;
    await sleep(DELAY_MS);
  }

  return papers;
}

async function main() {
  for (const [index, { condition, terms }] of TERM_SETS.entries()) {
    console.log(`Fetching delay papers for ${condition}...`);
    const papers = await fetchPapers(condition, terms);
    if (papers.length > 0) {
      const { error } = await db.from("delay_papers").upsert(papers, { onConflict: "pmid" });
      if (error) {
        throw new Error(`Supabase upsert failed for ${condition}: ${error.message}`);
      }
    }
    console.log(`${condition}: ${papers.length} papers inserted`);
    if (index < TERM_SETS.length - 1) await sleep(DELAY_MS);
  }
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
