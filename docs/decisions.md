Exclusion Policy: Precision Over Recall

So here's the thing I got wrong in week 1. 

--> If we move a trial into "probably not" and we're wrong, the family just never sees it. Nobody calls and nobody ever even sees the trial.  

--> If we leave a trial visible and the patient actually doesn't qualify, the worst case is that someone calls a coordinator, gets told no, and moves on. However, that's annoying and it wastes the time of the family. 

Since those two mistakes aren't equal, the rule protecting against them shouldn't be either. 

I originally set the floor at 0.87 recall, and recall is just the wrong statistic. Recall tells you: of the trials that really do require something, how many did we catch? This number doesn't relly tell us whether we're wrongly hiding a trial from someone. Precision matters more here because it tells us of the trials we labeled as requiring something, how many actually do? If precision is low, we're mislabeling trials, and that is what we're trying to avoid. So exclusion decisions need to run on precision, not recall. Recall can matter somewhere else down the line, just not here.

Here's the actual rule I landed on. A field is allowed to exclude a trial only if it's hitting 0.95 precision or better AND it's been tested on at least 10 examples in the gold standard. A field can score 100 percent on a single example just by luck. The 10-example minimum is what keeps us from mistaking a lucky guess for an actual pattern.

If a field's precision is somewhere between 0.80 and 0.95, or it just hasn't been tested enough yet, it can still show up as a caveat next to a trial, it just can't be the reason we hide it. And if precision drops below 0.80, we don't show it at all, it's not trustworthy enough to put in front of anyone.

Where that leaves us right now: requires_study_partner is at 100 percent precision across 10 examples, so it's allowed to exclude. requires_imaging is at 90 percent across 10 examples, so caveat only. requires_lumbar_puncture technically hit 100 percent, but only on one single example, so it's caveat only too, it just doesn't have enough data behind it yet. cognitive_scale isn't shown at all right now, we're holding off until it's been properly validated in week 4.

So only one field actually earns the right to exclude a trial this week. I don't think that's a bad result, honestly. A system that excludes on one field we've actually checked carefully is worth more than one that excludes on five fields nobody's verified. 

Per field, from docs/validation-report.md after the 40 gold trials were re-parsed with the fixed schema (30 August):

- requires_study_partner: precision 100% (8 flagged, 8 right), recall 67% (4 of 12 missed), 12 examples in the gold standard. Passes. Allowed to exclude.
- requires_imaging: precision 100% (9 flagged, 9 right), recall 100%, but only 9 examples in the gold standard. Fails the 10-example minimum by one. Caveat only.
- requires_lumbar_puncture: precision 100% on 1 example. Caveat only.
- cognitive_scale: not a yes/no field, not used in triage until validated in week 4.

One thing the re-parse showed: recall on requires_study_partner dropped from 83% to 67% when the same 40 trials were run again with the same model. Precision stayed at 100%. So the field is stable in the direction that matters for exclusion, and less stable in the direction that only costs a phone call. Two of the four misses now come back as "not required" rather than "not mentioned", which is worth reading in week 4.

---

## Free the Burp decisions (weeks 5 and 6)

The working title was Name It, which is why the code folders are still called `nameit` (`src/lib/nameit`, `src/data/nameit`, the `ni-` style names). The site and its address are Free the Burp, at /free-the-burp.

**One site, two separate products.** Free the Burp lives at /free-the-burp in the same Next.js app, in its own route group with its own layout, fonts and styles. The two products do not share navigation. Alzheimer's Access moved into `src/app/(alz)` without any change to its pages.

**Free the Burp is static.** Every Free the Burp page is built ahead of time from files in the repo: `content/conditions/*.md`, `content/vocabulary.csv` and `src/data/nameit/*.json`. It does not need the database to load, so it keeps working even if the Supabase keys on Vercel break, which happened to Alzheimer's Access in October.

**Trials come from a file, not the trials table.** Putting achalasia trials into the `trials` table would have mixed them into Alzheimer's Access results, because that site reads every recruiting row. The 33 Free the Burp trials live in `src/data/nameit/trials.json`, each with a one-sentence summary written by a person. `scripts/fetch-nameit-trials.ts` refreshes the facts and prints any new trial for someone to read first. Four studies that only mention these conditions in passing are listed as excluded, with the reason.

**Search terms were tightened after reading the results.** See `docs/attention-notes.md`. The bare abbreviation "R-CPD" matched dozens of chemistry papers, so it was dropped, and only PubMed papers are counted.

**Diagnosis delay was read by hand, not by the model.** See `docs/delay-validation.md`. Fewer than 20 of 389 abstracts carried a number, so a model pass would not have cleared the 10-example rule and would have mostly confirmed "not applicable".

**Every factual sentence cites a source, and the build enforces it.** A condition page that cites a source key missing from `src/data/nameit/sources.json`, or that does not have the six agreed sections in order, fails the build. An independent fact-check of about 185 claims found 20 problems before launch, all corrected.

**No symptom checker, no doctor directory.** The phrase finder shows which conditions a phrase is linked to and how to tell them apart. It never says what someone has. For R-CPD clinicians, the site links to noburp.info.
