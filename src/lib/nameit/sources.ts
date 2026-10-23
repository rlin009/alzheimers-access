import sources from "@/data/nameit/sources.json";

export type Source = {
  authors: string;
  title: string;
  journal: string;
  year: number | null;
  pmid?: string;
  doi?: string | null;
  url: string;
};

const SOURCES = sources as Record<string, Source>;

export function getSource(key: string): Source {
  const source = SOURCES[key];
  if (!source) throw new Error(`Unknown source key: ${key}`);
  return source;
}

export function hasSource(key: string): boolean {
  return key in SOURCES;
}

/** "Bastian RW, Smithson ML. Title. OTO Open. 2019." */
export function formatSource(source: Source): string {
  const year = source.year ? ` ${source.year}.` : "";
  return `${source.authors}. ${source.title}. ${source.journal}.${year}`;
}

/** Short form for tables: "Mailly 2025". */
export function shortCite(key: string): string {
  const s = getSource(key);
  const first = s.authors.split(/[ ,]/)[0];
  return s.year ? `${first} ${s.year}` : first;
}
