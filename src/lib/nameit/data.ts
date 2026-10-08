import attention from "@/data/nameit/attention.json";
import delay from "@/data/nameit/delay.json";
import trials from "@/data/nameit/trials.json";
import type { Label } from "./conditions";

export type AttentionRow = { condition: Label; pub_year: number; paper_count: number };

export const ATTENTION = attention as unknown as {
  fetched: string;
  source: string;
  firstYear: number;
  lastYear: number;
  partialYear: number;
  queries: Record<Label, string>;
  allTime: Record<Label, number>;
  before1990: Record<Label, number>;
  originalQueryTotals1990to2026: Record<Label, number>;
  rows: AttentionRow[];
};

export type DelayRow = {
  measure: string;
  value: string;
  n: number;
  design: string;
  source: string;
  caveat: string;
};

export const DELAY = delay as unknown as {
  note: string;
  searched: { query: string; papers: Record<Label, number>; uniquePapers: number; alsoRead: string };
  conditions: {
    condition: Label;
    builtToMeasure: number;
    headline: string;
    headlineDetail: string;
    rows: DelayRow[];
  }[];
};

export type Trial = {
  nctId: string;
  title: string;
  summary: string;
  conditions: Label[];
  status: "RECRUITING" | "NOT_YET_RECRUITING";
  studyType: "INTERVENTIONAL" | "OBSERVATIONAL";
  phases: string[];
  enrollment: number | null;
  minAge: string | null;
  maxAge: string | null;
  sponsor: string;
  siteCount: number;
  sites: string[];
  countries: string[];
  lastUpdate: string;
  url: string;
};

export const TRIALS = trials as unknown as { fetched: string; source: string; trials: Trial[] };

export function trialsFor(label: Label): Trial[] {
  return TRIALS.trials.filter((t) => t.conditions.includes(label));
}

/** "8 October 2026" from "2026-10-08". */
export function longDate(iso: string): string {
  const [y, m, d] = iso.split("-").map(Number);
  const months = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
  return `${d} ${months[m - 1]} ${y}`;
}
