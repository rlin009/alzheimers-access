# Validation Report

Generated: 2026-08-25T22:57:49.112Z

- Gold-standard rows: 40
- Database rows (table `criteria`): 977
- Matched on `nct_id`: 40
- Unmatched (in CSV, not found in DB): 0

For each field, **precision** treats the database value as the prediction and the gold-standard CSV value as ground truth; **recall** is computed against the same ground truth. Rows where a possible value never appears as either a prediction or a ground-truth value show `n/a`.

## `study_partner` → `requires_study_partner`

| Value | Precision | Recall | TP | FP | FN |
|---|---|---|---|---|---|
| required | 100.0% | 83.3% | 10 | 0 | 2 |
| not required | 0.0% | n/a | 0 | 1 | 0 |
| not mentioned | 96.6% | 100.0% | 28 | 1 | 0 |
| cannot tell | n/a | n/a | 0 | 0 | 0 |

## `imaging_required` → `requires_imaging`

| Value | Precision | Recall | TP | FP | FN |
|---|---|---|---|---|---|
| required | 90.0% | 100.0% | 9 | 1 | 0 |
| not required | n/a | n/a | 0 | 0 | 0 |
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
| required | 0.0% | n/a | 0 | 14 | 0 |
| not required | n/a | n/a | 0 | 0 | 0 |
| not mentioned | 80.8% | 95.5% | 21 | 5 | 1 |
| cannot tell | n/a | n/a | 0 | 0 | 0 |
