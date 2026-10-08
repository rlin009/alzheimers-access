# Open Door implementation — design QA

final result: passed

Scope: visual fidelity and implemented product interactions. This is not a clinical-data accuracy assessment or a release approval. Existing unrelated trial records require a separate data-quality fix before publication.

## Comparison target and evidence

Source truth: `design-directions/full-product/refined-open-door/home.png` (1536 × 1024), `results.png` (1536 × 1024), and `supporting-pages.png` (1024 × 1536), with `REFINEMENT.md`.

Implementation: http://127.0.0.1:3100/ in the in-app browser. Home, start, results, support, how-it-works, and privacy use the approved Open Door system.

Final unstitched browser captures in `design-directions/implementation-qa/`:

- `home-desktop-viewport.png`: 1440 × 1600 pixels, CSS viewport 1440 × 1600.
- `results-desktop-viewport.png`: 1440 × 2900 pixels, CSS viewport 1440 × 2900; live results, first two groups open and third closed.
- `home-phone-viewport.png`: 375 × 2198 pixels, CSS viewport 375 × 2200.
- `form-phone-viewport.png`: 375 × 2598 pixels, CSS viewport 375 × 2600; blank optional form.

Mobile capture has a two-pixel browser capture discrepancy in height. Width remains 1:1. Tall viewports avoid the browser's stitched-full-page screenshot defect. Older screenshots without the `viewport` suffix are superseded and are not final composition evidence. Tall viewports can add whitespace before the footer because the page fills its viewport.

Full-view composites inspected together: `home-full-comparison.png`, `home-phone-comparison.png`, `results-comparison.png`, and `form-comparison.png`. Focused composite: `hero-comparison.png`. `compare.py` crops the source frames and rescales both sides to equal comparison widths; it does not alter product assets. These are composition comparisons, not pixel-equivalence claims: the source is a raster design board with compressed content, while the implementation uses readable CSS text and live records.

## Findings and comparison history

- Resolved P2: hero background seam. Matched the hero container to the generated image background, #2b3063. Final hero composite shows an integrated surface.
- Resolved P2: awkward desktop headline wrapping. Adjusted grid allocation and headline line groups. Final hero composite preserves the reference's three-line structure.
- Resolved P2: links lost their underline through CSS reset. Explicit link styles restore visible text affordances; buttons, logo, and navigation retain their intended treatment.
- Resolved P2: duplicated support listing caused duplicate React keys. Deduplicated verified source rows. Corrected verification labels so website checks are not described as phone checks; singular result counts are grammatical.
- Capture issue, not product defect: stitched full-page screenshots duplicated and rescaled content. Replaced final evidence with single-viewport captures, then regenerated and inspected all comparison composites.

No remaining actionable P0/P1/P2 visual findings in the implemented scope.

## Required fidelity surfaces

- Typography: self-hosted DM Sans Variable is loaded, with Arial fallback. Body and helper text are at least 18px; headings remain bold and readable without truncation. The phone page is longer than the compressed mock because its text and controls meet the explicit size requirements.
- Layout: indigo hero, rounded panels, three concise next steps, restrained support row, simple FAQ, and decorative footer preserve the chosen direction. Desktop uses a wider content frame; prose and trial text retain constrained reading lengths. Phone content stacks in reading order.
- Colors: warm off-white, indigo, lilac, and butter-yellow actions match the approved palette. All three trial groups receive the same neutral treatment; labels and counts communicate sorting without a color verdict.
- Images and icons: generated family-care illustration, house, heading wave, and footer sprig are real raster assets. They retain the Open Door illustration style, with proportional image sizing. Icons come from Phosphor. No handcrafted illustration substitutes are used.
- Copy: required home text, optional-question framing, the full results caution, prominent official links, and neutral sorting labels are retained. Explanations reflect current algorithm limits. Site labels do not claim geographic distance calculations that the backend cannot provide.

## Interaction and accessibility checks

- Real Supabase save-and-results flow passed for completely blank answers and a subsequent location-only edit. Existing answers prefill; updating creates a fresh result link.
- Search for UAB returned matching real records; clear restored the lists. Each group exposes its count, expandable content, and additional records. Probably not retains plain reasons and official links.
- Mobile navigation, FAQ keyboard activation, support category filtering, out-of-coverage feedback, invalid result link recovery, and invalid API payload handling passed.
- All six routes checked at 375px: no horizontal overflow; visible primary/footer tap targets at least 44px. Labels and helpers are associated with native inputs. Skip link, focus styles, and reduced-motion handling are present.
- All six routes checked at 720px, equivalent in layout width to a 1440px browser at 200% zoom. Actual browser zoom could not be changed by the in-app shortcut, so actual 200% zoom remains a manual verification item. This is not a claim of complete WCAG conformance.
- Browser error log checked after fixes: only the historical duplicate-support-key warning from 19:43:22 remained; no newer errors appeared during final navigation and results checks.

## Engineering verification and release notes

- Production build passed, including TypeScript.
- `npm test`: five meaningful profile validation/prefill tests passed.
- `npx eslint src tests`: passed. Full `npm run lint` still reports pre-existing issues in `scripts/fetch-trials.ts` (two explicit-any errors and an unused variable warning).
- The current trial table contains unrelated studies, including perinatal mental health and behavioral research. Do not treat the redesign as resolving this data-import issue. No studies were silently filtered by title, and no database cleanup was performed.
- Support currently covers seven unique verified Charlotte/Mecklenburg organizations from the repository CSV; the interface states that coverage explicitly.
- Two non-sensitive test profile rows were created: a blank profile and a Charlotte, NC location-only profile. No real health answers were entered.

## Implementation checklist

- [x] Implement approved visuals in the existing Next.js app.
- [x] Connect the native optional survey to real saving, editing, and results.
- [x] Verify core interactions and responsive layouts.
- [x] Compare source and implementation together after fixes.
- [ ] Before publication: investigate and correct unrelated imported trial records.
- [ ] Before publication: manually verify actual 200% zoom in a browser that supports it.

Follow-up polish: none required for visual acceptance. No deployment, commit, or push was performed.

## September 11 follow-up: trial relevance corrected

The pre-existing unrelated-trial release concern described above has been addressed in the updated importer and active catalog. See `docs/trial-relevance-fix.md` and `docs/trial-scope-audit.json` for the applied refresh, recoverable backups, remaining uncertainty handling, and regression checks. Project-wide lint now passes after the importer rewrite. The new catalog filter is implemented locally and has not been deployed to the public site. Actual 200% zoom remains the earlier manual testing item.

## October 8: Free the Burp visual alignment

final result: passed

Scope: align the existing Free the Burp interface with Alzheimer's Access while preserving its content, navigation, symptom picker, results, and five-condition anatomy diagram. The user's two supplied screenshots supersede earlier proposals to restructure the experience. This is a scoped visual acceptance, not a complete accessibility or clinical review.

Reference: the supplied current-site screenshots and a fresh capture of https://alzheimers-access.vercel.app/. Local implementation: http://localhost:3000/free-the-burp. Compared the main-site reference and implemented desktop capture together at 1265 × 713 pixels. Kept the R-CPD page's existing two-column composition intentionally.

Evidence is saved outside the repository under `C:/AA_Whetstone/audits/rcpd-design-research-2026-10-08/`:

- `10-alzheimers-style-reference.jpg`: live main-site desktop reference.
- `12-restyle-desktop.jpg`: implemented desktop homepage.
- `13-restyle-picker.jpg`: filtered and selected symptom, result, and highlighted anatomy.
- `14-restyle-mobile.jpg`: implemented mobile homepage.
- `15-restyle-condition-mobile.jpg`: mobile R-CPD article.

Desktop captures are 1265 × 713. The requested mobile viewport was 390 × 844; the browser's effective content width was 375 CSS pixels and its captured image was 375 × 812. The measured document width and scroll width both equaled 375, with no horizontal overflow.

Five fidelity surfaces:

- Typography: DM Sans replaces Archivo for display text; headings, navigation, and fact labels share the main site's type family. Technical research labels retain their existing monospace treatment.
- Layout: the existing finder, diagram, reading order, and article structure remain. Indigo hero padding and rounded corners echo the main site without adopting a different flow.
- Colors: cream page, indigo text and hero, lavender anatomy panel, and butter selection accent align the sites. Orange anatomy pressure highlights retain their existing meaning.
- Images and icons: the user's existing interactive anatomy SVG and small wordmark icon remain; no replacement illustration or new generated asset was introduced.
- Copy: headings, explanations, safety guidance, results, and navigation labels are unchanged.

Verification: symptom search for “burp” returned three phrases; selecting “I can't burp, and I never could” showed its selected state, R-CPD result, and diagram highlight. Clearing selection and search worked. Homepage and condition article were visually inspected on mobile. Browser error logs were empty. `npm run lint`, `npm run build`, and `git diff --check` passed.

No actionable P0–P2 visual findings remain within this restyle's checked scope. Secondary routes inherit the shared stylesheet but were not all visually rechecked in this pass. Shared alert styles are scoped under `.ni` to avoid changing Alzheimer's Access. No deployment or push was performed.
