'use client'

// World Open Source: vitrine de ferramentas e repositórios open source que qualquer pessoa da comunidade pode publicar
// e editar. Visual "feito pro dev": fundo preto com brilho vermelho, tipografia de terminal e comandos prontos para
// copiar. A página ocupa a largura toda (sem coluna lateral).

import { useEffect, useId, useMemo, useRef, useState, type ButtonHTMLAttributes, type FormEvent, type ReactNode } from 'react'
import {
  AlertTriangle, ArrowUpRight, AudioLines, Ban, Bot, Boxes, Check, Clapperboard, Code2, Copy, Database, FileText, FlaskConical,
  GitCommitHorizontal, GitFork, HelpCircle, LineChart, Lock, Pencil, Plus, Search, ShieldCheck, Smartphone, SquareTerminal,
  Trash2, Unlock, X, type LucideIcon,
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

const LICENCA_VISUAL: Record<FamiliaLicenca, { rotulo: string; icone: LucideIcon; cls: string; exemplos: string; explica: string }> = {
  permissiva: {
    rotulo: 'permissiva', icone: Unlock, cls: 'border-emerald-400/30 bg-emerald-400/10 text-emerald-300', exemplos: 'MIT, Apache, BSD',
    explica: 'Pode usar, modificar e incorporar em produtos (inclusive fechados), mantendo o aviso de copyright e a licença.',
  },
  copyleft: {
    rotulo: 'copyleft', icone: Lock, cls: 'border-amber-400/30 bg-amber-400/10 text-amber-300', exemplos: 'GPL, AGPL, MPL',
    explica: 'Pode usar e modificar, mas quem distribui (ou, na AGPL, oferece pela rede) uma versão modificada precisa abrir o código dela sob a mesma licença. Para uso interno costuma ser tranquilo; para levar a produto, consulte o jurídico.',
  },
  restrita: {
    rotulo: 'uso restrito', icone: Ban, cls: 'border-red-400/35 bg-red-500/10 text-red-300', exemplos: 'não comercial, proprietária',
    explica: 'Não é uma licença open source comum: uso não comercial, proprietária ou sem licença (todos os direitos reservados). Leia os termos e fale com o jurídico antes de usar na empresa.',
  },
  outra: {
    rotulo: 'verificar', icone: HelpCircle, cls: 'border-white/15 bg-white/5 text-zinc-300', exemplos: 'leia o LICENSE',
    explica: 'Licença não informada ou fora das mais comuns: leia o arquivo LICENSE do repositório antes de usar.',
  },
}

function LicencaChip({ licenca }: { licenca: string }) {
  const v = LICENCA_VISUAL[familiaDaLicenca(licenca)]
  return (
    <span className={cx('inline-flex items-center gap-1 rounded-md border px-1.5 py-0.5 font-mono text-[11px]', v.cls)} title={v.explica}>
      <v.icone className="h-3 w-3" aria-hidden /> {licenca === 'Outra / não informada' ? 'licença?' : licenca}
    </span>
  )
}

/** "2026-07-21" → "jul/2026" (o último commit quando a ficha foi escrita). */
const mesAno = (data: string) => {
  const [a, m] = data.split('-')
  const meses = ['jan', 'fev', 'mar', 'abr', 'mai', 'jun', 'jul', 'ago', 'set', 'out', 'nov', 'dez']
  return a && m ? `${meses[Number(m) - 1] ?? m}/${a}` : data
}

// ── Peças do visual ──────────────────────────────────────────────────────────

/** Fundo da página: grade de pontos e brilhos vermelhos. */
function Fundo() {
  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden>
      <div className="absolute inset-0 opacity-[0.22]" style={{ backgroundImage: 'radial-gradient(rgba(255,255,255,0.35) 1px, transparent 1px)', backgroundSize: '22px 22px' }} />
      <div className="absolute -left-40 -top-48 h-[520px] w-[520px] rounded-full bg-[#D31809]/40 blur-[140px]" />
      <div className="absolute -right-32 top-24 h-[420px] w-[420px] rounded-full bg-[#7a0e05]/40 blur-[130px]" />
      <div className="absolute bottom-0 left-1/3 h-[360px] w-[620px] rounded-full bg-[#D31809]/15 blur-[150px]" />
      <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-[#ff5a4a]/70 to-transparent" />
    </div>
  )
}

function Botao({ variante = 'secundario', icone: I, children, className, ...props }: {
  variante?: 'primario' | 'secundario' | 'fantasma'; icone?: LucideIcon; children: ReactNode
} & ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button type="button" {...props}
      className={cx('inline-flex h-10 items-center justify-center gap-2 rounded-lg px-4 font-mono text-[13px] font-medium transition-all disabled:opacity-60', foco,
        variante === 'primario' && 'bg-[#D31809] text-white shadow-[0_0_24px_-4px_rgba(211,24,9,0.8)] hover:bg-[#e8261a] hover:shadow-[0_0_32px_-2px_rgba(255,90,74,0.9)]',
        variante === 'secundario' && 'border border-white/15 bg-white/[0.04] text-zinc-100 hover:border-white/30 hover:bg-white/[0.08]',
        variante === 'fantasma' && 'text-zinc-400 hover:bg-white/[0.06] hover:text-zinc-100',
        className)}>
      {I && <I className="h-4 w-4" aria-hidden />}{children}
    </button>
  )
}

/** Janela com barra de título de terminal (três bolinhas). */
function BarraDeJanela({ titulo, children }: { titulo: string; children?: ReactNode }) {
  return (
    <div className="flex items-center gap-3 border-b border-white/10 bg-white/[0.03] px-4 py-2.5">
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
      className={cx('m-auto w-[calc(100%-2rem)] overflow-hidden rounded-xl border border-white/10 bg-[#0d0d10] p-0 text-zinc-100 shadow-[0_0_80px_-20px_rgba(211,24,9,0.6)] backdrop:bg-black/70 backdrop:backdrop-blur-sm',
        largo ? 'max-w-3xl' : 'max-w-2xl')}>
      <div className="flex max-h-[88dvh] flex-col">
        <BarraDeJanela titulo={caminho}>
          <button type="button" onClick={onClose} aria-label="Fechar" className={cx('rounded-md p-1 text-zinc-500 hover:bg-white/10 hover:text-zinc-100', foco)}>
            <X className="h-4 w-4" aria-hidden />
          </button>
        </BarraDeJanela>
        <div className="border-b border-white/10 px-6 pb-4 pt-5">
          <h2 id={id} className="font-mono text-xl font-semibold tracking-tight text-white">{titulo}</h2>
          {subtitulo && <p className="mt-1 font-mono text-xs text-zinc-500">{subtitulo}</p>}
        </div>
        <div className="overflow-y-auto px-6 py-5">{children}</div>
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

function Abertura({ repos, onPublicar }: { repos: RepoOss[] | null; onPublicar: () => void }) {
  const total = repos?.length ?? 0
  const categorias = new Set((repos ?? []).map(r => r.categoria)).size
  const permissivas = (repos ?? []).filter(r => familiaDaLicenca(r.licenca) === 'permissiva').length
  return (
    <section className="overflow-hidden rounded-xl border border-white/10 bg-black/40 backdrop-blur-sm">
      <BarraDeJanela titulo="~/beon-labs/world-open-source" />
      <div className="grid gap-8 px-5 py-7 sm:px-8 sm:py-9 xl:grid-cols-[minmax(0,1fr)_420px]">
        <div>
          <p className="font-mono text-[13px] text-zinc-500">
            <span className="text-[#ff5a4a]">$</span> beon oss --curadoria comunidade<span className="ml-0.5 inline-block h-4 w-2 translate-y-0.5 animate-pulse bg-[#ff5a4a]" aria-hidden />
          </p>
          <h1 className="mt-4 max-w-3xl text-[34px] font-bold leading-[1.05] tracking-tight text-white sm:text-5xl">
            World Open Source: o melhor do código aberto,{' '}
            <span className="bg-gradient-to-r from-[#ff5a4a] to-[#ff9a8f] bg-clip-text text-transparent">curado pela comunidade.</span>
          </h1>
          <p className="mt-4 max-w-2xl text-[15px] leading-relaxed text-zinc-400">
            Repositórios que resolvem problemas reais: o que fazem, para que servem, a licença e os comandos para começar.
            Achou algo útil? Publique. Viu algo desatualizado? Qualquer pessoa pode editar.
          </p>
          <div className="mt-6 flex flex-wrap items-center gap-3">
            <Botao variante="primario" icone={Plus} onClick={onPublicar}>Publicar repositório</Botao>
            <dl className="flex flex-wrap gap-x-5 gap-y-1 font-mono text-xs text-zinc-500">
              <div className="flex gap-1.5"><dt>repos</dt><dd className="text-zinc-100">{repos ? total : '…'}</dd></div>
              <div className="flex gap-1.5"><dt>categorias</dt><dd className="text-zinc-100">{repos ? categorias : '…'}</dd></div>
              <div className="flex gap-1.5"><dt>permissivas</dt><dd className="text-emerald-300">{repos ? permissivas : '…'}</dd></div>
            </dl>
          </div>
        </div>

        <div className="space-y-3">
          {([
            ['o que é open source', 'Código-fonte público, que qualquer pessoa pode ler, usar, adaptar e melhorar, nos termos de uma licença.'],
            ['por que importa', 'Em vez de construir do zero, partimos do que milhares de pessoas já testaram, e podemos auditar o código.'],
            ['antes de levar para a Claro', 'Confira a licença, a atividade do projeto e onde os dados ficam. Na dúvida, fale com o jurídico e a segurança.'],
          ] as const).map(([t, d]) => (
            <div key={t} className="rounded-lg border border-white/10 bg-white/[0.03] px-4 py-3">
              <p className="font-mono text-xs text-[#ff7a6d]">{'// '}{t}</p>
              <p className="mt-1 text-sm leading-relaxed text-zinc-400">{d}</p>
            </div>
          ))}
        </div>
      </div>
      <div className="flex flex-wrap gap-x-5 gap-y-2 border-t border-white/10 px-5 py-3 font-mono text-xs text-zinc-500 sm:px-8">
        <span className="text-zinc-600">licenças:</span>
        {(['permissiva', 'copyleft', 'restrita', 'outra'] as FamiliaLicenca[]).map(f => {
          const v = LICENCA_VISUAL[f]
          return (
            <span key={f} className="inline-flex items-center gap-1.5" title={v.explica}>
              <span className={cx('inline-flex items-center gap-1 rounded border px-1.5 py-px', v.cls)}><v.icone className="h-3 w-3" aria-hidden />{v.rotulo}</span>
              {v.exemplos}
            </span>
          )
        })}
      </div>
    </section>
  )
}

// ── Card ─────────────────────────────────────────────────────────────────────

function Card({ repo, onAbrir }: { repo: RepoOss; onAbrir: () => void }) {
  const v = CATEGORIA_VISUAL[repo.categoria]
  const [dono, nome] = repo.slug.includes('/') ? [repo.slug.slice(0, repo.slug.indexOf('/') + 1), repo.slug.slice(repo.slug.indexOf('/') + 1)] : ['', repo.slug]
  const nomeDiferente = repo.nome.trim().toLowerCase() !== nome.toLowerCase()
  return (
    <button type="button" onClick={onAbrir}
      className={cx('group relative flex h-full flex-col overflow-hidden rounded-xl border border-white/10 bg-[#111113]/80 p-4 text-left backdrop-blur-sm transition-all duration-200 hover:-translate-y-0.5 hover:border-[#ff5a4a]/50 hover:shadow-[0_0_40px_-12px_rgba(211,24,9,0.7)]', foco)}>
      <span className="absolute inset-x-0 top-0 h-px opacity-60 transition-opacity group-hover:opacity-100" style={{ background: `linear-gradient(90deg, transparent, ${v.cor}, transparent)` }} aria-hidden />
      <div className="flex items-center justify-between gap-2">
        <span className="inline-flex min-w-0 items-center gap-1.5 font-mono text-[11px]" style={{ color: v.cor }}>
          <v.icone className="h-3.5 w-3.5 shrink-0" aria-hidden /><span className="truncate">{repo.categoria.toLowerCase()}</span>
        </span>
        <LicencaChip licenca={repo.licenca} />
      </div>
      <h3 className="mt-3 break-words font-mono text-[15px] leading-snug">
        <span className="text-zinc-500">{dono}</span><span className="font-semibold text-white group-hover:text-[#ff7a6d]">{nome}</span>
      </h3>
      {nomeDiferente && <p className="mt-0.5 text-xs text-zinc-500">{repo.nome}</p>}
      <p className="mt-2 line-clamp-3 text-sm leading-relaxed text-zinc-400">{repo.resumo}</p>
      {repo.tags.length > 0 && (
        <p className="mt-3 flex flex-wrap gap-x-2 gap-y-1 font-mono text-[11px] text-zinc-500">
          {repo.tags.slice(0, 4).map(t => <span key={t}>#{t}</span>)}
        </p>
      )}
      {repo.atencao && (
        <p className="mt-3 flex items-start gap-1.5 text-xs leading-snug text-amber-300/90">
          <AlertTriangle className="mt-px h-3.5 w-3.5 shrink-0" aria-hidden /><span className="line-clamp-2">{repo.atencao}</span>
        </p>
      )}
      <div className="mt-auto pt-4">
        <div className="flex items-center justify-between gap-2 border-t border-white/[0.06] pt-3 font-mono text-[11px] text-zinc-500">
          <span className="inline-flex items-center gap-1">
            {repo.ultimoCommit ? <><GitCommitHorizontal className="h-3.5 w-3.5" aria-hidden />{mesAno(repo.ultimoCommit)}</> : <>por {repo.publicadoPor.nome}</>}
          </span>
          <span className="inline-flex items-center gap-0.5 text-zinc-400 group-hover:text-[#ff7a6d]">abrir <ArrowUpRight className="h-3.5 w-3.5" aria-hidden /></span>
        </div>
      </div>
    </button>
  )
}

// ── Detalhe ──────────────────────────────────────────────────────────────────

/** Passos que são só um comando (copiáveis), em vez de uma frase explicando o que fazer. */
const COMANDO = /^(?:pip3?|pipx|uv|uvx|npm|npx|pnpm|yarn|bun|bunx|deno|git|docker|podman|brew|curl|wget|cargo|go|python3?|node|make|apt(?:-get)?|conda|ollama|kubectl|helm|gh|sudo|cd|chmod|bash|sh|\.\/)\s/

function Comentario({ titulo }: { titulo: string }) {
  return <h3 className="mb-2.5 font-mono text-xs text-[#ff7a6d]">{'// '}{titulo}</h3>
}

function Terminal({ repo }: { repo: RepoOss }) {
  const clone = `git clone ${repo.url.replace(/\/$/, '')}.git`
  const linhas = [clone, ...repo.comoComecar]
  const script = linhas.map(l => (COMANDO.test(l) ? l : `# ${l}`)).join('\n')
  return (
    <div className="overflow-hidden rounded-lg border border-white/10 bg-black/60">
      <BarraDeJanela titulo={`bash · ${repo.slug}`}>
        <BotaoCopiar texto={script} rotulo="Copiar todos os passos" />
      </BarraDeJanela>
      <ol className="space-y-1 p-3 font-mono text-[13px] leading-relaxed">
        {linhas.map((l, i) => COMANDO.test(l) ? (
          <li key={`${i}-${l}`} className="group/linha flex items-start gap-2 rounded-md px-2 py-1 hover:bg-white/[0.04]">
            <span className="select-none text-[#ff5a4a]" aria-hidden>$</span>
            <code className="min-w-0 flex-1 break-all text-zinc-100">{l}</code>
            <BotaoCopiar texto={l} className="-my-1 opacity-60 group-hover/linha:opacity-100" />
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
  const host = repo.url.replace(/^https:\/\//, '')
  return (
    <ModalDev titulo={repo.nome} subtitulo={host} caminho={`~/world-open-source/${repo.slug}/README.md`} onClose={onClose} largo>
      <div className="space-y-6">
        <div className="flex flex-wrap items-center gap-2">
          <span className="inline-flex items-center gap-1.5 rounded-md border border-white/10 bg-white/[0.04] px-2 py-0.5 font-mono text-[11px]" style={{ color: v.cor }}>
            <v.icone className="h-3.5 w-3.5" aria-hidden />{repo.categoria.toLowerCase()}
          </span>
          <LicencaChip licenca={repo.licenca} />
        </div>
        <p className="text-[15px] leading-relaxed text-zinc-200">{repo.resumo}</p>

        <section>
          <Comentario titulo="para que serve" />
          <ul className="space-y-2">
            {repo.usos.map(u => (
              <li key={u} className="flex gap-2.5 text-sm leading-relaxed text-zinc-300">
                <Check className="mt-0.5 h-4 w-4 shrink-0 text-emerald-400" aria-hidden />{u}
              </li>
            ))}
          </ul>
        </section>

        <section>
          <Comentario titulo="como começar" />
          <Terminal repo={repo} />
        </section>

        {repo.atencao && (
          <div className="flex gap-2.5 rounded-lg border border-amber-400/25 bg-amber-400/[0.07] p-3.5 text-sm leading-relaxed text-amber-200" role="note">
            <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden />
            <p><b className="font-semibold">Atenção:</b> {repo.atencao}</p>
          </div>
        )}

        <section>
          <Comentario titulo="licença" />
          <div className={cx('rounded-lg border p-3.5 text-sm', lic.cls)}>
            <p className="flex items-center gap-1.5 font-mono font-semibold"><lic.icone className="h-4 w-4" aria-hidden />{repo.licenca} · {lic.rotulo}</p>
            <p className="mt-1 leading-relaxed text-zinc-300">{lic.explica}</p>
          </div>
        </section>

        {repo.tags.length > 0 && (
          <p className="flex flex-wrap gap-x-3 gap-y-1 font-mono text-xs text-zinc-500">{repo.tags.map(t => <span key={t}>#{t}</span>)}</p>
        )}

        <p className="font-mono text-[11px] leading-relaxed text-zinc-500">
          {repo.ultimoCommit && <><span className="text-zinc-400">git log -1</span> → {repo.ultimoCommit.split('-').reverse().join('/')} (quando a ficha foi escrita)<br /></>}
          publicado por {repo.publicadoPor.nome} {tempoRelativo(repo.publicadoEm)}
          {repo.editadoPor && repo.editadoEm ? ` · editado por ${repo.editadoPor.nome} ${tempoRelativo(repo.editadoEm)}` : ''}
        </p>

        <div className="flex flex-wrap items-center justify-between gap-2 border-t border-white/10 pt-4">
          <div className="flex gap-2">
            <Botao icone={Pencil} onClick={onEditar}>Editar</Botao>
            {podeRemover && <Botao variante="fantasma" icone={Trash2} onClick={onRemover}>Remover</Botao>}
          </div>
          <a href={repo.url} target="_blank" rel="noopener noreferrer"
            className={cx('inline-flex h-10 items-center gap-2 rounded-lg bg-[#D31809] px-4 font-mono text-[13px] font-medium text-white shadow-[0_0_24px_-4px_rgba(211,24,9,0.8)] hover:bg-[#e8261a]', foco)}>
            Abrir repositório <ArrowUpRight className="h-4 w-4" aria-hidden />
          </a>
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

const inputDev = cx('w-full rounded-lg border border-white/15 bg-black/50 px-3 py-2 text-sm text-zinc-100 placeholder:text-zinc-600 transition-colors hover:border-white/25 focus:border-[#ff5a4a]/70 focus:outline-none focus:ring-2 focus:ring-[#ff5a4a]/30 [&>option]:bg-zinc-900')

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

  const campo = 'mb-1.5 block font-mono text-xs text-zinc-400'
  return (
    <ModalDev titulo={repo ? `Editar ${repo.nome}` : 'Publicar um repositório'} subtitulo="Explique para quem nunca viu o projeto"
      caminho={repo ? `~/world-open-source/${repo.slug}/editar` : '~/world-open-source/novo'} onClose={onClose}>
      <form onSubmit={enviar} className="space-y-4">
        <div className="grid gap-4 sm:grid-cols-[1fr_200px]">
          <div>
            <label htmlFor="oss-url" className={campo}>link do repositório</label>
            <input id="oss-url" required className={cx(inputDev, 'font-mono')} placeholder="https://github.com/dono/repositorio" value={f.url} onChange={set('url')} />
          </div>
          <div>
            <label htmlFor="oss-nome" className={campo}>nome</label>
            <input id="oss-nome" className={inputDev} placeholder="Opcional" maxLength={80} value={f.nome} onChange={set('nome')} />
          </div>
        </div>
        <div>
          <label htmlFor="oss-resumo" className={campo}>o que é (uma frase)</label>
          <input id="oss-resumo" required minLength={10} maxLength={200} className={inputDev} value={f.resumo} onChange={set('resumo')} placeholder="Ex.: Roda modelos de linguagem no seu computador, sem nuvem." />
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label htmlFor="oss-usos" className={campo}>para que serve (um uso por linha)</label>
            <textarea id="oss-usos" required rows={5} className={cx(inputDev, 'resize-y')} value={f.usos} onChange={set('usos')} />
          </div>
          <div>
            <label htmlFor="oss-comecar" className={campo}>como começar (um passo ou comando por linha)</label>
            <textarea id="oss-comecar" rows={5} className={cx(inputDev, 'resize-y font-mono text-[13px]')} value={f.comoComecar} onChange={set('comoComecar')}
              placeholder={'pip install pacote\nRode o exemplo do README'} />
          </div>
        </div>
        <div className="grid gap-4 sm:grid-cols-3">
          <div>
            <label htmlFor="oss-cat" className={campo}>categoria</label>
            <select id="oss-cat" className={inputDev} value={f.categoria} onChange={set('categoria')}>
              {CATEGORIAS_OSS.map(c => <option key={c}>{c}</option>)}
            </select>
          </div>
          <div>
            <label htmlFor="oss-lic" className={campo}>licença</label>
            <select id="oss-lic" className={inputDev} value={f.licenca} onChange={set('licenca')}>
              {LICENCAS.map(l => <option key={l.id}>{l.id}</option>)}
            </select>
          </div>
          <div>
            <label htmlFor="oss-tags" className={campo}>tags</label>
            <input id="oss-tags" className={cx(inputDev, 'font-mono')} placeholder="llm, local" value={f.tags} onChange={set('tags')} />
          </div>
        </div>
        <div>
          <label htmlFor="oss-atencao" className={campo}>atenção (opcional)</label>
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

type Ordem = 'commit' | 'az' | 'recentes'
const ORDENS: Record<Ordem, string> = { commit: 'último commit', recentes: 'publicados agora', az: 'nome (a-z)' }

export default function WorldOpenSourcePage() {
  const { me, toast } = useCommunity()
  const [repos, setRepos] = useState<RepoOss[] | null>(null)
  const [erro, setErro] = useState<string | null>(null)
  const [busca, setBusca] = useState('')
  const [categoria, setCategoria] = useState<CategoriaOss | null>(null)
  const [ordem, setOrdem] = useState<Ordem>('commit')
  const [aberto, setAberto] = useState<RepoOss | null>(null)
  const [form, setForm] = useState<{ repo: RepoOss | null } | null>(null)
  const buscaRef = useRef<HTMLInputElement>(null)

  const carregar = () => api<RepoOss[]>('/community/open-source').then(r => { setRepos(r); setErro(null) }).catch(e => setErro(errorMessage(e)))
  useEffect(() => { carregar() }, [])

  // "/" leva à busca, como em muitas ferramentas de dev (fora de campos de texto).
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

  const visiveis = useMemo(() => {
    const q = busca.trim().toLowerCase()
    const lista = (repos ?? []).filter(r => (!categoria || r.categoria === categoria)
      && (!q || [r.nome, r.slug, r.resumo, ...r.tags, ...r.usos].join(' ').toLowerCase().includes(q)))
    if (ordem === 'az') return [...lista].sort((a, b) => a.nome.localeCompare(b.nome, 'pt-BR', { sensitivity: 'base' }))
    if (ordem === 'recentes') return [...lista].sort((a, b) => b.publicadoEm.localeCompare(a.publicadoEm))
    return [...lista].sort((a, b) => (b.ultimoCommit ?? '').localeCompare(a.ultimoCommit ?? ''))
  }, [repos, busca, categoria, ordem])
  const categoriasUsadas = useMemo(
    () => CATEGORIAS_OSS.map(c => [c, (repos ?? []).filter(r => r.categoria === c).length] as const).filter(([, n]) => n > 0),
    [repos],
  )

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

  const chip = (ativo: boolean) => cx('inline-flex h-8 shrink-0 items-center whitespace-nowrap gap-1.5 rounded-md border px-2.5 font-mono text-xs transition-colors', foco,
    ativo ? 'border-[#ff5a4a]/60 bg-[#D31809]/20 text-white' : 'border-white/10 bg-white/[0.03] text-zinc-400 hover:border-white/25 hover:text-zinc-100')

  return (
    // Cobre também o espaço que o layout deixa embaixo do conteúdo (pb-24/md:pb-10), para não aparecer faixa branca.
    <div className="relative isolate -mb-24 min-h-dvh w-full bg-[#09090b] text-zinc-100 md:-mb-10">
      <Fundo />
      <div className="relative space-y-6 px-4 pb-28 pt-6 sm:px-6 md:pb-14 lg:px-8">
        <Abertura repos={repos} onPublicar={() => setForm({ repo: null })} />

        <div className="z-20 -mx-4 space-y-3 border-b border-white/10 bg-[#09090b]/85 px-4 py-3 backdrop-blur-md sm:-mx-6 sm:px-6 md:sticky md:top-0 lg:-mx-8 lg:px-8">
          <div className="flex flex-wrap items-center gap-3">
            <label className="relative flex min-w-[240px] flex-1 items-center sm:max-w-xl">
              <span className="sr-only">Buscar repositório</span>
              <Search className="pointer-events-none absolute left-3 h-4 w-4 text-zinc-500" aria-hidden />
              <span className="pointer-events-none absolute left-9 font-mono text-sm text-[#ff5a4a]" aria-hidden>&gt;</span>
              <input ref={buscaRef} type="search" value={busca} onChange={e => setBusca(e.target.value)}
                onKeyDown={e => { if (e.key === 'Escape' && busca) { e.preventDefault(); setBusca('') } }}
                placeholder="buscar ferramenta, uso ou tag"
                className="h-10 w-full rounded-lg border border-white/15 bg-black/50 pl-[3.25rem] pr-10 font-mono text-sm text-zinc-100 placeholder:text-zinc-600 focus:border-[#ff5a4a]/70 focus:outline-none focus:ring-2 focus:ring-[#ff5a4a]/30" />
              <kbd className="pointer-events-none absolute right-2.5 hidden rounded border border-white/15 px-1.5 font-mono text-[11px] text-zinc-500 sm:block" aria-hidden>/</kbd>
            </label>
            <label className="flex items-center gap-2 font-mono text-xs text-zinc-500">
              --sort
              <select value={ordem} onChange={e => setOrdem(e.target.value as Ordem)}
                className={cx('h-10 rounded-lg border border-white/15 bg-black/50 px-2.5 text-[13px] text-zinc-100 focus:border-[#ff5a4a]/70 focus:outline-none [&>option]:bg-zinc-900', foco)}>
                {(Object.keys(ORDENS) as Ordem[]).map(o => <option key={o} value={o}>{ORDENS[o]}</option>)}
              </select>
            </label>
            <p className="ml-auto font-mono text-xs text-zinc-500" aria-live="polite">
              {repos ? <><span className="text-zinc-100">{visiveis.length}</span> de {repos.length} repos</> : 'carregando…'}
            </p>
          </div>
          <div className="-mx-4 flex gap-1.5 overflow-x-auto px-4 pb-1 sm:-mx-6 sm:px-6 md:mx-0 md:flex-wrap md:overflow-visible md:px-0 md:pb-0" role="group" aria-label="Categorias">
            <button type="button" aria-pressed={!categoria} onClick={() => setCategoria(null)} className={chip(!categoria)}>todas</button>
            {categoriasUsadas.map(([c, n]) => {
              const v = CATEGORIA_VISUAL[c]
              return (
                <button key={c} type="button" aria-pressed={categoria === c} onClick={() => setCategoria(categoria === c ? null : c)} className={chip(categoria === c)}>
                  <v.icone className="h-3.5 w-3.5" style={{ color: v.cor }} aria-hidden />{c.toLowerCase()}<span className="text-zinc-600">{n}</span>
                </button>
              )
            })}
          </div>
        </div>

        {erro && !repos ? (
          <div className="rounded-xl border border-red-400/30 bg-red-500/[0.07] p-6 font-mono text-sm" role="alert">
            <p className="text-red-300">error: não foi possível carregar a vitrine</p>
            <p className="mt-1 text-zinc-400">{erro}</p>
            <Botao className="mt-4" onClick={carregar}>Tentar de novo</Botao>
          </div>
        ) : !repos ? (
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 min-[1900px]:grid-cols-5" aria-hidden>
            {Array.from({ length: 8 }, (_, i) => <div key={i} className="h-60 animate-pulse rounded-xl border border-white/5 bg-white/[0.04]" />)}
          </div>
        ) : visiveis.length === 0 ? (
          <div className="flex flex-col items-center rounded-xl border border-dashed border-white/15 px-6 py-14 text-center">
            <GitFork className="h-8 w-8 text-zinc-600" aria-hidden />
            <p className="mt-3 font-mono text-sm text-zinc-300">{repos.length ? '0 resultados para esse filtro' : 'a vitrine está vazia'}</p>
            <p className="mt-1 max-w-md text-sm text-zinc-500">Conhece uma ferramenta open source que ajudou você? Compartilhe com a comunidade.</p>
            <div className="mt-5 flex flex-wrap justify-center gap-2">
              {(busca || categoria) && <Botao onClick={() => { setBusca(''); setCategoria(null) }}>Limpar filtros</Botao>}
              <Botao variante="primario" icone={Plus} onClick={() => setForm({ repo: null })}>Publicar repositório</Botao>
            </div>
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 min-[1900px]:grid-cols-5">
            {visiveis.map(r => <Card key={r.id} repo={r} onAbrir={() => setAberto(r)} />)}
            <button type="button" onClick={() => setForm({ repo: null })}
              className={cx('flex min-h-[240px] flex-col items-center justify-center gap-2 rounded-xl border border-dashed border-white/15 font-mono text-zinc-500 transition-all hover:border-[#ff5a4a]/60 hover:bg-[#D31809]/[0.06] hover:text-[#ff7a6d]', foco)}>
              <Plus className="h-6 w-6" aria-hidden />
              <span className="text-sm">git push → vitrine</span>
              <span className="px-8 text-center text-xs text-zinc-600">Publique um repositório. Qualquer pessoa pode publicar e editar.</span>
            </button>
          </div>
        )}
      </div>

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
