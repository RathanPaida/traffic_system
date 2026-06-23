import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Fix: suppress multiple lockfile warning by setting workspace root
  experimental: {
    turbo: {
      root: __dirname,
    },
  },
};

export default nextConfig;
