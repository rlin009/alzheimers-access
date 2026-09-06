// src/app/page.tsx
import Link from "next/link";

export default function Home() {
  return (
    <main
      style={{
        minHeight: "100dvh",
        display: "flex",
        flexDirection: "column",
        justifyContent: "space-between",
        padding: "2rem 1.5rem",
        backgroundColor: "#ffffff",
        color: "#111111",
      }}
    >
      <div>
        <h1
          style={{
            fontSize: "2rem",
            lineHeight: 1.2,
            fontWeight: 800,
            marginBottom: "1.25rem",
          }}
        >
          Find clinical trials and local support for Alzheimer's and dementia
        </h1>

        <p
          style={{
            fontSize: "1.25rem",
            lineHeight: 1.5,
            color: "#333333",
          }}
        >
          For families caring for a loved one with Alzheimer's or dementia,
          this site helps you find clinical trials they may qualify for and
          resources near you — care support, respite services, and more.
        </p>
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
        <p style={{ fontSize: "1rem", color: "#555555" }}>
          Built by families who've navigated this journey.
        </p>

        <Link
          href="/start"
          style={{
            display: "block",
            textAlign: "center",
            width: "100%",
            padding: "1.5rem",
            fontSize: "1.5rem",
            fontWeight: 700,
            color: "#ffffff",
            backgroundColor: "#0B5FFF",
            borderRadius: "1rem",
            textDecoration: "none",
          }}
        >
          Get Started
        </Link>
      </div>
    </main>
  );
}