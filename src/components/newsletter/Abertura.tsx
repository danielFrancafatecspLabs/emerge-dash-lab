'use client'

// Abertura do beOn Radar: "Hoje é…, você vai conferir as principais tendências do mercado. Você está em…, e agora
// são…". O relógio anda sozinho; o lugar vem do fuso do navegador e, se a pessoa pedir, da localização do aparelho
// (resolvida aqui mesmo, sem mandar coordenadas para fora).

import { useEffect, useState, type ReactNode } from 'react'
import { Globe2, LocateFixed } from 'lucide-react'
import { cx, focusRing } from '@/components/ui'
import { cidadeMaisProxima, localPeloFuso, type Local } from './local'

const CHAVE_LOCAL = 'beon:radar:local'

function lerLocalSalvo(): Local | null {
  try {
    const v = JSON.parse(localStorage.getItem(CHAVE_LOCAL) ?? 'null')
    return v && typeof v.cidade === 'string' && typeof v.pais === 'string' ? { ...v, fonte: 'aparelho' } : null
  } catch { return null }
}

const plural = (n: number, um: string, varios: string) => `${n} ${n === 1 ? um : varios}`

export function Abertura({ edicao, acoes }: { edicao: number; acoes?: ReactNode }) {
  const [agora, setAgora] = useState<Date | null>(null)
  const [local, setLocal] = useState<Local | null>(null)
  const [localizando, setLocalizando] = useState(false)
  const [aviso, setAviso] = useState<string | null>(null)

  useEffect(() => {
    setAgora(new Date())
    const t = setInterval(() => setAgora(new Date()), 10_000)
    const fuso = Intl.DateTimeFormat().resolvedOptions().timeZone
    setLocal(lerLocalSalvo() ?? localPeloFuso(fuso))
    return () => clearInterval(t)
  }, [])

  function usarLocalizacao() {
    if (!navigator.geolocation) { setAviso('Este navegador não informa a localização.'); return }
    setLocalizando(true); setAviso(null)
    navigator.geolocation.getCurrentPosition(pos => {
      setLocalizando(false)
      const achado = cidadeMaisProxima(pos.coords.latitude, pos.coords.longitude)
      if (!achado) { setAviso('Não achamos uma cidade conhecida perto de você; seguimos pelo fuso horário.'); return }
      setLocal(achado)
      try { localStorage.setItem(CHAVE_LOCAL, JSON.stringify(achado)) } catch { /* sem armazenamento */ }
    }, () => { setLocalizando(false); setAviso('Sem permissão para usar a localização; seguimos pelo fuso horário.') }, { timeout: 10_000, maximumAge: 3600_000 })
  }

  const dia = agora?.toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'long' })
  const horas = agora?.getHours() ?? 0
  const minutos = agora?.getMinutes() ?? 0
  const destaque = 'font-extrabold text-beon-ink'

  return (
    <section aria-label="Abertura do beOn Radar" className="relative overflow-hidden rounded-[28px] border border-beon-line bg-white px-6 py-7 sm:px-10 sm:py-9">
      <div className="pointer-events-none absolute -right-16 -top-16 hidden h-64 w-64 rounded-full border-[18px] border-beon-tint sm:block" aria-hidden />
      <div className="pointer-events-none absolute -right-4 top-6 hidden h-40 w-40 animate-[spin_40s_linear_infinite] rounded-full border border-dashed border-beon-red/30 sm:block" aria-hidden />
      <div className="relative flex flex-wrap items-center justify-between gap-3">
        <p className="inline-flex items-center gap-2 text-[12px] font-bold uppercase tracking-[0.16em] text-beon-red">
          <Globe2 className="h-4 w-4" aria-hidden />beOn Radar 360° · Edição nº {edicao}
        </p>
        <div className="flex flex-wrap gap-2">{acoes}</div>
      </div>

      <p className="relative mt-4 max-w-4xl text-[22px] font-medium leading-[1.35] tracking-tight text-beon-body sm:text-[28px]" aria-live="off">
        {agora ? (
          <>
            Hoje é <span className={destaque}>{dia}</span>, e você vai conferir as principais tendências do mercado.
            {' '}Você está em <span className={destaque}>{local?.cidade}</span>, <span className={destaque}>{local?.pais}</span>,
            {' '}e agora são <span className={cx(destaque, 'tabular-nums text-beon-red')}>{plural(horas, 'hora', 'horas')} e {plural(minutos, 'minuto', 'minutos')}</span>.
          </>
        ) : <span className="invisible">Carregando a abertura</span>}
      </p>
      <p className="relative mt-3 max-w-3xl text-[15px] leading-relaxed text-beon-muted sm:text-base">
        <strong className="font-bold text-beon-ink">Este é o beOn Radar</strong>: uma newsletter que te faz enxergar as tendências em 360° pelo mundo,
        das bolsas ao Vale do Silício, das novas tecnologias aos sinais de futuro.
      </p>
      <div className="relative mt-4 flex flex-wrap items-center gap-x-4 gap-y-2 text-xs text-beon-muted">
        {local?.fonte === 'fuso' && (
          <button type="button" onClick={usarLocalizacao} disabled={localizando}
            className={cx('inline-flex items-center gap-1.5 rounded-full border border-beon-line px-3 py-1.5 font-semibold text-beon-body hover:bg-beon-soft disabled:opacity-60', focusRing)}>
            <LocateFixed className="h-3.5 w-3.5" aria-hidden />{localizando ? 'Localizando…' : 'Não é sua cidade? Usar minha localização'}
          </button>
        )}
        {local?.fonte === 'fuso' && <span>Cidade estimada pelo fuso horário do seu navegador.</span>}
        {aviso && <span role="status">{aviso}</span>}
      </div>
    </section>
  )
}
