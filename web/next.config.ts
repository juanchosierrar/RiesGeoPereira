import type { NextConfig } from "next";
import createMDX from "@next/mdx";
import path from "path";

const nextConfig: NextConfig = {
  output: "standalone",
  pageExtensions: ["js", "jsx", "md", "mdx", "ts", "tsx"],
  experimental: {
    optimizePackageImports: ['lucide-react', 'recharts']
  },
  turbopack: {
    root: path.resolve(__dirname),
  },
};

const withMDX = createMDX({});

export default withMDX(nextConfig);
