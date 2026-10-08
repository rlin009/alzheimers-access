#!/usr/bin/env python3
"""Export the attention table from Supabase and plot papers per year."""

from __future__ import annotations

import csv
import json
import os
import urllib.error
import urllib.request
from collections import defaultdict
from pathlib import Path

import matplotlib.pyplot as plt

ROOT = Path(__file__).resolve().parents[1]
DOCS_DIR = ROOT / "docs"
CSV_PATH = DOCS_DIR / "attention.csv"
CHART_PATH = DOCS_DIR / "attention-chart.png"
PAGE_SIZE = 1000
PARTIAL_YEAR = 2026


def load_dotenv(path: Path) -> None:
    if not path.exists():
        return
    for line in path.read_text(encoding="utf-8").splitlines():
        stripped = line.strip()
        if not stripped or stripped.startswith("#") or "=" not in stripped:
            continue
        key, value = stripped.split("=", 1)
        key = key.strip()
        value = value.strip().strip("'").strip('"')
        os.environ.setdefault(key, value)


def supabase_config() -> tuple[str, str]:
    load_dotenv(ROOT / ".env.local")
    load_dotenv(ROOT / ".env")
    url = os.environ.get("SUPABASE_URL") or os.environ.get("NEXT_PUBLIC_SUPABASE_URL")
    key = (
        os.environ.get("SUPABASE_SERVICE_ROLE_KEY")
        or os.environ.get("SUPABASE_ANON_KEY")
        or os.environ.get("NEXT_PUBLIC_SUPABASE_ANON_KEY")
    )
    if not url or not key:
        raise SystemExit(
            "Missing NEXT_PUBLIC_SUPABASE_URL (or SUPABASE_URL) and a Supabase key."
        )
    return url.rstrip("/"), key


def fetch_attention_rows(url: str, key: str) -> list[dict]:
    """Fetch every attention row, bypassing PostgREST's 100-row default."""
    rows: list[dict] = []
    start = 0
    while True:
        end = start + PAGE_SIZE - 1
        request = urllib.request.Request(
            f"{url}/rest/v1/attention"
            "?select=condition,pub_year,paper_count"
            "&order=pub_year.asc,condition.asc",
            headers={
                "apikey": key,
                "Authorization": f"Bearer {key}",
                "Accept": "application/json",
                "Range": f"{start}-{end}",
                "Range-Unit": "items",
            },
        )
        try:
            with urllib.request.urlopen(request) as response:
                chunk = json.loads(response.read().decode("utf-8"))
        except urllib.error.HTTPError as error:
            raise SystemExit(f"Supabase query failed: {error.read().decode('utf-8')}") from error

        if not isinstance(chunk, list):
            raise SystemExit(f"Unexpected Supabase response: {chunk!r}")
        rows.extend(chunk)
        if len(chunk) < PAGE_SIZE:
            break
        start += PAGE_SIZE
    return rows


def write_csv(rows: list[dict]) -> None:
    DOCS_DIR.mkdir(parents=True, exist_ok=True)
    with CSV_PATH.open("w", encoding="utf-8", newline="") as handle:
        writer = csv.DictWriter(
            handle,
            fieldnames=["condition", "pub_year", "paper_count"],
            extrasaction="ignore",
            lineterminator="\n",
        )
        writer.writeheader()
        for row in rows:
            writer.writerow(
                {
                    "condition": row["condition"],
                    "pub_year": row["pub_year"],
                    "paper_count": row["paper_count"],
                }
            )


def plot_chart(rows: list[dict]) -> None:
    series: dict[str, list[tuple[int, int]]] = defaultdict(list)
    for row in rows:
        series[str(row["condition"])].append((int(row["pub_year"]), int(row["paper_count"])))

    fig, ax = plt.subplots(figsize=(11, 6))
    for condition, points in sorted(series.items()):
        points.sort(key=lambda item: item[0])
        years = [year for year, _ in points]
        counts = [count for _, count in points]
        ax.plot(years, counts, marker="o", markersize=3, linewidth=1.8, label=condition)

    ax.axvline(PARTIAL_YEAR, color="#666666", linestyle="--", linewidth=1.2, zorder=0)
    y_top = ax.get_ylim()[1]
    ax.annotate(
        f"{PARTIAL_YEAR} is a partial year",
        xy=(PARTIAL_YEAR, y_top * 0.97),
        xytext=(-8, 0),
        textcoords="offset points",
        ha="right",
        va="top",
        fontsize=9,
        color="#444444",
    )

    ax.set_title("Europe PMC papers per year, by condition")
    ax.set_xlabel("Publication year")
    ax.set_ylabel("Paper count")
    ax.legend(title="Condition", loc="upper left")
    ax.grid(True, alpha=0.3)
    fig.tight_layout()
    fig.savefig(CHART_PATH, dpi=150)
    plt.close(fig)


def main() -> None:
    url, key = supabase_config()
    rows = fetch_attention_rows(url, key)
    write_csv(rows)
    plot_chart(rows)
    print(f"Exported {len(rows)} rows to {CSV_PATH}")
    print(f"Saved chart to {CHART_PATH}")


if __name__ == "__main__":
    main()
