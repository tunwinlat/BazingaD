import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Disable powered by header
  poweredByHeader: false,
  
  // Compress responses
  compress: true,
  
  // Configure images
  images: {
    formats: ['image/avif', 'image/webp'],
    remotePatterns: [],
  },
  
  // Custom headers to add security headers and remove informational ones
  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          {
            key: 'X-DNS-Prefetch-Control',
            value: 'on',
          },
        ],
      },
    ];
  },
  
  // Experimental features
  experimental: {
    // Enable if needed
  },
};

export default nextConfig;
