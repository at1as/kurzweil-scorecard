"use client";

import { useEffect } from "react";

const TAG = "G-Q5N6H3PVG2";
const ORIGIN = "https://www.jasonwillems.com";
const BASE = "/sites/kurzweil";

type AnalyticsWindow = Window & {
  dataLayer?: unknown[];
  gtag?: (...args: unknown[]) => void;
  __publicAnalyticsLoaded?: boolean;
};

/** Initialize the public tag once. Enhanced Measurement handles subsequent navigation. */
export function PageViews() {
  useEffect(() => {
    if (
      process.env.NEXT_PUBLIC_SITE_BASE_PATH !== BASE ||
      window.location.origin !== ORIGIN ||
      !window.location.pathname.startsWith(`${BASE}/`)
    )
      return;
    const browser = window as AnalyticsWindow;
    if (browser.__publicAnalyticsLoaded) return;
    browser.__publicAnalyticsLoaded = true;
    browser.dataLayer = browser.dataLayer ?? [];
    browser.gtag =
      browser.gtag ??
      function () {
        browser.dataLayer!.push(arguments);
      };
    browser.gtag("consent", "default", {
      analytics_storage: "granted",
      ad_storage: "denied",
      ad_user_data: "denied",
      ad_personalization: "denied",
    });
    browser.gtag("js", new Date());
    // Use Google’s native URL handling for Enhanced Measurement navigation.
    // Never attach calculator values or application state.
    browser.gtag("config", TAG, {
      allow_google_signals: false,
      allow_ad_personalization_signals: false,
      allow_enhanced_conversions: false,
    });
    const script = document.createElement("script");
    script.async = true;
    script.src = `https://www.googletagmanager.com/gtag/js?id=${TAG}`;
    script.referrerPolicy = "origin";
    document.head.appendChild(script);
  }, []);
  return null;
}
