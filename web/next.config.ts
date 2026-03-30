import type { NextConfig } from "next";
import createMDX from "@next/mdx";

const nextConfig: NextConfig = {
  output: "standalone",
  pageExtensions: ["js", "jsx", "md", "mdx", "ts", "tsx"],
  // reactCompiler was causing Turbopack panic with Tailwind v4 PostCSS
  // reactCompiler: true,
};

const withMDX = createMDX({});

export default withMDX(nextConfig);
