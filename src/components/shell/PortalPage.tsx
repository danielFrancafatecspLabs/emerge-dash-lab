'use client'

// Página das visões executivas e da administração, dentro da moldura do app: barra com o título,
// as ações da página e "Atualizar dados". O menu e a conta ficam no AppShell.

import { useEffect, useState, type ReactNode } from 'react'
import { Maximize2, Minimize2, RotateCcw } from 'lucide-react'
import { useCommunity } from '@/components/comunidade/CommunityProvider'
import { cx, focusRing } from '@/components/ui'
import { useHideChrome } from './AppChrome'

/** Limpa o cache do Jira no servidor e recarrega a página (só admin e executivo podem). */
function RefreshButton() {
  const [loading, setLoading] = useState(false)
  async function refresh() {
    if (loading) return
    setLoading(true)
    try {
      await fetch('/jira/api/clear-cache', { method: 'POST' })
    } finally {
      window.location.reload()
    }
  }
  return (
    <button
      type="button"
      onClick={refresh}
      disabled={loading}
      title="Limpar o cache e buscar os dados do Jira de novo"
      className={cx('flex h-9 items-center gap-2 rounded-full border border-beon-line bg-white px-3 text-sm font-medium text-beon-ink hover:bg-beon-soft disabled:opacity-60', focusRing)}
    >
      <RotateCcw className={cx('h-4 w-4 text-beon-muted', loading && 'animate-spin')} aria-hidden />
      <span className="hidden md:inline">{loading ? 'Atualizando…' : 'Atualizar dados'}</span>
    </button>
  )
}

/**
 * Estado "maximizado" da página (sem o menu lateral e as barras do app), lembrado neste navegador.
 * Começa sempre restaurado no servidor e lê a preferência depois de montar, para não divergir na hidratação.
 */
function useMaximizado(chave: string, ativo: boolean): [boolean, () => void] {
  const [maximizado, setMaximizado] = useState(false)
  const storageKey = `beon:maximizado:${chave}`
  useEffect(() => {
    if (!ativo) return
    try { setMaximizado(window.localStorage.getItem(storageKey) === '1') } catch { /* sem armazenamento */ }
  }, [ativo, storageKey])
  function alternar() {
    const novo = !maximizado
    setMaximizado(novo)
    try { window.localStorage.setItem(storageKey, novo ? '1' : '0') } catch { /* sem armazenamento */ }
  }
  return [ativo && maximizado, alternar]
}

function MaximizeButton({ maximizado, onClick }: { maximizado: boolean; onClick: () => void }) {
  const Icon = maximizado ? Minimize2 : Maximize2
  const label = maximizado ? 'Restaurar o menu' : 'Maximizar (esconder o menu)'
  return (
    <button
      type="button"
      onClick={onClick}
      title={label}
      aria-label={label}
      aria-pressed={maximizado}
      className={cx('flex h-9 items-center gap-2 rounded-full border border-beon-line bg-white px-3 text-sm font-medium text-beon-ink hover:bg-beon-soft', focusRing)}
    >
      <Icon className="h-4 w-4 text-beon-muted" aria-hidden />
      <span className="hidden lg:inline">{maximizado ? 'Restaurar' : 'Maximizar'}</span>
    </button>
  )
}

export interface PortalPageProps {
  /** Título da página. */
  title: string
  /** Uma linha de contexto abaixo do título. */
  description?: string
  /** Controles da página (filtros, exportar…), à direita da barra. */
  actions?: ReactNode
  /** Mostra "Atualizar dados" (limpa o cache do Jira) para admin e executivo. */
  refreshable?: boolean
  /**
   * Página com a altura da tela (deck, chat): a página cuida da própria rolagem dentro de um
   * contêiner `flex-1 overflow-auto`.
   */
  fit?: boolean
  /** `false` esconde menu e barras do app (modo apresentação). */
  chrome?: boolean
  /** Mostra "Maximizar" (padrão): esconde o menu lateral e as barras do app, mantendo a barra da página. */
  maximizable?: boolean
  children: ReactNode
}

export function PortalPage({ title, description, actions, refreshable, fit, chrome = true, maximizable = true, children }: PortalPageProps) {
  const { me } = useCommunity()
  const [maximizado, alternarMaximizado] = useMaximizado(title, maximizable && chrome)
  useHideChrome(!chrome || maximizado)

  if (!chrome) return <div className="min-h-dvh bg-beon-soft">{children}</div>

  const podeAtualizar = refreshable && (me?.role === 'admin' || me?.role === 'executivo')

  return (
    <div className={cx(
      'flex min-w-0 flex-col bg-beon-soft',
      fit
        ? cx('overflow-hidden', maximizado ? 'h-dvh' : 'h-[calc(100dvh-7.5rem)] md:h-dvh')
        : maximizado ? 'min-h-dvh' : 'min-h-[calc(100dvh-3.5rem)] md:min-h-dvh',
    )}>
      {/* Em página `fit` o contêiner não rola (overflow-hidden): a barra fica no fluxo, sem sticky. */}
      <div className={cx(
        'z-20 flex min-h-16 shrink-0 items-center gap-3 border-b border-beon-line bg-white/95 px-4 py-2.5 backdrop-blur sm:px-6',
        !fit && (maximizado ? 'sticky top-0' : 'sticky top-14 md:top-0'),
      )}>
        <div className="min-w-0 flex-1">
          <h1 className="truncate text-[17px] font-semibold leading-tight tracking-tight text-beon-ink">{title}</h1>
          {description && <p className="hidden truncate text-xs text-beon-muted sm:block">{description}</p>}
        </div>
        {(actions || podeAtualizar || maximizable) && (
          <div className="flex shrink-0 items-center gap-2">
            {actions}
            {podeAtualizar && <RefreshButton />}
            {maximizable && <MaximizeButton maximizado={maximizado} onClick={alternarMaximizado} />}
          </div>
        )}
      </div>
      <div className={cx('flex min-w-0 flex-1 flex-col', fit && 'min-h-0 overflow-hidden')}>{children}</div>
    </div>
  )
}
