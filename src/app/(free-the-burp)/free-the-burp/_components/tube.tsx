import type { Slug } from "@/lib/nameit/conditions";

// A side view of the swallowing tract, drawn as a diagram rather than
// anatomy: throat at the top, the upper sphincter, the long body of the
// esophagus, the lower sphincter, and the stomach. Each of the five
// conditions is marked at the height where it happens. The two sphincters
// are coloured like a manometry pressure plot, hot where the muscle stays
// squeezed shut.

type Mark = {
  slug: Slug;
  name: string;
  hint: string;
  /** y of the label baseline */
  y: number;
  /** point on the drawing the leader line goes to */
  to: [number, number];
};

const MARKS: Mark[] = [
  { slug: "zenkers", name: "Zenker's", hint: "pouch above the sphincter", y: 150, to: [146, 168] },
  { slug: "r-cpd", name: "R-CPD", hint: "air can't get out ↑", y: 205, to: [120, 212] },
  { slug: "a-cpd", name: "A-CPD", hint: "food can't get through ↓", y: 252, to: [120, 216] },
  { slug: "spasm", name: "Spasm", hint: "squeezes too early or too hard", y: 488, to: [112, 500] },
  { slug: "achalasia", name: "Achalasia", hint: "won't open into the stomach", y: 572, to: [120, 607] },
];

export function TubeLegend() {
  return <ul className="ni-tube-legend" aria-label="Diagram descriptions">{MARKS.map(mark =>
    <li key={mark.slug}><a href={`/free-the-burp/conditions/${mark.slug}`}>{mark.name}</a><span>{mark.hint}</span></li>
  )}</ul>;
}

export default function Tube({
  active = [],
  id = "tube",
  linkable = true,
  className = "",
  title = "Diagram of the swallowing tract with the five conditions marked where they happen",
}: {
  active?: Slug[];
  id?: string;
  linkable?: boolean;
  className?: string;
  title?: string;
}) {
  const any = active.length > 0;
  const on = (slug: Slug) => active.includes(slug);
  const hot = `${id}-hot`;
  const lumen = `${id}-lumen`;
  return (
    <svg
      className={`ni-tube ${any ? "has-active" : ""} ${className}`}
      viewBox="0 0 400 740"
      role="img"
      aria-labelledby={`${id}-title`}
    >
      <title id={`${id}-title`}>{title}</title>
      <defs>
        <linearGradient id={hot} x1="0" x2="1" y1="0" y2="0">
          <stop offset="0" stopColor="var(--ni-p3)" />
          <stop offset="0.5" stopColor="var(--ni-p4)" />
          <stop offset="1" stopColor="var(--ni-p3)" />
        </linearGradient>
        <linearGradient id={lumen} x1="0" x2="0" y1="0" y2="1">
          <stop offset="0" stopColor="var(--ni-lumen-top)" />
          <stop offset="1" stopColor="var(--ni-lumen)" />
        </linearGradient>
      </defs>

      {/* plain-language place names */}
      <g className="ni-tube-place" aria-hidden="true">
        <text x="146" y="40">throat</text>
        <text x="20" y="400" transform="rotate(-90 20 400)">esophagus</text>
        <text x="236" y="700">stomach</text>
      </g>

      {/* throat narrowing into the esophagus */}
      <path
        className="ni-tube-wall ni-tube-fill"
        fill={`url(#${lumen})`}
        d="M58 20 C 62 90, 78 140, 80 200 L 80 600 L 112 600 L 112 200 C 114 140, 130 90, 134 20 Z"
      />

      {/* Zenker's pouch, pushed out just above the upper sphincter */}
      <g className={`ni-tube-mark ${on("zenkers") ? "is-on" : ""}`} data-slug="zenkers">
        <path
          className="ni-tube-wall ni-tube-pouch"
          d="M113 150 C 132 146, 150 156, 150 176 C 150 194, 132 200, 113 196"
        />
      </g>

      {/* upper sphincter: R-CPD and A-CPD share this muscle */}
      <g className={`ni-tube-mark ni-tube-ring ${on("r-cpd") || on("a-cpd") ? "is-on" : ""}`}>
        <rect x="72" y="205" width="48" height="15" rx="7.5" fill={`url(#${hot})`} />
      </g>
      {/* trapped air under the upper sphincter (R-CPD) */}
      <g className={`ni-tube-mark ni-tube-air ${on("r-cpd") ? "is-on" : ""}`} aria-hidden="true">
        <circle cx="90" cy="236" r="5" />
        <circle cx="102" cy="248" r="3.5" />
        <circle cx="92" cy="258" r="2.5" />
      </g>

      {/* spasm: the lower body squeezing out of turn */}
      <g className={`ni-tube-mark ni-tube-spasm ${on("spasm") ? "is-on" : ""}`} aria-hidden="true">
        {[436, 466, 496, 526, 556].map((y) => (
          <path key={y} d={`M80 ${y} q 9 7 0 14 M112 ${y} q -9 7 0 14`} />
        ))}
      </g>

      {/* lower sphincter */}
      <g className={`ni-tube-mark ni-tube-ring ${on("achalasia") ? "is-on" : ""}`}>
        <rect x="72" y="600" width="48" height="15" rx="7.5" fill={`url(#${hot})`} />
      </g>

      {/* stomach */}
      <path
        className="ni-tube-wall ni-tube-stomach"
        d="M80 615 C 76 660, 96 712, 150 716 C 204 720, 226 676, 214 640 C 204 612, 160 600, 112 615 Z"
      />

      {/* labels */}
      {MARKS.map((m) => {
        const label = (
          <>
            <path className="ni-tube-leader" d={`M${m.to[0]} ${m.to[1]} L 176 ${m.y - 6} L 184 ${m.y - 6}`} />
            <text className="ni-tube-name" x="190" y={m.y}>
              {m.name}
            </text>
            <text className="ni-tube-hint" x="190" y={m.y + 17}>
              {m.hint}
            </text>
          </>
        );
        return (
          <g key={m.slug} className={`ni-tube-label ${on(m.slug) ? "is-on" : ""}`}>
            {linkable ? <a href={`/free-the-burp/conditions/${m.slug}`}>{label}</a> : label}
          </g>
        );
      })}
    </svg>
  );
}
