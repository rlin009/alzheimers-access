import Link from "next/link";
import PageHeading from "./page-heading";
export default function Recovery({
  title,
  children,
  retry,
}: {
  title: string;
  children: React.ReactNode;
  retry?: string;
}) {
  return (
    <main id="main-content" className="page-shell state-page">
      <PageHeading title={title} />
      <div className="state-content">
        <p>{children}</p>
        <div className="actions">
          {retry && (
            <a className="button button-indigo" href={retry}>
              Try again
            </a>
          )}
          <Link className="button button-butter" href="/start">
            Start a new search
          </Link>
          <a
            className="text-action"
            href="https://clinicaltrials.gov/search?cond=Alzheimer%20Disease&aggFilters=status:rec"
          >
            Search ClinicalTrials.gov
          </a>
        </div>
      </div>
    </main>
  );
}
