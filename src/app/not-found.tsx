import Link from "next/link";
export default function NotFound() {
  return (
    <div className="container page-container">
      <div className="page-intro">
        <div className="eyebrow">404 · RECORD NOT FOUND</div>
        <h1>This page isn’t in the ledger.</h1>
        <p>
          Return to the scorecard to find a prediction by its stable record ID.
        </p>
        <Link className="button button-primary" href="/predictions/">
          Explore the predictions →
        </Link>
      </div>
    </div>
  );
}
