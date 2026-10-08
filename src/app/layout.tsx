import type { Metadata } from "next";

// The site holds two separate projects: Alzheimer's Access, in app/(alz),
// and Free the Burp, in app/(free-the-burp). Each group has its own layout, fonts and
// styles, and they do not link to each other's navigation. This root layout
// only provides the document shell they share.
export const metadata: Metadata = {
  referrer: "no-referrer",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
