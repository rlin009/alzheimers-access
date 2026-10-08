import Link from "next/link";

export function NiHeader() {
  return (
    <header className="ni-header">
      <div className="ni-wrap ni-header-inner">
        <Link href="/free-the-burp" className="ni-wordmark" aria-label="Free the Burp, home">
          Free the&nbsp;Burp
        </Link>
        <nav aria-label="Main" className="ni-nav">
          <Link href="/free-the-burp#conditions">Conditions</Link>
          <Link href="/free-the-burp/evidence">Evidence</Link>
          <Link href="/free-the-burp/trials">Trials</Link>
          <Link href="/free-the-burp/about">About</Link>
        </nav>
      </div>
    </header>
  );
}

export function NiFooter() {
  return (
    <footer className="ni-footer">
      <div className="ni-wrap ni-footer-inner">
        <div>
          <p className="ni-wordmark ni-wordmark-small">Free the&nbsp;Burp</p>
          <p className="ni-footer-note">
            Free the Burp explains five swallowing conditions in plain words. It is not
            medical advice and it cannot tell you what you have. Take the names and
            the tests to a doctor.
          </p>
        </div>
        <div className="ni-footer-cols">
          <nav aria-label="Conditions">
            <p className="ni-mono-label">Conditions</p>
            <Link href="/free-the-burp/conditions/r-cpd">R-CPD</Link>
            <Link href="/free-the-burp/conditions/a-cpd">A-CPD</Link>
            <Link href="/free-the-burp/conditions/zenkers">Zenker&rsquo;s</Link>
            <Link href="/free-the-burp/conditions/spasm">Spasm</Link>
            <Link href="/free-the-burp/conditions/achalasia">Achalasia</Link>
          </nav>
          <nav aria-label="More">
            <p className="ni-mono-label">More</p>
            <Link href="/free-the-burp/evidence">The evidence</Link>
            <Link href="/free-the-burp/trials">Recruiting trials</Link>
            <Link href="/free-the-burp/about">About and sources</Link>
            <a href="https://noburp.info/" rel="noopener">
              noburp.info clinician directory
            </a>
          </nav>
        </div>
      </div>
    </footer>
  );
}
