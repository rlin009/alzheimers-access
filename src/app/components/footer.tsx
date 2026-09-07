// src/app/components/footer.tsx
import Link from "next/link";

export default function Footer() {
  return (
    <footer
      style={{
        borderTop: "1px solid #dddddd",
        padding: "1.5rem",
        backgroundColor: "#ffffff",
      }}
    >
      <nav
        style={{
          display: "flex",
          flexWrap: "wrap",
          justifyContent: "center",
          gap: "1.5rem",
          maxWidth: "42rem",
          margin: "0 auto",
        }}
      >
        <Link
          href="/how-it-works"
          style={{
            fontSize: "1rem",
            fontWeight: 700,
            color: "#111111",
            textDecoration: "underline",
            padding: "0.5rem",
            minHeight: "44px",
            display: "flex",
            alignItems: "center",
          }}
        >
          How this works
        </Link>
        <Link
          href="/privacy"
          style={{
            fontSize: "1rem",
            fontWeight: 700,
            color: "#111111",
            textDecoration: "underline",
            padding: "0.5rem",
            minHeight: "44px",
            display: "flex",
            alignItems: "center",
          }}
        >
          Privacy
        </Link>
      </nav>
    </footer>
  );
}
