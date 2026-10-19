'use client'

// Menu "Visões": as visões prontas, as que a pessoa salvou (neste navegador) e o link da visão atual.

import { useEffect, useState } from 'react'
import { Bookmark, Check, Link2, Trash2 } from 'lucide-react'
import { cx, focusRing, inputClass } from '@/components/ui'
import { VISOES_PRONTAS, type EstadoPortfolio } from '@/lib/portfolio/filtros'
import { Popover, botaoBarra } from './Comum'

export interface VisaoSalva { id: string; nome: string; estado: EstadoPortfolio }

const CHAVE = 'beon:portfolio:visoes:v1'

function ler(): VisaoSalva[] {
  try {
    const v = JSON.parse(window.localStorage.getItem(CHAVE) ?? '[]')
    return Array.isArray(v) ? v.filter(x => x && typeof x.nome === 'string' && x.estado) : []
  } catch {
    return []
  }
}

function gravar(v: VisaoSalva[]) {
  try { window.localStorage.setItem(CHAVE, JSON.stringify(v)) } catch { /* sem armazenamento: a visão vale só nesta sessão */ }
}

export function Visoes({ estado, onAplicar }: { estado: EstadoPortfolio; onAplicar: (e: Partial<EstadoPortfolio>) => void }) {
  const [salvas, setSalvas] = useState<VisaoSalva[]>([])
  const [nome, setNome] = useState('')
  const [copiado, setCopiado] = useState(false)
  useEffect(() => { setSalvas(ler()) }, [])

  function salvar() {
    const n = nome.trim()
    if (!n) return
    const nova = [...salvas.filter(s => s.nome !== n), { id: `${Date.now()}`, nome: n, estado }]
    setSalvas(nova); gravar(nova); setNome('')
  }
  function remover(id: string) {
    const nova = salvas.filter(s => s.id !== id)
    setSalvas(nova); gravar(nova)
  }
  async function copiar() {
    try {
      await navigator.clipboard.writeText(window.location.href)
      setCopiado(true)
      setTimeout(() => setCopiado(false), 1800)
    } catch { /* sem permissão de área de transferência */ }
  }

  const item = cx('flex w-full flex-col rounded-xl px-3 py-2 text-left hover:bg-beon-soft', focusRing)
  return (
    <Popover
      rotulo="Visões do portfólio"
      alinhar="direita"
      largura={340}
      botao={({ aberto, alternar }) => (
        <button type="button" onClick={alternar} aria-expanded={aberto} className={botaoBarra()}>
          <Bookmark className="h-4 w-4" aria-hidden /> Visões
        </button>
      )}
    >
      {fechar => (
        <div className="max-h-[70dvh] overflow-y-auto">
          <p className="px-3 pb-1 pt-1.5 text-[11px] font-semibold uppercase tracking-[0.08em] text-beon-muted">Prontas</p>
          {VISOES_PRONTAS.map(v => (
            <button key={v.id} type="button" className={item} onClick={() => { onAplicar(v.estado); fechar() }}>
              <span className="text-sm font-medium text-beon-ink">{v.nome}</span>
              <span className="text-xs text-beon-muted">{v.descricao}</span>
            </button>
          ))}

          <p className="mt-2 border-t border-beon-line px-3 pb-1 pt-3 text-[11px] font-semibold uppercase tracking-[0.08em] text-beon-muted">Suas visões</p>
          {salvas.length === 0 && <p className="px-3 pb-2 text-xs text-beon-muted">Monte os filtros e salve aqui para voltar com um clique.</p>}
          {salvas.map(s => (
            <div key={s.id} className="group flex items-center gap-1">
              <button type="button" className={cx(item, 'flex-1')} onClick={() => { onAplicar(s.estado); fechar() }}>
                <span className="text-sm font-medium text-beon-ink">{s.nome}</span>
              </button>
              <button type="button" onClick={() => remover(s.id)} aria-label={`Apagar a visão ${s.nome}`}
                className={cx('rounded-lg p-2 text-beon-muted opacity-60 hover:bg-beon-soft hover:text-beon-red group-hover:opacity-100', focusRing)}>
                <Trash2 className="h-4 w-4" aria-hidden />
              </button>
            </div>
          ))}
          <form className="flex gap-2 px-1 pb-1 pt-2" onSubmit={e => { e.preventDefault(); salvar() }}>
            <input value={nome} onChange={e => setNome(e.target.value)} placeholder="Nome da visão atual" aria-label="Nome da visão atual"
              maxLength={60} className={cx(inputClass, 'py-2 text-sm')} />
            <button type="submit" disabled={!nome.trim()}
              className={cx('shrink-0 rounded-xl bg-beon-ink px-3 text-sm font-medium text-white hover:bg-stone-800 disabled:opacity-40', focusRing)}>
              Salvar
            </button>
          </form>
          <p className="px-3 pb-1 text-[11px] text-beon-muted">Ficam salvas neste navegador.</p>

          <div className="mt-1 border-t border-beon-line pt-1">
            <button type="button" onClick={copiar} className={cx('flex w-full items-center gap-2 rounded-xl px-3 py-2 text-sm font-medium text-beon-ink hover:bg-beon-soft', focusRing)}>
              {copiado ? <Check className="h-4 w-4 text-emerald-600" aria-hidden /> : <Link2 className="h-4 w-4" aria-hidden />}
              {copiado ? 'Link copiado' : 'Copiar link desta visão'}
            </button>
          </div>
        </div>
      )}
    </Popover>
  )
}
