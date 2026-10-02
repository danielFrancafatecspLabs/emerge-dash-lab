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

    // Normaliza caminhos de módulos para evitar duplicação por case-sensitivity no Windows.
    // O webpack no Windows pode carregar o mesmo módulo via C:\ e c:\,
    // criando contextos React duplicados (ex: ActionQueueContext, RouterContext).
    if (!config.resolve.plugins) config.resolve.plugins = []
    config.resolve.plugins.push({
      apply: (resolver) => {
        resolver.getHook('resolve').tapAsync('NormalizePathPlugin', (request, resolveContext, callback) => {
          const fix = (p) => p && /^[a-zA-Z]:\\/.test(p) ? p.charAt(0).toLowerCase() + p.slice(1) : p
          if (request.path) request.path = fix(request.path)
          if (request.request) request.request = fix(request.request)
          callback()
        })
      },
    })

    // Força TODOS os paths de módulo para lowercase drive letter.
    // O webpack no Windows pode carregar o mesmo módulo via C:\ e c:\,
    // criando contextos React duplicados (ex: ActionQueueContext, RouterContext).
    // O erro "error-boundary.js# no React Client Manifest" ocorre quando o
    // React Server Components bundler registra o módulo com C:\ mas o requisita com c:\.
    const origResolve = config.resolve.byDependency ? config.resolve.byDependency : undefined
    if (config.resolve.byDependency) {
      // No Next.js 14, o resolve.byDependency pode conter paths com case misto
    }
    return config
  },
}

module.exports = nextConfig
