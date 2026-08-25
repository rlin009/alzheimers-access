import { config } from "dotenv";
import { fileURLToPath } from "url";
import path from "path";

// Resolve .env relative to the project root (one level up from this
// file, since this file lives in scripts/), so it loads correctly no
// matter what directory you run the command from.
const __dirname = path.dirname(fileURLToPath(import.meta.url));
config({ path: path.resolve(__dirname, "..", ".env") });

import { createClient } from "@supabase/supabase-js";
import Anthropic from "@anthropic-ai/sdk";

// ---------------------------------------------------------------------------
// Config / setup
// ---------------------------------------------------------------------------

// Assumes these env vars exist (adjust names if yours differ):
//   SUPABASE_URL
//   SUPABASE_SERVICE_ROLE_KEY   (needs write access to the criteria table)
//   ANTHROPIC_API_KEY           (picked up automatically by the SDK)
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  console.error(
    "Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in the environment."
  );
  process.exit(1);
}

function getFlag(name: string): string | undefined {
  const args = process.argv.slice(2);
  const idx = args.indexOf(`--${name}`);
  if (idx === -1) return undefined;
  return args[idx + 1];
}

const countArg = getFlag("limit");
const modelArg = getFlag("model");

if (!countArg || !modelArg) {
  console.error("Usage: tsx scripts/parse-criteria.ts --limit <count> --model <model>");
  console.error("Example: tsx scripts/parse-criteria.ts --limit 50 --model claude-sonnet-4-6");
  process.exit(1);
}

const COUNT = Number(countArg);
if (!Number.isInteger(COUNT) || COUNT <= 0) {
  console.error(`--limit must be a positive integer, got: ${countArg}`);
  process.exit(1);
}

const MODEL = modelArg;

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
const anthropic = new Anthropic();

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type TrialState = "required" | "not required" | "not mentioned" | "cannot tell";

interface Trial {
  nct_id: string;
  eligibility_text: string;
}

interface ParsedCriteria {
  requires_study_partner: TrialState;
  cognitive_scale: TrialState;
  min_cognitive_score: number | null;
  max_cognitive_score: number | null;
  excluded_conditions: string[];
  excluded_medications: string[];
  requires_imaging: TrialState;
  requires_lumbar_puncture: TrialState;
  care_setting: string | null;
  age_requirement: string | null;
  parse_confidence: string;
}

// ---------------------------------------------------------------------------
// JSON schema for structured outputs
// ---------------------------------------------------------------------------

const STATE_ENUM = ["required", "not required", "not mentioned", "cannot tell"];

const CRITERIA_SCHEMA = {
  type: "object",
  properties: {
    requires_study_partner: { type: "string", enum: STATE_ENUM },
    cognitive_scale: { type: "string", enum: STATE_ENUM },
    min_cognitive_score: { type: ["number", "null"] },
    max_cognitive_score: { type: ["number", "null"] },
    excluded_conditions: { type: "array", items: { type: "string" } },
    excluded_medications: { type: "array", items: { type: "string" } },
    requires_imaging: { type: "string", enum: STATE_ENUM },
    requires_lumbar_puncture: { type: "string", enum: STATE_ENUM },
    care_setting: { type: ["string", "null"] },
    age_requirement: { type: ["string", "null"] },
    parse_confidence: { type: "string" },
  },
  required: [
    "requires_study_partner",
    "cognitive_scale",
    "min_cognitive_score",
    "max_cognitive_score",
    "excluded_conditions",
    "excluded_medications",
    "requires_imaging",
    "requires_lumbar_puncture",
    "care_setting",
    "age_requirement",
    "parse_confidence",
  ],
  additionalProperties: false,
} as const;

// ---------------------------------------------------------------------------
// Fetch trials that still need parsing
// ---------------------------------------------------------------------------

async function getAlreadyParsedNctIds(): Promise<Set<string>> {
  const ids = new Set<string>();
  const pageSize = 1000;
  let from = 0;

  while (true) {
    const { data, error } = await supabase
      .from("criteria")
      .select("nct_id")
      .range(from, from + pageSize - 1);

    if (error) throw error;
    if (!data || data.length === 0) break;

    for (const row of data) ids.add(row.nct_id as string);

    if (data.length < pageSize) break;
    from += pageSize;
  }

  return ids;
}

async function getTrialsToProcess(
  alreadyParsed: Set<string>,
  limit: number
): Promise<Trial[]> {
  const result: Trial[] = [];
  const pageSize = 500;
  let from = 0;

  while (result.length < limit) {
    const { data, error } = await supabase
      .from("trials")
      .select("nct_id, eligibility_text")
      .eq("status", "RECRUITING")
      .not("eligibility_text", "is", null)
      .order("nct_id", { ascending: true })
      .range(from, from + pageSize - 1);

    if (error) throw error;
    if (!data || data.length === 0) break;

    for (const row of data) {
      if (result.length >= limit) break;
      if (alreadyParsed.has(row.nct_id as string)) continue;
      result.push({
        nct_id: row.nct_id as string,
        eligibility_text: row.eligibility_text as string,
      });
    }

    if (data.length < pageSize) break;
    from += pageSize;
  }

  return result;
}

// ---------------------------------------------------------------------------
// Claude extraction
// ---------------------------------------------------------------------------

async function extractCriteria(
  eligibilityText: string
): Promise<{ parsed: ParsedCriteria; raw: unknown }> {
  const response = await anthropic.messages.create({
    model: MODEL,
    max_tokens: 1024,
    messages: [
      {
        role: "user",
        content:
          "Extract structured eligibility criteria from the following clinical trial eligibility text. " +
          "For requires_study_partner, cognitive_scale, requires_imaging, and requires_lumbar_puncture, " +
          'return exactly one of: "required", "not required", "not mentioned", "cannot tell".\n\n' +
          'Return "not mentioned" when the document says nothing about this topic at all. ' +
          'Return "cannot tell" only when the document says something about it that you cannot ' +
          "interpret clearly. These are different and must never be swapped.\n\n" +
          "requires_study_partner, cognitive_scale, requires_imaging, and requires_lumbar_puncture " +
          'must ALWAYS be one of the four strings above — never null and never omitted. If the text ' +
          'says nothing about a topic, the correct value is the string "not mentioned", not null. ' +
          "Only min_cognitive_score, max_cognitive_score, care_setting, and age_requirement may be null.\n\n" +
          "A legally authorized representative appearing in a consent clause is NOT a study partner " +
          "requirement — do not mark requires_study_partner as required on that basis alone.\n\n" +
          "Only use the eligibility text provided below. Do not infer anything from the trial title " +
          "or from general knowledge about Alzheimer's trials or this condition. If the text doesn't " +
          "say it, treat it as not mentioned (or use null for the non-state fields).\n\n" +
          `Eligibility text:\n${eligibilityText}`,
      },
    ],
    output_config: {
      format: {
        type: "json_schema",
        schema: CRITERIA_SCHEMA,
      },
    },
  });

  const textBlock = response.content.find((block) => block.type === "text");
  if (!textBlock || textBlock.type !== "text") {
    throw new Error("No text block in Claude's response.");
  }

  const parsed = JSON.parse(textBlock.text) as ParsedCriteria;

  const stateFields: (keyof ParsedCriteria)[] = [
    "requires_study_partner",
    "cognitive_scale",
    "requires_imaging",
    "requires_lumbar_puncture",
  ];

  for (const field of stateFields) {
    if (parsed[field] === null || parsed[field] === undefined) {
      console.warn(
        `Model returned null for "${field}" — coercing to "not mentioned".`
      );
      (parsed as unknown as Record<string, unknown>)[field] = "not mentioned";
    }
  }

  return { parsed, raw: response };
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

async function main() {
  console.log(`Loading already-parsed nct_ids...`);
  const alreadyParsed = await getAlreadyParsedNctIds();
  console.log(`Found ${alreadyParsed.size} trials already in criteria table.`);

  console.log(`Fetching up to ${COUNT} unparsed RECRUITING trials...`);
  const trials = await getTrialsToProcess(alreadyParsed, COUNT);
  console.log(`Got ${trials.length} trials to process with model "${MODEL}".`);

  let succeeded = 0;
  let failed = 0;

  for (let i = 0; i < trials.length; i++) {
    const trial = trials[i];
    console.log(`[${i + 1}/${trials.length}] ${trial.nct_id} - parsing...`);

    try {
      const { parsed, raw } = await extractCriteria(trial.eligibility_text);

      const { error } = await supabase.from("criteria").insert({
        nct_id: trial.nct_id,
        requires_study_partner: parsed.requires_study_partner,
        cognitive_scale: parsed.cognitive_scale,
        min_cognitive_score: parsed.min_cognitive_score,
        max_cognitive_score: parsed.max_cognitive_score,
        excluded_conditions: parsed.excluded_conditions,
        excluded_medications: parsed.excluded_medications,
        requires_imaging: parsed.requires_imaging,
        requires_lumbar_puncture: parsed.requires_lumbar_puncture,
        care_setting: parsed.care_setting,
        age_requirement: parsed.age_requirement,
        parse_confidence: parsed.parse_confidence,
        raw_response: raw,
        model: MODEL,
      });

      if (error) throw error;

      succeeded++;
      console.log(`[${i + 1}/${trials.length}] ${trial.nct_id} - done.`);
    } catch (err) {
      failed++;
      console.error(`[${i + 1}/${trials.length}] ${trial.nct_id} - FAILED:`, err);
      // Not inserted, so this trial will be retried on the next run.
    }
  }

  console.log(`\nDone. ${succeeded} succeeded, ${failed} failed.`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
