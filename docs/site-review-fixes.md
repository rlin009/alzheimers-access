# Site review fixes — 8 October 2026

This first release addresses the 16 findings in the live-site review: urgent-symptom guidance; the spasm sham-controlled trial; swallowing-water wording; the Steele Creek emergency-department link; explicit research-count discrepancies; expanded spasm terminology and limits of the modern-name R-CPD search; diagnostic-delay claims; mobile diagram/chart readability; diagnostic overstatement; registry search scope and not-yet-recruiting labels; explanations in every Alzheimer’s trial group and marked quote fragments; medical/statistical definitions; unused onboarding fields and saved-answer deletion; creator/contact/review disclosure; results heading order; and singular phrase counts.

Free the Burp now uses normal-width Archivo headings, DM Sans text, calmer spacing and a navy/teal palette. Chart values can be read using a year selector or a complete table without an overlay obscuring the plot.

Research counts were refreshed from Europe PMC on 8 October. Broad inability-to-belch searches also return unrelated postoperative studies, so R-CPD numbers explicitly remain a modern-name search, with older reports acknowledged. Counts are search results, not a census. The source registry/medical literature may change after this review; independent clinical review has not been verified.

Production dependency patches: Next.js and its ESLint configuration 16.3.8, plus compatible transitive fixes. The remaining dependency advisory is in the development-only lint globbing chain; npm's suggested forced downgrade is not applied.

Validation: 25 automated tests, lint, production build; browser checks at desktop and 390px mobile width. No live patient records were created or deleted during testing. Deletion uses the existing private results-link capability and needs the current Supabase service key. Retention is honestly disclosed as manual deletion, with no automatic expiry.

## Deployment ownership

No deployment or Git push was performed. The private repository remains private. A Git push does not grant access to Riteesha’s Vercel team. Vercel may reject deployment for an author who is not allowed to deploy from a private repository; do not change commit authors to impersonate the owner. For two independent deployers, use a Vercel plan that supports both team members, or have Riteesha transfer the project to the account that should own deployment (and configure its Git integration, domains and environment variables). Otherwise the current owner must deploy. Confirm the production deployment succeeded in Vercel after pushing.

Public contact, approved by the user: riteesha.lingechetty@gmail.com.
