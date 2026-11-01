'use client'

// Peças da aba "Experimentos ativos": identidade de cada fase, o card do experimento e o detalhe (painel lateral) com
// a ficha, o relatório e, para admins, a edição desses links.

import { useEffect, useState, type FormEvent } from 'react'
import { createPortal } from 'react-dom'
import { ArrowUpRight, Building2, CalendarDays, Check, Copy, FileBarChart2, FileText, FlaskConical, Layers, Link2, Pencil, RefreshCw, UserRound, X } from 'lucide-react'
import type { ExperimentoDetalhado, FaseDoExperimento, LinksDoExperimento } from '@/lib/community/experimentos-ativos'
import { api, errorMessage } from '@/components/comunidade/api'
import { tempoRelativo } from '@/components/comunidade/format'
import { CoverArt } from '@/components/comunidade/visuals'
import { Avatar, cx, focusRing, inputClass } from '@/components/ui'

export const FASE: Record<FaseDoExperimento, { pill: string; ponto: string; tone: 'red' | 'amber'; explica: string }> = {
  'Em andamento': { pill: 'bg-emerald-50 text-emerald-800 ring-emerald-200', ponto: 'bg-emerald-500', tone: 'red', explica: 'O experimento está rodando: hipótese em teste, com o time construindo e medindo.' },
  'Em validação': { pill: 'bg-amber-50 text-amber-800 ring-amber-200', ponto: 'bg-amber-500', tone: 'amber', explica: 'O teste terminou e os resultados estão sendo validados antes da decisão de seguir, ajustar ou parar.' },
}

const ETAPAS = ['Backlog', 'Refinamento', 'Pronto', 'Em andamento', 'Em validação', 'Concluído'] as const

export function SeloDaFase({ fase, sobreImagem }: { fase: FaseDoExperimento; sobreImagem?: boolean }) {
  return (
    <span className={cx('inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-bold ring-1',
      sobreImagem ? 'bg-white/95 text-beon-ink ring-white/40' : FASE[fase].pill)}>
      <span className={cx('h-1.5 w-1.5 rounded-full', FASE[fase].ponto, fase === 'Em andamento' && 'animate-pulse')} aria-hidden />{fase}
    </span>
  )
}

function Documentos({ links, compacto }: { links: LinksDoExperimento; compacto?: boolean }) {
  const item = (tem: boolean, rotulo: string, Icone: typeof FileText) => (
    <span className={cx('inline-flex items-center gap-1 text-[11px] font-semibold', tem ? 'text-beon-ink' : 'text-beon-muted/70')} title={tem ? `${rotulo} disponível` : `${rotulo} ainda não publicada`}>
      <Icone className="h-3.5 w-3.5" aria-hidden />{rotulo}{tem && <Check className="h-3 w-3 text-emerald-600" aria-hidden />}
    </span>
  )
  return (
    <span className={cx('flex items-center', compacto ? 'gap-2.5' : 'gap-3')}>
      {item(!!links.ficha, 'Ficha', FileText)}
      {item(!!links.relatorio, 'Relatório', FileBarChart2)}
    </span>
  )
}

/** Card do experimento: capa, fase, nome, Iniciativa, resumo, sponsor, diretoria e quais documentos já estão no ar. */
export function CardDoExperimento({ e, onAbrir, destaque }: { e: ExperimentoDetalhado; onAbrir: () => void; destaque?: boolean }) {
  return (
    <button type="button" onClick={onAbrir}
      className={cx('group flex h-full w-full flex-col overflow-hidden rounded-[26px] border border-beon-line bg-white text-left transition-all duration-300 hover:-translate-y-1 hover:border-beon-ink/20 hover:shadow-xl hover:shadow-stone-900/10', focusRing,
        destaque && 'lg:h-[340px] lg:flex-row')}>
      <div className={cx('relative shrink-0 overflow-hidden', destaque ? 'h-48 lg:h-auto lg:w-[46%]' : 'h-36')}>
        <CoverArt seed={e.chave} pattern={destaque ? 'constelacao' : 'rede'} tone={FASE[e.fase].tone} className="h-full w-full transition-transform duration-700 group-hover:scale-105" />
        <div className="absolute inset-0 bg-gradient-to-t from-black/45 via-transparent to-black/10" aria-hidden />
        <div className="absolute inset-x-3 top-3 flex items-start justify-between gap-2">
          <SeloDaFase fase={e.fase} sobreImagem />
          {destaque && <span className="rounded-full bg-beon-red px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.08em] text-white">Mexeu agora</span>}
        </div>
        {e.iniciativa && (
          <span className="absolute inset-x-3 bottom-3 inline-flex max-w-full items-center gap-1.5 truncate text-[11px] font-semibold text-white/90">
            <Layers className="h-3.5 w-3.5 shrink-0" aria-hidden /><span className="truncate">{e.iniciativa}</span>
          </span>
        )}
      </div>
      <div className={cx('flex flex-1 flex-col', destaque ? 'p-6 lg:p-8' : 'p-5')}>
        <h3 className={cx('font-extrabold leading-snug tracking-tight text-beon-ink group-hover:text-beon-red', destaque ? 'text-2xl lg:text-[28px]' : 'text-[17px]')}>{e.nome}</h3>
        <p className={cx('mt-2 text-sm leading-relaxed text-beon-body', destaque ? 'line-clamp-5' : 'line-clamp-3')}>
          {e.descricao ?? <span className="italic text-beon-muted">O time ainda não escreveu a descrição deste experimento no Jira.</span>}
        </p>
        <div className="mt-auto space-y-3 pt-5">
          <div className="flex items-center gap-2.5">
            {e.sponsor ? <Avatar nome={e.sponsor} size={30} /> : <span className="flex h-[30px] w-[30px] items-center justify-center rounded-full bg-beon-soft text-beon-muted"><UserRound className="h-4 w-4" aria-hidden /></span>}
            <span className="min-w-0 text-[13px] leading-tight">
              <span className="block truncate font-semibold text-beon-ink">{e.sponsor ?? 'Sponsor não informado'}</span>
              <span className="block truncate text-beon-muted">{e.diretoria ?? 'Diretoria não informada'}</span>
            </span>
          </div>
          <div className="flex items-center justify-between gap-2 border-t border-beon-line pt-3">
            <Documentos links={e.links} compacto />
            <span className="inline-flex items-center gap-1 text-xs font-semibold text-beon-red opacity-80 group-hover:opacity-100">Ver detalhes<ArrowUpRight className="h-3.5 w-3.5" aria-hidden /></span>
          </div>
        </div>
      </div>
    </button>
  )
}

function BotaoDeDocumento({ href, titulo, descricao, Icone }: { href?: string; titulo: string; descricao: string; Icone: typeof FileText }) {
  if (!href) {
    return (
      <div className="flex items-center gap-3 rounded-2xl border border-dashed border-beon-line p-4">
        <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-beon-soft text-beon-muted"><Icone className="h-5 w-5" aria-hidden /></span>
        <span className="min-w-0">
          <span className="block text-sm font-semibold text-beon-muted">{titulo}</span>
          <span className="block text-xs text-beon-muted">Ainda não publicado pelo time do Lab.</span>
        </span>
      </div>
    )
  }
  return (
    <a href={href} target="_blank" rel="noopener noreferrer"
      className={cx('group flex items-center gap-3 rounded-2xl border border-beon-line bg-white p-4 transition-all hover:-translate-y-0.5 hover:border-beon-red/40 hover:shadow-lg', focusRing)}>
      <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-beon-tint text-beon-red"><Icone className="h-5 w-5" aria-hidden /></span>
      <span className="min-w-0 flex-1">
        <span className="block text-sm font-bold text-beon-ink">{titulo}</span>
        <span className="block truncate text-xs text-beon-muted">{descricao}</span>
      </span>
      <ArrowUpRight className="h-5 w-5 shrink-0 text-beon-muted transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5 group-hover:text-beon-red" aria-hidden />
    </a>
  )
}

/** Edição dos links (só admins): o que a Comunidade vai abrir nos botões de ficha e relatório. */
function EditorDeLinks({ e, onSalvo }: { e: ExperimentoDetalhado; onSalvo: (l: LinksDoExperimento) => void }) {
  const [aberto, setAberto] = useState(!e.links.ficha && !e.links.relatorio)
  const [ficha, setFicha] = useState(e.links.ficha ?? '')
  const [relatorio, setRelatorio] = useState(e.links.relatorio ?? '')
  const [salvando, setSalvando] = useState(false)
  const [msg, setMsg] = useState<{ tipo: 'ok' | 'erro'; texto: string } | null>(null)

  async function salvar(ev: FormEvent) {
    ev.preventDefault()
    setSalvando(true); setMsg(null)
    try {
      const l = await api<LinksDoExperimento>(`/community/experimentos-ativos/${encodeURIComponent(e.chave)}/links`, { method: 'PUT', json: { ficha, relatorio } })
      onSalvo(l)
      setMsg({ tipo: 'ok', texto: 'Links salvos: a Comunidade já pode abrir.' })
      setAberto(false)
    } catch (err) { setMsg({ tipo: 'erro', texto: errorMessage(err) }) }
    setSalvando(false)
  }

  return (
    <section className="rounded-2xl border border-beon-line bg-beon-soft/50 p-4" aria-label="Links da ficha e do relatório (admins)">
      <div className="flex items-center justify-between gap-2">
        <p className="inline-flex items-center gap-2 text-sm font-bold text-beon-ink"><Link2 className="h-4 w-4 text-beon-red" aria-hidden />Links para a Comunidade</p>
        <span className="rounded-full bg-beon-ink px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-white">Só admins</span>
      </div>
      {e.links.atualizadoEm && <p className="mt-1 text-xs text-beon-muted">Atualizados por {e.links.atualizadoPor} {tempoRelativo(e.links.atualizadoEm)}.</p>}
      {!aberto ? (
        <button type="button" onClick={() => setAberto(true)}
          className={cx('mt-3 inline-flex h-9 items-center gap-1.5 rounded-full border border-beon-line bg-white px-3.5 text-[13px] font-semibold text-beon-ink hover:bg-beon-soft', focusRing)}>
          <Pencil className="h-3.5 w-3.5" aria-hidden />Editar links
        </button>
      ) : (
        <form onSubmit={salvar} className="mt-3 space-y-3">
          <label className="block text-xs font-semibold text-beon-body">Link da ficha do experimento
            <input type="url" inputMode="url" placeholder="https://…" value={ficha} onChange={x => setFicha(x.target.value)} className={cx(inputClass, 'mt-1 h-10 bg-white text-sm')} />
          </label>
          <label className="block text-xs font-semibold text-beon-body">Link do relatório
            <input type="url" inputMode="url" placeholder="https://…" value={relatorio} onChange={x => setRelatorio(x.target.value)} className={cx(inputClass, 'mt-1 h-10 bg-white text-sm')} />
          </label>
          <p className="text-[11px] leading-relaxed text-beon-muted">Use links que a Comunidade consiga abrir (SharePoint, Drive, Confluence…). Deixe vazio para tirar o botão do ar.</p>
          <div className="flex gap-2">
            <button type="submit" disabled={salvando}
              className={cx('inline-flex h-9 items-center gap-1.5 rounded-full bg-beon-red px-4 text-[13px] font-semibold text-white hover:bg-beon-redhi disabled:opacity-60', focusRing)}>
              {salvando ? <RefreshCw className="h-3.5 w-3.5 animate-spin" aria-hidden /> : <Check className="h-3.5 w-3.5" aria-hidden />}Salvar links
            </button>
            {(e.links.ficha || e.links.relatorio) && (
              <button type="button" onClick={() => setAberto(false)} className={cx('h-9 rounded-full px-3 text-[13px] font-semibold text-beon-body hover:bg-white', focusRing)}>Cancelar</button>
            )}
          </div>
        </form>
      )}
      {msg && <p role="status" className={cx('mt-2 text-xs font-medium', msg.tipo === 'ok' ? 'text-emerald-700' : 'text-red-700')}>{msg.texto}</p>}
    </section>
  )
}

const dataLonga = (iso: string | null) => (iso ? new Date(iso).toLocaleDateString('pt-BR', { day: 'numeric', month: 'long', year: 'numeric' }) : null)

/** Painel lateral com tudo do experimento. Esc ou clique fora fecham. */
export function DetalheDoExperimento({ e, podeEditar, onFechar, onLinks }: {
  e: ExperimentoDetalhado; podeEditar: boolean; onFechar: () => void; onLinks: (l: LinksDoExperimento) => void
}) {
  const [visivel, setVisivel] = useState(false)
  const [copiado, setCopiado] = useState(false)
  useEffect(() => {
    const t = setTimeout(() => setVisivel(true), 20)
    const tecla = (k: KeyboardEvent) => { if (k.key === 'Escape') onFechar() }
    document.addEventListener('keydown', tecla)
    const overflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => { clearTimeout(t); document.removeEventListener('keydown', tecla); document.body.style.overflow = overflow }
  }, [onFechar])

  const atual = ETAPAS.indexOf(e.fase)
  async function copiar() {
    try { await navigator.clipboard.writeText(window.location.href); setCopiado(true); setTimeout(() => setCopiado(false), 2000) } catch { /* sem área de transferência */ }
  }

  return createPortal(
    <div className="fixed inset-0 z-50 flex justify-end" role="dialog" aria-modal="true" aria-labelledby="t-exp">
      <button type="button" aria-label="Fechar" onClick={onFechar} className={cx('absolute inset-0 bg-stone-950/40 backdrop-blur-[2px] transition-opacity duration-300', visivel ? 'opacity-100' : 'opacity-0')} />
      <div className={cx('relative flex h-full w-full max-w-[640px] flex-col overflow-y-auto bg-white shadow-2xl transition-transform duration-300 ease-out', visivel ? 'translate-x-0' : 'translate-x-full')}>
        <div className="relative h-60 shrink-0 overflow-hidden">
          <CoverArt seed={e.chave} pattern="constelacao" tone={FASE[e.fase].tone} className="h-full w-full" />
          <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/30 to-black/20" aria-hidden />
          <div className="absolute inset-x-5 top-5 flex items-center justify-between gap-2">
            <span className="flex items-center gap-2">
              <SeloDaFase fase={e.fase} sobreImagem />
              <span className="rounded-full bg-black/35 px-2.5 py-1 text-[11px] font-semibold text-white/90 backdrop-blur-md">{e.chave}</span>
            </span>
            <span className="flex gap-2">
              <button type="button" onClick={copiar} aria-label="Copiar link do experimento"
                className={cx('flex h-9 items-center gap-1.5 rounded-full bg-black/35 px-3 text-xs font-semibold text-white backdrop-blur-md hover:bg-black/55', focusRing)}>
                {copiado ? <Check className="h-4 w-4" aria-hidden /> : <Copy className="h-4 w-4" aria-hidden />}{copiado ? 'Copiado' : 'Copiar link'}
              </button>
              <button type="button" onClick={onFechar} aria-label="Fechar detalhes"
                className={cx('flex h-9 w-9 items-center justify-center rounded-full bg-black/35 text-white backdrop-blur-md hover:bg-black/55', focusRing)}>
                <X className="h-5 w-5" aria-hidden />
              </button>
            </span>
          </div>
          <div className="absolute inset-x-6 bottom-5">
            {e.iniciativa && <p className="inline-flex items-center gap-1.5 text-xs font-semibold text-white/80"><Layers className="h-3.5 w-3.5" aria-hidden />Iniciativa · {e.iniciativa}</p>}
            <h2 id="t-exp" className="mt-1 text-[26px] font-extrabold leading-tight tracking-tight text-white sm:text-[30px]">{e.nome}</h2>
          </div>
        </div>

        <div className="space-y-7 px-6 py-6">
          {/* Onde está no caminho */}
          <section aria-label="Fase do experimento">
            <ol className="flex items-center">
              {ETAPAS.map((etapa, i) => (
                <li key={etapa} className="flex flex-1 items-start last:flex-none">
                  <span className="flex flex-col items-center gap-1.5">
                    <span className={cx('flex h-7 w-7 items-center justify-center rounded-full text-[11px] font-bold',
                      i < atual ? 'bg-beon-ink text-white' : i === atual ? 'bg-beon-red text-white ring-4 ring-beon-tint' : 'bg-beon-soft text-beon-muted')}>
                      {i < atual ? <Check className="h-3.5 w-3.5" aria-hidden /> : i + 1}
                    </span>
                    <span className={cx('hidden w-16 text-center text-[10px] leading-tight sm:block', i === atual ? 'font-bold text-beon-ink' : 'text-beon-muted')}>{etapa}</span>
                  </span>
                  {i < ETAPAS.length - 1 && <span className={cx('mx-1 mt-[13px] h-[3px] flex-1 rounded-full', i < atual ? 'bg-beon-ink' : 'bg-beon-soft')} aria-hidden />}
                </li>
              ))}
            </ol>
            <p className="mt-3 rounded-2xl bg-beon-soft/70 px-4 py-3 text-[13px] leading-relaxed text-beon-body"><b className="text-beon-ink">{e.fase}.</b> {FASE[e.fase].explica}</p>
          </section>

          <dl className="grid gap-3 sm:grid-cols-2">
            <div className="flex items-center gap-3 rounded-2xl border border-beon-line p-3.5">
              {e.sponsor ? <Avatar nome={e.sponsor} size={40} /> : <span className="flex h-10 w-10 items-center justify-center rounded-full bg-beon-soft text-beon-muted"><UserRound className="h-5 w-5" aria-hidden /></span>}
              <span className="min-w-0"><dt className="text-[11px] font-semibold uppercase tracking-wide text-beon-muted">Sponsor / Diretor</dt><dd className="truncate font-bold text-beon-ink">{e.sponsor ?? 'Não informado'}</dd></span>
            </div>
            <div className="flex items-center gap-3 rounded-2xl border border-beon-line p-3.5">
              <span className="flex h-10 w-10 items-center justify-center rounded-full bg-beon-tint text-beon-red"><Building2 className="h-5 w-5" aria-hidden /></span>
              <span className="min-w-0"><dt className="text-[11px] font-semibold uppercase tracking-wide text-beon-muted">Diretoria</dt><dd className="truncate font-bold text-beon-ink">{e.diretoria ?? 'Não informada'}</dd></span>
            </div>
            <div className="flex items-center gap-3 rounded-2xl border border-beon-line p-3.5">
              <span className="flex h-10 w-10 items-center justify-center rounded-full bg-beon-soft text-beon-body"><FlaskConical className="h-5 w-5" aria-hidden /></span>
              <span className="min-w-0"><dt className="text-[11px] font-semibold uppercase tracking-wide text-beon-muted">No Jira desde</dt><dd className="truncate font-bold text-beon-ink">{dataLonga(e.criadoEm) ?? '—'}</dd></span>
            </div>
            <div className="flex items-center gap-3 rounded-2xl border border-beon-line p-3.5">
              <span className="flex h-10 w-10 items-center justify-center rounded-full bg-beon-soft text-beon-body"><CalendarDays className="h-5 w-5" aria-hidden /></span>
              <span className="min-w-0"><dt className="text-[11px] font-semibold uppercase tracking-wide text-beon-muted">Última atualização</dt><dd className="truncate font-bold text-beon-ink">{e.atualizadoEm ? tempoRelativo(e.atualizadoEm) : '—'}</dd></span>
            </div>
          </dl>

          <section aria-labelledby="t-desc">
            <h3 id="t-desc" className="text-[12px] font-bold uppercase tracking-[0.14em] text-beon-muted">Sobre o experimento</h3>
            <p className="mt-2 whitespace-pre-line text-[15px] leading-relaxed text-beon-body">
              {e.descricao ?? 'O time ainda não escreveu a descrição deste experimento no Jira.'}
            </p>
          </section>

          <section aria-labelledby="t-docs">
            <h3 id="t-docs" className="text-[12px] font-bold uppercase tracking-[0.14em] text-beon-muted">Documentos</h3>
            <div className="mt-3 grid gap-3 sm:grid-cols-2">
              <BotaoDeDocumento href={e.links.ficha} titulo="Ficha do experimento" descricao="Hipótese, escopo e como vamos medir" Icone={FileText} />
              <BotaoDeDocumento href={e.links.relatorio} titulo="Relatório" descricao="Resultados e aprendizados" Icone={FileBarChart2} />
            </div>
          </section>

          {podeEditar && <EditorDeLinks key={e.chave} e={e} onSalvo={onLinks} />}
        </div>
      </div>
    </div>,
    document.body,
  )
}
