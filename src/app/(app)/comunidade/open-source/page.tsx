'use client'

// Open Source World: vitrine de ferramentas e repositórios open source que qualquer pessoa da comunidade pode publicar
// e editar. Visual escuro com brilho vermelho, mas organizado e enxuto: categorias numa lista lateral, repositórios
// agrupados por categoria e cards só com o essencial. O resto (usos, comandos, licença) fica na ficha de cada um.

import { useEffect, useId, useMemo, useRef, useState, type ButtonHTMLAttributes, type FormEvent, type ReactNode } from 'react'
import {
  AlertTriangle, ArrowUpRight, AudioLines, Ban, Bot, Boxes, Check, Clapperboard, Code2, Copy, Database, FileText, FlaskConical,
  GitFork, HelpCircle, LineChart, Lock, Pencil, Plus, Search, ShieldCheck, Smartphone, SquareTerminal, Trash2, Unlock, X,
  type LucideIcon,
} from 'lucide-react'
import {
  CATEGORIAS_OSS, LICENCAS, familiaDaLicenca, type CategoriaOss, type FamiliaLicenca, type RepoOss,
} from '@/lib/community/open-source'
import { useCommunity } from '@/components/comunidade/CommunityProvider'
import { api, errorMessage } from '@/components/comunidade/api'
import { tempoRelativo } from '@/components/comunidade/format'
import { copiarTexto } from '@/components/clipboard'
import { cx } from '@/components/ui'

const foco = 'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#ff5a4a] focus-visible:ring-offset-2 focus-visible:ring-offset-[#09090b]'

const CATEGORIA_VISUAL: Record<CategoriaOss, { icone: LucideIcon; cor: string }> = {
  'IA e agentes': { icone: Bot, cor: '#ff5a4a' },
  'Agentes de código': { icone: SquareTerminal, cor: '#fb7185' },
  'Documentos e produtividade': { icone: FileText, cor: '#38bdf8' },
  'Pesquisa e ciência': { icone: FlaskConical, cor: '#34d399' },
  'Finanças e trading': { icone: LineChart, cor: '#facc15' },
  'Mobile e engenharia reversa': { icone: Smartphone, cor: '#94a3b8' },
  'Voz e áudio': { icone: AudioLines, cor: '#2dd4bf' },
  'Vídeo e animação': { icone: Clapperboard, cor: '#fb923c' },
  'Dados e analytics': { icone: Database, cor: '#60a5fa' },
  'Ferramentas de dev': { icone: Code2, cor: '#e4e4e7' },
  Segurança: { icone: ShieldCheck, cor: '#4ade80' },
  Outros: { icone: Boxes, cor: '#a1a1aa' },
}

const LICENCA_VISUAL: Record<FamiliaLicenca, { rotulo: string; icone: LucideIcon; cor: string; cls: string; exemplos: string; explica: string }> = {
  permissiva: {
    rotulo: 'Permissiva', icone: Unlock, cor: 'text-emerald-300', cls: 'border-emerald-400/25 bg-emerald-400/[0.06]', exemplos: 'MIT, Apache, BSD',
    explica: 'Pode usar, modificar e incorporar em produtos (inclusive fechados), mantendo o aviso de copyright e a licença.',
  },
  copyleft: {
    rotulo: 'Copyleft', icone: Lock, cor: 'text-amber-300', cls: 'border-amber-400/25 bg-amber-400/[0.06]', exemplos: 'GPL, AGPL, MPL',
    explica: 'Pode usar e modificar, mas quem distribui (ou, na AGPL, oferece pela rede) uma versão modificada precisa abrir o código dela sob a mesma licença. Para uso interno costuma ser tranquilo; para levar a produto, consulte o jurídico.',
  },
  restrita: {
    rotulo: 'Uso restrito', icone: Ban, cor: 'text-red-300', cls: 'border-red-400/30 bg-red-500/[0.07]', exemplos: 'não comercial, proprietária, sem licença',
    explica: 'Não é uma licença open source comum: uso não comercial, proprietária ou sem licença (todos os direitos reservados). Leia os termos e fale com o jurídico antes de usar na empresa.',
  },
  outra: {
    rotulo: 'Verificar', icone: HelpCircle, cor: 'text-zinc-300', cls: 'border-white/15 bg-white/[0.04]', exemplos: 'leia o LICENSE do repositório',
    explica: 'Licença não informada ou fora das mais comuns: leia o arquivo LICENSE do repositório antes de usar.',
  },
}

const nomeDaLicenca = (l: string) => (l === 'Outra / não informada' ? 'licença?' : l)

/** Nome da licença colorido pela família (sem caixa, para não pesar no card). */
function Licenca({ licenca }: { licenca: string }) {
  const v = LICENCA_VISUAL[familiaDaLicenca(licenca)]
  return <span className={cx('font-mono', v.cor)} title={`${v.rotulo}: ${v.explica}`}>{nomeDaLicenca(licenca)}</span>
}

/** "2026-07-21" → "jul/2026" (o último commit quando a ficha foi escrita). */
const mesAno = (data: string) => {
  const [a, m] = data.split('-')
  const meses = ['jan', 'fev', 'mar', 'abr', 'mai', 'jun', 'jul', 'ago', 'set', 'out', 'nov', 'dez']
  return a && m ? `${meses[Number(m) - 1] ?? m}/${a}` : data
}

const porCommit = (a: RepoOss, b: RepoOss) => (b.ultimoCommit ?? '').localeCompare(a.ultimoCommit ?? '')

// ── Peças do visual ──────────────────────────────────────────────────────────

/** Fundo: brilho vermelho no alto e uma grade de pontos que some ao descer. */
function Fundo() {
  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden>
      <div className="absolute inset-x-0 top-0 h-[560px] opacity-[0.16]"
        style={{
          backgroundImage: 'radial-gradient(rgba(255,255,255,0.5) 1px, transparent 1px)', backgroundSize: '24px 24px',
          maskImage: 'linear-gradient(to bottom, black, transparent)', WebkitMaskImage: 'linear-gradient(to bottom, black, transparent)',
        }} />
      <div className="absolute -left-48 -top-56 h-[560px] w-[560px] rounded-full bg-[#D31809]/35 blur-[150px]" />
      <div className="absolute -top-40 right-0 h-[380px] w-[380px] rounded-full bg-[#7a0e05]/30 blur-[140px]" />
      <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-[#ff5a4a]/60 to-transparent" />
    </div>
  )
}

function Botao({ variante = 'secundario', icone: I, children, className, ...props }: {
  variante?: 'primario' | 'secundario' | 'fantasma'; icone?: LucideIcon; children: ReactNode
} & ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button type="button" {...props}
      className={cx('inline-flex h-10 items-center justify-center gap-2 rounded-lg px-4 text-sm font-medium transition-all disabled:opacity-60', foco,
        variante === 'primario' && 'bg-[#D31809] text-white shadow-[0_0_24px_-6px_rgba(211,24,9,0.9)] hover:bg-[#e8261a]',
        variante === 'secundario' && 'border border-white/15 text-zinc-200 hover:border-white/30 hover:bg-white/[0.05]',
        variante === 'fantasma' && 'text-zinc-400 hover:bg-white/[0.06] hover:text-zinc-100',
        className)}>
      {I && <I className="h-4 w-4" aria-hidden />}{children}
    </button>
  )
}

/** Barra de título de terminal (três bolinhas). */
function BarraDeJanela({ titulo, children }: { titulo: string; children?: ReactNode }) {
  return (
    <div className="flex items-center gap-3 border-b border-white/10 bg-white/[0.02] px-4 py-2.5">
      <span className="flex gap-1.5" aria-hidden>
        <span className="h-2.5 w-2.5 rounded-full bg-[#ff5f57]" /><span className="h-2.5 w-2.5 rounded-full bg-[#febc2e]" /><span className="h-2.5 w-2.5 rounded-full bg-[#28c840]" />
      </span>
      <span className="min-w-0 flex-1 truncate font-mono text-xs text-zinc-500">{titulo}</span>
      {children}
    </div>
  )
}

/** Modal escuro (dialog nativo: foco preso, Esc fecha, clique fora fecha). */
function ModalDev({ titulo, subtitulo, caminho, onClose, children, largo }: {
  titulo: string; subtitulo?: string; caminho: string; onClose: () => void; children: ReactNode; largo?: boolean
}) {
  const ref = useRef<HTMLDialogElement>(null)
  const id = useId()
  useEffect(() => {
    const el = ref.current
    if (el && !el.open) el.showModal()
  }, [])
  return (
    <dialog ref={ref} onClose={onClose} onClick={e => { if (e.target === ref.current) onClose() }} aria-labelledby={id}
      className={cx('m-auto w-[calc(100%-2rem)] overflow-hidden rounded-xl border border-white/10 bg-[#0d0d10] p-0 text-zinc-100 shadow-[0_0_80px_-20px_rgba(211,24,9,0.55)] backdrop:bg-black/70 backdrop:backdrop-blur-sm',
        largo ? 'max-w-3xl' : 'max-w-2xl')}>
      <div className="flex max-h-[88dvh] flex-col">
        <BarraDeJanela titulo={caminho}>
          <button type="button" onClick={onClose} aria-label="Fechar" className={cx('rounded-md p-1 text-zinc-500 hover:bg-white/10 hover:text-zinc-100', foco)}>
            <X className="h-4 w-4" aria-hidden />
          </button>
        </BarraDeJanela>
        <div className="px-6 pb-2 pt-5">
          <h2 id={id} className="text-xl font-semibold tracking-tight text-white">{titulo}</h2>
          {subtitulo && <p className="mt-1 font-mono text-xs text-zinc-500">{subtitulo}</p>}
        </div>
        <div className="overflow-y-auto px-6 pb-6 pt-4">{children}</div>
      </div>
    </dialog>
  )
}

function BotaoCopiar({ texto, rotulo = 'Copiar comando', className }: { texto: string; rotulo?: string; className?: string }) {
  const { toast } = useCommunity()
  const [ok, setOk] = useState(false)
  async function copiar() {
    if (await copiarTexto(texto)) {
      setOk(true)
      setTimeout(() => setOk(false), 1600)
    } else {
      toast('Não foi possível copiar. Selecione o texto e copie manualmente.', 'error')
    }
  }
  return (
    <button type="button" onClick={copiar} aria-label={ok ? 'Copiado' : rotulo} title={ok ? 'Copiado' : rotulo}
      className={cx('inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-md text-zinc-500 transition-colors hover:bg-white/10 hover:text-zinc-100', foco, className)}>
      {ok ? <Check className="h-3.5 w-3.5 text-emerald-400" aria-hidden /> : <Copy className="h-3.5 w-3.5" aria-hidden />}
    </button>
  )
}

// ── Abertura ─────────────────────────────────────────────────────────────────

function Abertura({ repos, onPublicar, onLicencas }: { repos: RepoOss[] | null; onPublicar: () => void; onLicencas: () => void }) {
  const numeros: [string, number | null][] = [
    ['repositórios', repos ? repos.length : null],
    ['categorias', repos ? new Set(repos.map(r => r.categoria)).size : null],
    ['permissivas', repos ? repos.filter(r => familiaDaLicenca(r.licenca) === 'permissiva').length : null],
  ]
  return (
    <header className="flex flex-wrap items-end justify-between gap-x-12 gap-y-8 pb-10 pt-8 sm:pt-12">
      <div className="max-w-2xl">
        <p className="font-mono text-[13px] text-zinc-500">
          <span className="text-[#ff5a4a]">$</span> beon oss
          <span className="ml-1 inline-block h-4 w-2 translate-y-0.5 animate-pulse bg-[#ff5a4a]" aria-hidden />
        </p>
        <h1 className="mt-3 text-4xl font-bold tracking-tight text-white sm:text-5xl">
          Open Source <span className="bg-gradient-to-r from-[#ff5a4a] to-[#ff9a8f] bg-clip-text text-transparent">World</span>
        </h1>
        <p className="mt-4 text-[15px] leading-relaxed text-zinc-400 sm:text-base">
          Repositórios open source curados pela comunidade: o que fazem, a licença e como começar. Qualquer pessoa pode publicar e editar.
        </p>
        <div className="mt-7 flex flex-wrap gap-3">
          <Botao variante="primario" icone={Plus} onClick={onPublicar}>Publicar repositório</Botao>
          <Botao icone={HelpCircle} onClick={onLicencas}>Como ler as licenças</Botao>
        </div>
      </div>
      <dl className="flex gap-10">
        {numeros.map(([rotulo, n]) => (
          <div key={rotulo} className="flex flex-col-reverse">
            <dt className="mt-1 whitespace-nowrap text-xs text-zinc-500">{rotulo}</dt>
            <dd className="font-mono text-3xl font-semibold tabular-nums text-white">{n ?? '–'}</dd>
          </div>
        ))}
      </dl>
    </header>
  )
}

function GuiaDeLicencas({ onClose }: { onClose: () => void }) {
  return (
    <ModalDev titulo="Como ler as licenças" subtitulo="Antes de levar um projeto para a Claro" caminho="~/open-source-world/LICENSE.md" onClose={onClose}>
      <div className="space-y-6">
        <dl className="space-y-4 text-sm leading-relaxed">
          {([
            ['O que é open source', 'Código-fonte público, que qualquer pessoa pode ler, usar, adaptar e melhorar, nos termos de uma licença.'],
            ['Por que importa', 'Em vez de construir do zero, partimos do que milhares de pessoas já testaram, e podemos auditar o código.'],
            ['Antes de usar na empresa', 'Confira a licença, a atividade do projeto e onde os dados ficam. Na dúvida, fale com o jurídico e a segurança.'],
          ] as const).map(([t, d]) => (
            <div key={t}><dt className="font-medium text-zinc-100">{t}</dt><dd className="mt-0.5 text-zinc-400">{d}</dd></div>
          ))}
        </dl>
        <ul className="space-y-2.5">
          {(['permissiva', 'copyleft', 'restrita', 'outra'] as FamiliaLicenca[]).map(f => {
            const v = LICENCA_VISUAL[f]
            return (
              <li key={f} className={cx('rounded-lg border p-3.5 text-sm', v.cls)}>
                <p className={cx('flex items-center gap-1.5 font-medium', v.cor)}>
                  <v.icone className="h-4 w-4" aria-hidden />{v.rotulo}<span className="font-mono text-xs font-normal text-zinc-500">· {v.exemplos}</span>
                </p>
                <p className="mt-1 leading-relaxed text-zinc-400">{v.explica}</p>
              </li>
            )
          })}
        </ul>
      </div>
    </ModalDev>
  )
}

// ── Card ─────────────────────────────────────────────────────────────────────

function Card({ repo, mostrarCategoria, onAbrir }: { repo: RepoOss; mostrarCategoria: boolean; onAbrir: () => void }) {
  const barra = repo.slug.indexOf('/')
  const dono = barra > 0 ? repo.slug.slice(0, barra) : ''
  const nome = barra > 0 ? repo.slug.slice(barra + 1) : repo.slug
  const v = CATEGORIA_VISUAL[repo.categoria]
  return (
    <button type="button" onClick={onAbrir} title={repo.slug}
      className={cx('group flex h-full flex-col rounded-xl border border-white/[0.08] bg-white/[0.02] p-5 text-left transition-all duration-200 hover:border-[#ff5a4a]/40 hover:bg-white/[0.04] hover:shadow-[0_0_40px_-16px_rgba(211,24,9,0.8)]', foco)}>
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          {dono && <p className="truncate font-mono text-xs text-zinc-500">{dono}</p>}
          <h3 className="truncate font-mono text-[15px] font-semibold text-white group-hover:text-[#ff8a7d]">{nome}</h3>
        </div>
        <ArrowUpRight className="mt-0.5 h-4 w-4 shrink-0 text-zinc-600 transition-colors group-hover:text-[#ff8a7d]" aria-hidden />
      </div>
      <p className="mt-3 line-clamp-2 text-sm leading-relaxed text-zinc-400">{repo.resumo}</p>
      <p className="mt-auto flex items-center gap-3 pt-5 text-[11px] text-zinc-500">
        {mostrarCategoria && (
          <span className="inline-flex min-w-0 items-center gap-1.5">
            <span className="h-1.5 w-1.5 shrink-0 rounded-full" style={{ background: v.cor }} aria-hidden /><span className="truncate">{repo.categoria}</span>
          </span>
        )}
        <Licenca licenca={repo.licenca} />
        {repo.ultimoCommit && <span className="font-mono">{mesAno(repo.ultimoCommit)}</span>}
        {repo.atencao && (
          <span className="ml-auto inline-flex text-amber-300/80" title={`Atenção: ${repo.atencao}`}>
            <AlertTriangle className="h-3.5 w-3.5" aria-hidden /><span className="sr-only">Tem um ponto de atenção</span>
          </span>
        )}
      </p>
    </button>
  )
}

const grade = 'grid gap-4 [grid-template-columns:repeat(auto-fill,minmax(min(100%,280px),1fr))]'

// ── Detalhe ──────────────────────────────────────────────────────────────────

/** Passos que são só um comando (copiáveis), em vez de uma frase explicando o que fazer. */
const COMANDO = /^(?:pip3?|pipx|uv|uvx|npm|npx|pnpm|yarn|bun|bunx|deno|git|docker|podman|brew|curl|wget|cargo|go|python3?|node|make|apt(?:-get)?|conda|ollama|kubectl|helm|gh|sudo|cd|chmod|bash|sh|\.\/)\s/

function Titulo({ children }: { children: ReactNode }) {
  return <h3 className="mb-3 text-xs font-medium uppercase tracking-[0.12em] text-zinc-500">{children}</h3>
}

function Terminal({ repo }: { repo: RepoOss }) {
  const linhas = [`git clone ${repo.url.replace(/\/$/, '')}.git`, ...repo.comoComecar]
  const script = linhas.map(l => (COMANDO.test(l) ? l : `# ${l}`)).join('\n')
  return (
    <div className="overflow-hidden rounded-lg border border-white/10 bg-black/60">
      <BarraDeJanela titulo="bash">
        <BotaoCopiar texto={script} rotulo="Copiar todos os passos" />
      </BarraDeJanela>
      <ol className="space-y-0.5 p-3 font-mono text-[13px] leading-relaxed">
        {linhas.map((l, i) => COMANDO.test(l) ? (
          <li key={`${i}-${l}`} className="group/linha flex items-start gap-2 rounded-md px-2 py-1 hover:bg-white/[0.04]">
            <span className="select-none text-[#ff5a4a]" aria-hidden>$</span>
            <code className="min-w-0 flex-1 break-all text-zinc-100">{l}</code>
            <BotaoCopiar texto={l} className="-my-1 opacity-50 group-hover/linha:opacity-100" />
          </li>
        ) : (
          <li key={`${i}-${l}`} className="flex gap-2 px-2 py-1 text-zinc-500">
            <span className="select-none" aria-hidden>#</span><span className="min-w-0 flex-1">{l}</span>
          </li>
        ))}
      </ol>
    </div>
  )
}

function Detalhe({ repo, onClose, onEditar, onRemover, podeRemover }: {
  repo: RepoOss; onClose: () => void; onEditar: () => void; onRemover: () => void; podeRemover: boolean
}) {
  const lic = LICENCA_VISUAL[familiaDaLicenca(repo.licenca)]
  const v = CATEGORIA_VISUAL[repo.categoria]
  return (
    <ModalDev titulo={repo.nome} subtitulo={repo.url.replace(/^https:\/\//, '')} caminho={`~/open-source-world/${repo.slug}`} onClose={onClose} largo>
      <div className="space-y-7">
        <div>
          <p className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-zinc-400">
            <span className="inline-flex items-center gap-1.5"><v.icone className="h-3.5 w-3.5" style={{ color: v.cor }} aria-hidden />{repo.categoria}</span>
            <span className={cx('inline-flex items-center gap-1.5', lic.cor)}><lic.icone className="h-3.5 w-3.5" aria-hidden />{nomeDaLicenca(repo.licenca)} · {lic.rotulo.toLowerCase()}</span>
            {repo.ultimoCommit && <span className="font-mono text-zinc-500">último commit {repo.ultimoCommit.split('-').reverse().join('/')}</span>}
          </p>
          <p className="mt-3 text-[15px] leading-relaxed text-zinc-200">{repo.resumo}</p>
        </div>

        {repo.atencao && (
          <p className="flex gap-2.5 rounded-lg border border-amber-400/25 bg-amber-400/[0.06] p-3.5 text-sm leading-relaxed text-amber-200" role="note">
            <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden /><span>{repo.atencao}</span>
          </p>
        )}

        <section>
          <Titulo>Para que serve</Titulo>
          <ul className="space-y-2">
            {repo.usos.map(u => (
              <li key={u} className="flex gap-2.5 text-sm leading-relaxed text-zinc-300">
                <Check className="mt-0.5 h-4 w-4 shrink-0 text-emerald-400" aria-hidden />{u}
              </li>
            ))}
          </ul>
        </section>

        <section>
          <Titulo>Como começar</Titulo>
          <Terminal repo={repo} />
        </section>

        <section>
          <Titulo>Licença</Titulo>
          <p className="text-sm leading-relaxed text-zinc-400"><b className={cx('font-medium', lic.cor)}>{lic.rotulo}.</b> {lic.explica}</p>
        </section>

        <div className="flex flex-wrap items-center justify-between gap-3 border-t border-white/10 pt-5">
          <p className="text-xs text-zinc-500">
            Publicado por {repo.publicadoPor.nome} {tempoRelativo(repo.publicadoEm)}
            {repo.editadoPor && repo.editadoEm ? ` · editado por ${repo.editadoPor.nome} ${tempoRelativo(repo.editadoEm)}` : ''}
          </p>
          <div className="flex flex-wrap gap-2">
            <Botao variante="fantasma" icone={Pencil} onClick={onEditar}>Editar</Botao>
            {podeRemover && <Botao variante="fantasma" icone={Trash2} onClick={onRemover}>Remover</Botao>}
            <a href={repo.url} target="_blank" rel="noopener noreferrer"
              className={cx('inline-flex h-10 items-center gap-2 rounded-lg bg-[#D31809] px-4 text-sm font-medium text-white shadow-[0_0_24px_-6px_rgba(211,24,9,0.9)] hover:bg-[#e8261a]', foco)}>
              Abrir repositório <ArrowUpRight className="h-4 w-4" aria-hidden />
            </a>
          </div>
        </div>
      </div>
    </ModalDev>
  )
}

// ── Publicar / editar ────────────────────────────────────────────────────────

type Form = { url: string; nome: string; resumo: string; usos: string; comoComecar: string; categoria: CategoriaOss; licenca: string; tags: string; atencao: string }
const VAZIO: Form = { url: '', nome: '', resumo: '', usos: '', comoComecar: '', categoria: 'IA e agentes', licenca: 'MIT', tags: '', atencao: '' }
const doRepo = (r: RepoOss): Form => ({
  url: r.url, nome: r.nome, resumo: r.resumo, usos: r.usos.join('\n'), comoComecar: r.comoComecar.join('\n'),
  categoria: r.categoria, licenca: r.licenca, tags: r.tags.join(', '), atencao: r.atencao ?? '',
})

const inputDev = 'w-full rounded-lg border border-white/15 bg-black/50 px-3 py-2 text-sm text-zinc-100 placeholder:text-zinc-600 transition-colors hover:border-white/25 focus:border-[#ff5a4a]/70 focus:outline-none focus:ring-2 focus:ring-[#ff5a4a]/30 [&>option]:bg-zinc-900'

function Formulario({ repo, onClose, onSalvo }: { repo: RepoOss | null; onClose: () => void; onSalvo: (r: RepoOss) => void }) {
  const { toast } = useCommunity()
  const [f, setF] = useState<Form>(repo ? doRepo(repo) : VAZIO)
  const [enviando, setEnviando] = useState(false)
  const set = (k: keyof Form) => (e: { target: { value: string } }) => setF(x => ({ ...x, [k]: e.target.value }))

  async function enviar(e: FormEvent) {
    e.preventDefault()
    setEnviando(true)
    try {
      const salvo = repo
        ? await api<RepoOss>(`/community/open-source/${encodeURIComponent(repo.id)}`, { method: 'PATCH', json: f })
        : await api<RepoOss>('/community/open-source', { method: 'POST', json: f })
      toast(repo ? 'Card atualizado.' : 'Repositório publicado na vitrine.')
      onSalvo(salvo)
    } catch (err) {
      toast(errorMessage(err), 'error')
    } finally {
      setEnviando(false)
    }
  }

  const campo = 'mb-1.5 block text-xs font-medium text-zinc-400'
  return (
    <ModalDev titulo={repo ? `Editar ${repo.nome}` : 'Publicar um repositório'} subtitulo="Explique para quem nunca viu o projeto"
      caminho={repo ? `~/open-source-world/${repo.slug}/editar` : '~/open-source-world/novo'} onClose={onClose}>
      <form onSubmit={enviar} className="space-y-4">
        <div className="grid gap-4 sm:grid-cols-[1fr_200px]">
          <div>
            <label htmlFor="oss-url" className={campo}>Link do repositório</label>
            <input id="oss-url" required className={cx(inputDev, 'font-mono')} placeholder="https://github.com/dono/repositorio" value={f.url} onChange={set('url')} />
          </div>
          <div>
            <label htmlFor="oss-nome" className={campo}>Nome</label>
            <input id="oss-nome" className={inputDev} placeholder="Opcional" maxLength={80} value={f.nome} onChange={set('nome')} />
          </div>
        </div>
        <div>
          <label htmlFor="oss-resumo" className={campo}>O que é (uma frase)</label>
          <input id="oss-resumo" required minLength={10} maxLength={200} className={inputDev} value={f.resumo} onChange={set('resumo')} placeholder="Ex.: Roda modelos de linguagem no seu computador, sem nuvem." />
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label htmlFor="oss-usos" className={campo}>Para que serve (um uso por linha)</label>
            <textarea id="oss-usos" required rows={5} className={cx(inputDev, 'resize-y')} value={f.usos} onChange={set('usos')} />
          </div>
          <div>
            <label htmlFor="oss-comecar" className={campo}>Como começar (um passo ou comando por linha)</label>
            <textarea id="oss-comecar" rows={5} className={cx(inputDev, 'resize-y font-mono text-[13px]')} value={f.comoComecar} onChange={set('comoComecar')}
              placeholder={'pip install pacote\nRode o exemplo do README'} />
          </div>
        </div>
        <div className="grid gap-4 sm:grid-cols-3">
          <div>
            <label htmlFor="oss-cat" className={campo}>Categoria</label>
            <select id="oss-cat" className={inputDev} value={f.categoria} onChange={set('categoria')}>
              {CATEGORIAS_OSS.map(c => <option key={c}>{c}</option>)}
            </select>
          </div>
          <div>
            <label htmlFor="oss-lic" className={campo}>Licença</label>
            <select id="oss-lic" className={inputDev} value={f.licenca} onChange={set('licenca')}>
              {LICENCAS.map(l => <option key={l.id}>{l.id}</option>)}
            </select>
          </div>
          <div>
            <label htmlFor="oss-tags" className={campo}>Tags</label>
            <input id="oss-tags" className={inputDev} placeholder="llm, local" value={f.tags} onChange={set('tags')} />
          </div>
        </div>
        <div>
          <label htmlFor="oss-atencao" className={campo}>Atenção (opcional)</label>
          <input id="oss-atencao" maxLength={300} className={inputDev} value={f.atencao} onChange={set('atencao')}
            placeholder="Ex.: os pesos do modelo têm licença não comercial" />
        </div>
        <div className="flex justify-end gap-2 border-t border-white/10 pt-4">
          <Botao variante="fantasma" onClick={onClose}>Cancelar</Botao>
          <Botao type="submit" variante="primario" disabled={enviando} aria-busy={enviando}>{enviando ? 'Salvando…' : repo ? 'Salvar' : 'Publicar'}</Botao>
        </div>
      </form>
    </ModalDev>
  )
}

// ── Página ───────────────────────────────────────────────────────────────────

export default function OpenSourceWorldPage() {
  const { me, toast } = useCommunity()
  const [repos, setRepos] = useState<RepoOss[] | null>(null)
  const [erro, setErro] = useState<string | null>(null)
  const [busca, setBusca] = useState('')
  const [categoria, setCategoria] = useState<CategoriaOss | null>(null)
  const [aberto, setAberto] = useState<RepoOss | null>(null)
  const [form, setForm] = useState<{ repo: RepoOss | null } | null>(null)
  const [guia, setGuia] = useState(false)
  const buscaRef = useRef<HTMLInputElement>(null)

  const carregar = () => api<RepoOss[]>('/community/open-source').then(r => { setRepos(r); setErro(null) }).catch(e => setErro(errorMessage(e)))
  useEffect(() => { carregar() }, [])

  // "/" leva à busca, como em muitas ferramentas de dev (fora de campos de texto e com nenhum modal aberto).
  useEffect(() => {
    function atalho(e: KeyboardEvent) {
      const alvo = e.target as HTMLElement | null
      if (e.key !== '/' || e.metaKey || e.ctrlKey || e.altKey) return
      if (alvo && (alvo.isContentEditable || /^(INPUT|TEXTAREA|SELECT)$/.test(alvo.tagName))) return
      if (document.querySelector('dialog[open]')) return
      e.preventDefault()
      buscaRef.current?.focus()
    }
    window.addEventListener('keydown', atalho)
    return () => window.removeEventListener('keydown', atalho)
  }, [])

  const q = busca.trim().toLowerCase()
  const visiveis = useMemo(() => (repos ?? [])
    .filter(r => (!categoria || r.categoria === categoria)
      && (!q || [r.nome, r.slug, r.resumo, ...r.tags, ...r.usos].join(' ').toLowerCase().includes(q)))
    .sort(porCommit), [repos, q, categoria])
  const contagem = useMemo(
    () => CATEGORIAS_OSS.map(c => [c, (repos ?? []).filter(r => r.categoria === c).length] as const).filter(([, n]) => n > 0),
    [repos],
  )
  // Sem busca e sem categoria escolhida, a vitrine aparece agrupada por categoria.
  const grupos = !q && !categoria ? contagem.map(([c]) => [c, visiveis.filter(r => r.categoria === c)] as const) : null

  async function remover(r: RepoOss) {
    if (!window.confirm(`Remover ${r.nome} da vitrine?`)) return
    try {
      await api(`/community/open-source/${encodeURIComponent(r.id)}`, { method: 'DELETE' })
      setAberto(null)
      setRepos(rs => (rs ?? []).filter(x => x.id !== r.id))
      toast('Removido da vitrine.')
    } catch (err) {
      toast(errorMessage(err), 'error')
    }
  }

  const escolher = (c: CategoriaOss | null) => {
    setCategoria(c)
    if (window.scrollY > 400) document.getElementById('oss-vitrine')?.scrollIntoView({ block: 'start' })
  }
  const itemLateral = (ativo: boolean) => cx('flex w-full items-center gap-2.5 rounded-md px-3 py-1.5 text-left text-sm transition-colors', foco,
    ativo ? 'bg-white/[0.07] text-white' : 'text-zinc-400 hover:bg-white/[0.03] hover:text-zinc-100')
  const chip = (ativo: boolean) => cx('inline-flex h-8 shrink-0 items-center gap-1.5 whitespace-nowrap rounded-full border px-3 text-xs transition-colors', foco,
    ativo ? 'border-[#ff5a4a]/50 bg-[#D31809]/20 text-white' : 'border-white/10 text-zinc-400 hover:text-zinc-100')

  return (
    // Cobre também o espaço que o layout deixa embaixo do conteúdo (pb-24/md:pb-10), para não aparecer faixa branca.
    <div className="relative isolate -mb-24 min-h-dvh w-full bg-[#09090b] text-zinc-100 md:-mb-10">
      <Fundo />
      <div className="relative px-4 pb-28 sm:px-6 md:pb-16 lg:px-10">
        <Abertura repos={repos} onPublicar={() => setForm({ repo: null })} onLicencas={() => setGuia(true)} />

        <div id="oss-vitrine" className="scroll-mt-16 border-t border-white/[0.08] pt-8 lg:grid lg:grid-cols-[236px_minmax(0,1fr)] lg:gap-10 xl:grid-cols-[252px_minmax(0,1fr)]">
          {/* Categorias: lista lateral no computador, linha que rola no celular */}
          <nav aria-label="Categorias" className="hidden self-start lg:sticky lg:top-6 lg:block">
            <p className="mb-2 px-3 text-[11px] font-medium uppercase tracking-[0.14em] text-zinc-600">Categorias</p>
            <ul className="space-y-0.5">
              <li>
                <button type="button" aria-pressed={!categoria} onClick={() => escolher(null)} className={itemLateral(!categoria)}>
                  <span className="h-1.5 w-1.5 rounded-full bg-zinc-500" aria-hidden /><span className="flex-1">Todas</span>
                  <span className="font-mono text-xs text-zinc-600">{repos?.length ?? ''}</span>
                </button>
              </li>
              {contagem.map(([c, n]) => (
                <li key={c}>
                  <button type="button" aria-pressed={categoria === c} onClick={() => escolher(categoria === c ? null : c)} className={itemLateral(categoria === c)}>
                    <span className="h-1.5 w-1.5 shrink-0 rounded-full" style={{ background: CATEGORIA_VISUAL[c].cor }} aria-hidden />
                    <span className="min-w-0 flex-1 truncate">{c}</span>
                    <span className="font-mono text-xs text-zinc-600">{n}</span>
                  </button>
                </li>
              ))}
            </ul>
          </nav>

          <div className="min-w-0">
            <div className="flex items-center gap-4">
              <label className="relative flex min-w-0 flex-1 items-center sm:max-w-md">
                <span className="sr-only">Buscar repositório</span>
                <Search className="pointer-events-none absolute left-3.5 h-4 w-4 text-zinc-500" aria-hidden />
                <input ref={buscaRef} type="search" value={busca} onChange={e => setBusca(e.target.value)}
                  onKeyDown={e => { if (e.key === 'Escape' && busca) { e.preventDefault(); setBusca('') } }}
                  placeholder="Buscar por nome, uso ou tag"
                  className="h-10 w-full rounded-lg border border-white/10 bg-white/[0.03] pl-10 pr-10 text-sm text-zinc-100 placeholder:text-zinc-600 focus:border-[#ff5a4a]/60 focus:outline-none focus:ring-2 focus:ring-[#ff5a4a]/25" />
                <kbd className="pointer-events-none absolute right-3 hidden rounded border border-white/15 px-1.5 font-mono text-[11px] text-zinc-500 sm:block" aria-hidden>/</kbd>
              </label>
              <p className="ml-auto shrink-0 font-mono text-xs text-zinc-500" aria-live="polite">
                {repos ? (q || categoria ? `${visiveis.length} de ${repos.length}` : `${repos.length} repos`) : ''}
              </p>
            </div>

            <div className="-mx-4 mt-4 flex gap-2 overflow-x-auto px-4 pb-1 sm:-mx-6 sm:px-6 lg:hidden" role="group" aria-label="Categorias">
              <button type="button" aria-pressed={!categoria} onClick={() => escolher(null)} className={chip(!categoria)}>Todas</button>
              {contagem.map(([c]) => (
                <button key={c} type="button" aria-pressed={categoria === c} onClick={() => escolher(categoria === c ? null : c)} className={chip(categoria === c)}>
                  <span className="h-1.5 w-1.5 rounded-full" style={{ background: CATEGORIA_VISUAL[c].cor }} aria-hidden />{c}
                </button>
              ))}
            </div>

            <div className="mt-8">
              {erro && !repos ? (
                <div className="rounded-xl border border-red-400/30 bg-red-500/[0.06] p-6 text-sm" role="alert">
                  <p className="font-medium text-red-300">Não foi possível carregar a vitrine.</p>
                  <p className="mt-1 text-zinc-400">{erro}</p>
                  <Botao className="mt-4" onClick={carregar}>Tentar de novo</Botao>
                </div>
              ) : !repos ? (
                <div className={grade} aria-hidden>
                  {Array.from({ length: 6 }, (_, i) => <div key={i} className="h-40 animate-pulse rounded-xl bg-white/[0.04]" />)}
                </div>
              ) : visiveis.length === 0 ? (
                <div className="flex flex-col items-center rounded-xl border border-dashed border-white/15 px-6 py-14 text-center">
                  <GitFork className="h-8 w-8 text-zinc-600" aria-hidden />
                  <p className="mt-3 text-sm text-zinc-200">{repos.length ? 'Nenhum repositório com esse filtro' : 'A vitrine está vazia'}</p>
                  <p className="mt-1 max-w-md text-sm text-zinc-500">Conhece uma ferramenta open source que ajudou você? Compartilhe com a comunidade.</p>
                  <div className="mt-5 flex flex-wrap justify-center gap-2">
                    {(busca || categoria) && <Botao onClick={() => { setBusca(''); setCategoria(null) }}>Limpar filtros</Botao>}
                    <Botao variante="primario" icone={Plus} onClick={() => setForm({ repo: null })}>Publicar repositório</Botao>
                  </div>
                </div>
              ) : grupos ? (
                <div className="space-y-12">
                  {grupos.map(([c, lista]) => (
                    <section key={c} aria-labelledby={`oss-${c}`}>
                      <h2 id={`oss-${c}`} className="mb-4 flex items-center gap-2.5 text-sm font-medium text-zinc-200">
                        <span className="h-2 w-2 rounded-full" style={{ background: CATEGORIA_VISUAL[c].cor }} aria-hidden />{c}
                        <span className="font-mono text-xs font-normal text-zinc-600">{lista.length}</span>
                      </h2>
                      <div className={grade}>
                        {lista.map(r => <Card key={r.id} repo={r} mostrarCategoria={false} onAbrir={() => setAberto(r)} />)}
                      </div>
                    </section>
                  ))}
                </div>
              ) : (
                <div className={grade}>
                  {visiveis.map(r => <Card key={r.id} repo={r} mostrarCategoria={!categoria} onAbrir={() => setAberto(r)} />)}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {guia && <GuiaDeLicencas onClose={() => setGuia(false)} />}
      {aberto && (
        <Detalhe key={aberto.id} repo={aberto} onClose={() => setAberto(null)}
          onEditar={() => { setForm({ repo: aberto }); setAberto(null) }}
          onRemover={() => remover(aberto)}
          podeRemover={!!me && (me.role === 'admin' || me.username === aberto.publicadoPor.username)} />
      )}
      {form && (
        <Formulario repo={form.repo} onClose={() => setForm(null)}
          onSalvo={salvo => {
            setForm(null)
            setRepos(rs => {
              const lista = rs ?? []
              return lista.some(x => x.id === salvo.id) ? lista.map(x => (x.id === salvo.id ? salvo : x)) : [salvo, ...lista]
            })
            setAberto(salvo)
          }} />
      )}
    </div>
  )
}
