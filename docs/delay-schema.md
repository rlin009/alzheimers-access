# Delay schema: what to pull from each paper

Written before reading any abstracts, so the questions could not be shaped by the answers.

For each paper, record:

1. **n**: how many patients were in the study.
2. **Delay**: the time from first symptom to diagnosis, with its units, and whether it is a median or a mean. Record the spread (IQR, range or SD) if given.
3. **What was measured**: true diagnostic delay, symptom duration before treatment, or something else. These are not the same thing and must not be mixed.
4. **Misdiagnosed first**: the share given a different diagnosis before the right one.
5. **Misdiagnosed as what**: the wrong diagnoses named, with their shares.
6. **Self-diagnosed**: the share who worked out the diagnosis themselves.
7. **Design and setting**: prospective or retrospective, number of centres, country, years.

Every field takes one of four states, as in the trial parser:

- **Reported**: the abstract gives the number.
- **Not applicable**: the question does not fit the paper, for example a single case report.
- **Not reported**: the abstract does not give it. An abstract is a summary, so this means "not in the abstract", not "not measured".
- **Cannot tell**: the abstract gives something close but ambiguous.

A number goes on the site only if it is **reported**, it is about the condition's own patients, and the measure is named exactly as the study names it.
