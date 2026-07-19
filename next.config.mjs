/** @type {import('next').NextConfig} */
const nextConfig = {
  basePath: '/jira',
  webpack: (config) => {
    // @react-pdf/renderer needs these Node.js modules
    config.resolve.alias = {
      ...config.resolve.alias,
      canvas: false,
      encoding: false,
    }
    return config
  },
  // Allow @react-pdf/renderer to use Node.js APIs
  serverExternalPackages: ['@react-pdf/renderer'],
}

export default nextConfig
