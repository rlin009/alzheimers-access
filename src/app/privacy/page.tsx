// src/app/privacy/page.tsx
import Link from "next/link";

const ACCENT = "#0B5FFF";
const TEXT = "#111111";
const SUBTEXT = "#333333";

function Row({
  field,
  why,
}: {
  field: string;
  why: string;
}) {
  return (
    <div
      style={{
        borderTop: "1px solid #dddddd",
        padding: "1rem 0",
      }}
    >
      <p style={{ fontSize: "1.125rem", fontWeight: 700, color: TEXT, marginBottom: "0.25rem" }}>
        {field}
      </p>
      <p style={{ fontSize: "1.125rem", lineHeight: 1.5, color: SUBTEXT }}>{why}</p>
    </div>
  );
}

export default function Privacy() {
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
        Privacy
      </h1>

      <p
        style={{
          fontSize: "1.25rem",
          lineHeight: 1.5,
          color: SUBTEXT,
          marginBottom: "2rem",
          maxWidth: "42rem",
        }}
      >
        You're trusting us with information about a family member's health at
        a hard moment. Here is exactly what we store, why, and how to have it
        removed.
      </p>

      <section style={{ marginBottom: "2rem", maxWidth: "42rem" }}>
        <h2 style={{ fontSize: "1.5rem", fontWeight: 800, marginBottom: "1rem" }}>
          What we store, and why
        </h2>

        <Row
          field="Approximate location"
          why="Used to find trials and services near you. We store a general area (like a city or state), not a street address."
        />
        <Row
          field="Your relationship to the person diagnosed"
          why="Some trials have different criteria depending on who is enrolling — the person with the diagnosis or their caregiver."
        />
        <Row
          field="Diagnosis stage, if known"
          why="Many trials only accept a specific stage. This lets us skip trials that would never apply."
        />
        <Row
          field="Age band"
          why="Trials often have age cutoffs. We store a range (like '65–74'), not a birthdate."
        />
        <Row
          field="Whether a study partner is available"
          why="Most Alzheimer's trials require a study partner. Knowing this up front avoids showing you trials you can't actually join."
        />
      </section>

      <section style={{ marginBottom: "2rem", maxWidth: "42rem" }}>
        <h2 style={{ fontSize: "1.5rem", fontWeight: 800, marginBottom: "1rem" }}>
          What we don't ask for
        </h2>
        <p style={{ fontSize: "1.125rem", lineHeight: 1.6, color: SUBTEXT }}>
          We do not ask for your name, the name of the person diagnosed, an
          email address, a phone number, or a home address. You can browse
          and get results without creating any kind of account.
        </p>
      </section>

      <section style={{ marginBottom: "2rem", maxWidth: "42rem" }}>
        <h2 style={{ fontSize: "1.5rem", fontWeight: 800, marginBottom: "1rem" }}>
          What we never do
        </h2>
        <p style={{ fontSize: "1.125rem", lineHeight: 1.6, color: SUBTEXT }}>
          We never sell this information, and we never share it with trial
          sponsors, advertisers, or anyone else. It is used only to sort
          trials and services for you.
        </p>
      </section>

      <section style={{ marginBottom: "2rem", maxWidth: "42rem" }}>
        <h2 style={{ fontSize: "1.5rem", fontWeight: 800, marginBottom: "1rem" }}>
          Deleting your information
        </h2>
        <p style={{ fontSize: "1.125rem", lineHeight: 1.6, color: SUBTEXT }}>
          Because we don't collect your name or contact details, we can't
          reach out to you directly — so if you'd like your information
          deleted, use the link on your results page, or contact us with the
          web address shown after you complete the form. Deletion removes
          your stored answers entirely; it does not affect anyone else.
        </p>
      </section>

      <section style={{ marginBottom: "2.5rem", maxWidth: "42rem" }}>
        <h2 style={{ fontSize: "1.5rem", fontWeight: 800, marginBottom: "1rem" }}>
          This site is not medical advice
        </h2>
        <p style={{ fontSize: "1.125rem", lineHeight: 1.6, color: SUBTEXT }}>
          This site surfaces public information about trials and local
          services. It does not diagnose, treat, or advise on care or
          participation in any trial. Decisions about a trial should always
          go through the trial's own coordinator and your doctor.
        </p>
      </section>

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
    </main>
  );
}
