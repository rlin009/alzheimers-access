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
        <section><h2>Optional study email alerts on both sites</h2><p>Alzheimer’s Access and Free the Burp offer separate, optional email subscriptions. We save your email address, selected condition, age band, country/region, study-partner and travel preferences, followed study IDs, consent confirmation time and recent alerts in Supabase. These preferences can reveal health interests. We never send them to study coordinators. Confirmation and alert emails are delivered by Resend; that service receives your address and message content. Hosting is provided by Vercel. These providers have their own privacy and retention policies.</p><p>A confirmation link expires after 24 hours. Expired requests and temporary abuse-prevention counters are removed on the next successful daily job. Request limits use keyed hashes of email and network address. Subscriptions remain until you delete them. Sent alert history is retained for up to 90 days, cleaned on successful daily jobs. Unconfirmed deliveries may be kept until resolved. Provider delivery logs and backups can outlive deletion from our active database.</p><p>Open the private manage link in an alert email to change preferences, stop following a study, or “Unsubscribe and delete alert data”. This deletes that site’s subscription and stored alerts and invalidates its management link. It does not delete a separate subscription on the other site or your saved Alzheimer’s results. An email already being sent may still arrive. Anyone with your private management link can access or delete the associated alert preferences. If you lose it, sign up with the same email and confirm again to regain access. No marketing emails, texts or automatic weekly digests are sent.</p><p>Email subjects do not name a condition; email contents may reveal your study interests. Choose an inbox you are comfortable using. Independent clinical review of the sites has not been verified.</p></section>
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
