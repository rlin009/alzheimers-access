# Validation Report

Generated: 2026-08-30T14:23:04.591Z

- Gold-standard rows: 40
- Database rows (table `criteria`): 977
- Matched on `nct_id`: 40
- Unmatched (in CSV, not found in DB): 0

For each field, **precision** treats the database value as the prediction and the gold-standard CSV value as ground truth; **recall** is computed against the same ground truth. Rows where a possible value never appears as either a prediction or a ground-truth value show `n/a`.

## `study_partner` → `requires_study_partner`

| Value | Precision | Recall | TP | FP | FN |
|---|---|---|---|---|---|
| required | 100.0% | 66.7% | 8 | 0 | 4 |
| not required | 0.0% | n/a | 0 | 2 | 0 |
| not mentioned | 90.0% | 96.4% | 27 | 3 | 1 |
| cannot tell | n/a | n/a | 0 | 0 | 0 |

## `imaging_required` → `requires_imaging`

| Value | Precision | Recall | TP | FP | FN |
|---|---|---|---|---|---|
| required | 100.0% | 100.0% | 9 | 0 | 0 |
| not required | 0.0% | n/a | 0 | 1 | 0 |
| not mentioned | 93.3% | 100.0% | 28 | 2 | 0 |
| cannot tell | n/a | 0.0% | 0 | 0 | 3 |

## `lumbar_puncture_required` → `requires_lumbar_puncture`

| Value | Precision | Recall | TP | FP | FN |
|---|---|---|---|---|---|
| required | 100.0% | 100.0% | 1 | 0 | 0 |
| not required | n/a | n/a | 0 | 0 | 0 |
| not mentioned | 97.4% | 100.0% | 38 | 1 | 0 |
| cannot tell | n/a | 0.0% | 0 | 0 | 1 |

## `cognitive_scale` → `cognitive_scale`

| Value | Precision | Recall | TP | FP | FN |
|---|---|---|---|---|---|
| required | n/a | n/a | 0 | 0 | 0 |
| not required | n/a | n/a | 0 | 0 | 0 |
| not mentioned | n/a | 0.0% | 0 | 0 | 22 |
| cannot tell | n/a | n/a | 0 | 0 | 0 |
