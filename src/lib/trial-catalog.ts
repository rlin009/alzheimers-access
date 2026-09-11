import type { SupabaseClient } from "@supabase/supabase-js";
import type { Trial } from "./triage";

export type TrialCatalog = {
  updatedAt: string;
  entries: Record<string, { decision: string; reason: string }>;
};

/** Request bounded ID batches: Supabase's default 1,000-row cap cannot hide trials. */
export async function loadCatalogTrials(db: SupabaseClient, catalog: TrialCatalog): Promise<Trial[]> {
  const ids = Object.keys(catalog.entries).sort();
  const trials: Trial[] = [];
  for (let i = 0; i < ids.length; i += 100) {
    const { data, error } = await db.from("trials").select("*, criteria(*)")
      .in("nct_id", ids.slice(i, i + 100)).eq("status", "RECRUITING").order("nct_id");
    if (error) throw new Error("Failed to load the reviewed trial catalog.");
    trials.push(...(data ?? []) as Trial[]);
  }
  return trials;
}
