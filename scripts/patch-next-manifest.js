/**
 * Webpack plugin que normaliza os drive letters nos manifests do Next.js
 * para evitar o erro "error-boundary.js# no React Client Manifest" no Windows.
 *
 * O problema: o webpack no Windows resolve módulos com C:\ (maiúsculo)
 * mas o React Client Manifest é gerado com c:\ (minúsculo), causando mismatch.
 *
 * Este plugin hook no PROCESS_ASSETS_STAGE_OPTIMIZE para modificar os assets
 * enquanto o conteúdo ainda está disponível.
 */
class NormalizeManifestPlugin {
  apply(compiler) {
    compiler.hooks.thisCompilation.tap('NormalizeManifestPlugin', (compilation) => {
      compilation.hooks.processAssets.tap(
        {
          name: 'NormalizeManifestPlugin',
          stage: compiler.webpack.Compilation.PROCESS_ASSETS_STAGE_OPTIMIZE,
        },
        (assets) => {
          const manifests = Object.keys(assets).filter(
            (name) =>
              name.includes('react-loadable-manifest') ||
              name.includes('react-client-manifest') ||
              name.includes('build-manifest') ||
              name.endsWith('.json')
          )

          for (const name of manifests) {
            const asset = assets[name]
            if (!asset || !asset.source) continue

            let source = asset.source()
            if (typeof source !== 'string') {
              if (Buffer.isBuffer(source)) source = source.toString('utf-8')
              else continue
            }

            // Normaliza drive letter: C:\ -> c:\
            const normalized = source.replace(/"([a-zA-Z]):\\/g, (match, drive) => {
              return '"' + drive.toLowerCase() + ':\\'
            })

            if (normalized !== source) {
              const { RawSource } = compiler.webpack.sources || {}
              if (RawSource) {
                compilation.updateAsset(name, new RawSource(normalized))
              }
            }
          }
        }
      )
    })
  }
}

module.exports = NormalizeManifestPlugin