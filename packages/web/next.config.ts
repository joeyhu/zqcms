import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  // Docker standalone mode (produces self-contained server.js)
  output: 'standalone',
  // Monorepo root for output tracing
  outputFileTracingRoot: process.cwd() + '/../..',
  images: {
    remotePatterns: [
      {
        protocol: 'http',
        hostname: 'localhost',
        port: '11003',
      },
      // Allow any production uploads domain
      {
        protocol: 'https',
        hostname: '**',
      },
    ],
  },
  // Security headers
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff',
          },
          {
            key: 'X-Frame-Options',
            value: 'SAMEORIGIN',
          },
          {
            key: 'X-XSS-Protection',
            value: '1; mode=block',
          },
          {
            key: 'Referrer-Policy',
            value: 'strict-origin-when-cross-origin',
          },
          {
            key: 'Permissions-Policy',
            value: 'camera=(), microphone=(), geolocation=()',
          },
        ],
      },
    ];
  },
};

export default nextConfig;
