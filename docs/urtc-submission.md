MIT URTC POSTER SUBMISSION FIELDS:

Title: 

Abstract(10000 characters):

Subject IS(Choose one):

- Technology of Automation
- Technology of Computation
- Technology of Engineering
- Technology of Exploration
- Technology of Humanity
- Technology of Logic
- Technology of Networks
- Technology of Sustainability

Can upload a file(100 Mb) --> Perhaps a file of the abstract

Lastly, agree to the terms and conditions

---

Draft:

Alzheimer's clinical trials are chronically under-enrolled: in 2025, roughly 50,000 participants were needed to fully enroll active trials, but only about 11,000 people did so that year (USC Schaeffer Center, 2026). For families facing an Alzheimer's diagnosis, a clinical trial can represent one of the only options for treatment beyond standard care. A caregiver trying to read a trial's eligibility criteria encounters clinical jargon, including terms like lumbar puncture or cognitive score thresholds. Without a way to understand the information, they often give up on trials they may have qualified for, or never find out whether their family member is eligible at all. This raises the question: have Alzheimer's clinical trial eligibility requirements changed over the past twenty years, and specifically, has the requirement for a study partner grown more common?

To address this, I pulled every Alzheimer's and dementia trial from [ClinicalTrials.gov](http://ClinicalTrials.gov) (6,842 total), verifying the count against the registry's own total. After reading twenty real eligibility sections by hand, I built a criteria schema requiring three states for every field: found, explicitly not required, and not mentioned, since if a trial doesn't mention a requirement, that's different from the pipeline failing to read it. I hand-labeled forty trials before running any automated extraction, then built a pipeline using a language model to convert eligibility text into structured fields, including whether a study partner, imaging, or a lumbar puncture is required. Validating this extraction against the hand labels, computing precision and recall separately per field, surfaced a real error: the cognitive_scale field had been constrained to the same four state-words as the others, when it should have held the actual scale name (MMSE, MoCA, CDR). I corrected this and re-validated before trusting the field. Using only fields that met a precision threshold, I built a reproducible historical sample of 150 trials per five-year band from 2005 to 2025, and computed per-band statistics on the same requirements.

Among currently recruiting trials, 28.0 percent explicitly require a study partner, 4.9 percent explicitly state one is not required, and 67.1 percent say nothing about it either way, out of 968 trials (precision 100 percent, recall 83 percent against forty hand-labeled trials, meaning every trial flagged as requiring a partner truly did, though the parser likely missed some real cases, so the true share may be somewhat higher). The interesting number here is not the 28.0 percent. It is the 67.1 percent: two out of every three currently recruiting listings give a family no way to know, from the public registry alone, whether the person they are caring for even qualifies to ask.

Across five-year bands from 2005 to 2025, the study partner requirement measured 30.7, 37.3, 33.3, and 28.0 percent. At a sample size of 150 trials per band, a single band's percentage carries a margin of error of roughly 7 points, and a difference between two bands has to exceed roughly 11 points before it means anything. The largest gap here, between 2010 to 2014 and 2020 to 2025, is 9.3 points, short of that threshold. The honest finding is that no change in the study partner requirement was detected over twenty years, not that one rose or fell.

One measurement needed no parsing at all: the median length of a trial's eligibility text, taken directly from the raw string. That length grew from 899.5 characters in the earliest band to 1,061, 1,088, and 1,034 characters in the three that followed, a sustained increase that holds up regardless of whether the language model extracted anything correctly. Eligibility criteria have gotten measurably longer over twenty years even where the specific requirements this study measured have not detectably changed, which is itself worth noting: trials are asking for more information from applicants without necessarily becoming more restrictive in the ways tracked here.

The requirement that most determines whether a family can participate at all is the one nobody has been counting, and it did not need a novel method to count it. It needed reading the eligibility text that every trial already publishes, at scale, and reporting the result honestly, including where the result is a null one. This analysis now underlies a public tool that surfaces these requirements in plain language so families do not have to parse clinical text themselves.

