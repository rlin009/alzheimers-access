"use client";
import Link from "next/link";
import PageHeading from "./components/page-heading";
export default function ErrorPage({ reset }: { reset: () => void }) {
  return (
    <main id="main-content" className="page-shell state-page">
      <PageHeading title="We couldn’t open this page" />
      <div className="state-content">
        <p>
          Please try again. You can also return home to choose your next step.
        </p>
        <div className="actions">
          <button className="button button-indigo" onClick={reset}>
            Try again
          </button>
          <Link className="button button-outline" href="/">
            Return home
          </Link>
        </div>
      </div>
    </main>
  );
}
