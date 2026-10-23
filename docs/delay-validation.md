# Delay validation: why no model was used, and what is published

## What the plan said

Step 2 planned to run a Haiku extractor over about 40 papers, hand-label 10 first, and publish only fields that reached 0.95 precision on at least 10 examples.

## What actually came back

The search (each condition's terms AND "diagnostic delay" OR "time to diagnosis" OR "misdiagnosis" OR "misdiagnosed", PubMed only) returned **389 different papers**, not 40:

| Condition | Papers |
|---|---|
| Achalasia | 256 |
| Spasm | 82 |
| Zenker's | 66 |
| A-CPD | 19 |
| R-CPD | 8 |

Some papers match two conditions, so the rows add up to 431. Most are single case reports, where every delay field is "not applicable".

Two problems with the first `delay_papers` table, both now fixed:

- The table was keyed on `pmid` alone, so a paper that matched two conditions kept only the last condition's label. R-CPD showed 5 papers instead of 8. The key is now `(pmid, condition)` and the table holds 434 rows.
- About 116 search results had no PubMed ID. They were conference abstract books and one preprint, not papers, so leaving them out was correct.

## Why reading by hand instead of a model

Fewer than 20 of the 389 abstracts report a delay number at all. A model run over all 389 would have spent most of its effort confirming "not applicable" on case reports, and the 10-example precision rule could never be met for fields that appear in only a handful of papers.

So every abstract with a number near the delay words was read by hand, plus every one of the 89 R-CPD abstracts, which were searched for symptom-onset and self-diagnosis numbers. Each number on the site was copied from the abstract and then checked against it a second time.

## What is published

| Field | Published | Why |
|---|---|---|
| Delay, achalasia | Yes | Six studies built to measure it, n = 87 to 345 |
| Self-diagnosed, R-CPD | Yes | 5 studies within a systematic review (about 450 people) and one clinic series (n = 106) agree it is the large majority |
| Onset age vs diagnosis age, R-CPD | Yes, with its caveat | One clinic series (n = 106). Two averages, not a measured wait |
| Misdiagnosed first, achalasia | Yes | 42% (26% once, 16% more than once; n = 300), mostly as reflux |
| A doctor said it was reflux, R-CPD | Yes, labelled as a survey | Online survey, self-reported (n = 207) |
| Symptom duration, A-CPD, Zenker's, spasm | Shown, labelled as not a delay study | Side notes in treatment series, n = 7 to 40 |
| Delay, A-CPD, Zenker's, spasm | No | Nobody has measured it. Left empty on purpose |

The full table with sources is in `src/data/nameit/delay.json` and on the evidence page. `docs/delay-analysis.md` has the finding in words.
