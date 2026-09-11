# Trial relevance fix — September 11, 2026

## What changed

The former `query.cond=Alzheimer Disease OR Dementia` search included generated disease classifications. Two confirmed false positives were:

- NCT05925101: a study of destructive behavior in children ages 3–17. Its generated ancestors include "Aberrant Motor Behavior in Dementia".
- NCT07766174: a prenatal mental-health study. Its generated direct MeSH tags incorrectly include "Alzheimer Disease" even though its authored conditions and description concern perinatal mental health.

The importer now searches explicit condition, title, summary, and keyword fields. It does not search generated MeSH/ancestor classifications. A separate scope assessment controls the active catalog. Positive evidence in authored conditions/titles establishes relevance; summary-only and other contextual matches require review. Background/exclusion-only mentions cannot automatically establish relevance. Explicitly reviewed caregiver and prevention research is preserved. Unresolved relevance stays in **Can't tell**, with a visible explanation, rather than becoming Worth asking about.

Scope decisions concern what a study researches, never whether a person may participate. This is a transparent text-based check, not a clinical expert review or a guarantee of completeness. The existing family eligibility rules remain unchanged.

## Applied refresh

- Full backup: 6,865 existing trial rows, including nested parsed criteria.
- Checked against current public registry records: 1,255 studies.
- Included with relevance evidence: 981.
- Retained with an explicit relevance-uncertainty note: 92.
- Outside the active catalog: 182 (off-topic or no longer recruiting).
- Of the previous 980 displayed records, 97 were excluded for scope and 20 were no longer recruiting.
- Added 210 newly discovered or newly active records to the displayed catalog.
- Current displayed total: 1,073.
- Five changed eligibility texts had their three existing parsed requirement fields reset to `cannot tell`, preventing stale requirements from affecting the sort. Those fields can be re-parsed from the refreshed source later.
- No trial rows or family profile rows were deleted. No family profiles were read during the audit/import.

Evidence: `docs/trial-scope-audit.json` records each assessed ID, decision, reason, source hash, and reviewed excerpts where applicable. `src/data/trial-scope-reviews.json` stores the reviewed contextual decisions. Those decisions expire when their source text changes.

The recoverable pre-refresh backup and raw public registry download are in `.trial-audit/2026-09-11T20-19-43-792Z/`. The folder is ignored by Git. Keep it until the refresh is accepted. `before.json` contains old trial rows and their nested criteria; restore trial and criteria tables separately if restoration is needed. Do not blindly pass nested criteria objects into a trial upsert. Newly discovered records are additive and do not require deletion to roll back catalog membership.

## How refreshes work

```powershell
npm run trials:audit    # read-only database audit; writes local evidence and backups
npm run trials:refresh  # refresh registry rows and publish the local active catalog
```

Both load `.env.local` before `.env`. The service-role key remains server-side and ignored by Git.

Every existing recruiting record is refreshed by ID even if the narrower discovery query no longer returns it. Page counts and duplicate IDs are checked. The catalog is published only after all batches are saved and every active ID has been verified. Supabase requests for family results use batches of 100 catalog IDs, so the default 1,000-row cap cannot truncate the set.

The catalog is `src/data/trial-catalog.json`. It is versioned with the application and must be included in the next deployment after a refresh. Excluded legacy records remain in Supabase for recovery and research; the new application selects only active catalog IDs. The deployed old application will not use this filter until the updated code is deployed. No deployment was performed in this task.

This is not a database-wide transaction: an interrupted write may leave some source rows refreshed while the prior catalog remains active. Backups allow recovery, and rerunning the command completes the refresh. No automatic schedule was added.

## Validation

- Production build and project-wide ESLint pass.
- Regression tests cover the two real false positives, UAB, dementia subtypes, MCI, caregiver/prevention studies, changed review evidence, closed studies, exclusion-only mentions, more than 1,000 records, query failure, and uncertainty placement.
- Browser verified both unrelated titles return no matches, UAB still has three search matches, all 1,073 records are counted, and uncertainty notes appear in Can't tell.
- Example location-only test profile: 194 Worth asking about, 322 Can't tell, 557 Probably not.

Registry search documentation:
- https://clinicaltrials.gov/data-api/about-api/search-areas
- https://clinicaltrials.gov/find-studies/constructing-complex-search-queries
