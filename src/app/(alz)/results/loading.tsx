import PageHeading from "../../components/page-heading";
export default function Loading() {
  return (
    <main id="main-content" className="page-shell results-page">
      <PageHeading title="Your trial matches" />
      <p className="loading-text" role="status">
        Loading trial listings…
      </p>
    </main>
  );
}
