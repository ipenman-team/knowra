import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  transpilePackages: ['@knowra/shared', '@knowra/slate-converters'],
  output: 'standalone',
};

export default nextConfig;
