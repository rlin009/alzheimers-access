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

Corrected Accuracy Floor: 