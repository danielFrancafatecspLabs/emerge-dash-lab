'use client'

import { useState, useMemo, useRef, useEffect } from 'react'
import Sidebar from '@/components/layout/Sidebar'
import LogoutButton from '@/components/layout/LogoutButton'
import Link from 'next/link'
import {
  HeartHandshake, Search, X, ChevronRight, FlaskConical,
  Mic, MessageSquare, Eye, Bot, Server, BarChart3, Shield, Fingerprint, Layers,
  Tag, FolderOpen, ArrowUpRight, Sparkles, FileText, Download,
  Beaker, Grid3X3, List, BookOpen, Star, Zap
} from 'lucide-react'
import experimentosData from './experimentos-categorizados.json'

type FileInfo = {
  nome: string; caminho: string; tamanho: number
  tamanho_formatado: string; tipo: string; download_url: string
}
type Experimento = {
  folder_name: string; categoria: string; dominio: string
  status: string; maturidade: string; descricao: string; tags: string[]
  arquivos: FileInfo[]; fichas: FileInfo[]; relatorios: FileInfo[]
  total_arquivos: number; tem_ficha: boolean; tem_relatorio: boolean
  tipos_arquivos: Record<string, number>
}

const CATEGORIA_ICONS: Record<string, React.ElementType> = {
  'IA Generativa': Sparkles, 'Speech & Audio': Mic, 'NLP & Texto': MessageSquare,
  'Computer Vision': Eye, 'Automacao & Agentes': Bot, 'Infraestrutura & Custos': Server,
  'Pesquisa & Benchmark': BarChart3, 'Fraude & Seguranca': Shield, 'Biometria': Fingerprint,
  'Outros': Layers,
}

const CATEGORIA_GRADIENTS: Record<string, string> = {
  'IA Generativa': 'from-purple-500 to-violet-600',
  'Speech & Audio': 'from-cyan-500 to-blue-600',
  'NLP & Texto': 'from-blue-500 to-indigo-600',
  'Computer Vision': 'from-emerald-500 to-teal-600',
  'Automacao & Agentes': 'from-orange-500 to-red-500',
  'Infraestrutura & Custos': 'from-slate-500 to-gray-600',
  'Pesquisa & Benchmark': 'from-indigo-500 to-purple-600',
  'Fraude & Seguranca': 'from-red-500 to-rose-600',
  'Biometria': 'from-teal-500 to-emerald-600',
  'Outros': 'from-gray-400 to-gray-500',
}

const CATEGORIA_COLORS: Record<string, string> = {
  'IA Generativa': 'bg-purple-50 text-purple-700 border-purple-200',
  'Speech & Audio': 'bg-cyan-50 text-cyan-700 border-cyan-200',
  'NLP & Texto': 'bg-blue-50 text-blue-700 border-blue-200',
  'Computer Vision': 'bg-emerald-50 text-emerald-700 border-emerald-200',
  'Automacao & Agentes': 'bg-orange-50 text-orange-700 border-orange-200',
  'Infraestrutura & Custos': 'bg-slate-50 text-slate-700 border-slate-200',
  'Pesquisa & Benchmark': 'bg-indigo-50 text-indigo-700 border-indigo-200',
  'Fraude & Seguranca': 'bg-red-50 text-red-700 border-red-200',
  'Biometria': 'bg-teal-50 text-teal-700 border-teal-200',
  'Outros': 'bg-gray-50 text-gray-600 border-gray-200',
}

const STATUS_DOTS: Record<string, string> = {
  'Concluido': 'bg-emerald-500', 'Em Andamento': 'bg-blue-500',
  'Piloto': 'bg-amber-500', 'Cancelado': 'bg-red-300',
  'Desconhecido': 'bg-gray-300',
}

const STATUS_COLORS: Record<string, string> = {
  'Concluido': 'bg-emerald-50 text-emerald-700 border-emerald-200',
  'Em Andamento': 'bg-blue-50 text-blue-700 border-blue-200',
  'Piloto': 'bg-amber-50 text-amber-700 border-amber-200',
  'Cancelado': 'bg-red-50 text-red-400 border-red-100',
  'Desconhecido': 'bg-gray-50 text-gray-400 border-gray-100',
}

const MATURIDADE_COLORS: Record<string, string> = {
  'Prova de Conceito (PoC)': 'bg-yellow-50 text-yellow-700 border-yellow-200',
  'MVP': 'bg-lime-50 text-lime-700 border-lime-200',
  'Piloto': 'bg-amber-50 text-amber-700 border-amber-200',
  'Producao': 'bg-emerald-50 text-emerald-700 border-emerald-200',
  'Desconhecido': 'bg-gray-50 text-gray-400 border-gray-100',
}

const DOMINIO_COLORS: Record<string, string> = {
  'Atendimento ao Cliente': 'bg-rose-50 text-rose-700 border-rose-200',
  'Operacoes de Rede': 'bg-sky-50 text-sky-700 border-sky-200',
  'TI & Infraestrutura': 'bg-violet-50 text-violet-700 border-violet-200',
  'Financeiro': 'bg-emerald-50 text-emerald-700 border-emerald-200',
  'Vendas & Marketing': 'bg-amber-50 text-amber-700 border-amber-200',
  'Juridico & Regulatorio': 'bg-stone-50 text-stone-700 border-stone-200',
  'Seguranca': 'bg-red-50 text-red-700 border-red-200',
  'P&D': 'bg-fuchsia-50 text-fuchsia-700 border-fuchsia-200',
  'Multiplos': 'bg-cyan-50 text-cyan-700 border-cyan-200',
  'Outros': 'bg-gray-50 text-gray-500 border-gray-200',
}

// --- Animated counter ---
function AnimatedStat({ value, label, icon: Icon }: { value: number; label: string; icon: React.ElementType }) {
  const [count, setCount] = useState(0)
  const ref = useRef<HTMLDivElement>(null)
  useEffect(() => {
    const el = ref.current; if (!el) return
    const obs = new IntersectionObserver(([e]) => {
      if (e.isIntersecting) {
        let start: number | null = null
        const step = (ts: number) => {
          if (!start) start = ts
          const p = Math.min((ts - start) / 1200, 1)
          setCount(Math.floor((1 - Math.pow(1 - p, 3)) * value))
          if (p < 1) requestAnimationFrame(step)
        }
        requestAnimationFrame(step); obs.disconnect()
      }
    }, { threshold: 0.6 })
    obs.observe(el); return () => obs.disconnect()
  }, [value])
  return (
    <div ref={ref} className="flex items-center gap-3">
      <div className="p-2 rounded-xl bg-white/10"><Icon size={18} className="text-white" /></div>
      <div>
        <div className="text-xl font-bold text-white tabular-nums">{count}</div>
        <div className="text-[11px] text-red-100/70 font-medium">{label}</div>
      </div>
    </div>
  )
}

// --- Card component ---
function ExperimentoCard({ experimento }: { experimento: Experimento }) {
  const Icon = CATEGORIA_ICONS[experimento.categoria] ?? Layers
  const gradient = CATEGORIA_GRADIENTS[experimento.categoria] ?? 'from-gray-400 to-gray-500'
  return (
    <Link
      href={`/comunidade/experimentos/${encodeURIComponent(experimento.folder_name)}`}
      className="group bg-white border border-gray-200 rounded-xl overflow-hidden hover:shadow-lg hover:border-red-200 transition-all duration-200 block"
    >
      <div className={`h-1.5 bg-gradient-to-r ${gradient}`} />
      <div className="p-4">
        <div className="flex items-start justify-between mb-2">
          <div className="flex items-center gap-2">
            <div className={`p-1.5 rounded-lg bg-gradient-to-br ${gradient} text-white`}>
              <Icon size={14} />
            </div>
            <h3 className="font-semibold text-sm text-gray-800 line-clamp-1">{experimento.folder_name}</h3>
          </div>
          <div className="flex items-center gap-1.5 shrink-0">
            {experimento.tem_ficha && (
              <span className="text-[10px] bg-red-50 text-red-600 px-1.5 py-0.5 rounded font-medium">Ficha</span>
            )}
            {experimento.tem_relatorio && (
              <span className="text-[10px] bg-blue-50 text-blue-600 px-1.5 py-0.5 rounded font-medium">Relatório</span>
            )}
          </div>
        </div>
        <p className="text-xs text-gray-500 line-clamp-2 mb-3">{experimento.descricao}</p>
        <div className="flex flex-wrap gap-1.5 mb-3">
          <span className={`text-[10px] px-2 py-0.5 rounded-full border ${CATEGORIA_COLORS[experimento.categoria] ?? 'bg-gray-50 text-gray-500 border-gray-200'}`}>
            {experimento.categoria}
          </span>
          <span className={`text-[10px] px-2 py-0.5 rounded-full border ${DOMINIO_COLORS[experimento.dominio] ?? 'bg-gray-50 text-gray-500 border-gray-200'}`}>
            {experimento.dominio}
          </span>
          <span className={`text-[10px] px-2 py-0.5 rounded-full border ${STATUS_COLORS[experimento.status] ?? 'bg-gray-50 text-gray-400 border-gray-100'}`}>
            <span className={`inline-block w-1.5 h-1.5 rounded-full mr-1 ${STATUS_DOTS[experimento.status] ?? 'bg-gray-300'}`} />
            {experimento.status}
          </span>
          <span className={`text-[10px] px-2 py-0.5 rounded-full border ${MATURIDADE_COLORS[experimento.maturidade] ?? 'bg-gray-50 text-gray-400 border-gray-100'}`}>
            {experimento.maturidade}
          </span>
        </div>
        <div className="flex items-center justify-between text-[10px] text-gray-400">
          <span className="flex items-center gap-1">
            <FileText size={11} /> {experimento.total_arquivos} arquivos
          </span>
          <span className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity text-red-600 font-medium">
            Ver detalhes <ArrowUpRight size={11} />
          </span>
        </div>
      </div>
    </Link>
  )
}

// --- Row component ---
function ExperimentoRow({ experimento }: { experimento: Experimento }) {
  const Icon = CATEGORIA_ICONS[experimento.categoria] ?? Layers
  const gradient = CATEGORIA_GRADIENTS[experimento.categoria] ?? 'from-gray-400 to-gray-500'
  return (
    <Link
      href={`/comunidade/experimentos/${encodeURIComponent(experimento.folder_name)}`}
      className="group flex items-center gap-4 px-4 py-3 bg-white border border-gray-200 rounded-lg hover:border-red-200 hover:shadow-sm transition-all block"
    >
      <div className={`p-1.5 rounded-lg bg-gradient-to-br ${gradient} text-white shrink-0`}>
        <Icon size={14} />
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <h3 className="font-medium text-sm text-gray-800 truncate">{experimento.folder_name}</h3>
          {experimento.tem_ficha && (
            <span className="text-[10px] bg-red-50 text-red-600 px-1.5 py-0.5 rounded font-medium shrink-0">Ficha</span>
          )}
          {experimento.tem_relatorio && (
            <span className="text-[10px] bg-blue-50 text-blue-600 px-1.5 py-0.5 rounded font-medium shrink-0">Relatório</span>
          )}
        </div>
        <p className="text-xs text-gray-500 truncate mt-0.5">{experimento.descricao}</p>
      </div>
      <div className="flex items-center gap-2 shrink-0">
        <span className={`text-[10px] px-2 py-0.5 rounded-full border ${CATEGORIA_COLORS[experimento.categoria] ?? 'bg-gray-50 text-gray-500 border-gray-200'}`}>
          {experimento.categoria}
        </span>
        <span className={`text-[10px] px-2 py-0.5 rounded-full border ${STATUS_COLORS[experimento.status] ?? 'bg-gray-50 text-gray-400 border-gray-100'}`}>
          <span className={`inline-block w-1.5 h-1.5 rounded-full mr-1 ${STATUS_DOTS[experimento.status] ?? 'bg-gray-300'}`} />
          {experimento.status}
        </span>
        <span className="text-[10px] text-gray-400">{experimento.total_arquivos} arq.</span>
      </div>
    </Link>
  )
}

export default function ExperimentosPage() {
  const experimentos = experimentosData as Experimento[]
  const [search, setSearch] = useState('')
  const [filtroCategoria, setFiltroCategoria] = useState<string | null>(null)
  const [filtroDominio, setFiltroDominio] = useState<string | null>(null)
  const [filtroStatus, setFiltroStatus] = useState<string | null>(null)
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid')

  const categorias = useMemo(() => [...new Set(experimentos.map(e => e.categoria))].sort(), [experimentos])
  const dominios = useMemo(() => [...new Set(experimentos.map(e => e.dominio))].sort(), [experimentos])
  const statuses = useMemo(() => [...new Set(experimentos.map(e => e.status))].sort(), [experimentos])

  const filtrados = useMemo(() => {
    return experimentos.filter(e => {
      if (filtroCategoria && e.categoria !== filtroCategoria) return false
      if (filtroDominio && e.dominio !== filtroDominio) return false
      if (filtroStatus && e.status !== filtroStatus) return false
      if (search) {
        const q = search.toLowerCase()
        const matchNome = e.folder_name.toLowerCase().includes(q)
        const matchDesc = e.descricao.toLowerCase().includes(q)
        const matchTags = e.tags.some(t => t.toLowerCase().includes(q))
        if (!matchNome && !matchDesc && !matchTags) return false
      }
      return true
    })
  }, [experimentos, filtroCategoria, filtroDominio, filtroStatus, search])

  const temFiltros = filtroCategoria || filtroDominio || filtroStatus || search
  const comFicha = useMemo(() => filtrados.filter(e => e.tem_ficha).length, [filtrados])
  const totalArquivos = useMemo(() => filtrados.reduce((s, e) => s + e.total_arquivos, 0), [filtrados])

  const limparFiltros = () => {
    setSearch('')
    setFiltroCategoria(null)
    setFiltroDominio(null)
    setFiltroStatus(null)
  }

  return (
    <div className="flex min-h-dvh bg-white">
      <Sidebar />
      <main className="flex-1 flex flex-col overflow-hidden bg-white">
        {/* --- HEADER --- */}
        <header className="flex items-center justify-between px-6 py-3 border-b border-gray-100 bg-white shrink-0">
          <div className="flex items-center gap-3">
            <div className="p-1.5 rounded-lg bg-red-50">
              <FlaskConical size={18} className="text-red-600" />
            </div>
            <div>
              <h1 className="text-sm font-bold text-gray-800">Comunidade de Experimentos</h1>
              <p className="text-[11px] text-gray-400">Base de conhecimento do BeOn Lab</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <LogoutButton />
          </div>
        </header>

        {/* --- HERO --- */}
        <div className="relative overflow-hidden bg-gradient-to-br from-red-600 via-red-700 to-rose-800 shrink-0">
          <div className="absolute inset-0 opacity-10">
            <div className="absolute top-10 left-10 w-64 h-64 bg-white rounded-full blur-3xl animate-[floatUp_6s_ease-in-out_infinite]" />
            <div className="absolute bottom-0 right-10 w-48 h-48 bg-amber-300 rounded-full blur-3xl animate-[floatUp_8s_ease-in-out_infinite_1s]" />
          </div>
          <div className="relative px-6 py-6">
            <div className="flex items-center gap-2 text-red-100/80 text-[11px] mb-2">
              <Link href="/jira" className="hover:text-white transition">Home</Link>
              <ChevronRight size={12} />
              <span className="text-white">Comunidade de Experimentos</span>
            </div>
            <h2 className="text-2xl font-bold text-white mb-1">Base de Conhecimento do Lab</h2>
            <p className="text-red-100/80 text-sm max-w-2xl">
              Explore experimentos, fichas técnicas e relatórios organizados por categoria, domínio e maturidade.
            </p>
            <div className="flex gap-6 mt-4">
              <AnimatedStat value={experimentos.length} label="Total de experimentos" icon={Beaker} />
              <AnimatedStat value={comFicha} label="Com ficha técnica" icon={BookOpen} />
              <AnimatedStat value={totalArquivos} label="Arquivos indexados" icon={FileText} />
            </div>
          </div>
        </div>

        {/* --- FILTERS --- */}
        <div className="px-6 py-3 border-b border-gray-100 bg-gray-50/50 shrink-0">
          <div className="flex items-center gap-3 flex-wrap">
            <div className="relative flex-1 min-w-[200px] max-w-sm">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Buscar experimentos..."
                value={search}
                onChange={e => setSearch(e.target.value)}
                className="w-full pl-9 pr-8 py-2 text-xs bg-white border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-200 focus:border-red-300"
              />
              {search && (
                <button onClick={() => setSearch('')} className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                  <X size={14} />
                </button>
              )}
            </div>

            <select
              value={filtroCategoria ?? ''}
              onChange={e => setFiltroCategoria(e.target.value || null)}
              className="text-xs bg-white border border-gray-200 rounded-lg px-3 py-2 text-gray-600 focus:outline-none focus:ring-2 focus:ring-red-200"
            >
              <option value="">Todas categorias</option>
              {categorias.map(c => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>

            <select
              value={filtroDominio ?? ''}
              onChange={e => setFiltroDominio(e.target.value || null)}
              className="text-xs bg-white border border-gray-200 rounded-lg px-3 py-2 text-gray-600 focus:outline-none focus:ring-2 focus:ring-red-200"
            >
              <option value="">Todos domínios</option>
              {dominios.map(d => (
                <option key={d} value={d}>{d}</option>
              ))}
            </select>

            <select
              value={filtroStatus ?? ''}
              onChange={e => setFiltroStatus(e.target.value || null)}
              className="text-xs bg-white border border-gray-200 rounded-lg px-3 py-2 text-gray-600 focus:outline-none focus:ring-2 focus:ring-red-200"
            >
              <option value="">Todos status</option>
              {statuses.map(s => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>

            {temFiltros && (
              <button onClick={limparFiltros} className="text-xs text-red-600 hover:text-red-800 flex items-center gap-1">
                <X size={12} /> Limpar filtros
              </button>
            )}

            <div className="ml-auto flex items-center gap-1 bg-white border border-gray-200 rounded-lg p-0.5">
              <button
                onClick={() => setViewMode('grid')}
                className={`p-1.5 rounded ${viewMode === 'grid' ? 'bg-red-50 text-red-600' : 'text-gray-400 hover:text-gray-600'}`}
              >
                <Grid3X3 size={14} />
              </button>
              <button
                onClick={() => setViewMode('list')}
                className={`p-1.5 rounded ${viewMode === 'list' ? 'bg-red-50 text-red-600' : 'text-gray-400 hover:text-gray-600'}`}
              >
                <List size={14} />
              </button>
            </div>
          </div>
        </div>

        {/* --- CONTENT --- */}
        <div className="flex-1 overflow-y-auto p-6">
          {filtrados.length === 0 ? (
            <div className="text-center py-20">
              <Search size={40} className="mx-auto text-gray-300 mb-3" />
              <p className="text-gray-400 text-sm">Nenhum experimento encontrado</p>
              {temFiltros && (
                <button onClick={limparFiltros} className="mt-2 text-xs text-red-600 hover:text-red-800">
                  Limpar filtros
                </button>
              )}
            </div>
          ) : viewMode === 'grid' ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filtrados.map(exp => (
                <ExperimentoCard key={exp.folder_name} experimento={exp} />
              ))}
            </div>
          ) : (
            <div className="space-y-2">
              {filtrados.map(exp => (
                <ExperimentoRow key={exp.folder_name} experimento={exp} />
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  )
}
