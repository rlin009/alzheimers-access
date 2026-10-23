import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync, readdirSync } from "node:fs";
import path from "node:path";
import { parse } from "csv-parse/sync";
import { parseInline, parseMarkdown } from "../src/lib/nameit/markdown";
import { CONDITIONS, SECTION_TITLES } from "../src/lib/nameit/conditions";
import sources from "../src/data/nameit/sources.json";
import attention from "../src/data/nameit/attention.json";
import delay from "../src/data/nameit/delay.json";
import trials from "../src/data/nameit/trials.json";

const root = path.join(__dirname, "..");
const labels = new Set(CONDITIONS.map((c) => c.label));

test("citations attach to the word before them and split on semicolons", () => {
  const nodes = parseInline("It works [@a; @b].");
  assert.deepEqual(nodes, [
    { type: "text", text: "It works" },
    { type: "cite", keys: ["a", "b"] },
    { type: "text", text: "." },
  ]);
});

test("bold, italic and links are read", () => {
  const nodes = parseInline("**From A-CPD.** See *this* [site](https://noburp.info/).");
  assert.equal(nodes[0].type, "strong");
  assert.ok(nodes.some((n) => n.type === "em"));
  assert.ok(nodes.some((n) => n.type === "link" && n.href === "https://noburp.info/"));
});

test("sections, lists and citation order are parsed", () => {
  const page = parseMarkdown("---\nslug: x\n---\n\n## One\n\nText [@b].\n\n- item [@a]\n- item two\n\n## Two\n\nMore [@b].\n");
  assert.equal(page.meta.slug, "x");
  assert.deepEqual(page.sections.map((s) => s.title), ["One", "Two"]);
  assert.equal(page.sections[0].blocks[1].type, "ul");
  assert.deepEqual(page.citeOrder, ["b", "a"]);
});

test("every condition page has the six sections and only known sources", () => {
  const files = readdirSync(path.join(root, "content", "conditions"));
  assert.equal(files.length, CONDITIONS.length);
  for (const c of CONDITIONS) {
    const page = parseMarkdown(readFileSync(path.join(root, "content", "conditions", `${c.slug}.md`), "utf8"));
    assert.deepEqual(page.sections.map((s) => s.title), [...SECTION_TITLES], c.slug);
    for (const key of page.citeOrder) assert.ok(key in sources, `${c.slug} cites unknown source ${key}`);
    assert.ok(page.citeOrder.length >= 8, `${c.slug} should cite its sources`);
  }
});

test("condition pages contain no em dashes", () => {
  for (const c of CONDITIONS) {
    const text = readFileSync(path.join(root, "content", "conditions", `${c.slug}.md`), "utf8");
    assert.ok(!text.includes("—"), `${c.slug} has an em dash`);
  }
});

test("the vocabulary uses known conditions and marks overlaps", () => {
  const rows = parse(readFileSync(path.join(root, "content", "vocabulary.csv"), "utf8"), {
    columns: true,
    skip_empty_lines: true,
  }) as Record<string, string>[];
  assert.ok(rows.length >= 40);
  let overlaps = 0;
  for (const r of rows) {
    const conds = r.conditions.split(";").map((s) => s.trim());
    for (const c of conds) assert.ok(labels.has(c as never), `unknown condition ${c}`);
    if (conds.length > 1) overlaps++;
    assert.ok(r.evidence.length > 0, `"${r.phrase}" has no evidence`);
  }
  assert.ok(overlaps >= 10);
});

test("attention data covers every condition and year", () => {
  for (const l of labels) {
    const rows = attention.rows.filter((r) => r.condition === l);
    assert.equal(rows.length, attention.lastYear - attention.firstYear + 1, l);
    const sum = rows.reduce((a, r) => a + r.paper_count, 0);
    const all = attention.allTime[l as keyof typeof attention.allTime];
    const before = attention.before1990[l as keyof typeof attention.before1990];
    // per-year counts can miss a handful of papers with no year
    assert.ok(Math.abs(all - before - sum) <= 5, `${l}: ${all} - ${before} vs ${sum}`);
  }
});

test("every delay number and every trial points somewhere real", () => {
  for (const c of delay.conditions) {
    assert.ok(labels.has(c.condition as never));
    for (const r of c.rows) assert.ok(r.source in sources, r.source);
  }
  for (const t of trials.trials) {
    assert.match(t.nctId, /^NCT\d{8}$/);
    assert.ok(t.summary.length > 20);
    for (const l of t.conditions) assert.ok(labels.has(l as never), l);
  }
});
