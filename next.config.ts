import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  reactCompiler: true,
  async redirects() {
    return [
      // http -> https for apex
      {
        source: '/:path*',
        has: [{ type: 'host', value: 'vetra.asia' }],
        missing: [{ type: 'header', key: 'x-forwarded-proto' }],
        destination: 'https://vetra.asia/:path*',
        permanent: true,
      },

      // www -> apex (covers https://www and http://www after the next rule)
      {
        source: '/:path*',
        has: [{ type: 'host', value: 'www.vetra.asia' }],
        destination: 'https://vetra.asia/:path*',
        permanent: true,
      },

      // http://www -> https://apex in one hop (best)
      {
        source: '/:path*',
        has: [{ type: 'host', value: 'www.vetra.asia' }],
        missing: [{ type: 'header', key: 'x-forwarded-proto' }],
        destination: 'https://vetra.asia/:path*',
        permanent: true,
      },
    ]
  },
}

export default nextConfig;
