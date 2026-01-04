import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  reactCompiler: true,
  // Force webpack usage to avoid Turbopack issues with Cyrillic paths
  webpack: (config, { isServer }) => {
    return config;
  },
  // Ensure experimental features are disabled for webpack compatibility
  experimental: {
    // Disable features that might conflict with webpack
  },
};

export default nextConfig;
