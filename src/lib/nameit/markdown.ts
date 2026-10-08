// A deliberately small markdown reader for the condition pages in
// content/conditions/. It understands only what those files use:
//   ## headings, paragraphs, "- " lists, **bold**, *italic*,
//   [links](https://...) and citations written as [@key] or [@key1; @key2].
// Keeping it small means every page renders the same way and a citation to a
// source that does not exist fails the build instead of shipping.

export type Inline =
  | { type: "text"; text: string }
  | { type: "strong"; children: Inline[] }
  | { type: "em"; children: Inline[] }
  | { type: "link"; href: string; children: Inline[] }
  | { type: "cite"; keys: string[] };

export type Block =
  | { type: "p"; content: Inline[] }
  | { type: "ul"; items: Inline[][] };

export type Section = { id: string; title: string; blocks: Block[] };

export type ParsedPage = {
  meta: Record<string, string>;
  sections: Section[];
  /** Citation keys in the order they first appear on the page. */
  citeOrder: string[];
};

const INLINE =
  /\*\*(.+?)\*\*|\[@([^\]]+)\]|\[([^\]]+)\]\((https?:\/\/[^)\s]+)\)|\*(.+?)\*/g;

export function parseInline(text: string): Inline[] {
  const out: Inline[] = [];
  let last = 0;
  for (const m of text.matchAll(INLINE)) {
    const index = m.index ?? 0;
    if (index > last) out.push({ type: "text", text: text.slice(last, index) });
    if (m[1] !== undefined) out.push({ type: "strong", children: parseInline(m[1]) });
    else if (m[2] !== undefined) {
      // a citation hugs the word before it: drop the space in "swallow [@x]"
      const prev = out[out.length - 1];
      if (prev && prev.type === "text") prev.text = prev.text.replace(/\s+$/, "");
      out.push({
        type: "cite",
        keys: m[2].split(";").map((k) => k.trim().replace(/^@/, "")).filter(Boolean),
      });
    }
    else if (m[3] !== undefined) out.push({ type: "link", href: m[4], children: parseInline(m[3]) });
    else if (m[5] !== undefined) out.push({ type: "em", children: parseInline(m[5]) });
    last = index + m[0].length;
  }
  if (last < text.length) out.push({ type: "text", text: text.slice(last) });
  return out;
}

export function slugify(title: string): string {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

function collectCites(inlines: Inline[], into: string[]) {
  for (const node of inlines) {
    if (node.type === "cite") {
      for (const key of node.keys) if (!into.includes(key)) into.push(key);
    } else if ("children" in node) collectCites(node.children, into);
  }
}

export function parseMarkdown(source: string): ParsedPage {
  const text = source.replace(/\r\n/g, "\n");
  const meta: Record<string, string> = {};
  let body = text;
  const front = text.match(/^---\n([\s\S]*?)\n---\n/);
  if (front) {
    for (const line of front[1].split("\n")) {
      const kv = line.match(/^([\w-]+):\s*(.*)$/);
      if (kv) meta[kv[1]] = kv[2].trim();
    }
    body = text.slice(front[0].length);
  }

  const sections: Section[] = [];
  let current: Section | null = null;
  let paragraph: string[] = [];
  let list: string[] | null = null;

  const flush = () => {
    if (!current) return;
    if (paragraph.length) {
      current.blocks.push({ type: "p", content: parseInline(paragraph.join(" ")) });
      paragraph = [];
    }
    if (list) {
      current.blocks.push({ type: "ul", items: list.map(parseInline) });
      list = null;
    }
  };

  for (const raw of body.split("\n")) {
    const line = raw.trimEnd();
    const heading = line.match(/^##\s+(.+)$/);
    if (heading) {
      flush();
      current = { id: slugify(heading[1]), title: heading[1].trim(), blocks: [] };
      sections.push(current);
      continue;
    }
    if (!current) continue;
    if (line.trim() === "") {
      flush();
      continue;
    }
    const item = line.match(/^-\s+(.+)$/);
    if (item) {
      if (paragraph.length) flush();
      list = list ?? [];
      list.push(item[1]);
      continue;
    }
    if (list) flush();
    paragraph.push(line.trim());
  }
  flush();

  const citeOrder: string[] = [];
  for (const section of sections)
    for (const block of section.blocks) {
      if (block.type === "p") collectCites(block.content, citeOrder);
      else for (const item of block.items) collectCites(item, citeOrder);
    }

  return { meta, sections, citeOrder };
}
