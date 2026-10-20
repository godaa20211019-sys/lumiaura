import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* 全站皆為前端渲染（無 API / SSR），直接輸出靜態檔，可部署到任何靜態主機（Render Static Site、GitHub Pages…） */
  output: "export",
  images: { unoptimized: true },
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
};

export default nextConfig;
