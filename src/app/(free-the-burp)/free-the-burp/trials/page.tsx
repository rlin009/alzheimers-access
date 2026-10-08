import type { Metadata } from "next";
import Link from "next/link";
import { CONDITIONS } from "@/lib/nameit/conditions";
import { longDate, type Trial } from "@/lib/nameit/data";
import { getBurpTrials } from '@/lib/trial-monitor/burp';
import TrialFreshness from '@/app/components/trial-freshness';
export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: "Recruiting trials",
  description:
    "ClinicalTrials.gov studies for R-CPD, A-CPD, Zenker's, esophageal spasm or achalasia, with recruitment information and email follow controls.",
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

export default async function TrialsPage({searchParams}:{searchParams:Promise<{country?:string;status?:string}>}) {
  const params=await searchParams;
  const TRIALS=await getBurpTrials();
  const countries=[...new Set(TRIALS.trials.flatMap(t=>t.countries))].sort();
  const trialsFor=(label:string)=>TRIALS.trials.filter(t=>t.conditions.includes(label as typeof t.conditions[number]) && (!params.country || t.countries.includes(params.country)) && (!params.status || t.status===params.status));
  const total = TRIALS.trials.length;
  return (
    <main id="main" className="ni-main">
      <div className="ni-wrap ni-page">
        <header className="ni-page-head">
          <p className="ni-eyebrow">Recruiting trials</p>
          <h1 className="ni-page-title">Studies to keep an eye on</h1>
          <p className="ni-lede">
            {total} studies on ClinicalTrials.gov are listed as recruiting or not yet recruiting for
            people with one of these five conditions. These are the studies our search found. Registry summaries may use medical terms. A registry listing does not guarantee an open place. Checked{" "}
            {longDate(TRIALS.fetched)}.
          </p>
          <TrialFreshness checkedAt={TRIALS.fetched} automatic={TRIALS.automatic} unavailable={TRIALS.unavailable}/>
          <p><Link className="ni-arrowlink" href="/free-the-burp/alerts">Get email alerts for new studies or follow a study</Link></p>
          <form className="ni-trial-filters" action="/free-the-burp/trials">
            <label>Country<select name="country" defaultValue={params.country || ''}><option value="">All countries</option>{countries.map(country=><option key={country}>{country}</option>)}</select></label>
            <label>Recruitment<select name="status" defaultValue={params.status || ''}><option value="">Recruiting and not yet recruiting</option><option value="RECRUITING">Recruiting</option><option value="NOT_YET_RECRUITING">Not yet recruiting</option></select></label>
            <button type="submit">Filter studies</button><Link href="/free-the-burp/trials">Clear filters</Link>
          </form>
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
                    No studies for {c.name} match this view, checked on {longDate(TRIALS.fetched)}. Try clearing filters. Studies in other registries or under other terms may not appear here.
                  </p>
                  <Link href={`/free-the-burp/alerts?condition=${encodeURIComponent(c.label)}`}>Tell me when a potential study appears</Link>
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
                      {TRIALS.automatic && <p className="ni-muted">Registry summary (may contain technical terms)</p>}
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
                      <p className="ni-muted">Registry last updated: {t.lastUpdate || 'Not provided'}. A recent check does not mean the study team recently updated its record.</p>
                      <p><Link className="ni-arrowlink" href={`/free-the-burp/alerts?trial=${t.nctId}&condition=${encodeURIComponent(c.label)}`}>Follow this study by email</Link></p>
                    </li>
                  ))}
                </ul>
              )}
            </section>
          );
        })}
        <section className="ni-prose"><h2 className="ni-h2">Questions for the study team</h2><ul><li>Is this particular site still enrolling, and what determines eligibility?</li><li>What visits, tests, treatment changes and risks are involved?</li><li>Who covers travel and study-related costs?</li><li>Can I take the consent information to my own clinician before deciding?</li></ul></section>
      </div>
    </main>
  );
}
