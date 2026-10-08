import type { Metadata } from "next";
import Link from "next/link";
import PageHeading from "../../components/page-heading";
export const metadata: Metadata = { title: "Privacy" };
export default function Privacy() {
  return (
    <main id="main-content" className="page-shell prose-page">
      <PageHeading title="Privacy">
        <p>You can choose what to share.</p>
      </PageHeading>
      <article className="prose">
        <section>
          <h2>What you can share</h2>
          <p>
            All six questions are optional: approximate location, relationship,
            diagnosis stage, age band, study-partner availability, and
            willingness to travel.
          </p>
          <p>
            We use age, location, study-partner availability, and travel
            preference to sort trial listings. Relationship and diagnosis stage
            are saved with your answers but do not currently change that sort.
          </p>
        </section>
        <section>
          <h2>What is stored</h2>
          <p>
            When you submit, your answers are saved in the site’s database
            without a name attached. A code in your results link points to those
            answers. Submitting changes saves a new set of answers and gives you
            a new results link.
          </p>
          <p>
            The site uses hosting and database services to operate. The survey
            is part of this site; it is not sent to an external form service.
            Answers are not sent to trial coordinators by this site.
          </p>
        </section>
        <section>
          <h2>What we don’t ask for</h2>
          <p>
            You do not need to provide your name, the name of the person
            diagnosed, an email address, a phone number, or a street address. No
            account is needed.
          </p>
        </section>
        <section>
          <h2>Your results link</h2>
          <p>
            Keep your results link private. Anyone with that link can see the
            connected results and review the answers you submitted.
          </p>
          <p>
            ClinicalTrials.gov and support organizations have their own privacy
            policies. Opening those links takes you to their websites.
          </p>
        </section>
        <section>
          <h2>Your choices</h2>
          <p>
            You can leave any question blank. Read this page before deciding
            what feels safe to share. No answers are sent until you press Submit
            or Update results.
          </p>
        </section>
        <section>
          <h2>This site is not medical advice</h2>
          <p>
            This site shows public information about trials and local services.
            It does not diagnose, treat, or decide whether someone can take
            part. Discuss trial participation with the trial coordinator and
            your doctor.
          </p>
        </section>
        <Link className="text-action" href="/start">
          Back to the questions
        </Link>
      </article>
    </main>
  );
}
