import type { Metadata } from "next";
import "@fontsource-variable/dm-sans";
import Header from "../components/header";
import Footer from "../components/footer";
import "../globals.css";

export const metadata: Metadata = {
  title: { default: "Alzheimer's Access", template: "%s | Alzheimer's Access" },
  description:
    "Find Alzheimer's and dementia clinical trials to ask about, plus local care support and respite resources for families.",
};

export default function AlzLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <a className="skip-link" href="#main-content">
        Skip to content
      </a>
      <Header />
      {children}
      <Footer />
    </>
  );
}
