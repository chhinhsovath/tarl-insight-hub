/** @type {import('next').NextConfig} */
const nextConfig = {
  // Static export for cPanel hosting
  output: 'export',
  trailingSlash: true,
  skipTrailingSlashRedirect: true,
  distDir: 'out',
  
  // Disable server-side features for static hosting
  images: {
    unoptimized: true,
  },
  
  // Base path configuration (update with your domain path if needed)
  // basePath: '/tarl-insight-hub', // Uncomment if deploying to a subdirectory
  
  // Asset prefix for proper loading
  // assetPrefix: '/tarl-insight-hub/', // Uncomment if using subdirectory
  
  // Disable server-side features
  experimental: {
    missingSuspenseWithCSRBailout: false,
  },
  
  // Security headers (may not work on all shared hosting)
  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          {
            key: 'X-Frame-Options',
            value: 'SAMEORIGIN',
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff',
          },
        ],
      },
    ];
  },
}

export default nextConfig