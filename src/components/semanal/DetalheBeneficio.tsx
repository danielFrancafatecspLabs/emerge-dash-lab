'use client'

// Lista dos experimentos que compõem o benefício potencial total do slide de resumo da Semanal.

import { Dialog } from '@/components/ui'
import { formatarValor } from '@/lib/portfolio/filtros'
import type { SemanalBeneficioDetalhe } from '@/lib/semanal'
import type { EpicConsiderado } from '@/lib/weekly'

const GRUPOS: { id: EpicConsiderado['grupo']; titulo: string; descricao: string }[] = [
  { id: 'exploracao', titulo: 'Em exploração', descricao: 'Backlog e Em refinamento' },
  { id: 'andamento', titulo: 'Em andamento', descricao: 'Em andamento e Em validação' },
  { id: 'validada', titulo: 'Hipóteses validadas', descricao: 'Concluídos com a iniciativa em Aguardando piloto, Piloto ou Escala' },
]

const soma = (itens: EpicConsiderado[]) => itens.reduce((s, e) => s + (e.beneficio ?? 0), 0)

function Valor({ e }: { e: EpicConsiderado }) {
  if (e.beneficio) return <span className="font-semibold tabular-nums text-beon-ink">{formatarValor(e.beneficio)}</span>
  return <span className="text-beon-muted">{e.semBeneficio ? 'Sem benefício' : 'Só qualitativo'}</span>
}

export default function DetalheBeneficio({ aberto, onFechar, total, detalhe }: {
  aberto: boolean
  onFechar: () => void
  total: number
  detalhe: SemanalBeneficioDetalhe
}) {
  const { itens, fora } = detalhe
  const comValor = itens.filter(e => e.beneficio).length
  return (
    <Dialog open={aberto} onClose={onFechar} size="lg" title="Benefício potencial total"
      description="Experimentos em exploração, em andamento e com hipótese validada. Cancelados e refutados ficam de fora.">
      <div className="space-y-5">
        <div className="flex flex-wrap items-end justify-between gap-3 rounded-2xl bg-beon-soft px-4 py-3">
          <div>
            <p className="text-2xl font-semibold tracking-tight tabular-nums text-beon-ink">{formatarValor(total)}</p>
            <p className="text-xs text-beon-muted">{itens.length} experimentos considerados · {comValor} com benefício registrado</p>
          </div>
          <p className="text-xs text-beon-muted">
            Fora da conta: <b className="text-beon-ink">{fora.cancelados}</b> cancelados e <b className="text-beon-ink">{fora.refutados}</b> concluídos com hipótese refutada
          </p>
        </div>

        {itens.length === 0 && (
          <p className="text-sm text-beon-muted">Dados de exemplo: a lista aparece quando a Semanal é carregada com os dados do Jira.</p>
        )}

        {GRUPOS.map(g => {
          const lista = itens.filter(e => e.grupo === g.id).sort((a, b) => (b.beneficio ?? 0) - (a.beneficio ?? 0) || a.nome.localeCompare(b.nome, 'pt-BR'))
          if (!lista.length) return null
          return (
            <section key={g.id} aria-label={g.titulo}>
              <div className="flex items-baseline justify-between gap-3 border-b border-beon-line pb-1.5">
                <div>
                  <h3 className="text-sm font-semibold text-beon-ink">{g.titulo} <span className="font-normal text-beon-muted">· {lista.length}</span></h3>
                  <p className="text-[11px] text-beon-muted">{g.descricao}</p>
                </div>
                <span className="text-sm font-semibold tabular-nums text-beon-ink">{formatarValor(soma(lista))}</span>
              </div>
              <ul className="divide-y divide-beon-line">
                {lista.map(e => (
                  <li key={e.key} className="flex items-start justify-between gap-4 py-2 text-sm">
                    <div className="min-w-0">
                      <p className="truncate text-beon-ink">{e.nome}</p>
                      <p className="truncate text-[11px] text-beon-muted">
                        {e.key} · {e.status}
                        {g.id === 'validada' && e.iniciativa && <> · Iniciativa {e.iniciativa.key} em {e.iniciativa.status}</>}
                      </p>
                    </div>
                    <span className="shrink-0 text-right"><Valor e={e} /></span>
                  </li>
                ))}
              </ul>
            </section>
          )
        })}
      </div>
    </Dialog>
  )
}
