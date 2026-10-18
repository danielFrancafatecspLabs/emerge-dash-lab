import NormalizeManifestPlugin from './scripts/patch-next-manifest.js'

// Cabeçalhos de segurança aplicados a todas as respostas.
const SECURITY_HEADERS = [
  // Restrições que não dependem de scripts: sem embutir o app em outros sites, sem <object>, formulários só para cá.
  { key: 'Content-Security-Policy', value: "frame-ancestors 'none'; object-src 'none'; base-uri 'self'; form-action 'self'" },
  { key: 'X-Frame-Options', value: 'DENY' },
  { key: 'X-Content-Type-Options', value: 'nosniff' },
  { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
  { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=(), payment=()' },
]

/** @type {import('next').NextConfig} */
const nextConfig = {
  basePath: '/jira',
  poweredByHeader: false,
  async headers() {
    return [{ source: '/:path*', headers: SECURITY_HEADERS }]
  },
  // Aumenta o timeout para 60s (máximo no plano Pro da Vercel).
  // Necessário porque o fetch de changelogs do Jira pode ser lento.
  experimental: {
    serverActions: {
      bodySizeLimit: '2mb',
    },
    // Keep native/server-only packages out of the Next.js 14 webpack bundle.
    serverComponentsExternalPackages: ['@react-pdf/renderer', '@resvg/resvg-js', 'pptxgenjs'],
    // O PPTX da Semanal usa a arte e os ícones de public/semanal, lidos do disco em tempo de execução.
    outputFileTracingIncludes: { '/api/semanal/pptx': ['./public/semanal/**'] },
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
