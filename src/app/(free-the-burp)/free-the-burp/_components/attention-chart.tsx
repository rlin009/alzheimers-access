"use client";

import { useState } from "react";
import { ATTENTION } from "@/lib/nameit/data";
import type { Label } from "@/lib/nameit/conditions";

// Papers per year for each condition, 1990 to 2026, from Europe PMC.
// Series colours follow the condition, never its rank, and every line is
// labelled directly at its end, so colour is never the only cue.

const ORDER: Label[] = ["Achalasia", "Zenker's", "Spasm", "A-CPD", "R-CPD"];
const SERIES: Record<Label, string> = {
  Achalasia: "var(--ni-s1)",
  "R-CPD": "var(--ni-s2)",
  "A-CPD": "var(--ni-s3)",
  "Zenker's": "var(--ni-s4)",
  Spasm: "var(--ni-s5)",
};

const W = 760;
const H = 380;
const M = { top: 20, right: 110, bottom: 36, left: 46 };
const first = ATTENTION.firstYear;
const last = ATTENTION.lastYear;
const years = Array.from({ length: last - first + 1 }, (_, i) => first + i);

function seriesFor(label: Label) {
  return years.map(
    (y) => ATTENTION.rows.find((r) => r.condition === label && r.pub_year === y)?.paper_count ?? 0,
  );
}

const DATA = Object.fromEntries(ORDER.map((l) => [l, seriesFor(l)])) as Record<Label, number[]>;
const maxY = Math.ceil(Math.max(...ORDER.flatMap((l) => DATA[l])) / 50) * 50;

const x = (year: number) => M.left + ((year - first) / (last - first)) * (W - M.left - M.right);
const y = (v: number) => M.top + (1 - v / maxY) * (H - M.top - M.bottom);

function path(values: number[], from: number, to: number) {
  return values
    .slice(from - first, to - first + 1)
    .map((v, i) => `${i === 0 ? "M" : "L"}${x(from + i).toFixed(1)} ${y(v).toFixed(1)}`)
    .join(" ");
}

/** Spread end labels so they never overlap. */
function labelPositions() {
  const items = ORDER.map((l) => ({ l, y: y(DATA[l][DATA[l].length - 2]) }));
  items.sort((a, b) => a.y - b.y);
  for (let i = 1; i < items.length; i++)
    if (items[i].y - items[i - 1].y < 16) items[i].y = items[i - 1].y + 16;
  return Object.fromEntries(items.map((i) => [i.l, i.y])) as Record<Label, number>;
}

export default function AttentionChart() {
  const [hover, setHover] = useState<number | null>(null);
  const labels = labelPositions();
  const ticksY = Array.from({ length: maxY / 50 + 1 }, (_, i) => i * 50);
  const ticksX = years.filter((yr) => yr % 5 === 0);

  const fromPointer = (e: React.PointerEvent<SVGSVGElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const px = ((e.clientX - rect.left) / rect.width) * W;
    const yr = Math.round(first + ((px - M.left) / (W - M.left - M.right)) * (last - first));
    setHover(Math.min(last, Math.max(first, yr)));
  };
  const onKey = (e: React.KeyboardEvent<SVGSVGElement>) => {
    if (e.key === "ArrowLeft" || e.key === "ArrowRight") {
      e.preventDefault();
      const d = e.key === "ArrowLeft" ? -1 : 1;
      setHover((h) => Math.min(last, Math.max(first, (h ?? last - 1) + d)));
    }
    if (e.key === "Escape") setHover(null);
  };

  const hoverValues =
    hover === null
      ? []
      : ORDER.map((l) => ({ l, v: DATA[l][hover - first] })).sort((a, b) => b.v - a.v);
  const tipLeft = hover !== null && x(hover) > W * 0.6;

  return (
    <figure className="ni-chart">
      <div className="ni-chart-legend" aria-hidden="true">
        {[...ORDER].reverse().map((l) => (
          <span key={l}>
            <i style={{ background: SERIES[l] }} />
            {l}
          </span>
        ))}
      </div>
      <div className="ni-chart-frame">
        <svg
          viewBox={`0 0 ${W} ${H}`}
          role="img"
          aria-label="Line chart of research papers per year, 1990 to 2026. Achalasia rises from about 100 to over 300 papers a year. R-CPD has none until 2019 and reaches 28 in 2025. Use left and right arrow keys to read each year."
          tabIndex={0}
          onPointerMove={fromPointer}
          onPointerLeave={() => setHover(null)}
          onKeyDown={onKey}
          onBlur={() => setHover(null)}
        >
          {ticksY.map((t) => (
            <g key={t}>
              <line className="ni-grid" x1={M.left} x2={W - M.right} y1={y(t)} y2={y(t)} />
              <text className="ni-axis" x={M.left - 8} y={y(t) + 4} textAnchor="end">
                {t}
              </text>
            </g>
          ))}
          {ticksX.map((t) => (
            <text key={t} className="ni-axis" x={x(t)} y={H - 12} textAnchor="middle">
              {t}
            </text>
          ))}

          {/* the year R-CPD was named */}
          <line className="ni-annot-line" x1={x(2019)} x2={x(2019)} y1={M.top + 40} y2={H - M.bottom} />
          <text className="ni-annot" x={x(2019) - 6} y={M.top + 34} textAnchor="end">
            R-CPD named, 2019
          </text>

          {ORDER.map((l) => (
            <g key={l}>
              <path className="ni-line" d={path(DATA[l], first, last - 1)} style={{ stroke: SERIES[l] }} />
              <path className="ni-line ni-line-partial" d={path(DATA[l], last - 1, last)} style={{ stroke: SERIES[l] }} />
            </g>
          ))}

          {ORDER.map((l) => (
            <text key={l} className="ni-endlabel" x={x(last) + 10} y={labels[l] + 4}>
              {l}
            </text>
          ))}
          <text className="ni-axis" x={x(last)} y={M.top + 8} textAnchor="middle">
            2026 so far
          </text>

          {hover !== null && (
            <g className="ni-hover">
              <line x1={x(hover)} x2={x(hover)} y1={M.top} y2={H - M.bottom} />
              {ORDER.map((l) => (
                <circle key={l} cx={x(hover)} cy={y(DATA[l][hover - first])} r="4.5" style={{ fill: SERIES[l] }} />
              ))}
            </g>
          )}
          <rect x={M.left} y={M.top} width={W - M.left - M.right} height={H - M.top - M.bottom} fill="transparent" />
        </svg>
        {hover !== null && (
          <div
            className="ni-tooltip"
            style={{
              left: `${(x(hover) / W) * 100}%`,
              transform: tipLeft ? "translateX(calc(-100% - 14px))" : "translateX(14px)",
            }}
          >
            <p className="ni-tooltip-year">
              {hover}
              {hover === ATTENTION.partialYear ? " (so far)" : ""}
            </p>
            {hoverValues.map(({ l, v }) => (
              <p key={l}>
                <i style={{ background: SERIES[l] }} />
                <span>{l}</span>
                <b>{v}</b>
              </p>
            ))}
          </div>
        )}
      </div>
      <figcaption className="ni-chart-caption">
        Papers indexed in PubMed per year, counted through Europe PMC on{" "}
        {ATTENTION.fetched}. The 2026 line is dashed because the year is not over.
      </figcaption>
    </figure>
  );
}

/** Small two-line version for the home page: achalasia against R-CPD. */
export function Sparkline() {
  const w = 300;
  const h = 84;
  const sx = (yr: number) => ((yr - first) / (last - 1 - first)) * w;
  const sy = (v: number) => h - 20 - (v / maxY) * (h - 24);
  const line = (l: Label) =>
    DATA[l]
      .slice(0, -1)
      .map((v, i) => `${i === 0 ? "M" : "L"}${sx(first + i).toFixed(1)} ${sy(v).toFixed(1)}`)
      .join(" ");
  return (
    <svg className="ni-spark" viewBox={`0 0 ${w} ${h}`} aria-hidden="true">
      <path d={line("Achalasia")} style={{ stroke: SERIES.Achalasia }} />
      <path d={line("R-CPD")} style={{ stroke: SERIES["R-CPD"] }} />
      <text x="2" y={h - 3}>1990</text>
      <text x={w - 2} y={h - 3} textAnchor="end">2025</text>
    </svg>
  );
}

/** R-CPD on its own scale, so its growth is visible at all. */
export function RcpdBars() {
  const from = 2015;
  const yrs = years.filter((yr) => yr >= from);
  const vals = yrs.map((yr) => DATA["R-CPD"][yr - first]);
  const top = Math.max(...vals);
  const w = 520;
  const h = 200;
  const pad = { l: 8, r: 8, t: 22, b: 26 };
  const bw = (w - pad.l - pad.r) / yrs.length;
  const by = (v: number) => pad.t + (1 - v / top) * (h - pad.t - pad.b);
  return (
    <figure className="ni-chart ni-chart-small">
      <figcaption className="ni-chart-small-title">
        R-CPD on its own scale, {from} to {last}
      </figcaption>
      <svg viewBox={`0 0 ${w} ${h}`} role="img" aria-label={`Bar chart of R-CPD papers per year: ${yrs.map((yr, i) => `${yr}: ${vals[i]}`).join(", ")}.`}>
        <line className="ni-grid" x1={pad.l} x2={w - pad.r} y1={h - pad.b} y2={h - pad.b} />
        {yrs.map((yr, i) => {
          const v = vals[i];
          const x0 = pad.l + i * bw + 3;
          return (
            <g key={yr}>
              <title>{`${yr}: ${v} ${v === 1 ? "paper" : "papers"}${yr === ATTENTION.partialYear ? " so far" : ""}`}</title>
              {v > 0 && (
                <path
                  d={`M${x0} ${h - pad.b} V${by(v) + 4} q0 -4 4 -4 H${x0 + bw - 10} q4 0 4 4 V${h - pad.b} Z`}
                  className={yr === ATTENTION.partialYear ? "ni-bar ni-bar-partial" : "ni-bar"}
                />
              )}
              <text className="ni-bar-value" x={x0 + (bw - 6) / 2} y={(v > 0 ? by(v) : h - pad.b) - 6} textAnchor="middle">
                {v}
              </text>
              <text className="ni-axis" x={x0 + (bw - 6) / 2} y={h - 8} textAnchor="middle">
                {yr % 5 === 0 ? yr : `'${String(yr).slice(2)}`}
              </text>
            </g>
          );
        })}
      </svg>
    </figure>
  );
}
