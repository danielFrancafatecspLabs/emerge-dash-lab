'use client'

import { useState, useMemo, useCallback } from 'react'
import Link from 'next/link'
import Sidebar from '@/components/layout/Sidebar'
import LogoutButton from '@/components/layout/LogoutButton'
import {
  HeartHandshake, Search, Plus, Upload, BookOpen, FlaskConical, FileText,
  Lightbulb, ArrowRight, Clock, Users, TrendingUp, Star, Eye, Heart,
  Rocket, CheckCircle2, Timer, Building2, LayoutTemplate, Tag,
  Filter, X, ChevronRight, Zap, BookMarked, Library, Compass,
  Sparkles, Trophy, ArrowUpRight, Download, MessageSquare, ThumbsUp,
} from 'lucide-react'

interface ExperimentoItem {
  nome: string; area: string; categoria: string; complexidade: string
  status: string; resultado: string; responsavel: string; data: string; tags: string
}

interface KnowledgeItem {
  icon: string; title: string; desc: string; author: string
  date: string; readTime: string; category: string
  href?: string
}

interface SuccessCase {
  title: string; summary: string; results: string[]; color: string; emoji: string
}

const EXPERIMENTOS_DATA: ExperimentoItem[] = [
  { nome: 'Agente CORI - RAG COM MCP', area: 'Operações de Rede', categoria: 'Automação & Agentes', complexidade: 'Baixa', status: 'Concluído', resultado: 'Positivo', responsavel: 'beOn Labs', data: '2026-01-01', tags: 'agente, automação, RAG' },
  { nome: 'Alarmes Garantia da Receita', area: 'Financeiro', categoria: 'Outros', complexidade: 'Média', status: 'Em Andamento', resultado: 'Inconclusivo', responsavel: 'COE Digital', data: '2026-02-02', tags: 'alarme, receita, financeiro' },
  { nome: 'Analise de Sentimentos', area: 'P&D', categoria: 'NLP & Texto', complexidade: 'Alta', status: 'Backlog', resultado: 'Negativo', responsavel: 'Engenharia', data: '2026-03-03', tags: 'análise de sentimentos, NPS, dados' },
  { nome: 'Auto-Instalação (CS)', area: 'Atendimento ao Cliente', categoria: 'Automação & Agentes', complexidade: 'Média', status: 'Cancelado', resultado: '-', responsavel: 'Hitss', data: '2026-04-04', tags: 'auto-instalação, atendimento, clientes' },
  { nome: 'Automação de Editais', area: 'Operações de Rede', categoria: 'Automação & Agentes', complexidade: 'Baixa', status: 'Concluído', resultado: 'Positivo', responsavel: 'beOn Labs', data: '2026-05-05', tags: 'automação, editais, gestão' },
  { nome: 'Benchmark LLMs', area: 'P&D', categoria: 'Pesquisa & Benchmark', complexidade: 'Média', status: 'Em Andamento', resultado: 'Inconclusivo', responsavel: 'COE Digital', data: '2026-06-06', tags: 'benchmark, LLMs, P&D' },
  { nome: 'Cientista beOn labs', area: 'P&D', categoria: 'Pesquisa & Benchmark', complexidade: 'Alta', status: 'Concluído', resultado: 'Negativo', responsavel: 'Engenharia', data: '2026-01-07', tags: 'cientista, P&D, IA' },
  { nome: 'Clarinha', area: 'Atendimento ao Cliente', categoria: 'Outros', complexidade: 'Média', status: 'Cancelado', resultado: '-', responsavel: 'Hitss', data: '2026-02-08', tags: 'assistente virtual, Clarinha, atendimento' },
  { nome: 'Claro Box - Identificação de Fraude', area: 'Segurança', categoria: 'Fraude & Segurança', complexidade: 'Baixa', status: 'Concluído', resultado: 'Positivo', responsavel: 'beOn Labs', data: '2026-03-09', tags: 'fraude, segurança, Claro Box' },
  { nome: 'Classificação Automática de IncidenteChamado', area: 'TI & Infraestrutura', categoria: 'Automação & Agentes', complexidade: 'Média', status: 'Em Andamento', resultado: 'Inconclusivo', responsavel: 'COE Digital', data: '2026-04-10', tags: 'classificação, incidentes, TI' },
  { nome: 'Custos Infraestrutura IA', area: 'TI & Infraestrutura', categoria: 'Infraestrutura & Custos', complexidade: 'Alta', status: 'Backlog', resultado: 'Negativo', responsavel: 'Engenharia', data: '2026-05-11', tags: 'custos, infraestrutura, IA' },
  { nome: 'Experimento Reajuste Telmex', area: 'Financeiro', categoria: 'Outros', complexidade: 'Média', status: 'Cancelado', resultado: '-', responsavel: 'Hitss', data: '2026-06-12', tags: 'reajuste, Telmex, financeiro' },
  { nome: 'Gestão de Incidentes - Datacenter', area: 'TI & Infraestrutura', categoria: 'Automação & Agentes', complexidade: 'Baixa', status: 'Concluído', resultado: 'Positivo', responsavel: 'beOn Labs', data: '2026-01-13', tags: 'gestão, incidentes, datacenter' },
  { nome: 'Identificação de Chamadas de Spam', area: 'Atendimento ao Cliente', categoria: 'Speech & Áudio', complexidade: 'Média', status: 'Concluído', resultado: 'Inconclusivo', responsavel: 'COE Digital', data: '2026-02-14', tags: 'spam, chamadas, atendimento' },
  { nome: 'METAEXPERIMENTO', area: 'Múltiplos', categoria: 'Outros', complexidade: 'Alta', status: 'Backlog', resultado: 'Negativo', responsavel: 'Engenharia', data: '2026-03-15', tags: 'metaexperimento, tecnologia, exploração' },
  { nome: 'Motor Tecnico (CS)', area: 'Operações de Rede', categoria: 'Automação & Agentes', complexidade: 'Média', status: 'Cancelado', resultado: '-', responsavel: 'Hitss', data: '2026-04-16', tags: 'motor técnico, automação, CS' },
  { nome: 'Personas Sintéticas', area: 'P&D', categoria: 'IA Generativa', complexidade: 'Baixa', status: 'Concluído', resultado: 'Positivo', responsavel: 'beOn Labs', data: '2026-05-17', tags: 'personas, sintéticas, geração' },
  { nome: 'Previsão de Custos e Duração de Demandas de TI', area: 'TI & Infraestrutura', categoria: 'Infraestrutura & Custos', complexidade: 'Média', status: 'Em Andamento', resultado: 'Inconclusivo', responsavel: 'COE Digital', data: '2026-06-18', tags: 'previsão, custos, TI' },
  { nome: 'Serviço de Biometria', area: 'Segurança', categoria: 'Biometria', complexidade: 'Alta', status: 'Backlog', resultado: 'Negativo', responsavel: 'Engenharia', data: '2026-01-19', tags: 'biometria, segurança, autenticação' },
  { nome: 'Speech Recognitiion', area: 'Atendimento ao Cliente', categoria: 'Speech & Áudio', complexidade: 'Média', status: 'Cancelado', resultado: '-', responsavel: 'Hitss', data: '2026-02-20', tags: 'reconhecimento de fala, atendimento, IA' },
  { nome: 'Speech-To-Text', area: 'Atendimento ao Cliente', categoria: 'Speech & Áudio', complexidade: 'Baixa', status: 'Concluído', resultado: 'Positivo', responsavel: 'beOn Labs', data: '2026-03-21', tags: 'speech-to-text, whisper, IA' },
  { nome: 'Tabulação automática de Vendas', area: 'Vendas & Marketing', categoria: 'Automação & Agentes', complexidade: 'Média', status: 'Em Andamento', resultado: 'Inconclusivo', responsavel: 'COE Digital', data: '2026-04-22', tags: 'tabulação, vendas, automação' },
  { nome: 'URA Cognitiva', area: 'Atendimento ao Cliente', categoria: 'Automação & Agentes', complexidade: 'Alta', status: 'Backlog', resultado: 'Negativo', responsavel: 'Engenharia', data: '2026-05-23', tags: 'URA, cognitiva, atendimento' },
  { nome: 'VOC - Correlação de Alarmes', area: 'Operações de Rede', categoria: 'Outros', complexidade: 'Média', status: 'Cancelado', resultado: '-', responsavel: 'Hitss', data: '2026-06-24', tags: 'VOC, alarm, correlação' },
  { nome: 'Video-Inspeção da Rede (CS)', area: 'Operações de Rede', categoria: 'Computer Vision', complexidade: 'Baixa', status: 'Concluído', resultado: 'Positivo', responsavel: 'beOn Labs', data: '2026-01-25', tags: 'video, inspeção, rede' },
  { nome: 'APP Bot - Avatar – Atendimento Técnico', area: 'Atendimento ao Cliente', categoria: 'Automacao & Agentes', complexidade: 'Média', status: 'Em Andamento', resultado: 'Inconclusivo', responsavel: 'COE Digital', data: '2026-02-26', tags: 'app, bot, avatar' },
  { nome: 'Aceitação Remota Rede Móvel', area: 'Operacoes de Rede', categoria: 'Operacoes de Rede', complexidade: 'Alta', status: 'Backlog', resultado: 'Negativo', responsavel: 'Engenharia', data: '2026-03-27', tags: 'aceita, remota, rede' },
  { nome: 'Agente CORI (COPREDE)', area: 'Operacoes de Rede', categoria: 'Automacao & Agentes', complexidade: 'Média', status: 'Cancelado', resultado: '-', responsavel: 'Hitss', data: '2026-04-28', tags: 'agente, cori, coprede' },
  { nome: 'Agente criador de SD', area: 'TI & Infraestrutura', categoria: 'Automacao & Agentes', complexidade: 'Baixa', status: 'Concluído', resultado: 'Positivo', responsavel: 'beOn Labs', data: '2026-05-01', tags: 'agente, criador' },
  { nome: 'Análise de Contestação da Fatura Empresarial', area: 'Financeiro', categoria: 'Automacao & Agentes', complexidade: 'Média', status: 'Em Andamento', resultado: 'Inconclusivo', responsavel: 'COE Digital', data: '2026-06-02', tags: 'lise, contesta, fatura' },
  { nome: 'Assistente IA Ágil', area: 'Multiplos', categoria: 'Automacao & Agentes', complexidade: 'Alta', status: 'Backlog', resultado: 'Negativo', responsavel: 'Engenharia', data: '2026-01-03', tags: 'assistente, gil' },
  { nome: 'Atendimento por Voz - Resposta do KB', area: 'Atendimento ao Cliente', categoria: 'Speech & Audio', complexidade: 'Média', status: 'Cancelado', resultado: '-', responsavel: 'Hitss', data: '2026-02-04', tags: 'atendimento, por, voz' },
  { nome: 'Auto Inspeção Técnica', area: 'Multiplos', categoria: 'Outros', complexidade: 'Baixa', status: 'Concluído', resultado: 'Positivo', responsavel: 'beOn Labs', data: '2026-03-05', tags: 'auto, inspe, cnica' },
  { nome: 'Bot Vendedor - Hitss', area: 'Vendas & Marketing', categoria: 'Automacao & Agentes', complexidade: 'Média', status: 'Em Andamento', resultado: 'Inconclusivo', responsavel: 'COE Digital', data: '2026-04-06', tags: 'bot, vendedor, hitss' },
  { nome: 'Check IA', area: 'Multiplos', categoria: 'Qualidade & Testes', complexidade: 'Alta', status: 'Backlog', resultado: 'Negativo', responsavel: 'Engenharia', data: '2026-05-07', tags: 'check' },
  { nome: 'Clarinha 2025', area: 'Atendimento ao Cliente', categoria: 'Atendimento ao Cliente', complexidade: 'Média', status: 'Cancelado', resultado: '-', responsavel: 'Hitss', data: '2026-06-08', tags: 'clarinha' },
  { nome: 'Conexão Logística RSI', area: 'Operacoes de Rede', categoria: 'Operacoes & Logistica', complexidade: 'Baixa', status: 'Concluído', resultado: 'Positivo', responsavel: 'beOn Labs', data: '2026-01-09', tags: 'conex, log, stica' },
  { nome: 'Consulta inteligente sobre os documentos de arquitetura', area: 'TI & Infraestrutura', categoria: 'Automacao & Agentes', complexidade: 'Média', status: 'Em Andamento', resultado: 'Inconclusivo', responsavel: 'COE Digital', data: '2026-02-10', tags: 'consulta, inteligente, sobre' },
  { nome: 'Copiloto de vendas Consumo', area: 'Vendas & Marketing', categoria: 'Automacao & Agentes', complexidade: 'Alta', status: 'Backlog', resultado: 'Negativo', responsavel: 'Engenharia', data: '2026-03-11', tags: 'copiloto, vendas, consumo' }
]

const KNOWLEDGE_ITEMS: KnowledgeItem[] = [
  { icon: '📖', title: 'Playbook de Experimentação', desc: 'Guia completo com metodologia, templates e checklists', author: 'Daniel França Leite', date: '2026-06-15', readTime: '12 min', category: 'Playbook' },
  { icon: '🧩', title: 'Framework de Hipóteses', desc: 'Estrutura para formular e validar hipóteses com método científico', author: 'Daniel Leite', date: '2026-05-20', readTime: '8 min', category: 'Framework', href: '/comunidade/framework-hipoteses' },
  { icon: '📋', title: 'Canvas de Experimento', desc: 'One-page canvas para planejar experimentos rapidamente', author: 'beOn Labs', date: '2026-07-01', readTime: '5 min', category: 'Canvas' },
  { icon: '❓', title: 'FAQ da Comunidade', desc: 'Perguntas frequentes sobre o processo de experimentação', author: 'COE Digital', date: '2026-07-10', readTime: '15 min', category: 'FAQ' },
  { icon: '📝', title: 'Template de Relatório', desc: 'Modelo padronizado para documentar resultados de experimentos', author: 'Engenharia', date: '2026-04-28', readTime: '3 min', category: 'Template' },
  { icon: '📊', title: 'Estudo de Caso: Clarinha', desc: 'Análise detalhada do experimento de evolução da Clarinha', author: 'Hitss', date: '2026-06-30', readTime: '10 min', category: 'Estudo' },
  { icon: '✅', title: 'Boas Práticas em IA', desc: 'Diretrizes para experimentos com inteligência artificial', author: 'beOn Labs', date: '2026-07-05', readTime: '7 min', category: 'Boas Práticas' },
  { icon: '🔬', title: 'Guia de Métricas', desc: 'Como definir e acompanhar métricas de sucesso em experimentos', author: 'Daniel França', date: '2026-05-12', readTime: '6 min', category: 'Guia' },
]

const SUCCESS_CASES: SuccessCase[] = [
  { title: 'Evolução da Clarinha — Ciclo 2', summary: 'Assistente virtual com IA generativa que reduziu em 40% o tempo médio de atendimento e aumentou o NPS em 12 pontos.', results: ['Redução de 40% no TMA', 'NPS +12 pontos', 'R$ 2.3M em benefício anual'], color: 'from-red-500 to-red-700', emoji: '🤖' },
  { title: 'Assistente IA Ágil', summary: 'Copiloto de desenvolvimento que acelerou em 60% a entrega de user stories, com ganho de qualidade de código.', results: ['60% mais velocidade', '35% menos bugs', 'Adoção por 12 squads'], color: 'from-blue-500 to-blue-700', emoji: '⚡' },
  { title: 'Bot Avatar — Atendimento Técnico', summary: 'Avatar digital para suporte técnico que resolveu 70% das demandas sem intervenção humana no primeiro contato.', results: ['70% resolução 1º contato', 'R$ 1.8M economia', 'Satisfação 4.8/5'], color: 'from-green-500 to-green-700', emoji: '🎯' },
]

export default function ComunidadePage() {
  const [searchQuery, setSearchQuery] = useState('')
  const [filtroArea, setFiltroArea] = useState('Todas')
  const [filtroStatus, setFiltroStatus] = useState('Todos')
  const [filtroComplexidade, setFiltroComplexidade] = useState('Todas')
  const [favorites, setFavorites] = useState<Set<string>>(new Set())
  const [activeTab, setActiveTab] = useState<'todos' | 'favoritos' | 'recentes'>('todos')

  const toggleFavorite = useCallback((nome: string) => {
    setFavorites(prev => {
      const next = new Set(prev)
      if (next.has(nome)) next.delete(nome)
      else next.add(nome)
      return next
    })
  }, [])

  const indicadores = useMemo(() => [
    { label: 'Experimentos Ativos', value: '12', icon: FlaskConical, color: 'text-red-600', bg: 'bg-red-50' },
    { label: 'Concluídos', value: '27', icon: CheckCircle2, color: 'text-green-600', bg: 'bg-green-50' },
    { label: 'Conversão p/ Piloto', value: '38%', icon: Rocket, color: 'text-blue-600', bg: 'bg-blue-50' },
    { label: 'Conversão p/ Escala', value: '15%', icon: TrendingUp, color: 'text-purple-600', bg: 'bg-purple-50' },
    { label: 'Lead Time Médio', value: '45d', icon: Clock, color: 'text-amber-600', bg: 'bg-amber-50' },
    { label: 'Cycle Time Médio', value: '22d', icon: Timer, color: 'text-cyan-600', bg: 'bg-cyan-50' },
    { label: 'Participantes Ativos', value: '48', icon: Users, color: 'text-indigo-600', bg: 'bg-indigo-50' },
    { label: 'Conteúdos Publicados', value: '34', icon: FileText, color: 'text-rose-600', bg: 'bg-rose-50' },
    { label: 'Visualizações (mês)', value: '2.4K', icon: Eye, color: 'text-teal-600', bg: 'bg-teal-50' },
    { label: 'NPS Comunidade', value: '72', icon: Heart, color: 'text-pink-600', bg: 'bg-pink-50' },
    { label: 'Labs Participantes', value: '4', icon: Building2, color: 'text-orange-600', bg: 'bg-orange-50' },
    { label: 'Templates Disponíveis', value: '8', icon: LayoutTemplate, color: 'text-emerald-600', bg: 'bg-emerald-50' },
  ], [])

  const acessoRapido = useMemo(() => [
    { icon: Compass, label: 'Trilha para Experimentar', desc: 'Mini-curso completo em 6 módulos: da ideação à escala', count: '6 módulos', href: '/comunidade/como-experimentar', color: 'text-red-600', bg: 'bg-red-50', border: 'border-red-200', disabled: false },
    { icon: ThumbsUp, label: 'Boas Práticas', desc: 'Diretrizes e recomendações para experimentos de qualidade', count: '12 artigos', href: '#', color: 'text-green-600', bg: 'bg-green-50', border: 'border-green-200', disabled: true },
    { icon: Library, label: 'Biblioteca de Relatórios', desc: 'Relatórios executivos e técnicos dos experimentos', count: '27 relatórios', href: '#', color: 'text-blue-600', bg: 'bg-blue-50', border: 'border-blue-200', disabled: true },
    { icon: LayoutTemplate, label: 'Templates e Fichas', desc: 'Modelos prontos para documentar e planejar experimentos', count: '8 templates', href: '#', color: 'text-purple-600', bg: 'bg-purple-50', border: 'border-purple-200', disabled: true },
    { icon: FlaskConical, label: 'Catálogo de Experimentos', desc: 'Explore todos os experimentos do beOn Labs', count: '39 experimentos', href: '/comunidade/experimentos', color: 'text-amber-600', bg: 'bg-amber-50', border: 'border-amber-200', disabled: false },
    { icon: BookMarked, label: 'Base de Conhecimento', desc: 'Artigos, estudos e materiais da comunidade', count: '34 conteúdos', href: '#', color: 'text-cyan-600', bg: 'bg-cyan-50', border: 'border-cyan-200', disabled: true },
  ], [])

  const jornada = useMemo(() => [
    { step: 1, label: 'Ideação', desc: 'Identifique oportunidades e gere ideias' },
    { step: 2, label: 'Descoberta', desc: 'Pesquise e entenda o contexto do problema' },
    { step: 3, label: 'Hipótese', desc: 'Formule hipóteses testáveis com métricas' },
    { step: 4, label: 'Experimento', desc: 'Execute com método científico' },
    { step: 5, label: 'Validação', desc: 'Analise resultados e valide hipóteses' },
    { step: 6, label: 'Piloto', desc: 'Teste em ambiente controlado com usuários reais' },
    { step: 7, label: 'Escala', desc: 'Expanda para produção e mensure o impacto' },
  ], [])

  const destaques = useMemo(() => [
    { icon: FileText, label: 'Relatórios Executivos', desc: 'Resumos gerenciais dos principais experimentos', tag: 'Novo', color: 'from-red-500 to-red-600', image: 'https://images.pexels.com/photos/3183150/pexels-photo-3183150.jpeg?auto=compress&cs=tinysrgb&w=800' },
    { icon: Zap, label: 'Tendências Tecnológicas', desc: 'O que há de mais recente em IA, automação e dados', tag: 'Trending', color: 'from-blue-500 to-blue-600', image: 'https://images.pexels.com/photos/373543/pexels-photo-373543.jpeg?auto=compress&cs=tinysrgb&w=800' },
    { icon: Sparkles, label: 'IA Generativa', desc: 'Casos de uso, frameworks e aprendizados em GenAI', tag: 'Destaque', color: 'from-purple-500 to-purple-600', image: 'https://images.pexels.com/photos/8386440/pexels-photo-8386440.jpeg?auto=compress&cs=tinysrgb&w=800' },
    { icon: Compass, label: 'Novos Frameworks', desc: 'Metodologias emergentes para experimentação ágil', tag: '2026', color: 'from-green-500 to-green-600', image: 'https://images.pexels.com/photos/3184292/pexels-photo-3184292.jpeg?auto=compress&cs=tinysrgb&w=800' },
  ], [])

  const areas = useMemo(() => ['Todas', ...Array.from(new Set(EXPERIMENTOS_DATA.map(e => e.area))).sort()], [])
  const statuses = useMemo(() => ['Todos', ...Array.from(new Set(EXPERIMENTOS_DATA.map(e => e.status))).sort()], [])
  const complexidades = useMemo(() => ['Todas', 'Baixa', 'Média', 'Alta'], [])

  const filteredExperimentos = useMemo(() => {
    let result = EXPERIMENTOS_DATA
    if (searchQuery) {
      const q = searchQuery.toLowerCase()
      result = result.filter(e =>
        e.nome.toLowerCase().includes(q) ||
        e.categoria.toLowerCase().includes(q) ||
        e.tags.toLowerCase().includes(q) ||
        e.responsavel.toLowerCase().includes(q)
      )
    }
    if (filtroArea !== 'Todas') result = result.filter(e => e.area === filtroArea)
    if (filtroStatus !== 'Todos') result = result.filter(e => e.status === filtroStatus)
    if (filtroComplexidade !== 'Todas') result = result.filter(e => e.complexidade === filtroComplexidade)
    if (activeTab === 'favoritos') result = result.filter(e => favorites.has(e.nome))
    if (activeTab === 'recentes') result = result.slice(0, 10)
    return result
  }, [searchQuery, filtroArea, filtroStatus, filtroComplexidade, activeTab, favorites])

  const filteredKnowledge = useMemo(() => {
    if (!searchQuery) return KNOWLEDGE_ITEMS
    const q = searchQuery.toLowerCase()
    return KNOWLEDGE_ITEMS.filter(k =>
      k.title.toLowerCase().includes(q) ||
      k.desc.toLowerCase().includes(q) ||
      k.category.toLowerCase().includes(q)
    )
  }, [searchQuery])

  const filteredSuccessCases = useMemo(() => {
    if (!searchQuery) return SUCCESS_CASES
    const q = searchQuery.toLowerCase()
    return SUCCESS_CASES.filter(c =>
      c.title.toLowerCase().includes(q) ||
      c.summary.toLowerCase().includes(q)
    )
  }, [searchQuery])

  const statusColor = (s: string) => {
    const map: Record<string, string> = {
      'Concluído': 'bg-green-100 text-green-700',
      'Em Andamento': 'bg-blue-100 text-blue-700',
      'Backlog': 'bg-gray-100 text-gray-600',
      'Cancelado': 'bg-red-100 text-red-700',
    }
    return map[s] || 'bg-gray-100 text-gray-600'
  }

  const resultadoColor = (r: string) => {
    const map: Record<string, string> = {
      'Positivo': 'bg-emerald-100 text-emerald-700',
      'Inconclusivo': 'bg-amber-100 text-amber-700',
      'Negativo': 'bg-red-100 text-red-700',
      '-': 'bg-gray-50 text-gray-400',
    }
    return map[r] || 'bg-gray-50 text-gray-400'
  }

  return (
    <div className="flex min-h-dvh">
      <Sidebar />
      <main className="flex-1 flex flex-col overflow-hidden bg-gradient-to-br from-gray-50 via-white to-red-50/30">
        {/* ========== HEADER ========== */}
        <header className="sticky top-0 z-30 bg-white/80 backdrop-blur-md border-b border-gray-100">
          <div className="px-4 sm:px-6 lg:px-8 h-14 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-red-600 flex items-center justify-center">
                <HeartHandshake className="w-4 h-4 text-white" />
              </div>
              <h1 className="text-lg font-bold text-gray-900">Comunidade de Experimentação</h1>
            </div>
            <LogoutButton />
          </div>
        </header>

        <div className="flex-1 overflow-y-auto">
          <div className="px-4 sm:px-6 lg:px-8 py-8 space-y-14">

            {/* ========== SEÇÃO 1: DESTAQUES / HERO ========== */}
            <section>
              {/* Hero Banner compacto */}
              <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-red-600 via-red-700 to-red-900 p-6 sm:p-8 text-white mb-6">
                <div className="absolute inset-0 opacity-10">
                  <div className="absolute top-0 right-0 w-96 h-96 bg-white rounded-full blur-3xl" />
                  <div className="absolute bottom-0 left-0 w-64 h-64 bg-white rounded-full blur-3xl" />
                </div>
                <div className="relative z-10 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                  <div className="max-w-xl">
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/20 text-xs font-semibold tracking-wider uppercase mb-3">
                      <Sparkles className="w-3 h-3" /> Portal Central de Conhecimento
                    </span>
                    <h2 className="text-2xl sm:text-3xl font-bold mb-2 leading-tight">
                      Bem-vindo à Comunidade de Experimentação
                    </h2>
                    <p className="text-red-100 text-sm leading-relaxed">
                      Conecte-se com experimentadores, acesse conhecimento prático e acelere sua jornada de inovação.
                    </p>
                  </div>
                  <div className="flex gap-2 flex-shrink-0">
                    <Link href="/comunidade/como-experimentar" className="inline-flex items-center gap-2 px-4 py-2 bg-white text-red-700 rounded-xl font-semibold text-sm hover:bg-red-50 transition-colors shadow-lg whitespace-nowrap">
                      <Compass className="w-4 h-4" /> Começar Trilha
                    </Link>
                    <Link href="/comunidade/experimentos" className="inline-flex items-center gap-2 px-4 py-2 bg-white/10 text-white rounded-xl font-semibold text-sm hover:bg-white/20 transition-colors border border-white/20 whitespace-nowrap">
                      <FlaskConical className="w-4 h-4" /> Ver Experimentos
                    </Link>
                  </div>
                </div>
              </div>

              {/* Sweet Future — Card de destaque acima de todos os conteúdos */}
              <a
                href="/jira/SF_020_20260713.pdf"
                download
                className="group relative overflow-hidden rounded-2xl min-h-[200px] sm:min-h-[240px] flex items-center cursor-pointer transition-all duration-500 hover:scale-[1.01] hover:shadow-2xl hover:shadow-amber-500/20 mb-6"
              >
                {/* Imagem de fundo — capa do Sweet Future */}
                <div className="absolute inset-0">
                  <img
                    src="/jira/sweet-future-cover.png"
                    alt="Sweet Future Edição 020"
                    className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                  />
                </div>
                {/* Overlay gradiente para legibilidade */}
                <div className="absolute inset-0 bg-gradient-to-r from-black/70 via-black/40 to-black/50" />
                {/* Detalhe decorativo */}
                <div className="absolute top-0 left-0 w-2 h-full bg-gradient-to-b from-amber-400 to-orange-500" />
                {/* Conteúdo */}
                <div className="relative z-10 px-8 sm:px-10 py-8 flex flex-col sm:flex-row items-start sm:items-center gap-6 w-full">
                  <div className="flex-1">
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/20 text-amber-300 text-xs font-bold tracking-wider uppercase mb-3 border border-amber-500/30">
                      <Star className="w-3 h-3 fill-amber-400" /> Edição Especial
                    </span>
                    <h2 className="text-2xl sm:text-3xl font-bold text-white mb-2 leading-tight">
                      Sweet Future — Edição #020
                    </h2>
                    <p className="text-white/70 text-sm leading-relaxed max-w-2xl">
                      Publicação oficial do beOn Labs com as principais tendências, experimentos e cases de inovação. 
                      Baixe agora e fique por dentro de tudo que está acontecendo na comunidade.
                    </p>
                    <div className="flex items-center gap-3 mt-3">
                      <span className="text-xs text-white/50 flex items-center gap-1">
                        <Clock className="w-3 h-3" /> Julho 2026
                      </span>
                      <span className="text-xs text-white/50 flex items-center gap-1">
                        <FileText className="w-3 h-3" /> PDF
                      </span>
                    </div>
                  </div>
                  <div className="flex-shrink-0 flex items-center gap-2 px-5 py-3 bg-white text-gray-900 rounded-xl font-semibold text-sm group-hover:bg-amber-50 transition-colors shadow-xl">
                    <Download className="w-4 h-4" /> Baixar PDF
                  </div>
                </div>
              </a>

              {/* Conteúdos em Destaque — Cards Cinematográficos */}
              <h3 className="text-sm font-bold text-gray-800 mb-3 flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-red-500" /> Conteúdos em Destaque
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                {destaques.map((item, i) => (
                  <div
                    key={i}
                    className="group relative overflow-hidden rounded-2xl min-h-[280px] p-6 flex flex-col justify-between cursor-pointer transition-all duration-500 hover:scale-[1.02] hover:shadow-2xl hover:shadow-red-500/20"
                  >
                    {/* Imagem de fundo Pexels */}
                    <div className="absolute inset-0">
                      <img
                        src={item.image}
                        alt={item.label}
                        className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                        loading="lazy"
                      />
                    </div>
                    {/* Overlay gradiente escuro para contraste */}
                    <div className={`absolute inset-0 bg-gradient-to-br ${item.color} opacity-60`} />
                    {/* Overlay inferior mais escuro para legibilidade */}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
                    {/* Padrão geométrico sutil */}
                    <div className="absolute inset-0 opacity-10" style={{
                      backgroundImage: 'repeating-linear-gradient(45deg, transparent, transparent 30px, rgba(255,255,255,0.1) 30px, rgba(255,255,255,0.1) 31px)',
                    }} />
                    <div className="relative z-10 flex items-start justify-between">
                      <div className="w-12 h-12 rounded-xl bg-white/15 backdrop-blur-sm flex items-center justify-center ring-1 ring-white/20">
                        <item.icon className="w-6 h-6 text-white" />
                      </div>
                      <span className="px-2.5 py-1 rounded-full bg-white/15 backdrop-blur-sm text-[10px] font-bold text-white uppercase tracking-wider ring-1 ring-white/20">{item.tag}</span>
                    </div>
                    <div className="relative z-10 mt-auto">
                      <h4 className="text-white font-bold text-xl mb-1.5 drop-shadow-lg">{item.label}</h4>
                      <p className="text-white/70 text-sm leading-relaxed">{item.desc}</p>
                    </div>
                  </div>
                ))}
              </div>

              {/* Cards Destaque estilo Netflix — Cases de Sucesso */}
              <h3 className="text-sm font-bold text-gray-800 mb-3 flex items-center gap-2">
                <Trophy className="w-4 h-4 text-red-500" /> Cases de Sucesso
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {SUCCESS_CASES.map((item, i) => (
                  <div
                    key={i}
                    className={`group relative overflow-hidden rounded-2xl bg-gradient-to-br ${item.color} p-6 min-h-[200px] flex flex-col justify-end cursor-pointer transition-all duration-300 hover:scale-[1.02] hover:shadow-xl`}
                  >
                    <div className="absolute inset-0 opacity-20">
                      <div className="absolute -top-8 -right-8 w-40 h-40 bg-white rounded-full blur-2xl" />
                    </div>
                    <div className="relative z-10">
                      <span className="text-3xl mb-2 block">{item.emoji}</span>
                      <h4 className="text-white font-bold text-base mb-1">{item.title}</h4>
                      <p className="text-white/80 text-xs leading-relaxed mb-3 line-clamp-2">{item.summary}</p>
                      <div className="flex flex-wrap gap-1.5">
                        {item.results.map((r, ri) => (
                          <span key={ri} className="text-[10px] font-semibold text-white bg-white/15 px-2 py-0.5 rounded-full">{r}</span>
                        ))}
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Search + Quick Filters */}
              <div className="mt-6 bg-white rounded-xl border border-gray-200 shadow-sm p-4">
                <div className="flex flex-col sm:flex-row gap-3">
                  <div className="flex-1 relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <input
                      type="text"
                      placeholder="Buscar experimentos, materiais, cases..."
                      value={searchQuery}
                      onChange={e => setSearchQuery(e.target.value)}
                      className="w-full pl-10 pr-4 py-2.5 rounded-lg border border-gray-200 bg-gray-50 text-sm focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-400 transition-all"
                    />
                    {searchQuery && (
                      <button onClick={() => setSearchQuery('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                        <X className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                  <div className="flex gap-2 flex-wrap">
                    <button onClick={() => setActiveTab('todos')} className={`px-4 py-2 rounded-lg text-xs font-semibold transition-all ${activeTab === 'todos' ? 'bg-red-600 text-white shadow' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}>Todos</button>
                    <button onClick={() => setActiveTab('favoritos')} className={`px-4 py-2 rounded-lg text-xs font-semibold transition-all flex items-center gap-1.5 ${activeTab === 'favoritos' ? 'bg-red-600 text-white shadow' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}><Star className="w-3.5 h-3.5" /> Favoritos ({favorites.size})</button>
                    <button onClick={() => setActiveTab('recentes')} className={`px-4 py-2 rounded-lg text-xs font-semibold transition-all flex items-center gap-1.5 ${activeTab === 'recentes' ? 'bg-red-600 text-white shadow' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}><Clock className="w-3.5 h-3.5" /> Recentes</button>
                  </div>
                </div>
              </div>
            </section>

            {/* ========== SEÇÃO 2: ACESSO RÁPIDO ========== */}
            <section>
              <div className="flex items-center gap-3 mb-5">
                <span className="text-xs font-semibold text-red-600 uppercase tracking-widest bg-red-50 px-3 py-1 rounded-full">Acesso Rápido</span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {acessoRapido.map((item, i) => (
                  <Link
                    key={i}
                    href={item.disabled ? '#' : item.href}
                    className={`group relative flex items-start gap-4 p-5 rounded-xl border transition-all duration-200 ${
                      item.disabled
                        ? 'bg-gray-50 border-gray-100 opacity-60 cursor-not-allowed'
                        : 'bg-white border-gray-200 hover:border-red-200 hover:shadow-lg hover:shadow-red-500/5 hover:-translate-y-0.5'
                    }`}
                    onClick={e => { if (item.disabled) e.preventDefault() }}
                  >
                    <div className={`w-10 h-10 rounded-lg ${item.bg} flex items-center justify-center flex-shrink-0`}>
                      <item.icon className={`w-5 h-5 ${item.color}`} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <h3 className="font-semibold text-sm text-gray-900 group-hover:text-red-700 transition-colors">{item.label}</h3>
                        {item.disabled && <span className="text-[10px] font-semibold text-gray-400 bg-gray-100 px-1.5 py-0.5 rounded">Em breve</span>}
                      </div>
                      <p className="text-xs text-gray-500 mt-0.5 line-clamp-2">{item.desc}</p>
                      <span className="inline-block mt-2 text-[11px] font-medium text-red-600 bg-red-50 px-2 py-0.5 rounded-full">{item.count}</span>
                    </div>
                    <ChevronRight className={`w-4 h-4 mt-1 flex-shrink-0 transition-colors ${item.disabled ? 'text-gray-300' : 'text-gray-400 group-hover:text-red-500'}`} />
                  </Link>
                ))}
              </div>
            </section>

            {/* ========== SEÇÃO 3: JORNADA DE EXPERIMENTAÇÃO ========== */}
            <section>
              <div className="flex items-center gap-3 mb-5">
                <span className="text-xs font-semibold text-red-600 uppercase tracking-widest bg-red-50 px-3 py-1 rounded-full">Jornada de Experimentação</span>
              </div>
              <div className="bg-white rounded-xl border border-gray-200 p-6 sm:p-8">
                <div className="flex flex-wrap items-start justify-between gap-2">
                  {jornada.map((j, i) => (
                    <div key={j.step} className="flex flex-col items-center text-center flex-1 min-w-[80px]">
                      <div className="w-10 h-10 rounded-full bg-gradient-to-br from-red-500 to-red-700 text-white flex items-center justify-center text-sm font-bold shadow-md mb-2">
                        {j.step}
                      </div>
                      <span className="text-xs font-semibold text-gray-800">{j.label}</span>
                      <span className="text-[10px] text-gray-400 mt-0.5 leading-tight max-w-[90px]">{j.desc}</span>
                    </div>
                  ))}
                </div>
                <div className="hidden sm:flex items-center justify-center mt-2 px-4">
                  <div className="h-0.5 flex-1 bg-gradient-to-r from-red-200 via-red-400 to-red-200 rounded-full" />
                </div>
              </div>
            </section>

            {/* ========== SEÇÃO 4: EXPERIMENTOS REALIZADOS ========== */}
            <section>
              <div className="flex items-center justify-between mb-5">
                <div className="flex items-center gap-3">
                  <span className="text-xs font-semibold text-red-600 uppercase tracking-widest bg-red-50 px-3 py-1 rounded-full">Experimentos Realizados</span>
                  <span className="text-xs text-gray-400">{filteredExperimentos.length} de {EXPERIMENTOS_DATA.length} experimentos</span>
                </div>
                <div className="flex items-center gap-2 flex-wrap">
                  <select value={filtroArea} onChange={e => setFiltroArea(e.target.value)} className="text-xs border border-gray-200 rounded-lg px-2.5 py-1.5 bg-white text-gray-600 focus:outline-none focus:ring-2 focus:ring-red-500/20">
                    {areas.map(a => <option key={a} value={a}>{a === 'Todas' ? '🌐 Todas as Áreas' : a}</option>)}
                  </select>
                  <select value={filtroStatus} onChange={e => setFiltroStatus(e.target.value)} className="text-xs border border-gray-200 rounded-lg px-2.5 py-1.5 bg-white text-gray-600 focus:outline-none focus:ring-2 focus:ring-red-500/20">
                    {statuses.map(s => <option key={s} value={s}>{s}</option>)}
                  </select>
                  <select value={filtroComplexidade} onChange={e => setFiltroComplexidade(e.target.value)} className="text-xs border border-gray-200 rounded-lg px-2.5 py-1.5 bg-white text-gray-600 focus:outline-none focus:ring-2 focus:ring-red-500/20">
                    {complexidades.map(c => <option key={c} value={c}>{c === 'Todas' ? '📊 Complexidade' : c}</option>)}
                  </select>
                </div>
              </div>
              <div className="bg-white rounded-xl border border-gray-200 overflow-hidden shadow-sm">
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="bg-gray-50 border-b border-gray-200">
                        <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Experimento</th>
                        <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider hidden sm:table-cell">Área</th>
                        <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider hidden md:table-cell">Complexidade</th>
                        <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Status</th>
                        <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider hidden lg:table-cell">Resultado</th>
                        <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider hidden xl:table-cell">Responsável</th>
                        <th className="text-center px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider w-12">★</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredExperimentos.length === 0 ? (
                        <tr>
                          <td colSpan={7} className="text-center py-12 text-gray-400">
                            <Search className="w-8 h-8 mx-auto mb-2 opacity-50" />
                            <p className="text-sm">Nenhum experimento encontrado</p>
                            <p className="text-xs mt-1">Tente ajustar os filtros ou a busca</p>
                          </td>
                        </tr>
                      ) : (
                        filteredExperimentos.map((exp, i) => (
                          <tr key={i} className="border-b border-gray-100 hover:bg-red-50/30 transition-colors">
                            <td className="px-4 py-3">
                              <div className="flex items-center gap-2">
                                <span className="text-xs text-gray-400 font-mono w-8 flex-shrink-0">#{i + 1}</span>
                                <div>
                                  <p className="font-medium text-gray-900 text-xs leading-tight">{exp.nome}</p>
                                  <p className="text-[10px] text-gray-400 mt-0.5">{exp.categoria} · {exp.tags}</p>
                                </div>
                              </div>
                            </td>
                            <td className="px-4 py-3 hidden sm:table-cell">
                              <span className="text-xs text-gray-600 bg-gray-100 px-2 py-0.5 rounded-full">{exp.area}</span>
                            </td>
                            <td className="px-4 py-3 hidden md:table-cell">
                              <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${
                                exp.complexidade === 'Alta' ? 'bg-red-100 text-red-700' :
                                exp.complexidade === 'Média' ? 'bg-amber-100 text-amber-700' :
                                'bg-green-100 text-green-700'
                              }`}>{exp.complexidade}</span>
                            </td>
                            <td className="px-4 py-3">
                              <span className={`text-[11px] font-medium px-2 py-0.5 rounded-full ${statusColor(exp.status)}`}>{exp.status}</span>
                            </td>
                            <td className="px-4 py-3 hidden lg:table-cell">
                              <span className={`text-[11px] font-medium px-2 py-0.5 rounded-full ${resultadoColor(exp.resultado)}`}>{exp.resultado}</span>
                            </td>
                            <td className="px-4 py-3 hidden xl:table-cell">
                              <span className="text-xs text-gray-600">{exp.responsavel}</span>
                            </td>
                            <td className="px-4 py-3 text-center">
                              <button onClick={() => toggleFavorite(exp.nome)} className={`transition-colors ${favorites.has(exp.nome) ? 'text-amber-500 hover:text-amber-600' : 'text-gray-300 hover:text-amber-400'}`}>
                                <Star className={`w-4 h-4 ${favorites.has(exp.nome) ? 'fill-current' : ''}`} />
                              </button>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </section>

            {/* ========== SEÇÃO 5: CONHECIMENTO COMPARTILHADO ========== */}
            <section>
              <div className="flex items-center gap-3 mb-5">
                <span className="text-xs font-semibold text-red-600 uppercase tracking-widest bg-red-50 px-3 py-1 rounded-full">Conhecimento Compartilhado</span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {filteredKnowledge.map((item, i) => (
                  item.href ? (
                    <Link key={i} href={item.href} className="group bg-white rounded-xl border border-gray-200 p-5 hover:border-red-200 hover:shadow-lg hover:shadow-red-500/5 hover:-translate-y-0.5 transition-all duration-200 cursor-pointer block">
                      <div className="text-2xl mb-3">{item.icon}</div>
                      <span className="text-[10px] font-semibold text-red-600 bg-red-50 px-2 py-0.5 rounded-full">{item.category}</span>
                      <h4 className="font-semibold text-sm text-gray-900 mt-2 group-hover:text-red-700 transition-colors">{item.title}</h4>
                      <p className="text-xs text-gray-500 mt-1 line-clamp-2">{item.desc}</p>
                      <div className="flex items-center gap-2 mt-3 pt-3 border-t border-gray-100">
                        <span className="text-[10px] text-gray-400">{item.author}</span>
                        <span className="text-[10px] text-gray-300">·</span>
                        <span className="text-[10px] text-gray-400">{item.readTime}</span>
                      </div>
                    </Link>
                  ) : (
                    <div key={i} className="group bg-white rounded-xl border border-gray-200 p-5 hover:border-red-200 hover:shadow-lg hover:shadow-red-500/5 hover:-translate-y-0.5 transition-all duration-200 cursor-pointer">
                      <div className="text-2xl mb-3">{item.icon}</div>
                      <span className="text-[10px] font-semibold text-red-600 bg-red-50 px-2 py-0.5 rounded-full">{item.category}</span>
                      <h4 className="font-semibold text-sm text-gray-900 mt-2 group-hover:text-red-700 transition-colors">{item.title}</h4>
                      <p className="text-xs text-gray-500 mt-1 line-clamp-2">{item.desc}</p>
                      <div className="flex items-center gap-2 mt-3 pt-3 border-t border-gray-100">
                        <span className="text-[10px] text-gray-400">{item.author}</span>
                        <span className="text-[10px] text-gray-300">·</span>
                        <span className="text-[10px] text-gray-400">{item.readTime}</span>
                      </div>
                    </div>
                  )
                ))}
              </div>
            </section>

            {/* ========== SEÇÃO 6: CASOS DE SUCESSO ========== */}
            <section>
              <div className="flex items-center gap-3 mb-5">
                <span className="text-xs font-semibold text-red-600 uppercase tracking-widest bg-red-50 px-3 py-1 rounded-full">Casos de Sucesso</span>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                {filteredSuccessCases.map((item, i) => (
                  <div key={i} className="group bg-white rounded-xl border border-gray-200 overflow-hidden hover:shadow-xl hover:-translate-y-1 transition-all duration-300">
                    <div className={`bg-gradient-to-r ${item.color} p-5 text-white`}>
                      <span className="text-3xl">{item.emoji}</span>
                      <h4 className="font-bold text-base mt-2 leading-tight">{item.title}</h4>
                    </div>
                    <div className="p-5">
                      <p className="text-xs text-gray-600 leading-relaxed mb-4">{item.summary}</p>
                      <div className="space-y-2">
                        {item.results.map((r, j) => (
                          <div key={j} className="flex items-center gap-2 text-xs">
                            <Trophy className="w-3.5 h-3.5 text-amber-500 flex-shrink-0" />
                            <span className="font-medium text-gray-800">{r}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </section>

            {/* ========== SEÇÃO 7: INDICADORES DA COMUNIDADE ========== */}
            <section>
              <div className="flex items-center gap-3 mb-5">
                <span className="text-xs font-semibold text-red-600 uppercase tracking-widest bg-red-50 px-3 py-1 rounded-full">Indicadores da Comunidade</span>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
                {indicadores.map((ind, i) => (
                  <div key={i} className="bg-white rounded-xl border border-gray-200 p-4 hover:border-red-200 hover:shadow-md transition-all duration-200">
                    <div className={`w-8 h-8 rounded-lg ${ind.bg} flex items-center justify-center mb-2`}>
                      <ind.icon className={`w-4 h-4 ${ind.color}`} />
                    </div>
                    <p className="text-2xl font-bold text-gray-900">{ind.value}</p>
                    <p className="text-[10px] text-gray-500 mt-0.5 leading-tight">{ind.label}</p>
                  </div>
                ))}
              </div>
            </section>

            {/* ========== SEÇÃO 8: CONTEÚDOS EM DESTAQUE ========== */}
            <section>
              <div className="flex items-center gap-3 mb-5">
                <span className="text-xs font-semibold text-red-600 uppercase tracking-widest bg-red-50 px-3 py-1 rounded-full">Conteúdos em Destaque</span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {destaques.map((item, i) => (
                  <div key={i} className="group bg-white rounded-xl border border-gray-200 overflow-hidden hover:shadow-lg hover:-translate-y-0.5 transition-all duration-200 cursor-pointer">
                    <div className={`bg-gradient-to-r ${item.color} p-4 text-white`}>
                      <div className="flex items-center justify-between">
                        <item.icon className="w-5 h-5" />
                        <span className="text-[10px] font-bold bg-white/20 px-2 py-0.5 rounded-full">{item.tag}</span>
                      </div>
                    </div>
                    <div className="p-4">
                      <h4 className="font-semibold text-sm text-gray-900 group-hover:text-red-700 transition-colors">{item.label}</h4>
                      <p className="text-xs text-gray-500 mt-1">{item.desc}</p>
                      <div className="flex items-center gap-1 mt-3 text-xs font-medium text-red-600 group-hover:gap-2 transition-all">
                        Explorar <ArrowUpRight className="w-3 h-3" />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </section>

          </div>
        </div>
      </main>
    </div>
  )
}