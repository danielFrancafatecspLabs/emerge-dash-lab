import NormalizeManifestPlugin from './scripts/patch-next-manifest.js'

/** @type {import('next').NextConfig} */
const nextConfig = {
  typescript: { ignoreBuildErrors: true },
  basePath: '/jira',
  // Aumenta o timeout para 60s (máximo no plano Pro da Vercel).
  // Necessário porque o fetch de changelogs do Jira pode ser lento.
  experimental: {
    serverActions: {
      bodySizeLimit: '2mb',
    },
    // Keep native/server-only packages out of the Next.js 14 webpack bundle.
    serverComponentsExternalPackages: ['@react-pdf/renderer', '@resvg/resvg-js'],
  },
  webpack: (config) => {
    // @react-pdf/renderer needs these Node.js modules
    config.resolve.alias = {
      ...config.resolve.alias,
      canvas: false,
      encoding: false,
    }

    // Normaliza drive letters nos manifests do Next.js para evitar
    // o erro "error-boundary.js# no React Client Manifest" no Windows.
    config.plugins.push(new NormalizeManifestPlugin())

    return config
  },
}

export default nextConfig
