import type { NextConfig } from 'next';
import withMDX from '@next/mdx';

const withMDXConfig = withMDX({
  extension: /\.mdx$/,
  options: {
    remarkPlugins: [],
    rehypePlugins: [],
    providerImportSource: '@mdx-js/react',
  },
})({
  pageExtensions: ['js', 'jsx', 'ts', 'tsx', 'md', 'mdx'],
  reactStrictMode: true,
});

export default withMDXConfig as NextConfig;