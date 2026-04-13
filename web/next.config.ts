import type { NextConfig } from "next";
import createMDX from "@next/mdx";
import path from "path";

const nextConfig: NextConfig = {
  output: "standalone",
  pageExtensions: ["js", "jsx", "md", "mdx", "ts", "tsx"],
  typescript: {
    // !! WARN !!
    // Dangerously allow production builds to successfully complete even if
    // your project has type errors. This is to save RAM/Time during Hostinger build.
    ignoreBuildErrors: true,
  },
  eslint: {
    // Warning: This allows production builds to successfully complete even if
    // your project has ESLint errors. This saves RAM during Hostinger build.
    ignoreDuringBuilds: true,
  },
  productionBrowserSourceMaps: false, // Save memory during compilation
  experimental: {
    optimizePackageImports: ['lucide-react', 'recharts'],
    webpackBuildWorker: true, // Use a separate process for build tasks
    cpus: 1, // Limit parallelism to avoid exceeding RAM limits on Hostinger
  },
  turbopack: {
    root: path.resolve(__dirname),
  },
};

const withMDX = createMDX({});

export default withMDX(nextConfig);
