import type { Metadata } from "next";
import Link from "next/link";
import AttentionChart, { RcpdBars } from "../_components/attention-chart";
import { ATTENTION, DELAY, longDate } from "@/lib/nameit/data";
import { BY_LABEL, type Label } from "@/lib/nameit/conditions";
import { getSource, shortCite } from "@/lib/nameit/sources";

export const metadata: Metadata = {
  title: "The evidence",
  description:
    "How much has been written about each of the five conditions, and how long each takes to diagnose, with every number traced to its source.",
};

const ORDER: Label[] = ["Achalasia", "Zenker's", "Spasm", "A-CPD", "R-CPD"];

export default function EvidencePage() {
  const fmt = (n: number) => n.toLocaleString("en-US");
  const rcpdRaw = ATTENTION.originalQueryTotals1990to2026["R-CPD"];
  const rcpd = ATTENTION.allTime["R-CPD"];

  return (
    <main id="main" className="ni-main">
      <div className="ni-wrap ni-page">
        <header className="ni-page-head">
          <p className="ni-eyebrow">The evidence</p>
          <h1 className="ni-page-title">Same family of conditions. Not the same attention.</h1>
          <p className="ni-lede">
            Two questions, asked the same way of all five conditions. How much has
            been written about each one? And how long does it take a person to get
            the name?
          </p>
        </header>

        <section className="ni-ev-section" aria-labelledby="papers-h">
          <h2 id="papers-h" className="ni-h2 ni-h2-large">
            How much has been written
          </h2>
          <p className="ni-ev-intro">
            Achalasia has {fmt(ATTENTION.allTime["Achalasia"])} papers indexed in PubMed,{" "}
            {fmt(ATTENTION.before1990["Achalasia"])} of them from before 1990. R-CPD has{" "}
            {rcpd}, and every one is from 2019 or later. The R-CPD line only starts to
            climb in 2024.
          </p>
          <AttentionChart />
          <RcpdBars />
          <div className="ni-table-wrap">
            <table className="ni-table">
              <caption>Papers per condition</caption>
              <thead>
                <tr>
                  <th scope="col">Condition</th>
                  <th scope="col" className="num">All time</th>
                  <th scope="col" className="num">Before 1990</th>
                  <th scope="col" className="num">1990 to 2026</th>
                </tr>
              </thead>
              <tbody>
                {ORDER.map((l) => {
                  const since = ATTENTION.rows.filter((r) => r.condition === l).reduce((a, r) => a + r.paper_count, 0);
                  return (
                    <tr key={l}>
                      <th scope="row">
                        <Link href={`/free-the-burp/conditions/${BY_LABEL[l].slug}`}>{l}</Link>
                      </th>
                      <td className="num">{fmt(ATTENTION.allTime[l])}</td>
                      <td className="num">{fmt(ATTENTION.before1990[l])}</td>
                      <td className="num">{fmt(since)}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </section>

        <section className="ni-ev-section" aria-labelledby="delay-h">
          <h2 id="delay-h" className="ni-h2 ni-h2-large">
            How long it takes to get the name
          </h2>
          <p className="ni-ev-intro">
            Only achalasia has studies built to measure this. For the other four, the
            best available numbers are side notes in small treatment studies, or for
            R-CPD, one clinic&rsquo;s averages. Where nobody has measured something, the
            gap is left empty on purpose.
          </p>

          <div className="ni-delay-grid">
            {DELAY.conditions.map((d) => (
              <article key={d.condition} className={`ni-delay ${d.headline === "Not measured" ? "is-unmeasured" : ""}`}>
                <header>
                  <p className="ni-mono-label">
                    <Link href={`/free-the-burp/conditions/${BY_LABEL[d.condition].slug}`}>{d.condition}</Link>
                  </p>
                  <p className="ni-delay-headline">{d.headline}</p>
                  <p className="ni-delay-detail">{d.headlineDetail}</p>
                  <p className="ni-delay-count">
                    {d.builtToMeasure
                      ? `${d.builtToMeasure} studies built to measure it`
                      : "No study built to measure it"}
                  </p>
                </header>
                <ul>
                  {d.rows.map((r, i) => {
                    const s = getSource(r.source);
                    return (
                      <li key={i}>
                        <p className="ni-delay-value">{r.value}</p>
                        <p className="ni-delay-measure">{r.measure}</p>
                        <p className="ni-delay-meta">
                          {r.design}, {r.n} people.{" "}
                          <a href={s.url} rel="noopener">
                            {shortCite(r.source)}
                          </a>
                        </p>
                        {r.caveat && <p className="ni-delay-caveat">{r.caveat}</p>}
                      </li>
                    );
                  })}
                </ul>
              </article>
            ))}
          </div>
        </section>

        <section className="ni-ev-section ni-method" aria-labelledby="method-h">
          <h2 id="method-h" className="ni-h2 ni-h2-large">
            What was counted, and what was thrown out
          </h2>
          <div className="ni-prose">
            <p>
              Paper counts come from the Europe PMC search service, one search per
              condition per year, counting only papers indexed in PubMed. They were
              collected on {longDate(ATTENTION.fetched)}. The exact searches are listed
              below so anyone can repeat them.
            </p>
            <p>
              <strong>The first R-CPD count was wrong.</strong> The original search
              included the bare abbreviation &ldquo;R-CPD&rdquo; and found {rcpdRaw} papers
              from 1990 on. Reading them showed that many had nothing to do with
              swallowing. Chemists use R-CPD for other things, including a kind of
              fluorescent particle, and 17 of those papers were from before the condition
              was even named. Conference abstract books also matched. Dropping the bare
              abbreviation and keeping only PubMed papers left {rcpd}, all from 2019 on.
            </p>
            <p>
              <strong>A-CPD and R-CPD overlap.</strong> The phrase &ldquo;cricopharyngeal
              dysfunction&rdquo; also appears in every paper about retrograde
              cricopharyngeal dysfunction, so the A-CPD search excludes those papers to
              avoid counting them twice. It still includes papers about swallowing
              problems after strokes and other nerve conditions, which use the same words.
            </p>
            <p>
              <strong>Diagnosis times were read by hand.</strong> Europe PMC was searched
              for each condition together with &ldquo;diagnostic delay&rdquo;, &ldquo;time to
              diagnosis&rdquo;, &ldquo;misdiagnosis&rdquo; or &ldquo;misdiagnosed&rdquo;. That
              returned {DELAY.searched.uniquePapers} different PubMed papers, most of them
              single case reports. Every abstract with a
              number near those words was read, along with all {rcpd} R-CPD abstracts.
              Only the numbers shown above were kept, each checked against its abstract.
              No AI model was used to pull numbers out.
            </p>
          </div>
          <h3 className="ni-mono-label ni-queries-title">The exact searches</h3>
          <dl className="ni-queries">
            {ORDER.map((l) => (
              <div key={l}>
                <dt>{l}</dt>
                <dd>
                  <code>{ATTENTION.queries[l]} AND SRC:MED</code>
                </dd>
              </div>
            ))}
          </dl>
        </section>

        <section className="ni-ev-section" aria-labelledby="trust-h">
          <h2 id="trust-h" className="ni-h2 ni-h2-large">
            What not to read into this
          </h2>
          <ul className="ni-trust">
            <li>
              <strong>A paper count measures attention, not quality.</strong> Thousands
              of achalasia papers include many single case reports. R-CPD&rsquo;s {rcpd} include
              meta-analyses. The comparison says which condition doctors have been
              writing about, nothing more.
            </li>
            <li>
              <strong>The R-CPD 17 years is two averages, not a measured wait.</strong>{" "}
              It is the gap between the average age when symptoms began and the average
              age at diagnosis in one French clinic. People who reach a specialist clinic
              may have waited longer than most.
            </li>
            <li>
              <strong>The achalasia studies disagree.</strong> The median wait was 24
              months in Italy and the mean was 4.7 years in Germany. A mean is pulled up
              by the few people who waited decades, which is why the median is lower.
            </li>
            <li>
              <strong>2026 is not finished.</strong> The last point on the chart covers
              part of the year.
            </li>
          </ul>
        </section>
      </div>
    </main>
  );
}
