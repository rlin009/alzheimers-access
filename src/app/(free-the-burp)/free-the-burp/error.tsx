"use client";

import Link from "next/link";

export default function FreeTheBurpError({ reset }: { reset: () => void }) {
  return (
    <main id="main" className="ni-main">
      <div className="ni-wrap ni-page">
        <p className="ni-eyebrow">Something went wrong</p>
        <h1 className="ni-page-title">This page did not load</h1>
        <p className="ni-lede">Try loading it again. If it keeps failing, start from the home page.</p>
        <p className="ni-links-row">
          <button type="button" className="ni-button" onClick={reset}>
            Load it again
          </button>
          <Link className="ni-arrowlink" href="/free-the-burp">
            Go to the start page
          </Link>
        </p>
      </div>
    </main>
  );
}
