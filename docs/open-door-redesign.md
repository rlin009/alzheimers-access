# Refined Open Door redesign

The approved design is implemented in the existing Next.js product. Routes: `/`, `/start`, `/results`, `/support`, `/how-it-works`, and `/privacy`.

## Run locally

```powershell
npm ci
npm run dev -- --hostname 127.0.0.1 --port 3100
```

Keep `NEXT_PUBLIC_SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY` in the ignored `.env.local`. The service role is used only on the server. Do not commit or expose it.

## Product behavior

The six-question native form remains preferable to a Tally embed here: all questions are optional, answers feed the existing trial sort directly, and editing/restoring answers stays within the same accessible interface. No Tally account or integration is required.

Results use the existing triage logic and real stored trials. Search, list expansion, additional records, answer review, and editing work. Official ClinicalTrials.gov links remain prominent in all groups. Editing produces a new result link while the old link keeps its original answers.

The local-support directory reads verified entries from `docs/services-listings.csv`, deduplicates them, and states its Charlotte/Mecklenburg coverage. It provides real phone and website links and an honest out-of-area state.

The new typography is self-hosted DM Sans. Illustration assets are in `public/images`. Generated source PNGs are retained alongside the optimized hero WebP. Global analytics was removed from the layout to avoid tracking private result URLs.

## Validation

Use `npm test`, `npx eslint src tests`, and `npm run build`. The project-wide lint command has existing errors in the trial import script. See `../design-qa.md` for browser evidence, responsive checks, and testing limits.

## Before publishing

The Supabase trial table includes unrelated studies. This pre-existing import/data-quality problem needs correction independently of the visual redesign. No trial records or sorting algorithm were changed as part of this work.

Actual 200% browser zoom still needs a manual check; 375px and 720px reflow checks passed. The implementation has not been deployed.

The trial relevance issue noted above was addressed in the September 11 follow-up. See `trial-relevance-fix.md` for the refreshed catalog, audit evidence, backup location, and deployment requirement.
