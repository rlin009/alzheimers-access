#!/usr/bin/env -S node -r ts-node/register
/**
 * validate-criteria.ts
 *
 * Compares docs/gold-standard.csv against the `criteria` table in Supabase,
 * matching rows on nct_id.
 *
 * study_partner, imaging_required, and lumbar_puncture_required are state
 * fields, reported as precision/recall PER POSSIBLE VALUE (not a single
 * overall accuracy number):
 *   study_partner            -> requires_study_partner
 *   imaging_required         -> requires_imaging
 *   lumbar_puncture_required -> requires_lumbar_puncture
 *
 * Possible values for those three (case-insensitive, whitespace-trimmed):
 *   required | not required | not mentioned | cannot tell
 *
 * cognitive_scale -> cognitive_scale is free text (a scale name, e.g. MMSE,
 * MoCA, CDR, ADAS-Cog, or empty if none is named) and is scored separately
 * as a case-insensitive exact string match, not against the four values
 * above.
 *
 * Output: docs/validation-report.md
 *
 * ---------------------------------------------------------------------------
 * Setup:
 *   npm install @supabase/supabase-js dotenv
 *   npm install -D typescript ts-node @types/node
 *
 * (CSV parsing is hand-rolled below, no csv-parse dependency needed.)
 *
 * Environment variables required. This script loads them itself from a
 * `.env` file at the project root (one level up from scripts/) via dotenv,
 * so you don't need to export them into your shell manually:
 *   NEXT_PUBLIC_SUPABASE_URL
 *   SUPABASE_SERVICE_ROLE_KEY        (falls back to NEXT_PUBLIC_SUPABASE_ANON_KEY)
 *
 * Optional:
 *   SUPABASE_CRITERIA_TABLE     (defaults to "criteria")
 *
 * Run:
 *   npx tsx scripts/validate-criteria.ts
 * ---------------------------------------------------------------------------
 */

import { config } from "dotenv";
import { fileURLToPath } from "node:url";
import fs from "node:fs";
import path from "node:path";
import { createClient } from "@supabase/supabase-js";

// Resolve .env relative to the project root (one level up from this
// file, since this file lives in scripts/), so it loads correctly no
// matter what directory you run the command from.
const __dirname = path.dirname(fileURLToPath(import.meta.url));
config({ path: path.resolve(__dirname, "..", ".env") });

// ---------------------------------------------------------------------------
// Config
// ---------------------------------------------------------------------------

const CSV_PATH = path.resolve(process.cwd(), "docs/gold-standard.csv");
const REPORT_PATH = path.resolve(process.cwd(), "docs/validation-report.md");
const TABLE_NAME = process.env.SUPABASE_CRITERIA_TABLE ?? "criteria";

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_KEY =
  process.env.SUPABASE_SERVICE_ROLE_KEY ?? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!SUPABASE_URL || !SUPABASE_KEY) {
  const missing: string[] = [];
  if (!SUPABASE_URL) missing.push("NEXT_PUBLIC_SUPABASE_URL");
  if (!SUPABASE_KEY) missing.push("SUPABASE_SERVICE_ROLE_KEY (or NEXT_PUBLIC_SUPABASE_ANON_KEY)");
  console.error(`Missing env var(s): ${missing.join(", ")}`);
  console.error(
    `These were looked up in the shell/process environment after loading ${path.resolve(
      __dirname,
      "..",
      ".env"
    )} — check that file has the right names and no typos.`
  );
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

// CSV column name -> DB column name
const FIELD_MAP = {
  study_partner: "requires_study_partner",
  imaging_required: "requires_imaging",
  lumbar_puncture_required: "requires_lumbar_puncture",
  cognitive_scale: "cognitive_scale",
} as const;

type CsvField = keyof typeof FIELD_MAP;

// cognitive_scale is free text (a scale name like "MMSE" or "MoCA"), not one
// of the four state words below — it gets its own comparison logic instead
// of the per-value precision/recall table.
const STATE_FIELDS = [
  "study_partner",
  "imaging_required",
  "lumbar_puncture_required",
] as const satisfies readonly CsvField[];

const POSSIBLE_VALUES = [
  "required",
  "not required",
  "not mentioned",
  "cannot tell",
] as const;
type PossibleValue = (typeof POSSIBLE_VALUES)[number];

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface GoldRow {
  nct_id: string;
  [key: string]: string;
}

interface DbRow {
  nct_id: string;
  requires_study_partner: string | null;
  requires_imaging: string | null;
  requires_lumbar_puncture: string | null;
  cognitive_scale: string | null;
}

interface Counts {
  tp: number;
  fp: number;
  fn: number;
}

// Outcome buckets for a free-text field like cognitive_scale, compared by
// case-insensitive exact string match rather than against a fixed value set.
interface ScaleCounts {
  total: number;
  bothEmpty: number; // neither gold nor db named a scale
  exactMatch: number; // both named the same set of scales
  partialMatch: number; // both named scales and at least one is shared
  mismatch: number; // both named scales and none are shared
  goldOnly: number; // gold named a scale, db returned none
  dbOnly: number; // db named a scale, gold expected none
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function normalize(value: string | null | undefined): string {
  return (value ?? "").trim().toLowerCase();
}

/**
 * Minimal dependency-free CSV parser. Handles the common cases:
 * quoted fields, commas inside quotes, escaped "" quotes, and both
 * \n and \r\n line endings. Not a full RFC 4180 implementation (e.g.
 * it assumes each record fits on the lines it's given), but sufficient
 * for a straightforward gold-standard label file.
 */
function parseCsv(raw: string): string[][] {
  const rows: string[][] = [];
  let row: string[] = [];
  let field = "";
  let inQuotes = false;

  const text = raw.replace(/\r\n/g, "\n");

  for (let i = 0; i < text.length; i++) {
    const char = text[i];
    const next = text[i + 1];

    if (inQuotes) {
      if (char === '"' && next === '"') {
        field += '"';
        i++;
      } else if (char === '"') {
        inQuotes = false;
      } else {
        field += char;
      }
      continue;
    }

    if (char === '"') {
      inQuotes = true;
    } else if (char === ",") {
      row.push(field);
      field = "";
    } else if (char === "\n") {
      row.push(field);
      rows.push(row);
      row = [];
      field = "";
    } else {
      field += char;
    }
  }

  // Flush the last field/row if the file doesn't end with a newline.
  if (field.length > 0 || row.length > 0) {
    row.push(field);
    rows.push(row);
  }

  return rows.filter((r) => !(r.length === 1 && r[0] === ""));
}

function loadGoldStandard(csvPath: string): GoldRow[] {
  const raw = fs.readFileSync(csvPath, "utf-8");
  const rows = parseCsv(raw);
  if (rows.length === 0) return [];

  const header = rows[0].map((h) => h.trim());
  const records: GoldRow[] = rows.slice(1).map((row) => {
    const record: GoldRow = { nct_id: "" };
    header.forEach((key, idx) => {
      record[key] = (row[idx] ?? "").trim();
    });
    return record;
  });

  return records;
}

async function loadDbRows(): Promise<DbRow[]> {
  const columns = ["nct_id", ...Object.values(FIELD_MAP)].join(", ");
  const { data, error } = await supabase.from(TABLE_NAME).select(columns);
  if (error) {
    throw new Error(`Supabase query failed: ${error.message}`);
  }
  return (data ?? []) as unknown as DbRow[];
}

/**
 * Compute precision/recall inputs per possible value for a single field.
 * "Predicted" = database value, "Actual" = gold-standard (CSV) value.
 *
 *   TP = db == v AND gold == v
 *   FP = db == v AND gold != v
 *   FN = db != v AND gold == v
 */
function computeCounts(
  pairs: Array<{ gold: string; db: string }>
): Record<PossibleValue, Counts> {
  const counts = {} as Record<PossibleValue, Counts>;
  for (const v of POSSIBLE_VALUES) {
    counts[v] = { tp: 0, fp: 0, fn: 0 };
  }

  for (const { gold, db } of pairs) {
    for (const v of POSSIBLE_VALUES) {
      const dbIsV = db === v;
      const goldIsV = gold === v;
      if (dbIsV && goldIsV) counts[v].tp++;
      else if (dbIsV && !goldIsV) counts[v].fp++;
      else if (!dbIsV && goldIsV) counts[v].fn++;
    }
  }

  return counts;
}

/**
 * Compare a free-text field (cognitive_scale). The gold standard writes
 * "not mentioned" (or "not specified") when no scale is named, and lists
 * several scales separated by ";" when there are several. So the comparison
 * treats those placeholders as empty and compares the two sides as sets of
 * scale names rather than as one exact string.
 */
const EMPTY_SCALE_WORDS = new Set(["", "not mentioned", "not specified", "none", "n/a", "null"]);

function scaleSet(value: string): Set<string> {
  const v = value.trim().toLowerCase();
  if (EMPTY_SCALE_WORDS.has(v)) return new Set();
  return new Set(
    v
      .split(/[;,/]|\band\b/)
      .map((t) => t.replace(/[^a-z0-9]+/g, ""))
      .filter((t) => t.length > 0)
  );
}

function computeScaleCounts(pairs: Array<{ gold: string; db: string }>): ScaleCounts {
  const counts: ScaleCounts = {
    total: pairs.length,
    bothEmpty: 0,
    exactMatch: 0,
    partialMatch: 0,
    mismatch: 0,
    goldOnly: 0,
    dbOnly: 0,
  };

  for (const { gold, db } of pairs) {
    const g = scaleSet(gold);
    const d = scaleSet(db);
    const overlap = [...g].filter((t) => d.has(t)).length;

    if (g.size === 0 && d.size === 0) counts.bothEmpty++;
    else if (g.size === 0) counts.dbOnly++;
    else if (d.size === 0) counts.goldOnly++;
    else if (overlap === g.size && overlap === d.size) counts.exactMatch++;
    else if (overlap > 0) counts.partialMatch++;
    else counts.mismatch++;
  }

  return counts;
}

function precisionOf(c: Counts): number | null {
  const denom = c.tp + c.fp;
  return denom === 0 ? null : c.tp / denom;
}

function recallOf(c: Counts): number | null {
  const denom = c.tp + c.fn;
  return denom === 0 ? null : c.tp / denom;
}

function formatPct(n: number | null): string {
  return n === null ? "n/a" : `${(n * 100).toFixed(1)}%`;
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

async function main() {
  console.log(`Reading gold standard from ${CSV_PATH} ...`);
  const goldRows = loadGoldStandard(CSV_PATH);
  console.log(`Loaded ${goldRows.length} gold-standard rows.`);

  console.log(`Fetching criteria from Supabase table "${TABLE_NAME}" ...`);
  const dbRows = await loadDbRows();
  console.log(`Loaded ${dbRows.length} database rows.`);

  const dbByNctId = new Map<string, DbRow>();
  for (const row of dbRows) {
    dbByNctId.set(normalize(row.nct_id), row);
  }

  const matched: Array<{ nctId: string; gold: GoldRow; db: DbRow }> = [];
  const unmatchedNctIds: string[] = [];

  for (const goldRow of goldRows) {
    const nctId = normalize(goldRow.nct_id);
    const dbRow = dbByNctId.get(nctId);
    if (!dbRow) {
      unmatchedNctIds.push(goldRow.nct_id);
      continue;
    }
    matched.push({ nctId, gold: goldRow, db: dbRow });
  }

  if (unmatchedNctIds.length > 0) {
    console.warn(
      `Warning: ${unmatchedNctIds.length} nct_id(s) from the CSV had no match in Supabase: ${unmatchedNctIds.join(
        ", "
      )}`
    );
  }

  const lines: string[] = [];

  lines.push(`# Validation Report`);
  lines.push("");
  lines.push(`Generated: ${new Date().toISOString()}`);
  lines.push("");
  lines.push(`- Gold-standard rows: ${goldRows.length}`);
  lines.push(`- Database rows (table \`${TABLE_NAME}\`): ${dbRows.length}`);
  lines.push(`- Matched on \`nct_id\`: ${matched.length}`);
  lines.push(`- Unmatched (in CSV, not found in DB): ${unmatchedNctIds.length}`);
  lines.push("");
  lines.push(
    `For each field, **precision** treats the database value as the prediction and the gold-standard CSV value as ground truth; **recall** is computed against the same ground truth. Rows where a possible value never appears as either a prediction or a ground-truth value show \`n/a\`.`
  );
  lines.push("");

  for (const csvField of STATE_FIELDS) {
    const dbField = FIELD_MAP[csvField];

    const pairs = matched.map(({ gold, db }) => ({
      gold: normalize(gold[csvField]),
      db: normalize(db[dbField]),
    }));

    const counts = computeCounts(pairs);

    lines.push(`## \`${csvField}\` → \`${dbField}\``);
    lines.push("");
    lines.push(`| Value | Precision | Recall | TP | FP | FN |`);
    lines.push(`|---|---|---|---|---|---|`);

    for (const v of POSSIBLE_VALUES) {
      const c = counts[v];
      lines.push(
        `| ${v} | ${formatPct(precisionOf(c))} | ${formatPct(recallOf(c))} | ${c.tp} | ${c.fp} | ${c.fn} |`
      );
    }

    lines.push("");
  }

  // cognitive_scale is free text (a scale name), not one of the four state
  // words — scored separately as a case-insensitive exact-match comparison.
  {
    const csvField: CsvField = "cognitive_scale";
    const dbField = FIELD_MAP[csvField];

    const pairs = matched.map(({ gold, db }) => ({
      gold: normalize(gold[csvField]),
      db: normalize(db[dbField]),
    }));

    const c = computeScaleCounts(pairs);
    const expected = c.exactMatch + c.partialMatch + c.mismatch + c.goldOnly;
    const matchRateOfExpected = expected === 0 ? null : (c.exactMatch + c.partialMatch) / expected;
    const overallAgreement =
      c.total === 0 ? null : (c.exactMatch + c.partialMatch + c.bothEmpty) / c.total;

    lines.push(`## \`${csvField}\` → \`${dbField}\` (free text, set match)`);
    lines.push("");
    lines.push(
      `This field holds one or more scale names (e.g. MMSE, MoCA, CDR, ADAS-Cog) rather than one of the four state words. "not mentioned" in the gold standard counts as no scale. Each side is split into a set of scale names and the sets are compared, so "MMSE; CDR" against "CDR; MMSE" is an exact match and "MMSE; CDR" against "MMSE" is a partial match.`
    );
    lines.push("");
    lines.push(`| Metric | Count |`);
    lines.push(`|---|---|`);
    lines.push(`| Total compared | ${c.total} |`);
    lines.push(`| Both empty (no scale expected, none returned) | ${c.bothEmpty} |`);
    lines.push(`| Exact match (same set of scales) | ${c.exactMatch} |`);
    lines.push(`| Partial match (at least one scale in common) | ${c.partialMatch} |`);
    lines.push(`| Mismatch (both named scales, none in common) | ${c.mismatch} |`);
    lines.push(`| Gold named a scale, db returned none | ${c.goldOnly} |`);
    lines.push(`| Db named a scale, gold expected none | ${c.dbOnly} |`);
    lines.push("");
    lines.push(
      `- Match rate where a scale was expected (exact or partial): ${formatPct(matchRateOfExpected)} (${c.exactMatch + c.partialMatch} / ${expected})`
    );
    lines.push(`- Overall agreement (including both-empty rows): ${formatPct(overallAgreement)}`);
    lines.push("");
  }

  if (unmatchedNctIds.length > 0) {
    lines.push(`## Unmatched \`nct_id\` values`);
    lines.push("");
    lines.push(
      `These appeared in the gold-standard CSV but were not found in Supabase (excluded from the comparisons above):`
    );
    lines.push("");
    for (const id of unmatchedNctIds) {
      lines.push(`- ${id}`);
    }
    lines.push("");
  }

  fs.mkdirSync(path.dirname(REPORT_PATH), { recursive: true });
  fs.writeFileSync(REPORT_PATH, lines.join("\n"), "utf-8");
  console.log(`Wrote report to ${REPORT_PATH}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});