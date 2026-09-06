# Validation Report

Generated: 2026-09-06T02:54:40.394Z

- Gold-standard rows: 100
- Database rows (table `criteria`): 1000
- Matched on `nct_id`: 77
- Unmatched (in CSV, not found in DB): 23

For each field, **precision** treats the database value as the prediction and the gold-standard CSV value as ground truth; **recall** is computed against the same ground truth. Rows where a possible value never appears as either a prediction or a ground-truth value show `n/a`.

## `study_partner` → `requires_study_partner`

| Value | Precision | Recall | TP | FP | FN |
|---|---|---|---|---|---|
| required | 94.4% | 89.5% | 17 | 1 | 2 |
| not required | n/a | n/a | 0 | 0 | 0 |
| not mentioned | 94.9% | 98.2% | 56 | 3 | 1 |
| cannot tell | n/a | 0.0% | 0 | 0 | 1 |

## `imaging_required` → `requires_imaging`

| Value | Precision | Recall | TP | FP | FN |
|---|---|---|---|---|---|
| required | 26.3% | 71.4% | 5 | 14 | 2 |
| not required | n/a | n/a | 0 | 0 | 0 |
| not mentioned | 39.3% | 100.0% | 22 | 34 | 0 |
| cannot tell | 50.0% | 50.0% | 1 | 1 | 1 |

## `lumbar_puncture_required` → `requires_lumbar_puncture`

| Value | Precision | Recall | TP | FP | FN |
|---|---|---|---|---|---|
| required | 33.3% | 100.0% | 1 | 2 | 0 |
| not required | n/a | n/a | 0 | 0 | 0 |
| not mentioned | 40.5% | 100.0% | 30 | 44 | 0 |
| cannot tell | n/a | n/a | 0 | 0 | 0 |

## `cognitive_scale` → `cognitive_scale` (free text, set match)

This field holds one or more scale names (e.g. MMSE, MoCA, CDR, ADAS-Cog) rather than one of the four state words. "not mentioned" in the gold standard counts as no scale. Each side is split into a set of scale names and the sets are compared, so "MMSE; CDR" against "CDR; MMSE" is an exact match and "MMSE; CDR" against "MMSE" is a partial match.

| Metric | Count |
|---|---|
| Total compared | 77 |
| Both empty (no scale expected, none returned) | 48 |
| Exact match (same set of scales) | 3 |
| Partial match (at least one scale in common) | 3 |
| Mismatch (both named scales, none in common) | 1 |
| Gold named a scale, db returned none | 3 |
| Db named a scale, gold expected none | 19 |

- Match rate where a scale was expected (exact or partial): 60.0% (6 / 10)
- Overall agreement (including both-empty rows): 70.1%

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
- NCT05887674
- NCT05592678
- NCT06250725
- NCT03761381
- NCT04956549
- NCT06772194
- NCT05800028
- NCT03946930
- NCT06198699
- NCT03489278
- NCT06619327
- NCT06701630
- NCT06448403
- NCT05468905
