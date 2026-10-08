import "server-only";
import { readFile } from "node:fs/promises";
import path from "node:path";
import { parse } from "csv-parse/sync";
import { parseMarkdown, type ParsedPage } from "./markdown";
import { BY_LABEL, SECTION_TITLES, type Label, type Slug } from "./conditions";
import { hasSource } from "./sources";

const CONTENT = path.join(process.cwd(), "content");

/**
 * Reads content/conditions/<slug>.md. Fails loudly if the page does not have
 * the six agreed sections in order, or cites a source that is not in
 * src/data/nameit/sources.json, so a broken page can never be deployed.
 */
export async function getConditionPage(slug: Slug): Promise<ParsedPage> {
  const source = await readFile(path.join(CONTENT, "conditions", `${slug}.md`), "utf8");
  const page = parseMarkdown(source);
  const titles = page.sections.map((s) => s.title);
  if (titles.join("|") !== SECTION_TITLES.join("|"))
    throw new Error(`${slug}.md must have exactly these sections in order: ${SECTION_TITLES.join(", ")}. Found: ${titles.join(", ")}`);
  const missing = page.citeOrder.filter((key) => !hasSource(key));
  if (missing.length) throw new Error(`${slug}.md cites unknown sources: ${missing.join(", ")}`);
  return page;
}

export type Phrase = {
  id: string;
  phrase: string;
  conditions: Label[];
  note: string;
  group: string;
};

export const PHRASE_GROUPS: { id: string; title: string }[] = [
  { id: "air", title: "Air and burping" },
  { id: "sound", title: "Sounds" },
  { id: "stick", title: "Food getting stuck" },
  { id: "up", title: "Things coming back up" },
  { id: "breath", title: "Breath, voice and chest infections" },
  { id: "pain", title: "Pain and pressure" },
  { id: "told", title: "What I was told" },
];

/** Reads content/vocabulary.csv, the everyday phrases people use. */
export async function getPhrases(): Promise<Phrase[]> {
  const source = await readFile(path.join(CONTENT, "vocabulary.csv"), "utf8");
  const rows = parse(source, { columns: true, skip_empty_lines: true, bom: true, trim: true }) as Record<string, string>[];
  const groups = new Set(PHRASE_GROUPS.map((g) => g.id));
  return rows.map((row, i) => {
    const conditions = row.conditions.split(";").map((c) => c.trim()).filter(Boolean);
    for (const c of conditions)
      if (!(c in BY_LABEL)) throw new Error(`vocabulary.csv row ${i + 2}: unknown condition "${c}"`);
    if (!groups.has(row.group)) throw new Error(`vocabulary.csv row ${i + 2}: unknown group "${row.group}"`);
    return {
      id: `p${i}`,
      phrase: row.phrase,
      conditions: conditions as Label[],
      note: row.notes,
      group: row.group,
    };
  });
}
