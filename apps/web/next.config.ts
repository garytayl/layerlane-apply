import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  transpilePackages: ["@layerlane/core"],
  serverExternalPackages: ["@electric-sql/pglite"],
};

export default nextConfig;
