import type { NextConfig } from "next";
const config: NextConfig = {
  output: "export",
  basePath: process.env.NEXT_PUBLIC_SITE_BASE_PATH ?? "",
  // Keep the root-path preview intact while preparing a subpath bundle.
  distDir:
    process.env.PUBLIC_SITE_EXPORT === "1" ? "work/public-build" : ".next",
  generateBuildId: async () => process.env.PUBLIC_SITE_BUILD_ID ?? null,
  productionBrowserSourceMaps: false,
  turbopack: { root: process.cwd() },
  trailingSlash: true,
  images: { unoptimized: true },
  poweredByHeader: false,
};
export default config;
