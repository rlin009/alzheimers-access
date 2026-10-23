import Link from "next/link";

export default function FreeTheBurpNotFound() {
  return (
    <main id="main" className="ni-main">
      <div className="ni-wrap ni-page">
        <p className="ni-eyebrow">Page not found</p>
        <h1 className="ni-page-title">There is no page at this address</h1>
        <p className="ni-lede">
          The link may be old or mistyped. The five condition pages and the phrase
          finder are all reachable from the start page.
        </p>
        <p>
          <Link className="ni-arrowlink" href="/free-the-burp">
            Go to the start page
          </Link>
        </p>
      </div>
    </main>
  );
}
