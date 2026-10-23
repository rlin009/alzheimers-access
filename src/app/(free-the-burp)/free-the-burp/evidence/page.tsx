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
            Our searches returned {fmt(ATTENTION.allTime["Achalasia"])} achalasia records indexed in PubMed,{" "}
            {fmt(ATTENTION.before1990["Achalasia"])} of them from before 1990. The modern-name R-CPD search returned {rcpd} records. It misses earlier reports published under different names. These are search results, not a complete census of research.
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
                  <th scope="col" className="num">Unreconciled difference</th>
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
                      <td className="num">{fmt(ATTENTION.allTime[l] - ATTENTION.before1990[l] - since)}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          <p className="ni-chart-caption">The final column makes differences between the all-time query and summed yearly queries explicit. The cause has not been verified; it may involve date indexing or records changing between requests. These differences are not assigned to a year.</p>
        </section>

        <section className="ni-ev-section" aria-labelledby="delay-h">
          <h2 id="delay-h" className="ni-h2 ni-h2-large">
            How long it takes to get the name
          </h2>
          <p className="ni-ev-intro">
            Our search found dedicated diagnostic-delay studies for achalasia. For the other four, available figures came from small studies with other purposes, or for
            R-CPD, one clinic&rsquo;s averages. Where nobody has measured something, the
            gap is left empty. “Not measured” here means no dedicated study was found in this search.
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
                      : "No dedicated study found in our search"}
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
              number near those words was checked in the original research pass.
              The diagnostic-delay review is separate from the refreshed paper counts;
              it is not a systematic review. Each displayed estimate links to its source.
            </p>
          </div>
          <p className="ni-ev-intro">The refreshed spasm search includes “distal esophageal spasm” and “hypercontractile esophagus”. R-CPD counts remain restricted to modern names: older inability-to-belch reports exist, including reports from 1987, 1989 and 2001 discussed in <a href="https://journals.sagepub.com/doi/10.1177/19160216251329012">Lechien and colleagues’ review</a>. Adding broad inability-to-belch terms also finds postoperative problems unrelated to R-CPD, so those results are not presented as R-CPD research. No records under the modern name before 2019 does not mean no earlier research.</p>
          <h3 className="ni-mono-label ni-queries-title">Searches used for this snapshot</h3>
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
              meta-analyses. The comparison is sensitive to terminology, indexing and search coverage. It cannot by itself measure research quality or clinical attention.
            </li>
            <li>
              <strong>The R-CPD 17 years is two averages, not a measured wait.</strong>{" "}
              It is the gap between the average age when symptoms began and the average
              age at diagnosis in one French clinic. People who reach a specialist clinic
              may have waited longer than most.
            </li>
            <li>
              <strong>The achalasia studies disagree.</strong> The median wait was 24
              months in Italy and the mean was 4.7 years in Germany. These studies involved different patients and methods, so the results are not directly comparable. A mean is more affected by unusually long waits than a median.
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
