import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  reactCompiler: true,
  // Configure Turbopack to handle Cyrillic paths
  turbopack: {
    root: process.cwd(),
  },
};

export default nextConfig;
