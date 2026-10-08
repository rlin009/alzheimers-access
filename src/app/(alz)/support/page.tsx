import type { Metadata } from "next";
import { getSupportProviders } from "@/lib/support";
import PageHeading from "../../components/page-heading";
import SupportDirectory from "./support-directory";
export const metadata: Metadata = { title: "Local support" };
export default async function SupportPage() {
  const providers = await getSupportProviders();
  return (
    <main id="main-content" className="page-shell support-page">
      <PageHeading title="Find local support">
        <p>Find an organization to talk to about day-to-day care.</p>
      </PageHeading>
      <SupportDirectory providers={providers} />
    </main>
  );
}
