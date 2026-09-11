import "server-only";
import { readFile } from "node:fs/promises";
import path from "node:path";
import { parse } from "csv-parse/sync";
export type SupportProvider = {
  name: string;
  area: string;
  phone: string;
  website: string;
  checked: string;
  method: string;
  category: string;
};
const categories: Record<string, string> = {
  "Support Group": "caregiver-support",
  "Adult Day Care Facility": "adult-day",
  "Adult Day Services": "adult-day",
  "Medical Care Facility": "medical-care",
  "Legal Aid Organization": "legal-help",
  "Regional Agency Office": "finding-care",
  "County Human Services Agency": "finding-care",
};
export async function getSupportProviders(): Promise<SupportProvider[]> {
  const source = await readFile(
    path.join(process.cwd(), "docs", "services-listings.csv"),
    "utf8",
  );
  const rows = parse(source, {
    columns: true,
    skip_empty_lines: true,
    bom: true,
  }) as Record<string, string>[];
  const seen = new Set<string>();
  return rows
    .filter((row) => {
      if (
        !/^\d{4}-\d{2}-\d{2}$/.test(row.verified_date) ||
        !row.verification_method ||
        row.phone_type !== "direct" ||
        row.serves_dementia !== "true" ||
        row.service_area !== "Charlotte NC area"
      )
        return false;
      const key = [row.name, row.phone, row.website, row.service_area]
        .join("|")
        .toLowerCase();
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    })
    .map((row) => ({
      name: row.name,
      area: "Charlotte, NC area",
      phone: row.phone,
      website: row.website,
      checked: row.verified_date,
      method:
        row.verification_method === "phone call"
          ? "by phone"
          : row.verification_method.includes("website")
            ? "against the organization’s website"
            : row.verification_method,
      category: categories[row.type] || "other",
    }))
    .sort(
      (a, b) =>
        (a.category === "finding-care" ? 0 : 1) -
          (b.category === "finding-care" ? 0 : 1) ||
        a.name.localeCompare(b.name),
    );
}
