import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  reactCompiler: true,
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
