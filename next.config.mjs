/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  experimental: {
    // Next.js 14: externalize Prisma for App Router (avoids bundler issues)
    serverComponentsExternalPackages: ["@prisma/client"],
  },
};

export default nextConfig;
