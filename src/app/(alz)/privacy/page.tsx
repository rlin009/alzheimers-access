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
        <section><h2>Who runs this site</h2><p>Alzheimer’s Access is a student project created by Riteesha for the Whetstone capstone fellowship. For corrections or privacy questions, email <a href="mailto:riteesha.lingechetty@gmail.com">riteesha.lingechetty@gmail.com</a>. Please do not send medical records.</p></section>
        <section>
          <h2>What you can share</h2>
          <p>
            All four questions are optional: approximate location, age band, study-partner availability, and
            willingness to travel.
          </p>
          <p>
            We use age, location, study-partner availability, and travel
            preference to sort trial listings. We no longer ask for or save relationship and diagnosis stage because they do not change the sort. Older saved searches may still contain those answers.
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
            what feels safe to share. No answers are sent until you press Submit or Update results. Saved answers are retained until you delete them; there is currently no automatic expiry. Open your results link and choose “Delete these saved answers” to remove that set. This does not remove separate sets saved under other results links. Provider backups may retain copies under their own retention policies.
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
