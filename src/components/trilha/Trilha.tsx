'use client'

// Trilha de Experimentação: as dez etapas numa página só, com mapa, progresso salvo no perfil,
// vídeos da série "Experimentar no beOn Labs" e a etapa atual no endereço (?etapa=…).

import { useCallback, useEffect, useRef, useState } from 'react'
import {
  ArrowLeft, ArrowRight, BookOpen, CheckCircle2, ChevronDown, ClipboardCopy, Clock, FlaskConical, PlayCircle, Share2,
} from 'lucide-react'
import { useCommunity } from '@/components/comunidade/CommunityProvider'
import { useHideChrome } from '@/components/shell/AppChrome'
import { MaximizeButton, useMaximizado } from '@/components/shell/PortalPage'
import { Button, Dialog, cx, focusRing } from '@/components/ui'
import type { EtapaTrilha } from '@/lib/community/trilha'
import { BlocoTrilha, Rico } from './Blocos'
import { ETAPAS, FASES, GLOSSARIO, type Etapa, type Video } from './conteudo'

const TOTAL = ETAPAS.length

function faseDe(etapa: Etapa) {
  const i = FASES.findIndex(f => f.id === etapa.fase)
  return { ...FASES[i], n: i + 1 }
}

// ── Mapa da trilha ─────────────────────────────────────────────────────────────────────────────

function Mapa({ atual, concluidas, proxima, onIr }: {
  atual: EtapaTrilha; concluidas: EtapaTrilha[]; proxima: EtapaTrilha | null; onIr: (id: EtapaTrilha) => void
}) {
  return (
    <nav aria-label="Etapas da trilha" className="space-y-5">
      {FASES.map((fase, fi) => {
        const etapas = ETAPAS.filter(e => e.fase === fase.id)
        const feitas = etapas.filter(e => concluidas.includes(e.id)).length
        return (
          <div key={fase.id}>
            <div className="flex items-baseline justify-between px-3">
              <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-beon-muted">Fase {fi + 1} · {fase.titulo}</p>
              <p className="text-[11px] tabular-nums text-beon-muted">{feitas}/{etapas.length}</p>
            </div>
            <ol className="mt-1.5 space-y-0.5">
              {etapas.map(e => {
                const n = ETAPAS.indexOf(e) + 1
                const ok = concluidas.includes(e.id)
                const ativa = e.id === atual
                return (
                  <li key={e.id}>
                    <button type="button" onClick={() => onIr(e.id)} aria-current={ativa ? 'step' : undefined}
                      className={cx('flex w-full items-center gap-3 rounded-xl px-3 py-2 text-left transition-colors', ativa ? 'bg-beon-ink text-white' : 'hover:bg-beon-soft', focusRing)}>
                      <span className={cx('flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs font-bold tabular-nums',
                        ok ? 'bg-emerald-600 text-white' : ativa ? 'bg-white text-beon-ink' : 'bg-beon-soft text-beon-muted')}>
                        {ok ? <CheckCircle2 className="h-4 w-4" aria-label="Concluída" /> : n}
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className={cx('block truncate text-sm', ativa ? 'font-semibold' : 'text-beon-ink')}>{e.curto}</span>
                        <span className={cx('flex items-center gap-1 text-[11px]', ativa ? 'text-white/70' : 'text-beon-muted')}>
                          {e.video && <PlayCircle className="h-3 w-3" aria-label="Com vídeo" />}
                          {e.minutos} min
                        </span>
                      </span>
                      {e.id === proxima && !ativa && <span className="rounded-full bg-beon-tint px-2 py-0.5 text-[10px] font-semibold text-beon-red">Próxima</span>}
                    </button>
                  </li>
                )
              })}
            </ol>
          </div>
        )
      })}
    </nav>
  )
}

/** Barra de progresso em segmentos, um por etapa, agrupados por fase. Cada segmento leva à etapa. */
function Progresso({ atual, concluidas, onIr }: { atual: EtapaTrilha; concluidas: EtapaTrilha[]; onIr: (id: EtapaTrilha) => void }) {
  return (
    <div className="flex gap-3">
      {FASES.map(fase => {
        const etapas = ETAPAS.filter(e => e.fase === fase.id)
        return (
          <div key={fase.id} className="min-w-0" style={{ flex: etapas.length }}>
            <p className="hidden truncate text-[11px] font-medium text-beon-muted sm:block">{fase.titulo}</p>
            <div className="mt-1 flex gap-1">
              {etapas.map(e => {
                const ok = concluidas.includes(e.id)
                const ativa = e.id === atual
                return (
                  <button key={e.id} type="button" onClick={() => onIr(e.id)}
                    aria-label={`Etapa ${ETAPAS.indexOf(e) + 1}: ${e.titulo}${ok ? ' (concluída)' : ''}`}
                    className={cx('h-2 flex-1 rounded-full transition-colors', focusRing,
                      ok ? 'bg-beon-red' : 'bg-beon-line hover:bg-stone-300', ativa && 'ring-2 ring-beon-ink ring-offset-2')} />
                )
              })}
            </div>
          </div>
        )
      })}
    </div>
  )
}

// ── Partes da etapa ────────────────────────────────────────────────────────────────────────────

function VideoEpisodio({ video }: { video: Video }) {
  return (
    <section aria-label={`Vídeo: ${video.titulo}`} className="grid gap-5 rounded-3xl bg-beon-soft p-4 sm:grid-cols-[minmax(0,240px)_1fr] sm:p-5">
      <div className="mx-auto w-full max-w-[240px] overflow-hidden rounded-2xl bg-stone-900 shadow-sm">
        <video controls playsInline preload="none" poster={video.poster} className="aspect-[9/16] w-full object-cover">
          <source src={video.src} type="video/mp4" />
          Seu navegador não reproduz vídeos.
        </video>
      </div>
      <div className="min-w-0 self-center">
        <p className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.1em] text-beon-red">
          <PlayCircle className="h-3.5 w-3.5" aria-hidden /> {video.episodio} · {video.duracao}
        </p>
        <h3 className="mt-1 text-xl font-semibold tracking-tight text-beon-ink">{video.titulo}</h3>
        <p className="mt-1 text-sm text-beon-muted">Série “Experimentar no beOn Labs”, com o Ben, cientista do laboratório. O vídeo tem legendas.</p>
        <p className="mt-4 text-sm font-semibold text-beon-ink">Neste episódio</p>
        <ul className="mt-2 space-y-2">
          {video.pontos.map(p => (
            <li key={p} className="flex gap-2.5 text-sm leading-relaxed text-beon-body">
              <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-beon-red" aria-hidden /> {p}
            </li>
          ))}
        </ul>
        <p className="mt-4 text-sm text-beon-muted">O texto abaixo aprofunda o que o vídeo apresenta. Dá para seguir só lendo.</p>
      </div>
    </section>
  )
}

function Ferramenta({ ferramenta, onCopiar }: { ferramenta: NonNullable<Etapa['ferramenta']>; onCopiar: () => void }) {
  return (
    <section className="overflow-hidden rounded-2xl border border-beon-line">
      <div className="flex flex-wrap items-start justify-between gap-3 border-b border-beon-line bg-beon-soft px-4 py-3 sm:px-5">
        <div className="min-w-0">
          <p className="text-[11px] font-semibold uppercase tracking-[0.1em] text-beon-muted">Modelo para copiar</p>
          <h3 className="font-semibold text-beon-ink">{ferramenta.nome}</h3>
          <p className="mt-0.5 text-sm text-beon-muted">{ferramenta.descricao}</p>
        </div>
        <Button size="sm" icon={ClipboardCopy} onClick={onCopiar}>Copiar</Button>
      </div>
      <pre className="whitespace-pre-wrap bg-white px-4 py-4 font-sans text-sm leading-relaxed text-beon-body sm:px-5">{ferramenta.modelo}</pre>
    </section>
  )
}

// ── Página ─────────────────────────────────────────────────────────────────────────────────────

export function TrilhaExperimentacao({ etapaInicial }: { etapaInicial: EtapaTrilha | null }) {
  const { me, patchProfile, openComposer, toast } = useCommunity()
  const concluidas = me?.profile.trilhaConcluida ?? []
  const proxima = ETAPAS.find(e => !concluidas.includes(e.id))?.id ?? null

  const [atual, setAtual] = useState<EtapaTrilha>(etapaInicial ?? ETAPAS[0].id)
  const [posicionada, setPosicionada] = useState(etapaInicial !== null)
  const [mapaAberto, setMapaAberto] = useState(false)
  const [glossario, setGlossario] = useState(false)
  const [salvando, setSalvando] = useState(false)
  const [maximizado, alternarMaximizado] = useMaximizado('trilha', true)
  useHideChrome(maximizado)
  const topo = useRef<HTMLDivElement>(null)

  // Sem etapa no endereço, abre onde a pessoa parou.
  useEffect(() => {
    if (me && !posicionada) {
      if (proxima) setAtual(proxima)
      setPosicionada(true)
    }
  }, [me, posicionada, proxima])

  const ir = useCallback((id: EtapaTrilha) => {
    setAtual(id)
    setMapaAberto(false)
    try {
      const url = new URL(window.location.href)
      url.searchParams.set('etapa', id)
      window.history.replaceState(null, '', url)
    } catch { /* endereço é só conveniência */ }
    topo.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }, [])

  const i = ETAPAS.findIndex(e => e.id === atual)
  const etapa = ETAPAS[i]
  const fase = faseDe(etapa)
  const anterior = ETAPAS[i - 1]
  const seguinte = ETAPAS[i + 1]
  const feita = concluidas.includes(etapa.id)
  const restantes = ETAPAS.filter(e => !concluidas.includes(e.id)).reduce((s, e) => s + e.minutos, 0)

  async function alternar() {
    setSalvando(true)
    const ok = await patchProfile({ toggleEtapa: etapa.id }, p => ({
      ...p, trilhaConcluida: ETAPAS.map(e => e.id).filter(id => (id === etapa.id ? !feita : p.trilhaConcluida.includes(id))),
    }))
    setSalvando(false)
    if (!ok || feita) return
    if (!seguinte) toast('Trilha concluída. Que tal compartilhar o que você aprendeu?')
    else { toast(`Etapa ${i + 1} concluída.`); ir(seguinte.id) }
  }

  async function copiar() {
    if (!etapa.ferramenta) return
    try { await navigator.clipboard.writeText(etapa.ferramenta.modelo); toast('Modelo copiado.') } catch { toast('Não foi possível copiar. Selecione o texto e copie manualmente.', 'error') }
  }

  return (
    <div className="mx-auto max-w-[1180px] pb-16">
      {/* Cabeçalho */}
      <div className="flex flex-wrap items-end justify-between gap-4 px-4 pb-5 pt-6 sm:px-6 md:pt-8">
        <div className="min-w-0">
          <p className="mb-1 text-[12px] font-semibold uppercase tracking-[0.12em] text-beon-red">Trilha de Experimentação</p>
          <h1 className="text-[26px] font-semibold leading-tight tracking-tight text-beon-ink sm:text-[30px]">Do problema à decisão</h1>
          <p className="mt-1.5 max-w-2xl text-[15px] leading-relaxed text-beon-muted">
            Como o beOn Labs transforma ideias em evidência antes de virarem investimento. Dez etapas, em três fases, para quem vai propor, conduzir ou patrocinar um experimento.
          </p>
        </div>
        <div className="flex shrink-0 items-center gap-2">
          <Button icon={BookOpen} onClick={() => setGlossario(true)}>Glossário</Button>
          <MaximizeButton maximizado={maximizado} onClick={alternarMaximizado} />
        </div>
      </div>

      {/* Progresso */}
      <div className="px-4 sm:px-6">
        <div className="rounded-2xl border border-beon-line bg-white px-4 py-4 sm:px-5">
          <div className="mb-3 flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
            <p className="text-sm font-semibold text-beon-ink">
              Seu progresso <span className="font-normal tabular-nums text-beon-muted">· {concluidas.length} de {TOTAL} etapas</span>
            </p>
            <p className="flex items-center gap-1.5 text-sm tabular-nums text-beon-muted">
              <Clock className="h-3.5 w-3.5" aria-hidden />
              {restantes > 0 ? `cerca de ${restantes} min para terminar` : 'Trilha concluída'}
            </p>
          </div>
          <Progresso atual={atual} concluidas={concluidas} onIr={ir} />
          {proxima && proxima !== atual && concluidas.length > 0 && (
            <button type="button" onClick={() => ir(proxima)}
              className={cx('mt-3 inline-flex items-center gap-1.5 text-sm font-medium text-beon-red hover:underline', focusRing)}>
              Continuar de onde parei: {ETAPAS.find(e => e.id === proxima)?.curto} <ArrowRight className="h-4 w-4" aria-hidden />
            </button>
          )}
        </div>
      </div>

      <div ref={topo} className="grid scroll-mt-16 grid-cols-1 gap-8 px-4 pt-6 sm:px-6 lg:grid-cols-[264px_minmax(0,1fr)] lg:pt-8">
        {/* Mapa: lateral fixa no desktop, recolhível no celular */}
        <aside className="min-w-0">
          <div className="lg:hidden">
            <button type="button" onClick={() => setMapaAberto(v => !v)} aria-expanded={mapaAberto} aria-controls="mapa-trilha"
              className={cx('flex w-full items-center gap-3 rounded-2xl border border-beon-line bg-white px-4 py-3 text-left', focusRing)}>
              <span className="min-w-0 flex-1">
                <span className="block text-sm font-semibold text-beon-ink">Mapa da trilha</span>
                <span className="block truncate text-xs text-beon-muted">Etapa {i + 1} de {TOTAL} · {concluidas.length} concluída{concluidas.length === 1 ? '' : 's'}</span>
              </span>
              <span className="text-xs font-medium text-beon-red">{mapaAberto ? 'Fechar' : 'Ver etapas'}</span>
              <ChevronDown className={cx('h-4 w-4 text-beon-muted transition-transform', mapaAberto && 'rotate-180')} aria-hidden />
            </button>
            {mapaAberto && (
              <div id="mapa-trilha" className="mt-2 rounded-2xl border border-beon-line bg-white py-3">
                <Mapa atual={atual} concluidas={concluidas} proxima={proxima} onIr={ir} />
              </div>
            )}
          </div>
          <div className="hidden lg:sticky lg:top-6 lg:block">
            <Mapa atual={atual} concluidas={concluidas} proxima={proxima} onIr={ir} />
          </div>
        </aside>

        {/* Etapa */}
        <article aria-labelledby="etapa-titulo" className="min-w-0 max-w-[760px]">
          <header>
            <p className="flex flex-wrap items-center gap-x-2 gap-y-1 text-xs font-semibold uppercase tracking-[0.1em] text-beon-muted">
              <span className="text-beon-red">Fase {fase.n} · {fase.titulo}</span>
              <span aria-hidden>·</span>
              <span>Etapa {i + 1} de {TOTAL}</span>
              <span aria-hidden>·</span>
              <span className="normal-case tracking-normal">{etapa.minutos} min</span>
              {feita && <span className="rounded-full bg-emerald-50 px-2 py-0.5 normal-case tracking-normal text-emerald-700">Concluída</span>}
            </p>
            <div className="mt-2 flex items-start gap-4">
              <span className="hidden h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-beon-tint text-beon-red sm:flex"><etapa.icon className="h-6 w-6" aria-hidden /></span>
              <div className="min-w-0">
                <h2 id="etapa-titulo" className="text-[26px] font-semibold leading-tight tracking-tight text-beon-ink sm:text-[28px]">{etapa.titulo}</h2>
                <p className="mt-1.5 text-[16px] leading-relaxed text-beon-muted">{etapa.resumo}</p>
              </div>
            </div>
          </header>

          <div className="mt-8 space-y-9">
            {etapa.video && <VideoEpisodio key={etapa.id} video={etapa.video} />}

            {etapa.blocos.map((b, bi) => <BlocoTrilha key={bi} bloco={b} />)}

            {etapa.pratica && (
              <section className="rounded-2xl border-l-4 border-beon-red bg-beon-tint/60 px-5 py-4">
                <p className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.1em] text-beon-red">
                  <FlaskConical className="h-3.5 w-3.5" aria-hidden /> Na prática · Aceitação Remota (Ciclo 1)
                </p>
                {etapa.pratica.map(p => <p key={p} className="mt-2 text-[15px] leading-relaxed text-beon-ink"><Rico texto={p} /></p>)}
              </section>
            )}

            {etapa.ferramenta && <Ferramenta ferramenta={etapa.ferramenta} onCopiar={copiar} />}

            {etapa.aprofundar && (
              <details className="group rounded-2xl border border-beon-line bg-white">
                <summary className={cx('flex cursor-pointer list-none items-center justify-between gap-3 rounded-2xl px-4 py-3.5 sm:px-5 [&::-webkit-details-marker]:hidden', focusRing)}>
                  <span className="font-semibold text-beon-ink">{etapa.aprofundar.titulo}</span>
                  <ChevronDown className="h-4 w-4 shrink-0 text-beon-muted transition-transform group-open:rotate-180" aria-hidden />
                </summary>
                <div className="space-y-6 border-t border-beon-line px-4 py-5 sm:px-5">
                  {etapa.aprofundar.blocos.map((b, bi) => <BlocoTrilha key={bi} bloco={b} />)}
                </div>
              </details>
            )}

            <section className="rounded-2xl bg-beon-soft p-4 sm:p-5">
              <h3 className="font-semibold text-beon-ink">Pronto para seguir quando…</h3>
              <ul className="mt-3 space-y-2">
                {etapa.criterios.map(c => (
                  <li key={c} className="flex gap-2.5 text-[15px] text-beon-body"><CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600" aria-hidden /> {c}</li>
                ))}
              </ul>
            </section>
          </div>

          {/* Conclusão e navegação */}
          <div className="mt-10 border-t border-beon-line pt-6">
            <div className="flex flex-wrap items-center gap-3">
              <Button variant={feita ? 'secondary' : 'primary'} icon={CheckCircle2} loading={salvando} onClick={alternar}>
                {feita ? 'Concluída · desmarcar' : seguinte ? 'Concluir e seguir' : 'Concluir a trilha'}
              </Button>
              {!seguinte && etapa.ferramenta && (
                <Button icon={Share2} onClick={() => openComposer({ kind: 'experimento', content: etapa.ferramenta!.modelo, tags: ['experimentacao'] })}>
                  Compartilhar aprendizado
                </Button>
              )}
            </div>
            <div className="mt-6 grid gap-3 sm:grid-cols-2">
              {anterior ? (
                <button type="button" onClick={() => ir(anterior.id)}
                  className={cx('flex items-center gap-3 rounded-2xl border border-beon-line px-4 py-3 text-left hover:bg-beon-soft', focusRing)}>
                  <ArrowLeft className="h-4 w-4 shrink-0 text-beon-muted" aria-hidden />
                  <span className="min-w-0"><span className="block text-xs text-beon-muted">Anterior</span><span className="block truncate text-sm font-semibold text-beon-ink">{anterior.titulo}</span></span>
                </button>
              ) : <span className="hidden sm:block" />}
              {seguinte && (
                <button type="button" onClick={() => ir(seguinte.id)}
                  className={cx('flex items-center justify-end gap-3 rounded-2xl border border-beon-line px-4 py-3 text-right hover:bg-beon-soft', focusRing)}>
                  <span className="min-w-0"><span className="block text-xs text-beon-muted">Próxima</span><span className="block truncate text-sm font-semibold text-beon-ink">{seguinte.titulo}</span></span>
                  <ArrowRight className="h-4 w-4 shrink-0 text-beon-muted" aria-hidden />
                </button>
              )}
            </div>
          </div>
        </article>
      </div>

      <Dialog open={glossario} onClose={() => setGlossario(false)} title="Glossário" description="Os termos usados na trilha e no dia a dia do laboratório." size="lg">
        <dl className="divide-y divide-beon-line">
          {GLOSSARIO.map(g => (
            <div key={g.termo} className="grid gap-1 py-3 sm:grid-cols-[180px_1fr] sm:gap-4">
              <dt className="font-semibold text-beon-ink">{g.termo}</dt>
              <dd className="text-sm leading-relaxed text-beon-body">{g.definicao}</dd>
            </div>
          ))}
        </dl>
      </Dialog>
    </div>
  )
}
