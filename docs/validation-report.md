# Validation Report

Generated: 2026-09-05T23:10:32.937Z

- Gold-standard rows: 40
- Database rows (table `criteria`): 1000
- Matched on `nct_id`: 31
- Unmatched (in CSV, not found in DB): 9

For each field, **precision** treats the database value as the prediction and the gold-standard CSV value as ground truth; **recall** is computed against the same ground truth. Rows where a possible value never appears as either a prediction or a ground-truth value show `n/a`.

## `study_partner` → `requires_study_partner`


| Value         | Precision | Recall | TP  | FP  | FN  |
| ------------- | --------- | ------ | --- | --- | --- |
| required      | 100.0%    | 77.8%  | 7   | 0   | 2   |
| not required  | n/a       | n/a    | 0   | 0   | 0   |
| not mentioned | 91.7%     | 100.0% | 22  | 2   | 0   |
| cannot tell   | n/a       | n/a    | 0   | 0   | 0   |




## `imaging_required` → `requires_imaging`


| Value         | Precision | Recall | TP  | FP  | FN  |
| ------------- | --------- | ------ | --- | --- | --- |
| required      | 100.0%    | 71.4%  | 5   | 0   | 2   |
| not required  | n/a       | n/a    | 0   | 0   | 0   |
| not mentioned | 91.7%     | 100.0% | 22  | 2   | 0   |
| cannot tell   | 50.0%     | 50.0%  | 1   | 1   | 1   |




## `lumbar_puncture_required` → `requires_lumbar_puncture`


| Value         | Precision | Recall | TP  | FP  | FN  |
| ------------- | --------- | ------ | --- | --- | --- |
| required      | 100.0%    | 100.0% | 1   | 0   | 0   |
| not required  | n/a       | n/a    | 0   | 0   | 0   |
| not mentioned | 100.0%    | 100.0% | 30  | 0   | 0   |
| cannot tell   | n/a       | n/a    | 0   | 0   | 0   |




## `cognitive_scale` → `cognitive_scale` (free text, set match)

This field holds one or more scale names (e.g. MMSE, MoCA, CDR, ADAS-Cog) rather than one of the four state words. "not mentioned" in the gold standard counts as no scale. Each side is split into a set of scale names and the sets are compared, so "MMSE; CDR" against "CDR; MMSE" is an exact match and "MMSE; CDR" against "MMSE" is a partial match.


| Metric                                        | Count |
| --------------------------------------------- | ----- |
| Total compared                                | 31    |
| Both empty (no scale expected, none returned) | 21    |
| Exact match (same set of scales)              | 3     |
| Partial match (at least one scale in common)  | 3     |
| Mismatch (both named scales, none in common)  | 1     |
| Gold named a scale, db returned none          | 3     |
| Db named a scale, gold expected none          | 0     |


- Match rate where a scale was expected (exact or partial): 60.0% (6 / 10)
- Overall agreement (including both-empty rows): 87.1%



## Unmatched `nct_id` values

These appeared in the gold-standard CSV but were not found in Supabase (excluded from the comparisons above):

- NCT05977088
- NCT04715399
- NCT02763683
- NCT03082755
- NCT04575337
- NCT06540833
- NCT06595511
- NCT06546488
- NCT05077579

