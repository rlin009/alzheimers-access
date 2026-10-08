import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "About",
  description: "What Free the Burp is, what it is not, and how every fact on it was checked.",
};

export default function AboutPage() {
  return (
    <main id="main" className="ni-main">
      <div className="ni-wrap ni-page ni-about">
        <header className="ni-page-head">
          <p className="ni-eyebrow">About</p>
          <h1 className="ni-page-title">What this is, and what it isn&rsquo;t</h1>
        </header>

        <div className="ni-prose ni-about-body">
          <h2 className="ni-h2">The idea</h2>
          <p>
            Some swallowing conditions are easy to look up once you know their names.
            The hard part is the name. If you have never been told the word, you can
            only search for what it feels like, and searches for &ldquo;can&rsquo;t burp&rdquo; or
            &ldquo;food sticks in my throat&rdquo; lead in a dozen directions.
          </p>
          <p>
            Free the Burp starts from the other end. It begins with the words people use
            before they know the medical ones, and connects them to five conditions that
            all involve a muscle in the swallowing tract that does not open or squeeze
            the way it should. For each one it gives the name, how it differs from the
            conditions next to it, and the test to ask a doctor for by name.
          </p>

          <h2 className="ni-h2">What it will not do</h2>
          <ul>
            <li>
              <strong>It does not diagnose.</strong> It cannot tell you what you have.
              Several of these conditions can only be told apart with a test, and many of
              the symptoms here have other causes.
            </li>
            <li>
              <strong>It is not a doctor directory.</strong> For R-CPD, the community site{" "}
              <a href="https://noburp.info/" rel="noopener">
                noburp.info
              </a>{" "}
              already keeps a directory of clinicians who treat it, built over years.
              Use that.
            </li>
            <li>
              <strong>It does not store anything about you.</strong> The phrases you pick
              stay in your browser and disappear when you leave the page.
            </li>
          </ul>

          <h2 className="ni-h2">How the facts were checked</h2>
          <p>
            Every factual sentence on a condition page links to its source: a clinical
            guideline, a systematic review, a study, or Laryngopedia, the reference site
            run by the laryngologist who named R-CPD. If a sentence could not be
            traced to a source, it was cut. The site checks that each citation has a source entry. That check does not establish that a source supports every claim.
          </p>
          <p>
            The everyday phrases come from published patient surveys and interview
            studies, and from patient pages written by clinicians. No post from any
            forum was copied and no person is quoted. Each phrase in the site&rsquo;s vocabulary file carries the source that
            shows people describe it that way.
          </p>
          <p>
            The paper counts and diagnosis times are explained, with their limits, on the{" "}
            <Link href="/free-the-burp/evidence">evidence page</Link>. The trials list is pulled
            from ClinicalTrials.gov and each study is described in one plain sentence.
          </p>

          <h2 className="ni-h2">Who made it</h2>
          <p>
            Free the Burp was built by Riteesha, a high school student, as part of the Whetstone capstone
            fellowship, alongside Alzheimer&rsquo;s Access, a project that reads Alzheimer&rsquo;s
            trial listings for families. Both projects ask the same question from two
            directions: whether medical information actually reaches the person it is for.
          </p>
          <p>Independent clinical review has not been verified. This is a student research project, not a clinical service.</p>
          <p>Corrections and privacy questions: <a href="mailto:riteesha.lingechetty@gmail.com">riteesha.lingechetty@gmail.com</a>. Please do not send medical records.</p>
          <p className="ni-muted">
            Information here was last checked in October 2026. Medicine changes. If
            something looks out of date, a doctor&rsquo;s advice comes first.
          </p>
        </div>
      </div>
    </main>
  );
}
