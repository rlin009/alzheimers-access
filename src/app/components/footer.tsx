import Link from "next/link";

export default function Footer() {
  return (
    <footer className="site-footer">
      <div className="footer-inner">
        <Link href="/" className="wordmark">
          Free the Burp
        </Link>
        <nav aria-label="Footer">
          <Link href="/how-it-works">How this works</Link>
          <Link href="/privacy">Privacy</Link>
        </nav>
        <p className="copyright">
          &copy; 2026 Free the Burp. All rights reserved.
        </p>
      </div>
    </footer>
  );
}
