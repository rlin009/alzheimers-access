import type { Metadata } from "next";
import Link from "next/link";
import { CONDITIONS } from "@/lib/nameit/conditions";
import { TRIALS, longDate, trialsFor, type Trial } from "@/lib/nameit/data";

export const metadata: Metadata = {
  title: "Recruiting trials",
  description:
    "Studies found on ClinicalTrials.gov listed as recruiting or not yet recruiting people with R-CPD, A-CPD, Zenker's, esophageal spasm or achalasia, in plain words.",
};

function ages(t: Trial) {
  const clean = (a: string | null) => (a ? a.replace(/ Years?/, "") : null);
  const min = clean(t.minAge);
  const max = clean(t.maxAge);
  if (min && max) return `Ages ${min} to ${max}`;
  if (min) return `Ages ${min} and over`;
  if (max) return `Up to age ${max}`;
  return "Age limits not specified";
}

function kind(t: Trial) {
  return t.studyType === "INTERVENTIONAL" ? "Tests a treatment or procedure" : "Follows people, no new treatment";
}

export default function TrialsPage() {
  const total = TRIALS.trials.length;
  return (
    <main id="main" className="ni-main">
      <div className="ni-wrap ni-page">
        <header className="ni-page-head">
          <p className="ni-eyebrow">Recruiting trials</p>
          <h1 className="ni-page-title">Studies to keep an eye on</h1>
          <p className="ni-lede">
            {total} studies on ClinicalTrials.gov are listed as recruiting or not yet recruiting for
            people with one of these five conditions. These are the studies our search found, described in plain words. A registry listing does not guarantee an open place. Checked{" "}
            {longDate(TRIALS.fetched)}.
          </p>
          <nav className="ni-jump" aria-label="Jump to a condition">
            {CONDITIONS.map((c) => (
              <a key={c.slug} href={`#${c.slug}`}>
                {c.name} <span>{trialsFor(c.label).length}</span>
              </a>
            ))}
          </nav>
          <p className="ni-caution">
            Being listed here is not a recommendation. Ask the study team what taking
            part involves, and talk it through with your own doctor first.
          </p>
        </header>

        {CONDITIONS.map((c) => {
          const list = trialsFor(c.label);
          return (
            <section key={c.slug} id={c.slug} className="ni-trial-group" aria-labelledby={`${c.slug}-h`}>
              <div className="ni-trial-group-head">
                <h2 id={`${c.slug}-h`} className="ni-h2 ni-h2-large">
                  {c.name}
                </h2>
                <p className="ni-muted">
                  {list.length === 0
                    ? "No studies"
                    : `${list.length} ${list.length === 1 ? "study" : "studies"}`}
                  {" · "}
                  <Link href={`/free-the-burp/conditions/${c.slug}`}>About {c.name}</Link>
                </p>
              </div>
              {list.length === 0 ? (
                <div className="ni-trial-empty">
                  <p className="ni-trial-empty-big">No open studies found in this search.</p>
                  <p>
                    Our ClinicalTrials.gov search found no studies listed as recruiting or not yet recruiting for {c.name} on {longDate(TRIALS.fetched)}. Studies in other registries or under other terms may not appear here.
                  </p>
                </div>
              ) : (
                <ul className="ni-trials">
                  {list.map((t) => (
                    <li key={t.nctId} className="ni-trial">
                      <div className="ni-trial-tags">
                        <span className={`ni-tag ${t.status === "RECRUITING" ? "is-open" : ""}`}>
                          {t.status === "RECRUITING" ? "Recruiting" : "Not yet recruiting"}
                        </span>
                        <span className="ni-tag">{kind(t)}</span>
                        {t.conditions.length > 1 &&
                          t.conditions
                            .filter((l) => l !== c.label)
                            .map((l) => (
                              <span key={l} className="ni-tag ni-tag-quiet">
                                Also {l}
                              </span>
                            ))}
                      </div>
                      <p className="ni-trial-summary">{t.summary}</p>
                      <p className="ni-trial-title">{t.title}</p>
                      <dl className="ni-trial-facts">
                        <div>
                          <dt>Where</dt>
                          <dd>
                            {t.sites.length
                              ? t.sites.slice(0, 3).join("; ") + (t.siteCount > 3 ? `; and ${t.siteCount - 3} more` : "")
                              : "Sites not listed yet"}
                          </dd>
                        </div>
                        <div>
                          <dt>Who</dt>
                          <dd>
                            {ages(t)}
                            {t.enrollment ? `, about ${t.enrollment.toLocaleString("en-US")} people` : ""}
                          </dd>
                        </div>
                        <div>
                          <dt>Run by</dt>
                          <dd>{t.sponsor}</dd>
                        </div>
                      </dl>
                      <a className="ni-arrowlink" href={t.url} rel="noopener">
                        {t.nctId} on ClinicalTrials.gov
                      </a>
                    </li>
                  ))}
                </ul>
              )}
            </section>
          );
        })}
      </div>
    </main>
  );
}
