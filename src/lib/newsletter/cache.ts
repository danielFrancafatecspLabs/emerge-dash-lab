import { comCache } from '@/lib/cache-dados'
import { gerarEdicao, type Edicao } from './edicao'
import { registrarEdicao } from './historico'

/**
 * Edição da newsletter com cache no servidor (memória e disco): renovada no máximo a cada 6 horas, em segundo plano.
 * Se nenhuma fonte responder, a edição anterior continua valendo.
 */
export function edicaoDoDia(): Promise<Edicao> {
  return comCache('newsletter', async () => {
    const edicao = await gerarEdicao()
    if (!edicao.fontes.some(f => f.ok)) throw new Error('nenhuma fonte de notícias respondeu')
    // Cada edição nova entra no Histórico do mês (falha ao gravar não derruba a edição).
    try { registrarEdicao(edicao) } catch (err) { console.warn('[newsletter] histórico não gravado:', String(err)) }
    return edicao
  }, { frescoPorMs: 6 * 3600_000, maximoObsoletoMs: 3 * 86_400_000 })
}
