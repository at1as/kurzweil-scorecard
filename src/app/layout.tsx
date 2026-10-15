import type { Metadata } from "next";
import Link from "next/link";
import "@fontsource-variable/inter";
import "@fontsource-variable/newsreader";
import "./globals.css";
import { Navigation } from "@/components/navigation";
import { AS_OF_LABEL, datasetVersion } from "@/lib/data";
export const metadata: Metadata = {
  title: {
    default: "Ray Kurzweil Prediction Scorecard",
    template: "%s · Kurzweil Scorecard",
  },
  description:
    "An evidence-based audit of technological forecasting. Explore the research intake, original deadlines, evidence, and transparent scoring methodology.",
  robots: { index: true, follow: true },
};
export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>
        <a href="#main" className="skip-link">
          Skip to content
        </a>
        <Navigation />
        <main id="main">{children}</main>
        <footer className="site-footer">
          <div>
            <Link href="/" className="footer-brand">
              The Kurzweil Scorecard
              <span>Independent research. Transparent criteria.</span>
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
            <a href="/data/predictions.json" download>
              Canonical JSON ↗
            </a>
          </div>
          <div className="footer-bottom">
            Good forecasts deserve careful scrutiny. So do the scorecards.
          </div>
        </footer>
      </body>
    </html>
  );
}
