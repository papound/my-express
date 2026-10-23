import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "standalone",
  serverExternalPackages: ["puppeteer", "dbffile"],
  experimental: {
    // Allow server-only packages
  },
};

export default nextConfig;

