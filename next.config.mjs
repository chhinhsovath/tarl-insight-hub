/** @type {import('next').NextConfig} */
const nextConfig = {
  // Production optimizations
  output: process.env.NODE_ENV === 'production' ? 'standalone' : undefined,
  compress: true,
  poweredByHeader: false,
  reactStrictMode: true,
  
  // Webpack configuration for better module resolution
  webpack: (config, { isServer }) => {
    // Ensure proper module resolution for @/ imports
    config.resolve.alias = {
      ...config.resolve.alias,
      '@': new URL('.', import.meta.url).pathname,
    }
    return config
  },
  
  // Development settings
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  
  // Image optimization
  images: {
    unoptimized: process.env.NODE_ENV === 'development',
    domains: ['localhost', 'your-domain.com'],
    formats: ['image/avif', 'image/webp'],
  },
  
  // Security headers
  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          {
            key: 'X-Frame-Options',
            value: 'DENY',
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff',
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
  
  // Redirects for common paths
  async redirects() {
    return [
      {
        source: '/admin',
        destination: '/dashboard',
        permanent: true,
      },
      {
        source: '/training/session/:id',
        destination: '/training/sessions/:id/overview',
        permanent: true,
      },
    ];
  },
}

export default nextConfig