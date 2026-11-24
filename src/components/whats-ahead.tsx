import Link from "next/link";
import { ArrowRight } from "lucide-react";
import type { UpcomingBet } from "@/lib/ledger-data";
import { EvidenceLink } from "./evidence-panel";
import { Eyebrow } from "./ui";

const FEATURED_IDS = ["K036", "K021", "K045", "K042", "K024", "K022"];

function progressLabel(progress: UpcomingBet["progress"]) {
  if (progress === "PARTLY_FULFILLED") return "Partial progress";
  if (progress === "FULFILLED") return "Early milestone";
  return "Not yet realized";
}

function BetRow({ bet }: { bet: UpcomingBet }) {
  return (
    <li className="ahead-row">
      <span className="ahead-year">{bet.year}</span>
      <div className="ahead-claim">
        <EvidenceLink predictionId={bet.id}>
          <span className="field-record-id">{bet.id}</span>
          {bet.claim}
        </EvidenceLink>
        <span className="ahead-field">{bet.category}</span>
      </div>
      <span
        className={`ahead-status ${bet.progress === "PARTLY_FULFILLED" ? "is-partial" : ""}`}
      >
        {progressLabel(bet.progress)}
      </span>
    </li>
  );
}

export function WhatsAhead({ bets }: { bets: UpcomingBet[] }) {
  const featured = FEATURED_IDS.map((id) => bets.find((b) => b.id === id)!).filter(
    Boolean,
  );
  const featuredSet = new Set(featured.map((b) => b.id));
  const rest = bets.filter((b) => !featuredSet.has(b.id));

  return (
    <section
      id="whats-ahead"
      className="story-section ahead-section"
      aria-labelledby="ahead-heading"
    >
      <div className="story-section-heading">
        <Eyebrow>STILL OPEN · 2026–2045</Eyebrow>
        <h2 id="ahead-heading">What’s still ahead</h2>
        <p>
          {bets.length} predictions haven’t reached their deadlines yet—including
          Kurzweil’s most famous bets on human-level AI, longevity escape
          velocity, clean energy, and the 2045 Singularity. Select any row to
          check where things stand today.
        </p>
      </div>
      <ol className="ahead-list">
        {featured.map((bet) => (
          <BetRow key={bet.id} bet={bet} />
        ))}
      </ol>
      {rest.length > 0 && (
        <details className="editorial-disclosure ahead-more">
          <summary>Show all {bets.length} upcoming predictions</summary>
          <ol className="ahead-list ahead-list-rest">
            {rest.map((bet) => (
              <BetRow key={bet.id} bet={bet} />
            ))}
          </ol>
        </details>
      )}
      <div className="ahead-footer">
        <Link
          prefetch={false}
          className="text-link"
          href="/predictions/?view=future"
        >
          Browse all {bets.length} upcoming predictions{" "}
          <ArrowRight size={15} aria-hidden="true" />
        </Link>
      </div>
    </section>
  );
}
