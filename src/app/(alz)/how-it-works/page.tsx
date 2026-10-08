import type { Metadata } from "next";
import Link from "next/link";
import PageHeading from "../../components/page-heading";
export const metadata: Metadata = { title: "How this works" };
export default function HowItWorks() {
  return (
    <main id="main-content" className="page-shell prose-page">
      <PageHeading title="How this works">
        <p>
          Where the information comes from, how it is sorted, and where it can
          go wrong.
        </p>
      </PageHeading>
      <article className="prose">
        <section>
          <h2>Where the trial data comes from</h2>
          <p>
            Trial listings come from{" "}
            <a
              href="https://clinicaltrials.gov/"
              target="_blank"
              rel="noopener noreferrer"
            >
              ClinicalTrials.gov
              <span className="sr-only"> (opens in a new tab)</span>
            </a>
            , the U.S. government’s public registry of clinical research. This
            site does not run trials and has no relationship with trial
            sponsors.
          </p>
          <p>
            The listings here are a copy of the registry. A newly opened site or
            a trial that has stopped recruiting may not be reflected here yet.
            Always check the official trial page.
          </p>
          <p>
            We check that a listing concerns Alzheimer’s, dementia, related
            conditions, or mild cognitive impairment. This includes relevant
            prevention and caregiver research. A broad registry search can also
            return unrelated studies; those are kept out of these lists. When a
            study’s connection is unclear, it appears in “Can’t tell” with a note.
            This check can miss relevant studies, so you can also search the
            registry directly.
          </p>
        </section>
        <section>
          <h2>How a computer reads eligibility criteria</h2>
          <p>
            A computer reads each trial’s public criteria to look for details
            such as study-partner requirements, imaging, and lumbar punctures.
            The sort also uses the trial’s listed age range and recruiting
            sites.
          </p>
          <p>
            <strong>It can miss or misread a requirement.</strong> An unusual
            phrase or an unclear listing can change the result. The lists are a
            starting point for a conversation.
          </p>
          <p>
            Location matching is approximate and based on U.S. states. It does
            not calculate driving distance. Relationship and diagnosis stage are
            collected, but do not currently change the trial sort.
          </p>
        </section>
        <section>
          <h2>How accurate it actually is</h2>
          <p>
            In a manual check of 40 trials, the system found 8 of the 12
            study-partner requirements and missed 4. Every study-partner
            requirement it flagged in that sample was correct.
          </p>
          <p>
            This is one limited check, not an overall accuracy score. If a study
            partner is not mentioned here, that does not mean one is not needed.
            Always ask.
          </p>
        </section>
        <section>
          <h2>What the three lists mean</h2>
          <p>
            <strong>Worth asking about</strong> — nothing in the criteria we
            could read appears to conflict with your answers.
          </p>
          <p>
            <strong>Can’t tell — ask your doctor</strong> — the criteria could
            not be read reliably, or the study’s connection to dementia needs
            clarification. We show these trials so uncertainty does not
            make them disappear.
          </p>
          <p>
            <strong>Probably not</strong> — a specific detail appears to
            conflict with your answers. Read the reason and ask the coordinator
            whether it applies. The listing is still available to you.
          </p>
        </section>
        <section>
          <h2>The one rule this whole site runs on</h2>
          <p>
            <strong>
              This site never tells you that you or your family member are
              eligible or ineligible for a trial.
            </strong>{" "}
            It only sorts trials by what their public listing says.
          </p>
          <p>
            Call the coordinator listed on the trial’s official page to find out
            about taking part.
          </p>
        </section>
        <Link href="/start" className="button button-butter">
          Start your search
        </Link>
      </article>
    </main>
  );
}
