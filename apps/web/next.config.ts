import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  transpilePackages: ['@knowra/shared', '@knowra/slate-converters'],
  output: 'standalone',
  devIndicators: false
};

export default nextConfig;
