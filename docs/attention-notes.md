# Attention notes: what the paper counts mean and what was cleaned

## The first decision

After the first run, the note here said: keep the broad search terms for all five conditions, because the stray hits are small next to the totals, and narrowing could lose real papers.

That was the right instinct for achalasia, Zenker's and spasm, whose search terms are full medical phrases. It turned out to be wrong for R-CPD, so the note below replaces it.

## What the pre-2019 R-CPD rows were

R-CPD was named in 2019. The first search still found 17 R-CPD papers from before 2019:

| Year | Papers |
|---|---|
| 1992 | 1 |
| 2005 | 1 |
| 2010 | 1 |
| 2013 | 1 |
| 2014 | 2 |
| 2015 | 2 |
| 2016 | 2 |
| 2017 | 4 |
| 2018 | 3 |

Reading their titles showed that none of them are about swallowing. They matched the bare abbreviation "R-CPD", which chemists and engineers use for other things: drug compound names, a kind of fluorescent particle (red-emitting polymer dots), and a method in data science. Examples from the whole search:

- Structural basis for selectivity and diversity in angiotensin II receptors (2017)
- Synthesis and in vitro PDT evaluation of red emission polymer dots (R-CPDs) (2021)
- Computational information geometry for binary classification of high-dimensional random tensors (2018)

The same thing was happening after 2019 too. Of the 144 papers the first search found, 46 were not about R-CPD at all, and 7 more were conference abstract books or tables of contents (collections of hundreds of short abstracts, listed as one item) rather than papers.

So "negligible next to the totals" was not true for R-CPD. It was more than a third of the total.

## What was changed

1. **The bare abbreviation was dropped.** R-CPD is now searched as `"retrograde cricopharyngeus" OR "retrograde cricopharyngeal"`. Every real R-CPD paper found by the old search also contains one of these phrases, except one German review about belching in general.
2. **Only PubMed papers are counted** (`AND SRC:MED`), which removes the conference abstract books for every condition.
3. **A-CPD no longer counts R-CPD papers.** "Cricopharyngeal dysfunction" appears inside "retrograde cricopharyngeal dysfunction", so the A-CPD search now ends with `NOT ("retrograde cricopharyngeus" OR "retrograde cricopharyngeal")`.

## The numbers after cleaning

Counted on 8 October 2026.

| Condition | All time | Before 1990 | 1990 to 2026 | First search, 1990 to 2026 |
|---|---|---|---|---|
| Achalasia | 9,296 | 2,891 | 6,402 | 6,494 |
| Zenker's | 1,888 | 285 | 1,602 | 1,639 |
| Spasm | 1,217 | 162 | 1,054 | 1,104 |
| A-CPD | 509 | 63 | 446 | 530 |
| R-CPD | 89 | 0 | 89 | 144 |

The headline changes from "9,400 against 143" to **9,296 against 89**. The gap is bigger than the first run said, and every one of the 89 R-CPD papers is from 2019 or later.

## Limits that are still there

- A-CPD's search still includes swallowing problems after strokes and other nerve conditions, because those papers use the same words. Its count is the least precise of the five.
- A paper count measures how much doctors write about a condition, not how good the research is.
- 2026 is a partial year.

The data is in `docs/attention.csv` and `src/data/nameit/attention.json`. The chart is `docs/attention-chart.png` and is live on the Free the Burp evidence page. `scripts/fetch-attention.ts` repeats the whole count.
