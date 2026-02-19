import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  transpilePackages: ['@contexta/shared', '@contexta/slate-converters'],
  output: 'standalone',
};

export default nextConfig;
