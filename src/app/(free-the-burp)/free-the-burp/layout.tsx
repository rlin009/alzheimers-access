import type { Metadata } from "next";
import "@fontsource-variable/archivo/wdth.css";
import "@fontsource-variable/source-serif-4/opsz.css";
import "@fontsource-variable/source-serif-4/opsz-italic.css";
import "@fontsource/ibm-plex-mono/400.css";
import "@fontsource/ibm-plex-mono/500.css";
import "./nameit.css";
import { NiFooter, NiHeader } from "./_components/chrome";

export const metadata: Metadata = {
  title: { default: "Free the Burp", template: "%s | Free the Burp" },
  description:
    "Five swallowing conditions in plain words. Start from what you notice, find the name to ask about, and the test to ask for.",
};

export default function FreeTheBurpLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="ni">
      <a className="ni-skip" href="#main">
        Skip to content
      </a>
      <NiHeader />
      {children}
      <NiFooter />
    </div>
  );
}
