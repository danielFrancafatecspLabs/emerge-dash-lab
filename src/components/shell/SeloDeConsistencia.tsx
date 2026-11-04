'use client'

// Selo do agente de analytics, só para admins: diz se as visões (Semanal, Estratégia, Portfólio, Crescimento) contam
// a mesma história. Clicando, mostra cada verificação com os números de cada tela e os alertas de qualidade dos dados.

import { useEffect, useState } from 'react'
import { AlertTriangle, CheckCircle2, Loader2, ScanSearch } from 'lucide-react'
import { Popover } from '@/components/portfolio/Comum'
import { useCommunity } from '@/components/comunidade/CommunityProvider'
import { cx, focusRing } from '@/components/ui'
import type { RelatorioConsistencia, Verificacao } from '@/lib/analytics/consistencia'

const formatar = (n: number, formato: Verificacao['formato']) => (formato === 'moeda'
  ? n >= 1_000_000 ? `R$ ${(n / 1_000_000).toLocaleString('pt-BR', { maximumFractionDigits: 1 })} mi` : `R$ ${Math.round(n).toLocaleString('pt-BR')}`
  : n.toLocaleString('pt-BR'))

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

  return (
    <Popover
      rotulo="Agente de analytics"
      alinhar="direita"
      largura={460}
      botao={({ aberto, alternar }) => (
        <button type="button" onClick={alternar} aria-expanded={aberto}
          title="Agente de analytics: confere se os números batem entre as telas (só admins veem)"
          className={cx('inline-flex h-7 items-center gap-1.5 rounded-full px-2.5 text-xs font-medium ring-1 ring-inset', focusRing,
            !rel ? 'text-beon-muted ring-beon-line' : div ? 'bg-amber-50 text-amber-800 ring-amber-200' : 'bg-emerald-50 text-emerald-800 ring-emerald-200',
            className)}>
          {!rel ? <Loader2 className="h-3.5 w-3.5 animate-spin" aria-hidden /> : div ? <AlertTriangle className="h-3.5 w-3.5" aria-hidden /> : <CheckCircle2 className="h-3.5 w-3.5" aria-hidden />}
          {!rel ? 'Conferindo' : div ? `${div} ${div === 1 ? 'divergência' : 'divergências'}` : 'Números batem'}
        </button>
      )}
    >
      {() => !rel ? <p className="p-3 text-sm text-beon-muted">Conferindo as telas…</p> : (
        <div className="max-h-[70vh] space-y-3 overflow-y-auto p-2 text-sm">
          <div className="flex items-start gap-2">
            <ScanSearch className="mt-0.5 h-4 w-4 shrink-0 text-beon-red" aria-hidden />
            <p className="text-beon-body">
              <b className="text-beon-ink">Agente de analytics.</b> Recalcula cada número com as funções de cada tela e confere se batem.
              Rodou {new Date(rel.geradoEm).toLocaleString('pt-BR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' })}.
            </p>
          </div>
          <ul className="divide-y divide-beon-line rounded-xl border border-beon-line">
            {[...rel.verificacoes].sort((a, b) => Number(a.ok) - Number(b.ok)).map(v => (
              <li key={v.id} className="px-3 py-2" title={v.regra}>
                <p className="flex items-center gap-1.5 font-medium text-beon-ink">
                  {v.ok ? <CheckCircle2 className="h-3.5 w-3.5 shrink-0 text-emerald-600" aria-hidden /> : <AlertTriangle className="h-3.5 w-3.5 shrink-0 text-amber-600" aria-hidden />}
                  {v.titulo}
                </p>
                <p className="mt-0.5 flex flex-wrap gap-x-3 text-xs text-beon-muted">
                  {Object.entries(v.valores).map(([visao, n]) => <span key={visao}>{visao}: <b className="tabular-nums text-beon-ink">{formatar(n ?? 0, v.formato)}</b></span>)}
                </p>
              </li>
            ))}
          </ul>
          {rel.alertas.length > 0 && (
            <div>
              <p className="mb-1 text-[11px] font-semibold uppercase tracking-[0.1em] text-beon-muted">Qualidade dos dados no Jira</p>
              <ul className="space-y-1">
                {rel.alertas.map(a => (
                  <li key={a.id} className="text-xs text-beon-body">
                    <b className="tabular-nums text-beon-ink">{a.quantidade}</b> {a.titulo.toLowerCase()}
                    {a.exemplos.length > 0 && <span className="text-beon-muted"> · {a.exemplos.join(', ')}{a.quantidade > a.exemplos.length ? '…' : ''}</span>}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}
    </Popover>
  )
}
