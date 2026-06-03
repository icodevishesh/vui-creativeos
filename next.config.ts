import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  experimental: {
    // Increase body size limit for designer file uploads (multiple platform files can exceed 10MB default)
    proxyClientMaxBodySize: "2000mb",
  },
};

export default nextConfig;
