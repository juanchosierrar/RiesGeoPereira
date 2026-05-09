import type { NextConfig } from "next";
import createMDX from "@next/mdx";

const nextConfig: NextConfig = {
  output: "standalone",
  pageExtensions: ["js", "jsx", "md", "mdx", "ts", "tsx"],
  typescript: {
    // Allow production builds even with type errors to reduce RAM/time on Hostinger
    ignoreBuildErrors: true,
  },
  eslint: {
    // Skip ESLint during build to save time/memory on Hostinger
    ignoreDuringBuilds: true,
  },
  productionBrowserSourceMaps: false,
  experimental: {
    optimizePackageImports: ["lucide-react", "recharts"],
    // CRITICAL: Disable webpack worker to prevent crash on memory-constrained hosts
    webpackBuildWorker: false,
    // Single CPU thread to stay within Hostinger's RAM limits
    cpus: 1,
  },
  // Webpack tuning: disable parallel minification, increase reliability
  webpack: (config, { isServer }) => {
    config.parallelism = 1;

    // Disable TerserPlugin parallel threads (biggest RAM consumer)
    if (!isServer) {
      const TerserPlugin = config.optimization?.minimizer?.find(
        (p: { constructor?: { name?: string } }) => p.constructor?.name === "TerserPlugin"
      );
      if (TerserPlugin && (TerserPlugin as { options?: { parallel?: boolean } }).options) {
        (TerserPlugin as { options: { parallel: boolean } }).options.parallel = false;
      }
    }

    // Ignore optional heavy native modules that break on Linux builds
    config.resolve = config.resolve ?? {};
    config.resolve.fallback = {
      ...config.resolve.fallback,
      fs: false,
      net: false,
      tls: false,
    };

    return config;
  },
};

const withMDX = createMDX({});

export default withMDX(nextConfig);
