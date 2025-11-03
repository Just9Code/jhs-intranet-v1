import type { NextConfig } from "next";
import path from "node:path";
import fs from "node:fs";

const LOADER = path.resolve(__dirname, 'src/visual-edits/component-tagger-loader.js');
const loaderExists = fs.existsSync(LOADER);

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**',
      },
      {
        protocol: 'http',
        hostname: '**',
      },
    ],
  },
  typescript: {
    ignoreBuildErrors: false,
  },
  eslint: {
    ignoreDuringBuilds: false,
  },
  // Only enable turbopack loader if the file exists (Orchids environment)
  ...(loaderExists && {
    turbopack: {
      rules: {
        "*.{jsx,tsx}": {
          loaders: [LOADER]
        }
      }
    }
  })
};

export default nextConfig;
// Orchids restart: 1762113797497