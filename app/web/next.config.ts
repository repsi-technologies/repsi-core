import type { NextConfig } from "next";
import path from "path";

const nextConfig: NextConfig = {
  devIndicators: false,
  images: {
    unoptimized: true,
  },
  turbopack: {
    root: path.resolve(__dirname, "../../"),
  },
};

export default nextConfig;
