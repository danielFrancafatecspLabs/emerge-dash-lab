/**
 * Script para gerar o cache de classificação de portfólio (EBITDA/NPS/Receita)
 * sem precisar do Jira.
 *
 * Lê os experimentos do arquivo data/posts.json (ou de outro arquivo local)
 * e chama o classifyPortfolios para cada um, salvando o cache.
 *
 * COMO USAR:
 *   npx tsx scripts/generate-classification-cache.ts
 */

import { classifyPortfolios } from '../src/lib/portfolio-classifier'
import type { EpicClassifyInput } from '../src/lib/portfolio-classifier'

/** Os JSONs locais não têm um formato fixo: lê cada entrada como um registro solto. */
const registros = (dados: unknown): Record<string, unknown>[] =>
  (Array.isArray(dados) ? dados : dados && typeof dados === 'object' ? Object.values(dados) : [])
    .filter((x): x is Record<string, unknown> => !!x && typeof x === 'object')

const texto = (...valores: unknown[]) => valores.find((v): v is string => typeof v === 'string') ?? ''

async function main() {
  console.log('=== Gerando cache de classificação de portfólio ===\n')

  // Tenta carregar dados de experimentos de fontes locais
  let epics: EpicClassifyInput[] = []

  // 1. Tenta ler de data/posts.json (formato comunidade)
  try {
    const posts = await import('../data/posts.json', { with: { type: 'json' } })
    for (const post of registros(posts.default)) {
      if (typeof post.experimentoKey === 'string' && post.experimentoKey) {
        epics.push({
          key: post.experimentoKey,
          summary: texto(post.titulo, post.summary, post.content),
          dominio: texto(post.dominio) || null,
        })
      }
    }
    console.log(`  → Carregados ${epics.length} epics de data/posts.json`)
  } catch {
    console.log('  → data/posts.json não encontrado ou sem dados de experimentos')
  }

  // 2. Tenta ler de data/beneficios.json
  if (epics.length === 0) {
    try {
      const beneficios = await import('../data/beneficios.json', { with: { type: 'json' } })
      for (const item of registros(beneficios.default)) {
        if (typeof item.key === 'string' && item.key) {
          epics.push({
            key: item.key,
            summary: texto(item.nome, item.summary, item.titulo),
            dominio: texto(item.dominio) || null,
          })
        }
      }
      console.log(`  → Carregados ${epics.length} epics de data/beneficios.json`)
    } catch {
      console.log('  → data/beneficios.json não encontrado')
    }
  }

  if (epics.length === 0) {
    console.log('\n⚠ Nenhum experimento encontrado em fontes locais.')
    console.log('  O cache será gerado automaticamente quando a página de estratégia')
    console.log('  for acessada com o Jira funcionando.')
    console.log('\n  Para testar manualmente, forneça alguns experimentos:')
    console.log('    npx tsx scripts/generate-classification-cache.ts')
    return
  }

  console.log(`\n  Classificando ${epics.length} experimentos via LLM...`)
  console.log('  (Isso pode levar alguns segundos)\n')

  const resultado = await classifyPortfolios(epics)

  const categorias = Object.values(resultado)
  const countEbitda = categorias.filter(c => c === 'EBITDA').length
  const countNps = categorias.filter(c => c === 'NPS').length
  const countReceita = categorias.filter(c => c === 'Receita').length
  const total = categorias.length

  console.log(`\n=== Distribuição ===`)
  console.log(`  EBITDA: ${countEbitda} (${Math.round(countEbitda / total * 100)}%)`)
  console.log(`  NPS:    ${countNps} (${Math.round(countNps / total * 100)}%)`)
  console.log(`  Receita: ${countReceita} (${Math.round(countReceita / total * 100)}%)`)
  console.log(`  Total:  ${total}`)
  console.log(`\n✅ Cache salvo em .portfolio-cache.json`)
}

main().catch(err => {
  console.error('\n=== ERRO ===')
  console.error(err.message)
  process.exit(1)
})