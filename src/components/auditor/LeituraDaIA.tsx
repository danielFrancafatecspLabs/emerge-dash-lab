'use client'

// A leitura do dia escrita pela IA, no topo do Auditor: a manchete, os pontos em ordem de prioridade (cada um com as
// evidências e a ação), o que mudou desde ontem e as perguntas para o time. Mostra também de onde ela veio (modelo,
// hora, qual auditoria) e quantos pontos a conferência descartou. A IA é chamada uma vez por dia, no servidor.

import { Sparkles } from 'lucide-react'
import { cx, focusRing } from '@/components/ui'
import type { EstadoDaLeitura } from '@/lib/analytics/leitura-ia-servidor'
import type { Prioridade } from '@/lib/analytics/leitura-ia'

const quando = (iso: string) => new Date(iso).toLocaleString('pt-BR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' })
const PRIORIDADE: Record<Prioridade, { rotulo: string; cor: string }> = {
  alta: { rotulo: 'Alta', cor: 'bg-red-50 text-red-700 ring-red-200' },
  media: { rotulo: 'Média', cor: 'bg-amber-50 text-amber-800 ring-amber-200' },
  baixa: { rotulo: 'Baixa', cor: 'bg-stone-100 text-beon-body ring-stone-200' },
}
const MOTIVO: Record<string, string> = {
  'primeira-auditoria': 'A leitura de hoje sai logo depois da primeira auditoria do dia.',
  'aguardando-nova-tentativa': 'A IA não respondeu na última tentativa; o Auditor tenta de novo em até 2 horas.',
  'tentativas-esgotadas': 'A IA não respondeu nas 3 tentativas de hoje; amanhã ela tenta de novo.',
  'ja-gerada-hoje': '',
  'sem-ia': '',
}

function Evidencia({ e, jiraUrl }: { e: string; jiraUrl?: string | null }) {
  const classe = 'rounded-md bg-beon-soft px-1.5 py-0.5 font-mono text-[11px] text-beon-body ring-1 ring-inset ring-beon-line'
  if (jiraUrl && /^[A-Z][A-Z0-9]+-\d+$/.test(e)) {
    return <a href={`${jiraUrl}/browse/${e}`} target="_blank" rel="noreferrer" className={cx(classe, 'hover:text-beon-ink', focusRing)}>{e}</a>
  }
  return <span className={classe}>{e}</span>
}

export function LeituraDaIA({ ia, jiraUrl }: { ia?: EstadoDaLeitura; jiraUrl?: string | null }) {
  if (!ia) return null
  if (ia.estado === 'sem-ia') {
    return (
      <section className="flex items-start gap-3 rounded-2xl border border-dashed border-beon-line bg-white p-4 text-sm text-beon-muted">
        <Sparkles className="mt-0.5 h-4 w-4 shrink-0" aria-hidden />
        <p>A leitura do dia por IA está desligada: configure <code className="text-beon-ink">LLM_API_KEY</code> e <code className="text-beon-ink">LLM_API_BASE</code> no servidor. O Auditor continua funcionando sem ela.</p>
      </section>
    )
  }
  if (ia.estado !== 'pronta') {
    return (
      <section className="flex items-start gap-3 rounded-2xl border border-beon-line bg-white p-4 text-sm text-beon-body">
        <Sparkles className={cx('mt-0.5 h-4 w-4 shrink-0 text-beon-red', ia.estado === 'gerando' && 'animate-pulse')} aria-hidden />
        <p>{ia.estado === 'gerando' ? 'A IA está escrevendo a leitura de hoje. Atualize a página em alguns segundos.' : MOTIVO[ia.motivo] || 'A leitura de hoje ainda não saiu.'}</p>
      </section>
    )
  }

  const { leitura: l, modelo, geradaEm, auditoriaDe, descartados } = ia.leitura
  return (
    <section aria-labelledby="leitura-ia" className="overflow-hidden rounded-2xl border border-beon-line bg-white">
      <div className="border-b border-beon-line px-5 py-4">
        <p className="flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-[0.1em] text-beon-red">
          <Sparkles className="h-3.5 w-3.5" aria-hidden />Leitura do dia{!ia.deHoje && <span className="normal-case tracking-normal text-beon-muted"> · de {quando(geradaEm)}; a de hoje sai depois da primeira auditoria</span>}
        </p>
        <h2 id="leitura-ia" className="mt-1 text-xl font-semibold leading-snug tracking-tight text-beon-ink">{l.manchete}</h2>
      </div>

      {l.pontos.length > 0 && (
        <ol className="divide-y divide-beon-line">
          {l.pontos.map((p, i) => (
            <li key={p.titulo} className="grid gap-x-4 gap-y-1.5 px-5 py-3.5 sm:grid-cols-[28px_minmax(0,1fr)]">
              <span className="hidden pt-0.5 text-lg font-semibold tabular-nums leading-none text-beon-muted sm:block">{i + 1}</span>
              <div className="min-w-0 space-y-1.5">
                <p className="flex flex-wrap items-center gap-2">
                  <span className="text-[15px] font-semibold text-beon-ink">{p.titulo}</span>
                  <span className={cx('rounded-full px-2 py-0.5 text-[11px] font-medium ring-1 ring-inset', PRIORIDADE[p.prioridade].cor)}>{PRIORIDADE[p.prioridade].rotulo}</span>
                </p>
                <p className="text-sm leading-relaxed text-beon-body">{p.explicacao}</p>
                {p.acao && (
                  <p className="text-sm text-beon-body">
                    <span className={cx('mr-1.5 rounded-full px-2 py-0.5 text-[11px] font-medium ring-1 ring-inset', p.acao.onde === 'Jira' ? 'bg-sky-50 text-sky-800 ring-sky-200' : 'bg-stone-100 text-beon-ink ring-stone-200')}>{p.acao.onde === 'Jira' ? 'No Jira' : 'No app'}</span>
                    {p.acao.texto}
                  </p>
                )}
                {p.evidencias.length > 0 && <p className="flex flex-wrap items-center gap-1.5 text-xs text-beon-muted">Base:{p.evidencias.map(e => <Evidencia key={e} e={e} jiraUrl={jiraUrl} />)}</p>}
              </div>
            </li>
          ))}
        </ol>
      )}

      {(l.mudancas || l.perguntas.length > 0) && (
        <div className="grid gap-4 border-t border-beon-line bg-beon-soft/60 px-5 py-4 md:grid-cols-2">
          {l.mudancas && (
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-[0.1em] text-beon-muted">Desde a leitura anterior</p>
              <p className="mt-1 text-sm leading-relaxed text-beon-body">{l.mudancas}</p>
            </div>
          )}
          {l.perguntas.length > 0 && (
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-[0.1em] text-beon-muted">Perguntas para o time</p>
              <ul className="mt-1 space-y-1">{l.perguntas.map(q => <li key={q} className="text-sm leading-relaxed text-beon-body">· {q}</li>)}</ul>
            </div>
          )}
        </div>
      )}

      <p className="border-t border-beon-line px-5 py-2.5 text-[11px] leading-relaxed text-beon-muted">
        Escrita por IA ({modelo}) em {quando(geradaEm)}, a partir da auditoria de {quando(auditoriaDe)}. Gerada uma vez por dia. Cada ponto foi conferido contra os números do Auditor
        {descartados > 0 ? `; ${descartados} ${descartados === 1 ? 'ponto foi descartado' : 'pontos foram descartados'} por citar algo que não está no relatório` : ''}. Os números e os itens abaixo são do Auditor, não da IA.
      </p>
    </section>
  )
}
