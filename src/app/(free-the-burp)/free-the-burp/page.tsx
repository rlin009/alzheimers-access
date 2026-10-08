import Link from "next/link";
import Finder from "./_components/finder";
import { CONDITIONS } from "@/lib/nameit/conditions";
import { getPhrases, PHRASE_GROUPS } from "@/lib/nameit/content";
import { ATTENTION, DELAY, TRIALS, longDate } from "@/lib/nameit/data";
import { Sparkline } from "./_components/attention-chart";

export default async function FreeTheBurpHome() {
  const phrases = await getPhrases();
  const achalasia = ATTENTION.allTime["Achalasia"];
  const rcpd = ATTENTION.allTime["R-CPD"];
  const measured = DELAY.conditions.filter((c) => c.builtToMeasure > 0).length;
  const trialCount = TRIALS.trials.length;
  const rcpdTrials = TRIALS.trials.filter((t) => t.conditions.includes("R-CPD")).length;

  return (
    <main id="main" className="ni-main">
      <div className="ni-wrap">
        <Finder phrases={phrases} groups={PHRASE_GROUPS} conditions={CONDITIONS} />
      </div>

      <section id="conditions" className="ni-band" aria-labelledby="five-title">
        <div className="ni-wrap">
          <p className="ni-eyebrow">Top of the throat to the stomach</p>
          <h2 id="five-title" className="ni-h2 ni-h2-large">
            Same tube, five places it can go wrong
          </h2>
          <ol className="ni-five">
            {CONDITIONS.map((c) => (
              <li key={c.slug}>
                <Link href={`/free-the-burp/conditions/${c.slug}`} className="ni-five-card">
                  <span className="ni-five-place">{c.place}</span>
                  <span className="ni-five-name">{c.name}</span>
                  <span className="ni-five-fails">{c.fails}</span>
                  <span className="ni-five-who">{c.who}</span>
                </Link>
              </li>
            ))}
          </ol>
          <p className="ni-band-note">
            R-CPD and A-CPD are the same muscle failing in opposite directions. Zenker&rsquo;s
            pouch grows above that same muscle. Achalasia is the same kind of failure at
            the other end of the tube.
          </p>
        </div>
      </section>

      <section className="ni-wrap ni-why-section" aria-labelledby="why-title">
        <p className="ni-eyebrow">Why the name is hard to find</p>
        <h2 id="why-title" className="ni-h2 ni-h2-large">
          One has been studied for decades. One was named in 2019.
        </h2>
        <div className="ni-stats">
          <div className="ni-stat">
            <p className="ni-stat-figure">
              <span>{achalasia.toLocaleString("en-US")}</span>
              <span className="ni-stat-vs">vs</span>
              <span className="ni-stat-hot">{rcpd}</span>
            </p>
            <p className="ni-stat-label">
              records returned by our achalasia search, compared with {rcpd} by our modern-name R-CPD search. Counts depend on the terms used.
            </p>
            <Sparkline />
          </div>
          <div className="ni-stat">
            <p className="ni-stat-figure">
              <span>{measured}</span>
              <span className="ni-stat-vs">of</span>
              <span>5</span>
            </p>
            <p className="ni-stat-label">
              conditions for which our search found dedicated diagnostic-delay studies. For
              achalasia it is about two years. People with R-CPD in one clinic had
              symptoms for about 17 years before diagnosis, and almost all of them
              found the name themselves.
            </p>
          </div>
          <div className="ni-stat">
            <p className="ni-stat-figure">
              <span>{trialCount}</span>
              <span className="ni-stat-vs">and</span>
              <span className="ni-stat-hot">{rcpdTrials}</span>
            </p>
            <p className="ni-stat-label">
              studies listed as recruiting or not yet recruiting across these conditions, and{" "}
              {rcpdTrials === 0 ? "none" : rcpdTrials} for R-CPD. Checked{" "}
              {longDate(TRIALS.fetched)}.
            </p>
          </div>
        </div>
        <div className="ni-links-row">
          <Link className="ni-arrowlink" href="/free-the-burp/evidence">
            See the evidence and how it was counted
          </Link>
          <Link className="ni-arrowlink" href="/free-the-burp/trials">
            See the recruiting trials
          </Link>
        </div>
      </section>
    </main>
  );
}
