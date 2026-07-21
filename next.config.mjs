/** @type {import('next').NextConfig} */
const nextConfig = {
  basePath: '/jira',
  // Aumenta o timeout para 60s (máximo no plano Pro da Vercel).
  // Necessário porque o fetch de changelogs do Jira pode ser lento.
  experimental: {
    serverActions: {
      bodySizeLimit: '2mb',
    },
  },
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
