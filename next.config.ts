import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  turbopack: {
    root: __dirname,
  },
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "pub-564ebedfa7bb43c5a16bf3db65cbe281.r2.dev",
      },
    ],
  },
};

export default nextConfig;
