import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "standalone",
  transpilePackages: ["@venlaxiq/ui"],
};

export default nextConfig;
