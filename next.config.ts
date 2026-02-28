import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Security headers are handled by middleware.ts
  // This ensures they apply to all routes including API routes
  
  // Disable powered by header
  poweredByHeader: false,
  
  // Compress responses
  compress: true,
  
  // Configure images
  images: {
    formats: ['image/avif', 'image/webp'],
    remotePatterns: [],
  },
  
  // Experimental features
  experimental: {
    // Enable if needed
  },
};

export default nextConfig;
