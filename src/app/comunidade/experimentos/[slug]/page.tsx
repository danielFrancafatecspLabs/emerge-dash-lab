'use client'

import { useParams } from 'next/navigation'
import { useMemo } from 'react'
import Sidebar from '@/components/layout/Sidebar'
import LogoutButton from '@/components/layout/LogoutButton'
import Link from 'next/link'
import {
  HeartHandshake, ChevronRight, FlaskConical, Download, FileText,
  FileSpreadsheet, FileImage, FileArchive, File, FolderOpen,
  ArrowLeft, ExternalLink, BarChart3, Tag, Gauge, Target,
  TrendingUp, BookOpen, Lightbulb, ClipboardCheck
} from 'lucide-react'
import experimentosData from '../experimentos-categorizados.json'

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

const FILE_TYPE_ICONS: Record<string, React.ElementType> = {
  ficha: FileText, relatorio: BarChart3, apresentacao: FileText,
  documento: FileText, dados: FileSpreadsheet, compactado: FileArchive,
  midia: FileImage, imagem: FileImage, link: ExternalLink,
  texto: FileText, outros: File,
}
const FILE_TYPE_LABELS: Record<string, string> = {
  ficha: 'Ficha Técnica', relatorio: 'Relatório', apresentacao: 'Apresentação',
  documento: 'Documento', dados: 'Dados', compactado: 'Compactado',
  midia: 'Mídia', imagem: 'Imagem', link: 'Link', texto: 'Texto', outros: 'Outros',
}
const FILE_TYPE_COLORS: Record<string, string> = {
  ficha: 'text-red-600 bg-red-50 border-red-200',
  relatorio: 'text-blue-600 bg-blue-50 border-blue-200',
  apresentacao: 'text-orange-600 bg-orange-50 border-orange-200',
  documento: 'text-indigo-600 bg-indigo-50 border-indigo-200',
  dados: 'text-green-600 bg-green-50 border-green-200',
  compactado: 'text-yellow-600 bg-yellow-50 border-yellow-200',
  midia: 'text-purple-600 bg-purple-50 border-purple-200',
  imagem: 'text-pink-600 bg-pink-50 border-pink-200',
  link: 'text-cyan-600 bg-cyan-50 border-cyan-200',
  texto: 'text-gray-600 bg-gray-50 border-gray-200',
  outros: 'text-gray-500 bg-gray-50 border-gray-200',
}
const CATEGORIA_COLORS: Record<string, string> = {
  'IA Generativa': 'bg-purple-100 text-purple-700 border-purple-200',
  'Speech & Áudio': 'bg-cyan-100 text-cyan-700 border-cyan-200',
  'NLP & Texto': 'bg-blue-100 text-blue-700 border-blue-200',
  'Computer Vision': 'bg-emerald-100 text-emerald-700 border-emerald-200',
  'Automação & Agentes': 'bg-orange-100 text-orange-700 border-orange-200',
  'Infraestrutura & Custos': 'bg-slate-100 text-slate-700 border-slate-200',
  'Pesquisa & Benchmark': 'bg-indigo-100 text-indigo-700 border-indigo-200',
  'Fraude & Segurança': 'bg-red-100 text-red-700 border-red-200',
  'Biometria': 'bg-teal-100 text-teal-700 border-teal-200',
  'Outros': 'bg-gray-100 text-gray-600 border-gray-200',
}
const STATUS_COLORS: Record<string, string> = {
  'Concluído': 'bg-green-100 text-green-700', 'Em Andamento': 'bg-blue-100 text-blue-700',
  'Piloto': 'bg-amber-100 text-amber-700', 'Cancelado': 'bg-red-100 text-red-500',
  'Desconhecido': 'bg-gray-100 text-gray-500',
}
const MATURIDADE_COLORS: Record<string, string> = {
  'Prova de Conceito (PoC)': 'bg-yellow-100 text-yellow-700', 'MVP': 'bg-lime-100 text-lime-700',
  'Piloto': 'bg-amber-100 text-amber-700', 'Produção': 'bg-green-100 text-green-700',
  'Desconhecido': 'bg-gray-100 text-gray-500',
}
const DOMINIO_COLORS: Record<string, string> = {
  'Atendimento ao Cliente': 'bg-rose-100 text-rose-700',
  'Operações de Rede': 'bg-sky-100 text-sky-700',
  'TI & Infraestrutura': 'bg-violet-100 text-violet-700',
  'Financeiro': 'bg-emerald-100 text-emerald-700',
  'Vendas & Marketing': 'bg-amber-100 text-amber-700',
  'Jurídico & Regulatório': 'bg-stone-100 text-stone-700',
  'Segurança': 'bg-red-100 text-red-700',
  'P&D': 'bg-fuchsia-100 text-fuchsia-700',
  'Múltiplos': 'bg-cyan-100 text-cyan-700',
  'Outros': 'bg-gray-100 text-gray-600',
}

function FileDownloadRow({ file }: { file: FileInfo }) {
  const Icon = FILE_TYPE_ICONS[file.tipo] || File
  const colorClass = FILE_TYPE_COLORS[file.tipo] || FILE_TYPE_COLORS.outros
  const label = FILE_TYPE_LABELS[file.tipo] || 'Arquivo'
  return (
    <a
      href={file.download_url}
      download
      className="flex items-center justify-between p-3 bg-white border border-gray-200 rounded-xl hover:shadow-md hover:border-red-200 transition-all group"
    >
      <div className="flex items-center gap-3 min-w-0">
        <div className={`p-1.5 rounded-lg border ${colorClass}`}>
          <Icon size={16} />
        </div>
        <div className="min-w-0">
          <p className="text-sm font-medium text-gray-800 truncate">{file.nome}</p>
          <div className="flex items-center gap-2">
            <span className="text-xs text-gray-400">{file.tamanho_formatado}</span>
            <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-medium border ${colorClass}`}>{label}</span>
          </div>
        </div>
      </div>
      <Download size={18} className="text-red-500 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity" />
    </a>
  )
}

export default function ExperimentoDetalhePage() {
  const params = useParams()
  const slug = decodeURIComponent(params.slug as string)
  const experimentos = experimentosData as Experimento[]
  const experimento = useMemo(() => experimentos.find(e => e.folder_name === slug), [experimentos, slug])

  if (!experimento) {
    return (
      <div className="flex min-h-dvh">
        <Sidebar />
        <main className="flex-1 flex flex-col overflow-hidden bg-gradient-to-br from-gray-50 via-white to-red-50/30">
          <header className="h-14 border-b border-gray-200/60 flex items-center justify-between px-6 bg-white/80 backdrop-blur-sm shrink-0">
            <div className="flex items-center gap-3">
              <Link href="/comunidade" className="text-sm text-gray-400 hover:text-gray-600 transition-colors flex items-center gap-1">
                <HeartHandshake size={16} />Comunidade
              </Link>
              <ChevronRight size={14} className="text-gray-300" />
              <Link href="/comunidade/experimentos" className="text-sm text-gray-400 hover:text-gray-600 transition-colors">Experimentos</Link>
            </div>
            <LogoutButton />
          </header>
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center">
              <FlaskConical size={48} className="mx-auto text-gray-300 mb-4" />
              <h2 className="text-xl font-bold text-gray-700">Experimento não encontrado</h2>
              <p className="text-gray-400 mt-2">"{slug}" não corresponde a nenhum experimento.</p>
              <Link href="/comunidade/experimentos" className="mt-4 inline-flex items-center gap-2 text-red-600 hover:text-red-700 font-medium">
                <ArrowLeft size={16} /> Voltar para experimentos
              </Link>
            </div>
          </div>
        </main>
      </div>
    )
  }

  const todosArquivos = experimento.arquivos || []
  const fichas = experimento.fichas || []
  const relatorios = experimento.relatorios || []
  const outrosArquivos = todosArquivos.filter(a => a.tipo !== 'ficha' && a.tipo !== 'relatorio')

  return (
    <div className="flex min-h-dvh">
      <Sidebar />
      <main className="flex-1 flex flex-col overflow-hidden bg-gradient-to-br from-gray-50 via-white to-red-50/30">
        <header className="h-14 border-b border-gray-200/60 flex items-center justify-between px-6 bg-white/80 backdrop-blur-sm shrink-0">
          <div className="flex items-center gap-3 min-w-0">
            <Link href="/comunidade" className="text-sm text-gray-400 hover:text-gray-600 transition-colors flex items-center gap-1 shrink-0">
              <HeartHandshake size={16} />Comunidade
            </Link>
            <ChevronRight size={14} className="text-gray-300 shrink-0" />
            <Link href="/comunidade/experimentos" className="text-sm text-gray-400 hover:text-gray-600 transition-colors shrink-0">Experimentos</Link>
            <ChevronRight size={14} className="text-gray-300 shrink-0" />
            <h1 className="text-sm font-semibold text-gray-800 truncate">{experimento.folder_name}</h1>
          </div>
          <LogoutButton />
        </header>

        <div className="flex-1 overflow-auto">
          {/* Hero */}
          <div className="relative overflow-hidden bg-gradient-to-b from-red-700 to-red-800">
            <div className="absolute inset-0 opacity-10">
              <div className="absolute top-0 right-0 w-64 h-64 bg-white rounded-full blur-3xl" />
              <div className="absolute bottom-0 left-10 w-48 h-48 bg-red-300 rounded-full blur-3xl" />
            </div>
            <div className="relative max-w-4xl mx-auto px-6 py-8">
              <Link href="/comunidade/experimentos" className="inline-flex items-center gap-1.5 text-red-200/80 hover:text-white text-sm mb-4 transition-colors">
                <ArrowLeft size={16} /> Voltar para experimentos
              </Link>
              <h2 className="text-xl md:text-2xl font-bold text-white mb-3 tracking-tight">{experimento.folder_name}</h2>
              <p className="text-red-100/80 text-sm max-w-2xl">{experimento.descricao}</p>
            </div>
          </div>

          <div className="max-w-4xl mx-auto px-6 py-8 space-y-8">
            {/* Quick Info Cards */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {[
                { icon: FolderOpen, label: 'Categoria', value: experimento.categoria, color: CATEGORIA_COLORS[experimento.categoria] },
                { icon: Target, label: 'Domínio', value: experimento.dominio, color: DOMINIO_COLORS[experimento.dominio] },
                { icon: Gauge, label: 'Status', value: experimento.status, color: STATUS_COLORS[experimento.status] },
                { icon: TrendingUp, label: 'Maturidade', value: experimento.maturidade, color: MATURIDADE_COLORS[experimento.maturidade] },
              ].map(card => (
                <div key={card.label} className="bg-white border border-gray-200 rounded-xl p-4">
                  <div className="flex items-center gap-2 text-xs text-gray-400 mb-1">
                    <card.icon size={14} /> {card.label}
                  </div>
                  <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${card.color || 'bg-gray-100 text-gray-500'}`}>
                    {card.value}
                  </span>
                </div>
              ))}
            </div>

            {/* Description */}
            <section className="bg-white border border-gray-200 rounded-2xl p-6">
              <div className="flex items-center gap-2 mb-4">
                <BookOpen size={18} className="text-red-600" />
                <h3 className="font-semibold text-gray-900">Sobre este Experimento</h3>
              </div>
              <p className="text-sm text-gray-600 leading-relaxed">{experimento.descricao}</p>
              <div className="flex flex-wrap gap-1.5 mt-4">
                {(experimento.tags || []).map(tag => (
                  <span key={tag} className="text-[11px] text-gray-500 bg-gray-100 px-2 py-0.5 rounded-full font-medium">
                    <Tag size={10} className="inline mr-1" />{tag}
                  </span>
                ))}
              </div>
            </section>

            {/* Fichas Técnicas */}
            {fichas.length > 0 && (
              <section className="bg-gradient-to-br from-red-50 to-white border-2 border-red-200 rounded-2xl p-6">
                <div className="flex items-center gap-3 mb-4">
                  <div className="p-2 bg-red-100 rounded-lg"><FileText size={20} className="text-red-600" /></div>
                  <div>
                    <h3 className="font-semibold text-gray-900">Fichas Técnicas</h3>
                    <p className="text-xs text-gray-400">{fichas.length} arquivo{fichas.length > 1 ? 's' : ''} disponível{fichas.length > 1 ? 'is' : ''} para download</p>
                  </div>
                </div>
                <div className="space-y-2">
                  {fichas.map((f, i) => <FileDownloadRow key={i} file={f} />)}
                </div>
              </section>
            )}

            {/* Relatórios */}
            {relatorios.length > 0 && (
              <section className="bg-gradient-to-br from-blue-50 to-white border-2 border-blue-200 rounded-2xl p-6">
                <div className="flex items-center gap-3 mb-4">
                  <div className="p-2 bg-blue-100 rounded-lg"><BarChart3 size={20} className="text-blue-600" /></div>
                  <div>
                    <h3 className="font-semibold text-gray-900">Relatórios</h3>
                    <p className="text-xs text-gray-400">{relatorios.length} arquivo{relatorios.length > 1 ? 's' : ''} disponível{relatorios.length > 1 ? 'is' : ''} para download</p>
                  </div>
                </div>
                <div className="space-y-2">
                  {relatorios.map((f, i) => <FileDownloadRow key={i} file={f} />)}
                </div>
              </section>
            )}

            {/* Outros Arquivos */}
            {outrosArquivos.length > 0 && (
              <section className="bg-white border border-gray-200 rounded-2xl p-6">
                <div className="flex items-center gap-3 mb-4">
                  <div className="p-2 bg-gray-100 rounded-lg"><FolderOpen size={20} className="text-gray-500" /></div>
                  <div>
                    <h3 className="font-semibold text-gray-900">Outros Arquivos</h3>
                    <p className="text-xs text-gray-400">{outrosArquivos.length} arquivo{outrosArquivos.length > 1 ? 's' : ''} complementar{outrosArquivos.length > 1 ? 'es' : ''}</p>
                  </div>
                </div>
                <div className="space-y-2">
                  {outrosArquivos.map((f, i) => <FileDownloadRow key={i} file={f} />)}
                </div>
              </section>
            )}

            {todosArquivos.length === 0 && (
              <section className="bg-white border border-dashed border-gray-300 rounded-2xl p-8 text-center">
                <File size={40} className="mx-auto text-gray-300 mb-3" />
                <h3 className="font-semibold text-gray-600">Nenhum arquivo disponível</h3>
                <p className="text-sm text-gray-400 mt-1">Este experimento ainda não possui arquivos anexados.</p>
              </section>
            )}

            {/* Bottom spacer */}
            <div className="pb-8" />
          </div>
        </div>
      </main>
    </div>
  )
}