import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  transpilePackages: ['@contexta/shared'],
  output: 'standalone',
};

export default nextConfig;
