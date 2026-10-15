import Link from "next/link";
import {
  ArrowUpRight,
  ArrowRight,
  CircleHelp,
  ExternalLink,
} from "lucide-react";
import type { ReactNode } from "react";
import { LABELS, type Verdict } from "@/lib/model";
export function Badge({
  verdict,
  disputed = false,
}: {
  verdict: Verdict;
  disputed?: boolean;
}) {
  return (
    <span className="badge-group">
      <span className={`badge badge-${verdict.toLowerCase()}`}>
        <span className="badge-dot" />
        {LABELS[verdict]}
      </span>
      {disputed && <span className="badge badge-disputed">Disputed</span>}
    </span>
  );
}
export function Eyebrow({ children }: { children: ReactNode }) {
  return <div className="eyebrow">{children}</div>;
}
export function SectionHeading({
  index,
  title,
  children,
  href,
  linkLabel = "Explore records",
}: {
  index?: string;
  title: string;
  children?: ReactNode;
  href?: string;
  linkLabel?: string;
}) {
  return (
    <div className="section-heading">
      <div>
        {index && <span className="section-number">{index}</span>}
        <h2>{title}</h2>
        {children && <p>{children}</p>}
      </div>
      {href && (
        <Link className="text-link" href={href}>
          {linkLabel}
          <ArrowUpRight size={16} />
        </Link>
      )}
    </div>
  );
}
export function EmptyChart({
  title = "Evidence comes first.",
  children,
  compact = false,
}: {
  title?: string;
  children: ReactNode;
  compact?: boolean;
}) {
  return (
    <div className={`empty-chart ${compact ? "compact" : ""}`}>
      <div className="empty-chart-lines" aria-hidden="true">
        <i />
        <i />
        <i />
        <i />
      </div>
      <CircleHelp size={22} />
      <h3>{title}</h3>
      <p>{children}</p>
      <Link href="/methodology/" className="text-link">
        How scoring works <ArrowRight size={15} />
      </Link>
    </div>
  );
}
export function External({
  href,
  children,
}: {
  href: string;
  children: ReactNode;
}) {
  return (
    <a href={href} target="_blank" rel="noopener noreferrer">
      {children}
      <ExternalLink size={13} className="inline-icon" />
      <span className="sr-only"> (opens in a new tab)</span>
    </a>
  );
}
export function Notice({ children }: { children: ReactNode }) {
  return (
    <div className="notice">
      <span className="notice-mark">i</span>
      <div>{children}</div>
    </div>
  );
}
