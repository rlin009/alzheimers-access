import Link from "next/link";
export default function Footer() {
  return (
    <footer className="site-footer">
      <div className="footer-inner">
        <Link href="/" className="wordmark">
          Alzheimer’s Access
        </Link>
        <nav aria-label="Footer">
          <Link href="/how-it-works">How this works</Link>
          <Link href="/privacy">Privacy</Link>
        </nav>
      </div>
    </footer>
  );
}
