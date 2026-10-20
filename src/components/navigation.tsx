"use client";
import { AUTHOR_BLOG } from "@/lib/site-path";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { ArrowUpRight } from "lucide-react";
export function Navigation() {
  const path = usePathname();
  const items = [
    ["/", "The story"],
    ["/predictions/", "Predictions"],
    ["/methodology/", "Methodology"],
    ["/sources/", "Sources"],
  ];
  return (
    <header className="site-header">
      <div className="header-inner">
        <Link href="/" className="brand" aria-label="Kurzweil Scorecard home">
          <span className="brand-symbol" aria-hidden="true">
            k<span>.</span>
          </span>
          <span>
            THE KURZWEIL
            <br />
            <strong>SCORECARD</strong>
          </span>
        </Link>
        <nav aria-label="Main navigation">
          {items.map(([href, label]) => (
            <Link
              key={href}
              href={href}
              aria-current={
                (
                  href === "/"
                    ? path === "/"
                    : path.startsWith(href.slice(0, -1))
                )
                  ? "page"
                  : undefined
              }
            >
              {label}
            </Link>
          ))}
        </nav>
        <a href={AUTHOR_BLOG} className="author-cta header-author">
          More from Jason <ArrowUpRight size={15} aria-hidden="true" />
        </a>
      </div>
    </header>
  );
}
