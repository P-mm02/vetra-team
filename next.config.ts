import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  reactCompiler: true,
  agentRules: false,
  images: { remotePatterns: process.env.CLOUDINARY_CLOUD_NAME ? [{ protocol: 'https', hostname: 'res.cloudinary.com', pathname: `/${process.env.CLOUDINARY_CLOUD_NAME}/image/upload/**` }] : [] },
  async headers() {
    return [{ source: '/pay/:path*', headers: [
      { key: 'Referrer-Policy', value: 'no-referrer' },
      { key: 'X-Robots-Tag', value: 'noindex, nofollow, noarchive' },
      { key: 'Cache-Control', value: 'private, no-store' },
    ] }]
  },
  async redirects() {
    return [
      {
        source: '/:path*',
        has: [{ type: 'host', value: 'www.vetra.asia' }],
        destination: 'https://vetra.asia/:path*',
        permanent: true,
      },
    ]
  },
}

export default nextConfig;
