'use client'

// Selo do Auditor de Analytics, só para admins: diz se as visões (Semanal, Estratégia, Portfólio, Comparativo…) contam
// a mesma história. Clicando, mostra o parecer, cada divergência com o veredito e a causa provável e o que mudou no
// Jira desde a leitura anterior. O relatório completo, com a explicação de cada caso, fica na página /auditor.

import Link from 'next/link'
import { useEffect, useState } from 'react'
import { AlertTriangle, ArrowRight, ArrowRightLeft, CheckCircle2, Loader2, ScanSearch } from 'lucide-react'
import { Popover } from '@/components/portfolio/Comum'
import { useCommunity } from '@/components/comunidade/CommunityProvider'
import { cx, focusRing } from '@/components/ui'
import type { Diferenca, Natureza, RelatorioConsistencia, Verificacao } from '@/lib/analytics/consistencia'
import type { Mudanca } from '@/lib/analytics/movimento'

const reais = (n: number) => (Math.abs(n) >= 1_000_000
  ? `R$ ${(n / 1_000_000).toLocaleString('pt-BR', { maximumFractionDigits: 1 })} mi`
  : `R$ ${Math.round(n).toLocaleString('pt-BR')}`)
const formatar = (n: number, formato: Verificacao['formato']) => (formato === 'moeda' ? reais(n) : n.toLocaleString('pt-BR'))
const quando = (iso: string) => new Date(iso).toLocaleString('pt-BR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' })
const sinal = (n: number, texto: string) => `${n > 0 ? '+' : '−'}${texto}`

const NATUREZA: Record<Natureza, string> = { telas: 'Entre telas', jira: 'App × Jira', soma: 'Conta que não fecha' }
const VERBO: Record<Mudanca['tipo'], string> = { entrou: 'entrou', saiu: 'saiu', status: 'mudou de status', beneficio: 'mudou o benefício' }
const LIMITE_DE_MUDANCAS = 12

const Titulo = ({ children }: { children: React.ReactNode }) => (
  <p className="mb-1 text-[11px] font-semibold uppercase tracking-[0.1em] text-beon-muted">{children}</p>
)

function Valores({ v }: { v: Verificacao }) {
  return (
    <p className="mt-0.5 flex flex-wrap gap-x-3 text-xs text-beon-muted">
      {Object.entries(v.valores).map(([visao, n]) => <span key={visao}>{visao}: <b className="tabular-nums text-beon-ink">{formatar(n ?? 0, v.formato)}</b></span>)}
    </p>
  )
}

function LinhaDeDiferenca({ d }: { d: Diferenca }) {
  return (
    <li className="text-xs leading-relaxed text-beon-body">
      <b className="text-beon-ink">{d.conta}</b> conta e <b className="text-beon-ink">{d.naoConta}</b> não ({d.total}):{' '}
      {d.itens.map((i, k) => (
        <span key={i.key}>{k > 0 && ', '}<span className="font-medium text-beon-ink">{i.key}</span> <span className="text-beon-muted">({i.status})</span></span>
      ))}
      {d.total > d.itens.length && <span className="text-beon-muted"> e mais {d.total - d.itens.length}</span>}
    </li>
  )
}

function Divergencia({ v }: { v: Verificacao }) {
  return (
    <li className="rounded-xl border border-amber-200 bg-amber-50/60 px-3 py-2" title={v.regra}>
      <p className="flex items-start gap-1.5 font-medium text-beon-ink">
        <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0 text-amber-600" aria-hidden />
        <span className="min-w-0 flex-1">{v.titulo}</span>
        <span className="shrink-0 rounded-full bg-white px-1.5 py-px text-[10px] font-medium text-amber-800 ring-1 ring-inset ring-amber-200">{NATUREZA[v.natureza]}</span>
      </p>
      {v.veredito ? <p className="mt-0.5 text-xs leading-relaxed text-beon-body">{v.veredito}</p> : <Valores v={v} />}
      {v.diagnostico && (
        <div className="mt-1.5 border-t border-amber-200 pt-1.5">
          <ul className="space-y-1">{v.diagnostico.diferencas.map(d => <LinhaDeDiferenca key={`${d.conta}>${d.naoConta}`} d={d} />)}</ul>
          {v.diagnostico.causa && <p className="mt-1.5 text-xs text-amber-900"><b>Causa provável:</b> {v.diagnostico.causa}</p>}
        </div>
      )}
      {v.acoes?.[0] && <p className="mt-1.5 text-xs text-beon-body"><b className="text-beon-ink">O que fazer ({v.acoes[0].onde === 'Jira' ? 'no Jira' : 'no app'}):</b> {v.acoes[0].texto}</p>}
    </li>
  )
}

export function SeloDeConsistencia({ className }: { className?: string }) {
  const { me } = useCommunity()
  const [rel, setRel] = useState<RelatorioConsistencia | null>(null)
  const [erro, setErro] = useState(false)
  const admin = me?.role === 'admin'

  useEffect(() => {
    if (!admin) return
    let vivo = true
    fetch('/jira/api/analytics/consistencia', { credentials: 'include' })
      .then(r => (r.ok ? r.json() : Promise.reject(r.status)))
      .then((x: RelatorioConsistencia) => { if (vivo) setRel(x) })
      .catch(() => { if (vivo) setErro(true) })
    return () => { vivo = false }
  }, [admin])

  if (!admin || erro) return null
  const div = rel?.divergencias ?? 0
  const falhas = rel?.verificacoes.filter(v => !v.ok) ?? []
  const certas = rel?.verificacoes.filter(v => v.ok) ?? []
  const mov = rel?.movimento

  return (
    <Popover
      rotulo="Auditor de Analytics"
      alinhar="direita"
      largura={520}
      botao={({ aberto, alternar }) => (
        <button type="button" onClick={alternar} aria-expanded={aberto}
          title="Auditor de Analytics: confere, item por item, se os números batem entre as telas (só admins veem)"
          className={cx('inline-flex h-7 items-center gap-1.5 rounded-full px-2.5 text-xs font-medium ring-1 ring-inset', focusRing,
            !rel ? 'text-beon-muted ring-beon-line' : div ? 'bg-amber-50 text-amber-800 ring-amber-200' : 'bg-emerald-50 text-emerald-800 ring-emerald-200',
            className)}>
          {!rel ? <Loader2 className="h-3.5 w-3.5 animate-spin" aria-hidden /> : div ? <AlertTriangle className="h-3.5 w-3.5" aria-hidden /> : <CheckCircle2 className="h-3.5 w-3.5" aria-hidden />}
          {!rel ? 'Conferindo' : div ? `${div} ${div === 1 ? 'divergência' : 'divergências'}` : 'Números batem'}
        </button>
      )}
    >
      {() => !rel ? <p className="p-3 text-sm text-beon-muted">Conferindo as telas…</p> : (
        <div className="max-h-[72vh] space-y-3.5 overflow-y-auto p-2 text-sm">
          <div className="flex items-start gap-2">
            <ScanSearch className="mt-0.5 h-4 w-4 shrink-0 text-beon-red" aria-hidden />
            <div className="min-w-0 text-beon-body">
              <p><b className="text-beon-ink">Auditor de Analytics.</b> {rel.parecer?.titulo ?? (rel.resumo ?? []).join(' ')}</p>
              <p className="mt-0.5 text-xs text-beon-muted">{(rel.resumo ?? [])[0]} Auditado em {quando(rel.geradoEm)}.</p>
              {rel.ia?.estado === 'pronta' && (
                <p className="mt-1.5 rounded-lg bg-beon-soft px-2 py-1.5 text-xs leading-relaxed text-beon-body"><b className="text-beon-ink">Leitura do dia (IA):</b> {rel.ia.leitura.leitura.manchete}</p>
              )}
              <Link href="/auditor" className={cx('mt-1.5 inline-flex items-center gap-1 text-xs font-semibold text-beon-red hover:underline', focusRing)}>
                Abrir o relatório completo, com a explicação de cada caso<ArrowRight className="h-3.5 w-3.5" aria-hidden />
              </Link>
            </div>
          </div>

          {falhas.length > 0 && (
            <div>
              <Titulo>Divergências</Titulo>
              <ul className="space-y-2">{falhas.map(v => <Divergencia key={v.id} v={v} />)}</ul>
            </div>
          )}

          {mov && (
            <div>
              <Titulo>O que mudou no Jira desde a leitura anterior</Titulo>
              <div className="rounded-xl border border-beon-line px-3 py-2">
                <p className="flex items-start gap-1.5 text-xs text-beon-body">
                  <ArrowRightLeft className="mt-0.5 h-3.5 w-3.5 shrink-0 text-beon-muted" aria-hidden />
                  <span>
                    De {quando(mov.de)} para {quando(mov.ate)}:{' '}
                    {mov.mudancas.length === 0 ? 'nada mudou.' : (
                      <>
                        <b className="text-beon-ink">{mov.mudancas.length}</b> {mov.mudancas.length === 1 ? 'mudança' : 'mudanças'}
                        {mov.saldo.experimentos !== 0 && <> · experimentos <b className="tabular-nums text-beon-ink">{sinal(mov.saldo.experimentos, String(Math.abs(mov.saldo.experimentos)))}</b></>}
                        {mov.saldo.iniciativas !== 0 && <> · iniciativas <b className="tabular-nums text-beon-ink">{sinal(mov.saldo.iniciativas, String(Math.abs(mov.saldo.iniciativas)))}</b></>}
                        {Math.abs(mov.saldo.beneficio) >= 1 && <> · benefício potencial <b className="tabular-nums text-beon-ink">{sinal(mov.saldo.beneficio, reais(Math.abs(mov.saldo.beneficio)))}</b></>}
                      </>
                    )}
                  </span>
                </p>
                {mov.mudancas.length > 0 && (
                  <ul className="mt-1.5 space-y-0.5 border-t border-beon-line pt-1.5">
                    {mov.mudancas.slice(0, LIMITE_DE_MUDANCAS).map(m => (
                      <li key={`${m.tipo}-${m.key}`} className="text-xs text-beon-body">
                        <span className="font-medium text-beon-ink">{m.key}</span> {VERBO[m.tipo]}
                        {m.tipo === 'entrou' && m.para ? ` (${m.para})` : m.tipo === 'saiu' && m.de ? ` (estava em ${m.de})` : m.de || m.para ? `: ${m.de} → ${m.para}` : ''}
                        {m.entidade === 'iniciativa' && <span className="text-beon-muted"> · iniciativa</span>}
                      </li>
                    ))}
                    {mov.mudancas.length > LIMITE_DE_MUDANCAS && <li className="text-xs text-beon-muted">e mais {mov.mudancas.length - LIMITE_DE_MUDANCAS}</li>}
                  </ul>
                )}
              </div>
            </div>
          )}

          {rel.alertas.length > 0 && (
            <div>
              <Titulo>Cadastro no Jira</Titulo>
              <p className="text-xs leading-relaxed text-beon-body">
                {(['corrigir', 'conferir', 'informativo'] as const).map(g => {
                  const n = rel.alertas.filter(a => (a.gravidade ?? 'conferir') === g).length
                  return n ? `${n} ${g === 'corrigir' ? (n === 1 ? 'ponto para corrigir' : 'pontos para corrigir') : g === 'conferir' ? (n === 1 ? 'ponto para conferir' : 'pontos para conferir') : (n === 1 ? 'informativo' : 'informativos')}` : null
                }).filter(Boolean).join(' · ')}. O relatório completo explica cada um e lista os itens.
              </p>
            </div>
          )}

          <details className="rounded-xl border border-beon-line" open={falhas.length === 0}>
            <summary className={cx('cursor-pointer px-3 py-2 text-xs font-medium text-beon-ink', focusRing)}>
              {certas.length} {certas.length === 1 ? 'conferência que bate' : 'conferências que batem'}
            </summary>
            <ul className="divide-y divide-beon-line border-t border-beon-line">
              {certas.map(v => (
                <li key={v.id} className="px-3 py-2" title={v.regra}>
                  <p className="flex items-center gap-1.5 font-medium text-beon-ink"><CheckCircle2 className="h-3.5 w-3.5 shrink-0 text-emerald-600" aria-hidden />{v.titulo}</p>
                  <Valores v={v} />
                </li>
              ))}
            </ul>
          </details>
        </div>
      )}
    </Popover>
  )
}
