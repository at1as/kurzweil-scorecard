import { AUTHOR_HOME, AUTHOR_BLOG, sitePath } from "@/lib/site-path";
import { ArrowRight } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import "@fontsource-variable/inter";
import "@fontsource-variable/newsreader";
import "./globals.css";
import { EvidenceProvider } from "@/components/evidence-panel";
import { Navigation } from "@/components/navigation";
import { AS_OF_LABEL, datasetVersion } from "@/lib/data";
export const metadata: Metadata = {
  title: {
    default: "Ray Kurzweil Prediction Scorecard",
    template: "%s · Kurzweil Scorecard",
  },
  description:
    "Where was Ray Kurzweil right? Compare 84 predictions by field, see what arrived on time or late, and inspect the evidence behind each judgment.",
  robots: { index: true, follow: true },
};
export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>
        <EvidenceProvider>
          <a href="#main" className="skip-link">
            Skip to content
          </a>
          <Navigation />
          <main id="main">{children}</main>
          <footer className="site-footer">
            <div>
              <Link href="/" className="footer-brand">
                The Kurzweil Scorecard
                <span>Predictions, judgments, and the evidence.</span>
              </Link>
              <p>
                An independent project. Not affiliated with Ray Kurzweil.
                <br />
                Research snapshot: {AS_OF_LABEL} · Dataset v{datasetVersion}
              </p>
            </div>
            <div className="footer-links">
              <Link href="/methodology/">Methodology</Link>
              <Link href="/sources/">Source coverage</Link>
              <a href={sitePath("/data/predictions.json")} download>
                Canonical JSON ↗
              </a>
            </div>
            <div className="footer-author">
              <div>
                <p>
                  Built by <a href={AUTHOR_HOME}>Jason Willems</a>.
                </p>
                <span>I write about software, AI and building products.</span>
              </div>
              <a className="author-cta" href={AUTHOR_BLOG}>
                Read my blog <ArrowRight size={15} aria-hidden="true" />
              </a>
            </div>
            <div className="footer-bottom">
              AI-assisted research · Selected forecasts · All assessments and
              source history available
            </div>
          </footer>
        </EvidenceProvider>
      </body>
    </html>
  );
}
