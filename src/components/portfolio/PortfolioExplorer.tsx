'use client'

// Aba Portfólio: Kanban das Iniciativas (board de Ideação), Kanban dos Experimentos (board de
// Experimentação/Piloto) e Lista, com os mesmos filtros nas três visões. O estado da visão fica na URL
// (dá para compartilhar o link) e pode ser salvo como "Visão".

import { useCallback, useEffect, useMemo, useState } from 'react'
import { Download, HelpCircle, KanbanSquare, List, Search, X } from 'lucide-react'
import { cx, focusRing } from '@/components/ui'
import {
  AGRUPAVEIS, alternarValor, aplicarVisao, CAMPO, criarContexto, entidadeDa, estadoParaQuery, filtrar, FILTROS_RAPIDOS,
  formatarValor, ordenar, ORDENS, paraCsv, resumir, totalDeFiltros, type EstadoPortfolio, type OrdemId, type VisaoId,
} from '@/lib/portfolio/filtros'
import { SITUACAO_LABEL, type Entidade, type ItemPortfolio, type PortfolioDados } from '@/lib/portfolio/tipos'
import { COR_SITUACAO, Popover, botaoBarra } from './Comum'
import { Detalhe } from './Detalhe'
import { BotaoTodosFiltros, FiltroRapido, FiltrosAtivos, PainelFiltros } from './Filtros'
import { Kanban } from './Kanban'
import { EscolherColunas, Lista } from './Lista'
import { Visoes } from './Visoes'

const VISOES: { id: VisaoId; label: string; icone: typeof List }[] = [
  { id: 'iniciativas', label: 'Iniciativas', icone: KanbanSquare },
  { id: 'experimentos', label: 'Experimentos', icone: KanbanSquare },
  { id: 'lista', label: 'Lista', icone: List },
]

const selectClass = cx(
  'h-9 rounded-full border border-beon-line bg-white pl-3 pr-8 text-[13px] font-medium text-beon-body hover:border-stone-300',
  focusRing,
)

function Segmentos<T extends string>({ opcoes, valor, onMudar, rotulo }: {
  opcoes: { id: T; label: string; icone?: typeof List; extra?: string }[]
  valor: T
  onMudar: (v: T) => void
  rotulo: string
}) {
  return (
    <div role="tablist" aria-label={rotulo} className="inline-flex max-w-full shrink-0 overflow-x-auto rounded-full bg-stone-100 p-1">
      {opcoes.map(o => {
        const ativo = o.id === valor
        const Icone = o.icone
        return (
          <button
            key={o.id}
            type="button"
            role="tab"
            aria-selected={ativo}
            onClick={() => onMudar(o.id)}
            className={cx(
              'inline-flex h-7 shrink-0 items-center gap-1.5 rounded-full px-3 text-[13px] font-medium transition',
              ativo ? 'bg-white text-beon-ink shadow-sm' : 'text-beon-muted hover:text-beon-ink', focusRing,
            )}
          >
            {Icone && <Icone className="h-3.5 w-3.5" aria-hidden />}
            {o.label}
            {o.extra && <span className={cx('tabular-nums', ativo ? 'text-beon-muted' : 'text-beon-muted/70')}>{o.extra}</span>}
          </button>
        )
      })}
    </div>
  )
}

function Indicador({ rotulo, valor, detalhe, ativo, onClick, cor, ajuda }: {
  rotulo: string; valor: string; detalhe: string; ativo?: boolean; onClick?: () => void; cor?: string
  /** Definição do indicador, mostrada ao passar o mouse. */
  ajuda?: string
}) {
  const conteudo = (
    <>
      <span className="flex items-center gap-1.5 text-xs text-beon-muted">
        {cor && <span className="h-1.5 w-1.5 rounded-full" style={{ background: cor }} aria-hidden />}
        {rotulo}
      </span>
      <span className="mt-0.5 block text-[22px] font-semibold leading-tight tracking-tight tabular-nums text-beon-ink">{valor}</span>
      <span className="block truncate text-[11.5px] text-beon-muted">{detalhe}</span>
    </>
  )
  const classe = cx(
    'min-w-[168px] flex-1 rounded-2xl border bg-white px-4 py-3 text-left',
    ativo ? 'border-beon-ink ring-1 ring-beon-ink' : 'border-beon-line',
  )
  return onClick
    ? <button type="button" onClick={onClick} aria-pressed={ativo} title={`${ajuda ? `${ajuda} ` : ''}Clique para filtrar.`} className={cx(classe, 'transition hover:border-stone-300', focusRing)}>{conteudo}</button>
    : <div className={classe} title={ajuda}>{conteudo}</div>
}

function ComoLer() {
  return (
    <Popover
      rotulo="Como ler o portfólio"
      alinhar="direita"
      largura={380}
      botao={({ aberto, alternar }) => (
        <button type="button" onClick={alternar} aria-expanded={aberto} title="Como ler" aria-label="Como ler o portfólio"
          className={cx('inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-beon-line bg-white text-beon-body hover:text-beon-ink', focusRing)}>
          <HelpCircle className="h-4 w-4" aria-hidden />
        </button>
      )}
    >
      {() => (
        <div className="space-y-3 p-2 text-sm leading-relaxed text-beon-body">
          <p><b className="text-beon-ink">Iniciativa</b> é a ideia estratégica (board de Ideação). <b className="text-beon-ink">Experimento</b> é a execução concreta dela (Epic no board de Experimentação/Piloto). Uma iniciativa pode ter vários experimentos, os <b className="text-beon-ink">ciclos</b>.</p>
          <p>As colunas dos quadros são as do Jira. A <b className="text-beon-ink">situação</b> resume o status:</p>
          <ul className="space-y-1">
            {(Object.keys(SITUACAO_LABEL) as (keyof typeof SITUACAO_LABEL)[]).map(s => (
              <li key={s} className="flex items-center gap-2"><span className="h-2 w-2 rounded-full" style={{ background: COR_SITUACAO[s] }} />{SITUACAO_LABEL[s]}</li>
            ))}
          </ul>
          <p>O <b className="text-beon-ink">benefício</b> da iniciativa é a soma dos experimentos dela. Um experimento está <b className="text-beon-ink">bloqueado</b> quando ainda está aberto e tem flag de impedimento, motivo ou tipo de impedimento preenchido, status ou etiqueta de bloqueio, ou um vínculo &quot;bloqueado por&quot; com item aberto. O detalhe mostra o porquê.</p>
          <p>As hipóteses contam só os experimentos <b className="text-beon-ink">concluídos</b>. <b className="text-beon-ink">Validada</b>: a iniciativa-mãe está em Aguardando piloto, Em piloto ou Em escala. <b className="text-beon-ink">Refutada</b>: a iniciativa-mãe não está em nenhuma dessas colunas (ou o experimento não tem iniciativa).</p>
          <p><b className="text-beon-ink">Em execução</b> soma as colunas de experimentação e piloto; o percentual é sobre o portfólio sem os cancelados.</p>
          <p>Os filtros valem nas três visões: na de iniciativas, um campo do experimento olha os experimentos de cada iniciativa.</p>
        </div>
      )}
    </Popover>
  )
}

function baixarCsv(itens: ItemPortfolio[], entidade: Entidade, ctx: ReturnType<typeof criarContexto>) {
  const csv = paraCsv(itens, entidade, ctx)
  const url = URL.createObjectURL(new Blob([`﻿${csv}`], { type: 'text/csv;charset=utf-8' }))
  const a = document.createElement('a')
  a.href = url
  a.download = `portfolio-${entidade === 'iniciativa' ? 'iniciativas' : 'experimentos'}-${new Date().toISOString().slice(0, 10)}.csv`
  a.click()
  URL.revokeObjectURL(url)
}

export default function PortfolioExplorer({ dados, estadoInicial, detalheInicial }: {
  dados: PortfolioDados
  estadoInicial: EstadoPortfolio
  detalheInicial: string | null
}) {
  const ctx = useMemo(() => criarContexto(dados), [dados])
  const [estado, setEstado] = useState(estadoInicial)
  const [detalhe, setDetalhe] = useState<string | null>(detalheInicial)
  const [painel, setPainel] = useState(false)

  const entidade = entidadeDa(estado)
  const base: ItemPortfolio[] = entidade === 'iniciativa' ? dados.iniciativas : dados.experimentos
  const itens = useMemo(() => ordenar(filtrar(base, entidade, estado, ctx), estado.ordem), [base, entidade, estado, ctx])
  const resumo = useMemo(() => resumir(itens, ctx), [itens, ctx])
  const itemAberto = detalhe ? ctx.iniciativas.get(detalhe) ?? ctx.experimentos.get(detalhe) ?? null : null

  // A URL acompanha a visão (para compartilhar o link e voltar ao mesmo ponto).
  useEffect(() => {
    const q = new URLSearchParams(estadoParaQuery(estado))
    if (detalhe) q.set('d', detalhe)
    const s = q.toString()
    window.history.replaceState(window.history.state, '', `${window.location.pathname}${s ? `?${s}` : ''}`)
  }, [estado, detalhe])

  const mudar = useCallback((p: Partial<EstadoPortfolio>) => setEstado(e => ({ ...e, ...p })), [])
  const alternar = useCallback((campo: string, valor: string) => setEstado(e => alternarValor(e, campo, valor)), [])
  const limparCampo = useCallback((campo: string) => setEstado(e => {
    const filtros = { ...e.filtros }
    delete filtros[campo]
    return { ...e, filtros }
  }), [])
  const limparTudo = useCallback(() => setEstado(e => ({ ...e, filtros: {}, busca: '' })), [])
  const fecharDetalhe = useCallback(() => setDetalhe(null), [])
  const fecharPainel = useCallback(() => setPainel(false), [])

  /** Liga/desliga um conjunto de valores de um campo (atalhos dos indicadores). */
  function alternarAtalho(campo: string, valores: string[]) {
    setEstado(e => {
      const atuais = e.filtros[campo] ?? []
      const igual = atuais.length === valores.length && valores.every(v => atuais.includes(v))
      const filtros = { ...e.filtros }
      if (igual) delete filtros[campo]
      else filtros[campo] = valores
      return { ...e, filtros }
    })
  }
  const atalhoAtivo = (campo: string, valores: string[]) => {
    const atuais = estado.filtros[campo] ?? []
    return atuais.length === valores.length && valores.every(v => atuais.includes(v))
  }

  const filtroProps = { itens: base, entidade, estado, ctx, onAlternar: alternar, onLimparCampo: limparCampo }
  const nomeEntidade = entidade === 'iniciativa' ? 'iniciativas' : 'experimentos'
  const kanban = estado.visao !== 'lista'
  const pct = (n: number, base: number) => (base ? `${Math.round((n / base) * 100)}%` : '—')

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      {/* Barra de ferramentas */}
      <div className="shrink-0 space-y-2.5 border-b border-beon-line bg-white px-4 py-3 sm:px-6">
        <div className="flex flex-wrap items-center gap-2">
          <Segmentos
            rotulo="Visão"
            valor={estado.visao}
            onMudar={v => mudar({ visao: v })}
            opcoes={VISOES.map(v => ({
              ...v,
              extra: v.id === 'iniciativas' ? String(dados.iniciativas.length) : v.id === 'experimentos' ? String(dados.experimentos.length) : undefined,
            }))}
          />
          {estado.visao === 'lista' && (
            <Segmentos
              rotulo="Itens da lista"
              valor={estado.lista}
              onMudar={l => mudar({ lista: l })}
              opcoes={[{ id: 'experimento', label: 'Experimentos' }, { id: 'iniciativa', label: 'Iniciativas' }]}
            />
          )}
          <label className="flex h-9 min-w-[200px] flex-1 items-center gap-2 rounded-full border border-beon-line bg-white px-3 focus-within:border-beon-ink/40 focus-within:ring-2 focus-within:ring-beon-red/20 sm:max-w-sm">
            <Search className="h-4 w-4 shrink-0 text-beon-muted" aria-hidden />
            <input
              value={estado.busca}
              onChange={e => mudar({ busca: e.target.value })}
              placeholder={entidade === 'iniciativa' ? 'Buscar iniciativa, experimento, pessoa ou chave' : 'Buscar experimento, iniciativa, pessoa ou chave'}
              aria-label="Buscar no portfólio"
              className="w-full bg-transparent text-sm text-beon-ink placeholder:text-beon-muted/80 focus:outline-none"
            />
            {estado.busca && (
              <button type="button" onClick={() => mudar({ busca: '' })} aria-label="Limpar a busca" className={cx('rounded-full p-0.5 text-beon-muted hover:text-beon-ink', focusRing)}>
                <X className="h-3.5 w-3.5" aria-hidden />
              </button>
            )}
          </label>
          <div className="-mx-4 flex w-[calc(100%+2rem)] items-center gap-2 overflow-x-auto px-4 sm:mx-0 sm:ml-auto sm:w-auto sm:flex-wrap sm:overflow-visible sm:px-0">
            <select
              aria-label={kanban ? 'Raias do quadro' : 'Agrupar a lista'}
              value={estado.agrupar ?? ''}
              onChange={e => mudar({ agrupar: e.target.value || null })}
              className={selectClass}
            >
              <option value="">{kanban ? 'Sem raias' : 'Sem agrupar'}</option>
              {AGRUPAVEIS.map(id => <option key={id} value={id}>{kanban ? 'Raias' : 'Agrupar'}: {CAMPO.get(id)?.label}</option>)}
            </select>
            <select aria-label="Ordenar" value={estado.ordem} onChange={e => mudar({ ordem: e.target.value as OrdemId })} className={selectClass}>
              {ORDENS.map(o => <option key={o.id} value={o.id}>{o.label}</option>)}
            </select>
            {!kanban && <EscolherColunas entidade={entidade} estado={estado} onMudar={c => mudar({ colunas: { ...estado.colunas, [entidade]: c } })} />}
            <button type="button" onClick={() => baixarCsv(itens, entidade, ctx)} className={botaoBarra()} title={`Baixar os ${itens.length} ${nomeEntidade} da tela em CSV`}>
              <Download className="h-4 w-4" aria-hidden /> <span className="hidden lg:inline">CSV</span>
            </button>
            <Visoes estado={estado} onAplicar={v => { setEstado(aplicarVisao(v)); setDetalhe(null) }} />
            <ComoLer />
          </div>
        </div>

        <div className="-mx-4 flex items-center gap-2 overflow-x-auto px-4 sm:mx-0 sm:flex-wrap sm:overflow-visible sm:px-0">
          {FILTROS_RAPIDOS.map(id => <FiltroRapido key={id} campoId={id} {...filtroProps} />)}
          <BotaoTodosFiltros estado={estado} rapidos={FILTROS_RAPIDOS} onAbrir={() => setPainel(true)} />
          <FiltrosAtivos
            estado={estado}
            entidade={entidade}
            rapidos={FILTROS_RAPIDOS}
            onAlternar={alternar}
            onLimparTudo={limparTudo}
            onLimparBusca={() => mudar({ busca: '' })}
          />
          <span className="ml-auto shrink-0 whitespace-nowrap text-[13px] text-beon-muted">
            <b className="font-semibold tabular-nums text-beon-ink">{itens.length}</b> de {base.length} {nomeEntidade}
          </span>
        </div>
      </div>

      {/* Indicadores (reagem aos filtros; os clicáveis viram filtro) */}
      <div className="flex shrink-0 gap-3 overflow-x-auto px-4 pt-3 sm:px-6">
        <Indicador
          rotulo={entidade === 'iniciativa' ? 'Iniciativas' : 'Experimentos'}
          valor={String(resumo.total)}
          detalhe={entidade === 'iniciativa' ? `${resumo.relacionados} experimentos vinculados` : `de ${resumo.relacionados} iniciativas`}
        />
        <Indicador
          rotulo="Benefício potencial"
          valor={formatarValor(resumo.beneficio)}
          detalhe={entidade === 'iniciativa' ? 'soma dos experimentos vinculados' : 'soma dos experimentos na tela'}
        />
        <Indicador
          rotulo="Em execução" cor={COR_SITUACAO['em-execucao']}
          valor={String(resumo.emExecucao)} detalhe={`${pct(resumo.emExecucao, resumo.ativos)} dos não cancelados`}
          ajuda="Em experimentação, aguardando piloto ou em piloto (iniciativas); em andamento ou em validação (experimentos)."
          ativo={atalhoAtivo('situacao', [SITUACAO_LABEL['em-execucao']])}
          onClick={() => alternarAtalho('situacao', [SITUACAO_LABEL['em-execucao']])}
        />
        <Indicador
          rotulo="Hipóteses validadas" cor="#059669"
          valor={String(resumo.validadas)} detalhe={`${pct(resumo.validadas, resumo.concluidos)} de ${resumo.concluidos} concluídos`}
          ajuda="Experimentos concluídos com a iniciativa-mãe em Aguardando piloto, Em piloto ou Em escala."
          ativo={atalhoAtivo('hipotese', ['Validada'])}
          onClick={() => alternarAtalho('hipotese', ['Validada'])}
        />
        <Indicador
          rotulo="Hipóteses refutadas" cor="#A8A29E"
          valor={String(resumo.refutadas)} detalhe={`${pct(resumo.refutadas, resumo.concluidos)} de ${resumo.concluidos} concluídos`}
          ajuda="Experimentos concluídos cuja iniciativa-mãe não está em Aguardando piloto, Em piloto nem Em escala."
          ativo={atalhoAtivo('hipotese', ['Refutada'])}
          onClick={() => alternarAtalho('hipotese', ['Refutada'])}
        />
        <Indicador
          rotulo="Bloqueados" cor="#F59E0B"
          valor={String(resumo.bloqueados)} detalhe={`${pct(resumo.bloqueados, resumo.ativos)} dos não cancelados`}
          ativo={atalhoAtivo('bloqueio', ['Bloqueado'])}
          onClick={() => alternarAtalho('bloqueio', ['Bloqueado'])}
        />
      </div>

      {/* Conteúdo */}
      <div className="min-h-0 flex-1">
        {kanban ? (
          <Kanban
            itens={itens}
            colunas={dados.boards[entidade].colunas}
            ctx={ctx}
            raias={estado.agrupar}
            alternadas={estado.alternadas}
            filtrando={totalDeFiltros(estado) > 0 || !!estado.busca.trim()}
            onAlternarColuna={id => mudar({ alternadas: estado.alternadas.includes(id) ? estado.alternadas.filter(c => c !== id) : [...estado.alternadas, id] })}
            onAbrir={i => setDetalhe(i.key)}
          />
        ) : (
          <Lista itens={itens} entidade={entidade} estado={estado} ctx={ctx} onOrdenar={o => mudar({ ordem: o })} onAbrir={i => setDetalhe(i.key)} />
        )}
      </div>

      <PainelFiltros aberto={painel} onFechar={fecharPainel} onLimparTudo={limparTudo} total={itens.length} {...filtroProps} />
      {itemAberto && (
        <Detalhe
          item={itemAberto}
          ctx={ctx}
          jiraUrl={dados.jiraUrl}
          onFechar={fecharDetalhe}
          onAbrir={i => setDetalhe(i.key)}
          onFiltrar={(campo, valor) => {
            setEstado(e => ((e.filtros[campo] ?? []).includes(valor) ? e : alternarValor(e, campo, valor)))
            setDetalhe(null)
          }}
        />
      )}
    </div>
  )
}
