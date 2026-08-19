import "dotenv/config";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const BASE = "https://clinicaltrials.gov/api/v2/studies";
const CONDITION = "Alzheimer Disease OR Dementia";

function ageStringToYears(age?: string): number | null {
  if (!age) return null;

  const match = age.trim().match(/^(\d+)\s*(Year|Month|Week|Day)s?$/i);
  if (!match) return null;

  const amount = parseInt(match[1], 10);
  const unit = match[2].toLowerCase();

  switch (unit) {
    case "year":
      return amount;
    case "month":
      return Math.floor(amount / 12);
    case "week":
      return Math.floor(amount / 52);
    case "day":
      return Math.floor(amount / 365);
    default:
      return null;
  }
}

// "2019-03" has no day, so store the 1st and record that the day is not real
function startDate(
  d?: { date?: string }
): { start_date: string | null; start_date_precision: string | null } {
  if (!d?.date) return { start_date: null, start_date_precision: null };
  if (d.date.length === 7)
    return { start_date: d.date + "-01", start_date_precision: "month" };
  return { start_date: d.date, start_date_precision: "day" };
}

function flatten(s: any) {
  const p = s.protocolSection ?? {};
  const id = p.identificationModule ?? {};
  const st = p.statusModule ?? {};
  const el = p.eligibilityModule ?? {};
  const de = p.designModule ?? {};
  const co = p.conditionsModule ?? {};
  const sp = p.sponsorCollaboratorsModule ?? {};
  const lo = p.contactsLocationsModule ?? {};

  return {
    nct_id: id.nctId,
    brief_title: id.briefTitle ?? null,
    official_title: id.officialTitle ?? null,
    status: st.overallStatus ?? null,
    phases: de.phases ?? [],
    conditions: co.conditions ?? [],
    min_age_years: ageStringToYears(el.minimumAge),
    max_age_years: ageStringToYears(el.maximumAge),
    sex: el.sex ?? null,
    eligibility_text: el.eligibilityCriteria ?? null,
    locations: lo.locations ?? [],
    sponsor: sp.leadSponsor?.name ?? null,
    ...startDate(st.startDateStruct),
    last_updated: st.lastUpdatePostDateStruct?.date ?? null,
    fetched_at: new Date().toISOString(),
  };
}

// Flattens a single study and upserts it into the `trials` table,
// returning whatever Supabase hands back for that row.
async function saveFirstStudy(study: any) {
  const row = flatten(study);

  const { data, error } = await supabase
    .from("trials")
    .upsert(row, { onConflict: "nct_id" })
    .select();

  if (error) throw new Error("Supabase error: " + error.message);

  return data;
}

async function main() {
  let pageToken: string | undefined = undefined;
  let page = 0;
  let expectedTotal: number | null = null;
  const seen = new Set<string>();

  while (true) {
    const params = new URLSearchParams({
      "query.cond": CONDITION,
      pageSize: "200",
      countTotal: "true",
    });
    if (pageToken) params.set("pageToken", pageToken);

    const res = await fetch(`${BASE}?${params.toString()}`, {
      headers: { "User-Agent": "AlzheimersAccessCapstone/0.1" },
    });
    if (!res.ok) throw new Error("Request failed: " + res.status);

    const data = await res.json();
    page++;

    // totalCount is sent on the first page only
    if (expectedTotal === null) {
      expectedTotal = data.totalCount ?? null;
      console.log("Registry reports total studies:", expectedTotal);
    }

    const rows = (data.studies ?? []).map(flatten);
    for (const r of rows) seen.add(r.nct_id);

    const { error } = await supabase
      .from("trials")
      .upsert(rows, { onConflict: "nct_id" });
    if (error) throw new Error("Supabase error: " + error.message);

    console.log(`page ${page}: saved ${rows.length}, running total ${seen.size}`);

    pageToken = data.nextPageToken;
    if (!pageToken) break;

    await new Promise((r) => setTimeout(r, 400)); // be polite to the API
  }

  console.log("Finished. Unique trials:", seen.size, "Registry said:", expectedTotal);
  if (seen.size !== expectedTotal) {
    throw new Error(
      `Count mismatch: collected ${seen.size}, registry reported ${expectedTotal}`
    );
  }
  console.log("Counts match.");
}

// Kept deliberately as a manual test entry point. Not called by main().
// Fetches just the first page and saves only the first study, for testing
// flatten()/saveFirstStudy() in isolation before running the full crawl.
async function testFirstStudyOnly() {
  const params = new URLSearchParams({
    "query.cond": CONDITION,
    pageSize: "1",
  });

  const res = await fetch(`${BASE}?${params.toString()}`, {
    headers: { "User-Agent": "AlzheimersAccessCapstone/0.1" },
  });
  if (!res.ok) throw new Error("Request failed: " + res.status);

  const data = await res.json();
  const study = (data.studies ?? [])[0];
  if (!study) throw new Error("No studies returned");

  const result = await saveFirstStudy(study);
  console.log("Upsert result:", JSON.stringify(result, null, 2));
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});