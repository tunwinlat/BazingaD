import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Disable powered by header
  poweredByHeader: false,
  
  // Compress responses
  compress: true,
  
  // Configure images with optimization
  images: {
    formats: ['image/avif', 'image/webp'],
    remotePatterns: [],
    minimumCacheTTL: 60,
  },
  
  // Enable React strict mode for better development
  reactStrictMode: true,
  
  // Turbopack configuration
  turbopack: {
    // Empty config to enable Turbopack explicitly
  },
  
  // Custom headers for security and caching
  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          {
            key: 'X-DNS-Prefetch-Control',
            value: 'on',
          },
          {
            key: 'Permissions-Policy',
            value: 'microphone=(), camera=(), payment=(), usb=(), vr=()',
          },
        ],
      },
      {
        source: '/api/:path*',
        headers: [
          {
            key: 'Cache-Control',
            value: 'no-store, max-age=0',
          },
        ],
      },
    ];
  },
};

export default nextConfig;
