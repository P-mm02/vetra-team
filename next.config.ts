import type { NextConfig } from "next";
import seedMedia from "./src/lib/cms/project-seed-media.json";

const cloudNames = [...new Set([
  process.env.CLOUDINARY_CLOUD_NAME,
  ...seedMedia.map(({ src }) => new URL(src).pathname.split("/")[1]),
].filter((name): name is string => Boolean(name)))];

const nextConfig: NextConfig = {
  /* config options here */
  reactCompiler: true,
  distDir: process.env.CMS_ISOLATED_TEST === 'true' ? '.next-cms-test' : '.next',
  agentRules: false,
  images: { remotePatterns: cloudNames.map(name => ({ protocol: 'https', hostname: 'res.cloudinary.com', pathname: `/${name}/image/upload/**` })) },
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
        source: '/cms',
        destination: '/admin/cms',
        permanent: true,
      },
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
