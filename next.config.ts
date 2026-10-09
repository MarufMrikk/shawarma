import type { NextConfig } from "next";

// NEXT_PUBLIC_DEMO=1 builds the static customer-side demo for GitHub Pages (see scripts/build-demo.mjs).
const isDemo = process.env.NEXT_PUBLIC_DEMO === "1";

const nextConfig: NextConfig = {
  ...(isDemo && {
    output: "export",
    basePath: process.env.DEMO_BASE_PATH || undefined,
    trailingSlash: true,
    images: { unoptimized: true },
  }),
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
};

export default nextConfig;
