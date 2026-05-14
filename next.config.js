/** @type {import('next').NextConfig} */
const isGhPages = process.env.GITHUB_PAGES === 'true';
const repo = 'dropforge';

const nextConfig = {
  reactStrictMode: true,
  // Static export for GitHub Pages. Comment `output: 'export'` out if deploying
  // to Vercel (where API routes work).
  output: isGhPages ? 'export' : undefined,
  basePath: isGhPages ? `/${repo}` : undefined,
  assetPrefix: isGhPages ? `/${repo}/` : undefined,
  trailingSlash: isGhPages,
  images: {
    unoptimized: true,
    remotePatterns: [{ protocol: 'https', hostname: '**' }],
  },
  webpack: (config) => {
    config.resolve.fallback = { fs: false, net: false, tls: false };
    return config;
  },
};

module.exports = nextConfig;
