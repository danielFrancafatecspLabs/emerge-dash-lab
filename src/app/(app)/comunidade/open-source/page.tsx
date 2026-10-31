'use client'

// World Open Source: o que é open source, como ler as licenças e uma vitrine de ferramentas e repositórios úteis que
// qualquer pessoa da comunidade pode publicar e editar.

import { useEffect, useMemo, useState, type FormEvent, type ReactNode } from 'react'
import {
  AudioLines, Bot, Boxes, CheckCircle2, Clapperboard, Code2, Database, ExternalLink, GitFork, Globe2, HeartHandshake,
  HelpCircle, Lock, Pencil, Plus, Rocket, Search, ShieldCheck, Trash2, Unlock, type LucideIcon,
} from 'lucide-react'
import {
  CATEGORIAS_OSS, LICENCAS, familiaDaLicenca, type CategoriaOss, type FamiliaLicenca, type RepoOss,
} from '@/lib/community/open-source'
import { useCommunity } from '@/components/comunidade/CommunityProvider'
import { api, errorMessage } from '@/components/comunidade/api'
import { tempoRelativo } from '@/components/comunidade/format'
import { Button, Chip, Dialog, EmptyState, ErrorState, Skeleton, cx, focusRing, inputClass } from '@/components/ui'

const CATEGORIA_VISUAL: Record<CategoriaOss, { icone: LucideIcon; fundo: string; texto: string }> = {
  'IA e agentes': { icone: Bot, fundo: 'from-[#D31809] to-[#8f1006]', texto: 'text-[#D31809]' },
  'Voz e áudio': { icone: AudioLines, fundo: 'from-[#0f766e] to-[#064e48]', texto: 'text-teal-700' },
  'Vídeo e animação': { icone: Clapperboard, fundo: 'from-[#c2410c] to-[#7c2d12]', texto: 'text-orange-700' },
  'Dados e analytics': { icone: Database, fundo: 'from-[#2F6FB3] to-[#1d4777]', texto: 'text-[#2F6FB3]' },
  'Ferramentas de dev': { icone: Code2, fundo: 'from-[#1C1917] to-[#44403C]', texto: 'text-beon-ink' },
  Segurança: { icone: ShieldCheck, fundo: 'from-[#15803d] to-[#14532d]', texto: 'text-green-700' },
  Outros: { icone: Boxes, fundo: 'from-[#78716C] to-[#44403C]', texto: 'text-beon-body' },
}

const LICENCA_VISUAL: Record<FamiliaLicenca, { rotulo: string; icone: LucideIcon; cls: string; explica: string }> = {
  permissiva: {
    rotulo: 'Permissiva', icone: Unlock, cls: 'border-green-200 bg-green-50 text-green-800',
    explica: 'Pode usar, modificar e incorporar em produtos (inclusive fechados), mantendo o aviso de copyright e a licença.',
  },
  copyleft: {
    rotulo: 'Copyleft', icone: Lock, cls: 'border-amber-200 bg-amber-50 text-amber-900',
    explica: 'Pode usar e modificar, mas quem distribui (ou, na AGPL, oferece pela rede) uma versão modificada precisa abrir o código dela sob a mesma licença. Para uso interno costuma ser tranquilo; para levar a produto, consulte o jurídico.',
  },
  outra: {
    rotulo: 'Verificar', icone: HelpCircle, cls: 'border-beon-line bg-beon-soft text-beon-body',
    explica: 'Licença não informada ou fora das mais comuns: leia o arquivo LICENSE do repositório antes de usar.',
  },
}

function LicencaChip({ licenca }: { licenca: string }) {
  const v = LICENCA_VISUAL[familiaDaLicenca(licenca)]
  return (
    <span className={cx('inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[11px] font-semibold', v.cls)} title={v.explica}>
      <v.icone className="h-3 w-3" aria-hidden /> {licenca === 'Outra / não informada' ? 'Licença: verificar' : licenca}
    </span>
  )
}

// ── Abertura ─────────────────────────────────────────────────────────────────

function Abertura({ total, onPublicar }: { total: number; onPublicar: () => void }) {
  return (
    <section className="relative overflow-hidden rounded-3xl bg-beon-ink text-white">
      {/* Grade de pontos e brilho da marca */}
      <div className="pointer-events-none absolute inset-0 opacity-[0.18]" style={{ backgroundImage: 'radial-gradient(rgba(255,255,255,0.55) 1px, transparent 1px)', backgroundSize: '18px 18px' }} aria-hidden />
      <div className="pointer-events-none absolute -right-24 -top-24 h-80 w-80 rounded-full bg-beon-red/60 blur-3xl" aria-hidden />
      <div className="pointer-events-none absolute -bottom-32 left-1/3 h-72 w-72 rounded-full bg-[#2F6FB3]/40 blur-3xl" aria-hidden />

      <div className="relative px-6 py-8 sm:px-10 sm:py-10">
        <p className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.14em]">
          <Globe2 className="h-3.5 w-3.5" aria-hidden /> Comunidade · World Open Source
        </p>
        <h1 className="mt-4 max-w-3xl text-[34px] font-bold leading-[1.05] tracking-tight sm:text-5xl">
          O melhor do código aberto, <span className="text-[#ff8a7d]">curado pela comunidade</span>.
        </h1>
        <p className="mt-4 max-w-2xl text-[15px] leading-relaxed text-white/80 sm:text-base">
          Ferramentas e repositórios open source que resolvem problemas reais: o que são, para que servem e como começar.
          Achou algo útil? Publique aqui. Viu algo desatualizado? Qualquer pessoa pode editar.
        </p>
        <div className="mt-6 flex flex-wrap items-center gap-3">
          <button type="button" onClick={onPublicar}
            className={cx('inline-flex h-11 items-center gap-2 rounded-full bg-white px-5 text-sm font-semibold text-beon-ink transition-transform hover:-translate-y-0.5', focusRing)}>
            <Plus className="h-4 w-4" aria-hidden /> Publicar um repositório
          </button>
          <span className="text-sm text-white/70">{total} {total === 1 ? 'projeto na vitrine' : 'projetos na vitrine'}</span>
        </div>

        <div className="mt-8 grid gap-3 md:grid-cols-3">
          {([
            [GitFork, 'O que é open source', 'Software com o código-fonte público, que qualquer pessoa pode ler, usar, adaptar e melhorar, nos termos de uma licença.'],
            [HeartHandshake, 'Por que importa', 'Acelera experimentos: em vez de construir do zero, partimos do que milhares de pessoas já testaram, e podemos auditar o código.'],
            [Rocket, 'Antes de levar para a Claro', 'Confira a licença (o selo de cada card), a atividade do projeto e onde os dados ficam. Na dúvida, fale com o jurídico e a segurança.'],
          ] as [LucideIcon, string, string][]).map(([I, t, d]) => (
            <div key={t} className="rounded-2xl border border-white/15 bg-white/[0.07] p-4 backdrop-blur-sm">
              <I className="h-5 w-5 text-[#ff8a7d]" aria-hidden />
              <p className="mt-2 font-semibold">{t}</p>
              <p className="mt-1 text-sm leading-relaxed text-white/75">{d}</p>
            </div>
          ))}
        </div>

        <div className="mt-4 flex flex-wrap gap-x-5 gap-y-2 text-xs text-white/75">
          {(['permissiva', 'copyleft', 'outra'] as FamiliaLicenca[]).map(f => {
            const v = LICENCA_VISUAL[f]
            return <span key={f} className="inline-flex items-center gap-1.5" title={v.explica}><v.icone className="h-3.5 w-3.5" aria-hidden /><b className="font-semibold text-white">{v.rotulo}</b> {f === 'permissiva' ? 'MIT, Apache, BSD' : f === 'copyleft' ? 'GPL, AGPL, MPL' : 'leia o LICENSE'}</span>
          })}
        </div>
      </div>
    </section>
  )
}

// ── Card e detalhe ───────────────────────────────────────────────────────────

function Card({ repo, onAbrir }: { repo: RepoOss; onAbrir: () => void }) {
  const v = CATEGORIA_VISUAL[repo.categoria]
  return (
    <button type="button" onClick={onAbrir}
      className={cx('group flex h-full flex-col overflow-hidden rounded-2xl border border-beon-line bg-white text-left transition-all hover:-translate-y-0.5 hover:shadow-lg hover:shadow-stone-900/5', focusRing)}>
      <div className={cx('relative h-24 bg-gradient-to-br', v.fundo)}>
        <div className="absolute inset-0 opacity-25" style={{ backgroundImage: 'radial-gradient(rgba(255,255,255,0.7) 1px, transparent 1px)', backgroundSize: '14px 14px' }} aria-hidden />
        <span className="absolute left-4 top-4 inline-flex items-center gap-1.5 rounded-full bg-black/25 px-2.5 py-1 text-[11px] font-semibold text-white backdrop-blur-sm">
          <v.icone className="h-3.5 w-3.5" aria-hidden /> {repo.categoria}
        </span>
        <v.icone className="absolute -bottom-3 right-3 h-20 w-20 text-white/15" aria-hidden />
      </div>
      <div className="flex flex-1 flex-col p-4">
        <p className="truncate font-mono text-xs text-beon-muted">{repo.slug}</p>
        <h3 className="mt-0.5 text-lg font-semibold tracking-tight text-beon-ink group-hover:text-beon-red">{repo.nome}</h3>
        <p className="mt-1.5 line-clamp-3 text-sm leading-relaxed text-beon-body">{repo.resumo}</p>
        <div className="mt-3 flex flex-wrap gap-1.5">
          <LicencaChip licenca={repo.licenca} />
          {repo.tags.slice(0, 3).map(t => <span key={t} className="rounded-full bg-beon-soft px-2 py-0.5 text-[11px] text-beon-body">#{t}</span>)}
        </div>
        <p className="mt-auto pt-4 text-xs text-beon-muted">
          por {repo.publicadoPor.nome}{repo.editadoPor ? ` · editado por ${repo.editadoPor.nome}` : ''}
        </p>
      </div>
    </button>
  )
}

function Secao({ titulo, children }: { titulo: string; children: ReactNode }) {
  return (
    <section>
      <h3 className="mb-2 text-[12px] font-semibold uppercase tracking-[0.1em] text-beon-muted">{titulo}</h3>
      {children}
    </section>
  )
}

function Detalhe({ repo, onClose, onEditar, onRemover, podeRemover }: {
  repo: RepoOss; onClose: () => void; onEditar: () => void; onRemover: () => void; podeRemover: boolean
}) {
  const fam = familiaDaLicenca(repo.licenca)
  const lic = LICENCA_VISUAL[fam]
  const v = CATEGORIA_VISUAL[repo.categoria]
  return (
    <Dialog open onClose={onClose} title={repo.nome} description={`${repo.categoria} · ${repo.slug}`} size="lg">
      <div className="space-y-6">
        <div className={cx('flex items-start gap-3 rounded-2xl bg-gradient-to-br p-4 text-white', v.fundo)}>
          <v.icone className="mt-0.5 h-6 w-6 shrink-0" aria-hidden />
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-white/75">O que é</p>
            <p className="mt-1 text-[15px] leading-relaxed">{repo.resumo}</p>
          </div>
        </div>

        <Secao titulo="Para que serve">
          <ul className="space-y-2">
            {repo.usos.map(u => (
              <li key={u} className="flex gap-2.5 text-sm leading-relaxed text-beon-body">
                <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-green-700" aria-hidden />{u}
              </li>
            ))}
          </ul>
        </Secao>

        {repo.comoComecar.length > 0 && (
          <Secao titulo="Como começar">
            <ol className="space-y-2">
              {repo.comoComecar.map((p, i) => (
                <li key={p} className="flex gap-3 text-sm leading-relaxed text-beon-body">
                  <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-beon-ink text-xs font-semibold text-white">{i + 1}</span>
                  <span className="pt-0.5">{p}</span>
                </li>
              ))}
            </ol>
          </Secao>
        )}

        <Secao titulo="Licença">
          <div className={cx('rounded-xl border p-3.5 text-sm', lic.cls)}>
            <p className="flex items-center gap-1.5 font-semibold"><lic.icone className="h-4 w-4" aria-hidden />{repo.licenca} · {lic.rotulo}</p>
            <p className="mt-1 leading-relaxed">{lic.explica}</p>
          </div>
        </Secao>

        {repo.tags.length > 0 && (
          <div className="flex flex-wrap gap-1.5">
            {repo.tags.map(t => <span key={t} className="rounded-full bg-beon-soft px-2.5 py-1 text-xs text-beon-body">#{t}</span>)}
          </div>
        )}

        <p className="text-xs text-beon-muted">
          Publicado por {repo.publicadoPor.nome} {tempoRelativo(repo.publicadoEm)}
          {repo.editadoPor && repo.editadoEm ? ` · editado por ${repo.editadoPor.nome} ${tempoRelativo(repo.editadoEm)}` : ''}
        </p>

        <div className="flex flex-wrap items-center justify-between gap-2 border-t border-beon-line pt-4">
          <div className="flex gap-2">
            <Button icon={Pencil} onClick={onEditar}>Editar</Button>
            {podeRemover && <Button variant="ghost" icon={Trash2} onClick={onRemover}>Remover</Button>}
          </div>
          <a href={repo.url} target="_blank" rel="noopener noreferrer"
            className={cx('inline-flex h-10 items-center gap-2 rounded-full bg-beon-red px-4 text-sm font-medium text-white hover:bg-beon-redhi', focusRing)}>
            Abrir o repositório <ExternalLink className="h-4 w-4" aria-hidden />
          </a>
        </div>
      </div>
    </Dialog>
  )
}

// ── Publicar / editar ────────────────────────────────────────────────────────

type Form = { url: string; nome: string; resumo: string; usos: string; comoComecar: string; categoria: CategoriaOss; licenca: string; tags: string }
const VAZIO: Form = { url: '', nome: '', resumo: '', usos: '', comoComecar: '', categoria: 'IA e agentes', licenca: 'MIT', tags: '' }
const doRepo = (r: RepoOss): Form => ({
  url: r.url, nome: r.nome, resumo: r.resumo, usos: r.usos.join('\n'), comoComecar: r.comoComecar.join('\n'),
  categoria: r.categoria, licenca: r.licenca, tags: r.tags.join(', '),
})

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

  const campo = 'mb-1.5 block text-sm font-medium text-beon-ink'
  return (
    <Dialog open onClose={onClose} title={repo ? `Editar ${repo.nome}` : 'Publicar um repositório'} description="Explique para quem nunca viu o projeto" size="lg">
      <form onSubmit={enviar} className="space-y-4">
        <div className="grid gap-4 sm:grid-cols-[1fr_200px]">
          <div>
            <label htmlFor="oss-url" className={campo}>Link do repositório</label>
            <input id="oss-url" required className={inputClass} placeholder="https://github.com/dono/repositorio" value={f.url} onChange={set('url')} />
          </div>
          <div>
            <label htmlFor="oss-nome" className={campo}>Nome</label>
            <input id="oss-nome" className={inputClass} placeholder="Opcional" maxLength={80} value={f.nome} onChange={set('nome')} />
          </div>
        </div>
        <div>
          <label htmlFor="oss-resumo" className={campo}>O que é (uma frase)</label>
          <input id="oss-resumo" required minLength={10} maxLength={200} className={inputClass} value={f.resumo} onChange={set('resumo')} placeholder="Ex.: Roda modelos de linguagem no seu computador, sem nuvem." />
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label htmlFor="oss-usos" className={campo}>Para que serve (um uso por linha)</label>
            <textarea id="oss-usos" required rows={5} className={cx(inputClass, 'resize-y')} value={f.usos} onChange={set('usos')} />
          </div>
          <div>
            <label htmlFor="oss-comecar" className={campo}>Como começar (um passo por linha)</label>
            <textarea id="oss-comecar" rows={5} className={cx(inputClass, 'resize-y')} value={f.comoComecar} onChange={set('comoComecar')} />
          </div>
        </div>
        <div className="grid gap-4 sm:grid-cols-3">
          <div>
            <label htmlFor="oss-cat" className={campo}>Categoria</label>
            <select id="oss-cat" className={inputClass} value={f.categoria} onChange={set('categoria')}>
              {CATEGORIAS_OSS.map(c => <option key={c}>{c}</option>)}
            </select>
          </div>
          <div>
            <label htmlFor="oss-lic" className={campo}>Licença</label>
            <select id="oss-lic" className={inputClass} value={f.licenca} onChange={set('licenca')}>
              {LICENCAS.map(l => <option key={l.id}>{l.id}</option>)}
            </select>
          </div>
          <div>
            <label htmlFor="oss-tags" className={campo}>Tags</label>
            <input id="oss-tags" className={inputClass} placeholder="llm, local" value={f.tags} onChange={set('tags')} />
          </div>
        </div>
        <div className="flex justify-end gap-2 border-t border-beon-line pt-4">
          <Button onClick={onClose}>Cancelar</Button>
          <Button type="submit" variant="primary" loading={enviando}>{repo ? 'Salvar' : 'Publicar'}</Button>
        </div>
      </form>
    </Dialog>
  )
}

// ── Página ───────────────────────────────────────────────────────────────────

export default function WorldOpenSourcePage() {
  const { me, toast } = useCommunity()
  const [repos, setRepos] = useState<RepoOss[] | null>(null)
  const [erro, setErro] = useState<string | null>(null)
  const [busca, setBusca] = useState('')
  const [categoria, setCategoria] = useState<CategoriaOss | null>(null)
  const [aberto, setAberto] = useState<RepoOss | null>(null)
  const [form, setForm] = useState<{ repo: RepoOss | null } | null>(null)

  const carregar = () => api<RepoOss[]>('/community/open-source').then(r => { setRepos(r); setErro(null) }).catch(e => setErro(errorMessage(e)))
  useEffect(() => { carregar() }, [])

  const visiveis = useMemo(() => {
    const q = busca.trim().toLowerCase()
    return (repos ?? []).filter(r => (!categoria || r.categoria === categoria)
      && (!q || [r.nome, r.slug, r.resumo, ...r.tags, ...r.usos].join(' ').toLowerCase().includes(q)))
  }, [repos, busca, categoria])
  const categoriasUsadas = useMemo(() => CATEGORIAS_OSS.filter(c => (repos ?? []).some(r => r.categoria === c)), [repos])

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

  return (
    <div className="mx-auto max-w-[1120px] space-y-6 px-4 pb-12 pt-6 sm:px-6">
      <Abertura total={repos?.length ?? 0} onPublicar={() => setForm({ repo: null })} />

      <div className="flex flex-wrap items-center gap-3">
        <div className="relative min-w-[220px] flex-1 sm:max-w-sm">
          <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-beon-muted" aria-hidden />
          <input type="search" value={busca} onChange={e => setBusca(e.target.value)} placeholder="Buscar ferramenta, uso ou tag…" aria-label="Buscar"
            className={cx(inputClass, 'rounded-full pl-10')} />
        </div>
        <div className="flex flex-wrap gap-2" role="group" aria-label="Categorias">
          <Chip selected={!categoria} onClick={() => setCategoria(null)}>Todas</Chip>
          {categoriasUsadas.map(c => {
            const I = CATEGORIA_VISUAL[c].icone
            return <Chip key={c} selected={categoria === c} onClick={() => setCategoria(categoria === c ? null : c)}><I className="h-3.5 w-3.5" aria-hidden />{c}</Chip>
          })}
        </div>
      </div>

      {erro && !repos ? <ErrorState message={erro} onRetry={carregar} /> : !repos ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">{[0, 1, 2].map(i => <Skeleton key={i} className="h-72 rounded-2xl" />)}</div>
      ) : visiveis.length === 0 ? (
        <EmptyState icon={GitFork} title={repos.length ? 'Nada com esse filtro' : 'A vitrine está vazia'}
          action={<Button variant="primary" icon={Plus} onClick={() => setForm({ repo: null })}>Publicar um repositório</Button>}>
          Conhece uma ferramenta open source que ajudou você? Compartilhe com a comunidade.
        </EmptyState>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {visiveis.map(r => <Card key={r.id} repo={r} onAbrir={() => setAberto(r)} />)}
          <button type="button" onClick={() => setForm({ repo: null })}
            className={cx('flex min-h-[280px] flex-col items-center justify-center gap-2 rounded-2xl border-2 border-dashed border-beon-line text-beon-muted transition-colors hover:border-beon-red/40 hover:bg-beon-tint/40 hover:text-beon-red', focusRing)}>
            <Plus className="h-7 w-7" aria-hidden />
            <span className="text-sm font-semibold">Publicar um repositório</span>
            <span className="px-8 text-center text-xs">Qualquer pessoa pode publicar e editar</span>
          </button>
        </div>
      )}

      {aberto && (
        <Detalhe repo={aberto} onClose={() => setAberto(null)}
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
