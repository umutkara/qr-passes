import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  reactCompiler: true,
  // Use Turbopack for better performance
  turbopack: {},
};

export default nextConfig;
