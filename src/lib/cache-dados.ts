import fs from 'fs'
import path from 'path'

/**
 * Cache de dados no servidor, em memória e em disco, com "stale-while-revalidate":
 *
 * - Dentro do prazo de frescor, devolve o valor guardado sem ir à fonte.
 * - Vencido o prazo, devolve na hora o valor guardado e atualiza em segundo plano.
 * - Sem valor guardado (ou invalidado, ou velho demais), espera a fonte; se ela falhar, usa o último valor que houver.
 * - Pedidos simultâneos dividem uma única ida à fonte.
 * - O carregador recebe o valor anterior, para reaproveitar o que não mudou (atualização incremental).
 *
 * O disco guarda o último valor entre reinícios do servidor; se não der para gravar (disco somente leitura), segue só
 * em memória.
 */

interface Entrada<T> {
  valor: T
  salvoEm: number
  /** Marcado por `invalidarCache`: o próximo pedido espera dados novos (mas o valor segue de base e de reserva). */
  invalidado?: boolean
}

export interface OpcoesCache {
  /** Até quando o valor é servido sem consultar a fonte. */
  frescoPorMs: number
  /** Acima desta idade, o pedido espera a fonte em vez de servir o valor guardado. */
  maximoObsoletoMs: number
}

interface Estado {
  entradas: Map<string, Entrada<unknown>>
  emAndamento: Map<string, Promise<unknown>>
}

// No globalThis: o Next.js pode carregar este módulo mais de uma vez (rotas e páginas), e o cache precisa ser um só.
const G = globalThis as typeof globalThis & { __beonCacheDados?: Estado }
const estado: Estado = (G.__beonCacheDados ??= { entradas: new Map(), emAndamento: new Map() })

export const diretorioDoCache = () => process.env.JIRA_CACHE_DIR || path.join(process.cwd(), '.cache')
const arquivoDa = (chave: string) => path.join(diretorioDoCache(), `${chave}.json`)

function lerDoDisco<T>(chave: string): Entrada<T> | undefined {
  try {
    const e = JSON.parse(fs.readFileSync(arquivoDa(chave), 'utf-8')) as Entrada<T>
    return typeof e?.salvoEm === 'number' && e.valor !== undefined ? e : undefined
  } catch {
    return undefined
  }
}

function gravarNoDisco(chave: string, entrada: Entrada<unknown>) {
  try {
    fs.mkdirSync(diretorioDoCache(), { recursive: true })
    // Grava num temporário e renomeia: quem lê nunca encontra o arquivo pela metade.
    const tmp = `${arquivoDa(chave)}.${process.pid}.tmp`
    fs.writeFileSync(tmp, JSON.stringify(entrada), 'utf-8')
    fs.renameSync(tmp, arquivoDa(chave))
  } catch (err) {
    console.warn(`[cache] não foi possível gravar ${chave} em disco; seguindo só em memória:`, String(err))
  }
}

function entradaDe<T>(chave: string): Entrada<T> | undefined {
  let e = estado.entradas.get(chave) as Entrada<T> | undefined
  if (!e) {
    e = lerDoDisco<T>(chave)
    if (e) estado.entradas.set(chave, e)
  }
  return e
}

function atualizar<T>(chave: string, carregar: (anterior?: T) => Promise<T>, anterior?: T): Promise<T> {
  const atual = estado.emAndamento.get(chave) as Promise<T> | undefined
  if (atual) return atual
  const inicio = Date.now()
  const p = carregar(anterior)
    .then(valor => {
      const entrada = { valor, salvoEm: Date.now() }
      estado.entradas.set(chave, entrada)
      gravarNoDisco(chave, entrada)
      console.log(`[cache] ${chave} atualizado em ${((Date.now() - inicio) / 1000).toFixed(1)}s`)
      return valor
    })
    .finally(() => estado.emAndamento.delete(chave))
  estado.emAndamento.set(chave, p)
  return p
}

export async function comCache<T>(chave: string, carregar: (anterior?: T) => Promise<T>, opcoes: OpcoesCache): Promise<T> {
  const e = entradaDe<T>(chave)
  if (!e) return atualizar(chave, carregar)

  const idade = Date.now() - e.salvoEm
  if (!e.invalidado && idade < opcoes.frescoPorMs) return e.valor

  if (e.invalidado || idade >= opcoes.maximoObsoletoMs) {
    try {
      return await atualizar(chave, carregar, e.valor)
    } catch (err) {
      console.error(`[cache] falha ao atualizar ${chave}; servindo a última versão guardada:`, err)
      return e.valor
    }
  }

  atualizar(chave, carregar, e.valor).catch(err =>
    console.error(`[cache] falha ao atualizar ${chave} em segundo plano; a versão guardada continua valendo:`, err))
  return e.valor
}

/** Quando o valor guardado foi obtido da fonte (ou undefined, se não há nada guardado). */
export function salvoEm(chave: string): Date | undefined {
  const e = entradaDe(chave)
  return e ? new Date(e.salvoEm) : undefined
}

/** Faz o próximo pedido buscar dados novos, mantendo o valor atual como base incremental e reserva em caso de falha. */
export function invalidarCache(chave: string) {
  const e = entradaDe(chave)
  if (e) e.invalidado = true
}

/** Só para testes: esquece tudo o que está em memória. */
export function _limparMemoria() {
  estado.entradas.clear()
  estado.emAndamento.clear()
}
