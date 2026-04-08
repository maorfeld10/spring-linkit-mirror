/** @type {import('next').NextConfig} */
const nextConfig = {
  typescript: {
    // TODO: Fix all TS errors and remove this flag
    ignoreBuildErrors: true,
  },
  eslint: {
    // TODO: Fix all ESLint warnings and remove this flag
    ignoreDuringBuilds: true,
  },
};

export default nextConfig;
