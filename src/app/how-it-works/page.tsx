// src/app/how-it-works/page.tsx
import Link from "next/link";

const ACCENT = "#0B5FFF";
const TEXT = "#111111";
const SUBTEXT = "#333333";

function Section({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section style={{ marginBottom: "2.5rem" }}>
      <h2
        style={{
          fontSize: "1.5rem",
          fontWeight: 800,
          color: TEXT,
          marginBottom: "0.75rem",
        }}
      >
        {title}
      </h2>
      <div
        style={{
          fontSize: "1.125rem",
          lineHeight: 1.6,
          color: SUBTEXT,
          maxWidth: "42rem",
        }}
      >
        {children}
      </div>
    </section>
  );
}

export default function HowItWorks() {
  return (
    <main
      style={{
        minHeight: "100dvh",
        padding: "2rem 1.5rem",
        backgroundColor: "#ffffff",
        color: TEXT,
      }}
    >
      <h1
        style={{
          fontSize: "2rem",
          lineHeight: 1.2,
          fontWeight: 800,
          marginBottom: "1.5rem",
        }}
      >
        How this works
      </h1>

      <p
        style={{
          fontSize: "1.25rem",
          lineHeight: 1.5,
          color: SUBTEXT,
          marginBottom: "2.5rem",
          maxWidth: "42rem",
        }}
      >
        This page explains where the information on this site comes from,
        how it&apos;s sorted, and where it can go wrong. Please read it
        before you trust anything the results page tells you.
      </p>

      <Section title="Where the trial data comes from">
        <p style={{ marginBottom: "1rem" }}>
          Trial listings come from ClinicalTrials.gov, the U.S. government&apos;s
          public registry of clinical research. It is the same registry
          doctors and researchers use. This site does not run any trials
          itself and has no relationship with the trial sponsors.
        </p>
        <p>
          The registry is re-checked on a schedule, so a trial that closes
          enrollment or opens a new site near you should show up here within
          a few days, not instantly.
        </p>
      </Section>

      <Section title="How a computer reads eligibility criteria">
        <p style={{ marginBottom: "1rem" }}>
          Each trial listing includes an eligibility section written in
          dense, clinical language — the kind meant for doctors, not
          families. This site uses an automated language model to read that
          text and pull out a few specific things: whether a study partner
          is required, roughly how often visits happen, and a few other
          common requirements.
        </p>
        <p>
          <strong>This automated reading sometimes gets it wrong.</strong> It
          can miss a requirement that&apos;s stated in an unusual way, or
          misread one that&apos;s ambiguous. It is a starting point for a
          conversation with a trial coordinator, not a final answer.
        </p>
      </Section>

      <Section title="How accurate it actually is">
        <p style={{ marginBottom: "1rem" }}>
          We checked this by hand. Out of 40 trials reviewed manually:
        </p>
        <ul
          style={{
            marginBottom: "1rem",
            paddingLeft: "1.5rem",
            listStyleType: "disc",
          }}
        >
          <li style={{ marginBottom: "0.5rem" }}>
            Every trial the system flagged as requiring a study partner
            really did require one. It did not falsely flag any trial.
          </li>
          <li>
            Of the 12 trials that actually required a study partner, the
            system caught 8 and missed 4.
          </li>
        </ul>
        <p>
          In plain terms: if this site tells you a trial needs a study
          partner, that has been reliable so far. If it doesn&apos;t mention
          a study partner, that&apos;s not proof one isn&apos;t needed — always
          ask.
        </p>
      </Section>

      <Section title="What the three lists mean">
        <p style={{ marginBottom: "1rem" }}>
          <strong>Worth asking about</strong> — nothing in the criteria we
          could read appears to rule this out.
        </p>
        <p style={{ marginBottom: "1rem" }}>
          <strong>Can&apos;t tell — ask your doctor</strong> — the criteria
          couldn&apos;t be read reliably. We show these instead of hiding
          them, because a trial the system can&apos;t read is not a trial
          that should disappear.
        </p>
        <p>
          <strong>Probably not</strong> — something specific in the listing
          appears to conflict with what you told us. We name that specific
          thing so you can judge for yourself whether it really applies.
        </p>
      </Section>

      <Section title="The one rule this whole site runs on">
        <p>
          <strong>
            This site never tells you that you or your family member are
            eligible or ineligible for a trial.
          </strong>{" "}
          It only sorts trials by what their public listing says. The only
          way to actually find out is to call the trial coordinator listed
          on the trial&apos;s page. If you take one thing from this page,
          take that.
        </p>
      </Section>

      <div style={{ marginTop: "3rem" }}>
        <Link
          href="/start"
          style={{
            display: "inline-block",
            padding: "1rem 1.75rem",
            fontSize: "1.25rem",
            fontWeight: 700,
            color: "#ffffff",
            backgroundColor: ACCENT,
            borderRadius: "0.75rem",
            textDecoration: "none",
            minHeight: "44px",
          }}
        >
          Start your search
        </Link>
      </div>
    </main>
  );
}
