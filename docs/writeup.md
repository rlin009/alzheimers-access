# Two projects, one question

Does medical information actually reach the person it is for?

I built two sites to test that question from opposite ends. Alzheimer's Access starts from information that exists but cannot be read: the eligibility text of Alzheimer's trials. Free the Burp starts from information that cannot be found: the names of swallowing conditions that most people have never been told. The first problem is unreadable. The second is unsearchable, because you cannot look up a word nobody has told you.

Every number below carries how far it can be trusted. The fields I decided not to trust are named at the end, because that is the most important part of any result like this.

## Part 1. Alzheimer's Access: the information is there but nobody can read it

### What I asked

When a family reads a recruiting Alzheimer's trial on ClinicalTrials.gov, can they tell whether the person they care for could take part? The single requirement that most often decides it is whether the trial needs a study partner, a family member or caregiver who comes to visits.

### How

- Pulled every Alzheimer's and dementia trial from ClinicalTrials.gov and checked the count against the registry's own total.
- Read 20 eligibility sections by hand before writing any code, and designed four states for every field: required, not required, not mentioned, and cannot tell. "Not mentioned" is a real answer about the trial. "Cannot tell" is about the parser.
- Hand-labelled 40 trials, then used a language model to read the rest, and measured it against the hand labels field by field.
- Set a rule before looking at results: a field may hide a trial from a family only if it reaches 95% precision on at least 10 examples. Hiding a trial wrongly costs a family a chance they never learn about. Showing one wrongly costs a phone call. Those mistakes are not equal, so the rule runs on precision.

### What I found

Of 968 recruiting trials (refreshed 23 August 2026):

| Study partner | Trials | Share |
|---|---|---|
| Required | 271 | 28.0% |
| Not required | 47 | 4.9% |
| Not mentioned | 650 | 67.1% |

Two out of three listings give a family no way to know, from the public registry alone, whether a study partner is needed.

**How far to trust it.** Precision for "required" was 100% (8 of 8 flagged trials were right). Recall was 67%: the parser missed 4 of 12 real cases. So 28.0% is a floor, and the true share requiring a partner is probably higher. When the same 40 trials were run again with the same model, recall dropped from 83% to 67% while precision stayed at 100%. The field is stable in the direction that decides whether a trial is hidden, and less stable in the direction that only costs a phone call.

**The trend that wasn't there.** I sampled 150 trials per five-year band from 2005 to 2025. The study partner requirement measured 30.7%, 37.3%, 33.3% and 28.0%. With 150 trials per band, one band's figure carries a margin of about 7 points, and a difference between two bands needs about 11 points to mean anything. The largest gap is 9.3 points. The honest finding is that no change was detected over twenty years.

**What did change.** The median length of eligibility text, measured straight from the raw text with no model, rose from 900 characters in 2005 to 2009 to between 1,034 and 1,088 in every band after. I did not test whether that gap is beyond sampling error, so it is a description, not a finding.

### What the site does

A family answers six optional questions. The site sorts recruiting trials into worth asking about, ask carefully, and probably not, and every trial it moves shows the reason in plain words, quoting the trial's own text. Only the study partner field is allowed to move a trial to "probably not".

## Part 2. Free the Burp: the information exists but nobody can find it

### What I asked

R-CPD, the condition where the upper esophageal sphincter will not open to let air out, was only named in 2019. It belongs to a family of five conditions where a muscle in the swallowing tract does not open or squeeze the way it should: R-CPD, A-CPD (the same muscle failing for food going down), Zenker's diverticulum, esophageal spasm, and achalasia. Achalasia is the same kind of failure at the other end of the same tube, and has been studied for decades. Does a diagnosis reach the person it belongs to, and how differently for the old condition and the new one?

### How much has been written

I counted PubMed papers per condition per year through Europe PMC.

| Condition | Papers, all time | Before 1990 |
|---|---|---|
| Achalasia | 9,296 | 2,891 |
| Zenker's | 1,888 | 285 |
| Spasm | 1,217 | 162 |
| A-CPD | 509 | 63 |
| R-CPD | 89 | 0 |

**How far to trust it.** My first count gave R-CPD 144 papers. Reading them showed that the bare abbreviation "R-CPD" also matched chemistry and engineering papers: 46 of the 144 had nothing to do with swallowing, and 7 more were conference abstract books. Dropping the abbreviation and counting only PubMed papers gave 89, all from 2019 or later. The A-CPD count is the least precise, because "cricopharyngeal dysfunction" is also used for swallowing problems after strokes. A paper count measures attention, not quality, and 2026 is a partial year. The full record is in `docs/attention-notes.md`.

### How long it takes to get the name

| Condition | Studies built to measure it | Best number |
|---|---|---|
| Achalasia | 6 | Median 24 months, IQR 12 to 72 (n = 278) |
| R-CPD | 0 | Symptoms at mean age 13.6, diagnosis at mean age 30.4 (n = 106) |
| A-CPD | 0 | none |
| Zenker's | 0 | one side note: 17 months (n = 28) |
| Spasm | 0 | none |

Achalasia's delay has been measured at least six times since 1997 in four countries, and it is slow: about two years in the largest recent study, and up to a mean of 5.7 years in older ones. 42% of patients in one German study had been given at least one wrong diagnosis first, most often reflux.

R-CPD has never had a delay study. What it has instead is evidence that the medical system is not where people find the name. In the 5 studies in a 2025 systematic review that recorded how the diagnosis was made, patients had recognised it themselves 78.9% of the time. In one French clinic, 105 of 106 patients had worked it out themselves after 162 medical visits between them. In a 13-person interview study, every patient first heard the name on social media.

So the two ends of the same tube look like this. Achalasia is slow to diagnose, but the diagnosis comes from doctors, and its delay is measured. R-CPD is diagnosed by patients, and its delay has never been measured at all.

**How far to trust it.** The R-CPD "about 17 years" is the gap between two group averages from one specialist clinic, not each person's own wait, and people who reach a specialist may have waited longer than most. The achalasia studies disagree by years, partly because some report medians and some means. Delay papers that do not use the words "diagnostic delay", "time to diagnosis" or "misdiagnosis" could have been missed, so I also read every R-CPD abstract in full. No model was used here: fewer than 20 of 389 abstracts contained a delay number, so every number was read and checked by hand (`docs/delay-validation.md`).

### Who is studying it now

33 studies on ClinicalTrials.gov are recruiting or about to recruit people with these conditions (8 October 2026). 28 include achalasia. None is for R-CPD. Everything known about treating R-CPD comes from case series and surveys, with one small controlled study.

### What the site does

Free the Burp starts from the words people use before they know the medical ones, 50 everyday phrases taken from published patient surveys and clinicians' patient pages. A person picks the phrases that sound like them, and the site shows which conditions those words are linked to, how to tell those conditions apart, and the exact test to ask a doctor for. Half of the phrases point to more than one condition, and those carry a note on how the conditions differ. Each condition has one page with the same six sections, and every factual sentence links to its source. An independent check of about 185 claims found 20 problems before launch, and all were fixed. The site does not diagnose, and it does not rebuild the R-CPD clinician directory that noburp.info already keeps.

## Same failure, two directions

In Alzheimer's Access, the information exists and is public, but it is written so that a family cannot use it: two out of three listings never say whether a study partner is needed.

In Free the Burp, the information exists and is readable, but it cannot be found without a word that nobody has given the patient: four out of five R-CPD patients find the name themselves.

Both are failures of delivery, not of knowledge.

## Fields I decided not to trust

- **Alzheimer's Access, imaging and lumbar puncture.** Imaging reached 100% precision but on 9 examples, one short of the rule. Lumbar puncture was right on its only example. Both are shown as notes for a family to ask about, and neither can hide a trial.
- **Alzheimer's Access, cognitive scale.** First defined wrongly with the same four words as the yes or no fields. Fixed and re-validated, but not used to sort trials.
- **Alzheimer's Access, the twenty-year trend.** Not claimed, because no gap between bands cleared the margin of error.
- **Free the Burp, A-CPD paper counts.** Includes some stroke-related swallowing papers that use the same phrase.
- **Free the Burp, delay for A-CPD, Zenker's and spasm.** Not published as delay, because nobody has measured it. Small treatment series that mention symptom duration are shown, labelled as not being delay studies.
- **Free the Burp, R-CPD 17 years.** Published only with its caveat, as two averages from one clinic.
