'use client'

import { useState } from 'react'
import Link from 'next/link'
import Sidebar from '@/components/layout/Sidebar'
import LogoutButton from '@/components/layout/LogoutButton'
import {
  ArrowLeft, Lightbulb, Target, FlaskConical, CheckCircle2, XCircle,
  TrendingUp, BookOpen, ChevronRight, AlertTriangle, Sparkles,
  ClipboardCheck, BarChart3, Zap, PenTool, Search, Layers, ArrowRight,
  Download, Share2, ThumbsUp, MessageSquare, Eye, Clock, User, FileText,
} from 'lucide-react'

export default function FrameworkHipotesesPage() {
  const [activeStep, setActiveStep] = useState(0)

  const steps = [
    { id: 0, title: 'O Problema', icon: Search },
    { id: 1, title: 'A Observação', icon: Eye },
    { id: 2, title: 'A Pergunta', icon: Lightbulb },
    { id: 3, title: 'A Hipótese', icon: FlaskConical },
    { id: 4, title: 'As Métricas', icon: BarChart3 },
    { id: 5, title: 'A Validação', icon: ClipboardCheck },
  ]

  return (
    <div className="flex min-h-dvh bg-slate-50">
      <Sidebar />

      <div className="flex-1 flex flex-col lg:ml-[72px] min-w-0">
        {/* Header */}
        <header className="sticky top-0 z-30 bg-white/90 backdrop-blur-sm border-b border-slate-200 px-4 sm:px-6 lg:px-8 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Link href="/comunidade" className="flex items-center gap-2 text-slate-500 hover:text-slate-700 transition-colors">
                <ArrowLeft className="w-4 h-4" />
                <span className="text-sm">Comunidade</span>
              </Link>
              <span className="text-slate-300">/</span>
              <span className="text-sm font-medium text-slate-700">Framework de Hipóteses</span>
            </div>
            <LogoutButton />
          </div>
        </header>

        <div className="flex-1 overflow-y-auto">
          <div className="px-4 sm:px-6 lg:px-8 py-8">

            {/* HERO */}
            <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-red-600 via-red-700 to-red-900 p-8 sm:p-12 text-white mb-10">
              <div className="absolute inset-0 opacity-10">
                <div className="absolute top-0 right-0 w-96 h-96 bg-white rounded-full blur-3xl" />
                <div className="absolute bottom-0 left-0 w-64 h-64 bg-white rounded-full blur-3xl" />
              </div>
              <div className="relative z-10 max-w-3xl">
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/20 text-xs font-semibold tracking-wider uppercase mb-4">
                  <BookOpen className="w-3 h-3" /> Guia Completo
                </span>
                <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold mb-4 leading-tight">
                  Como Construir uma Hipótese do Zero
                </h1>
                <p className="text-red-100 text-base sm:text-lg leading-relaxed mb-6 max-w-2xl">
                  Um guia passo a passo para formular hipóteses testáveis usando método científico.
                  Aprenda a transformar ideias em experimentos estruturados que geram resultados mensuráveis.
                </p>
                <div className="flex flex-wrap items-center gap-4 text-sm text-red-100">
                  <span className="flex items-center gap-1.5"><Clock className="w-4 h-4" /> 15 min de leitura</span>
                  <span className="flex items-center gap-1.5"><User className="w-4 h-4" /> Por Daniel França</span>
                  <span className="flex items-center gap-1.5"><Layers className="w-4 h-4" /> 6 etapas</span>
                </div>
              </div>
            </div>

            {/* STEP NAVIGATION */}
            <div className="flex gap-2 overflow-x-auto pb-4 mb-10">
              {steps.map((step) => (
                <button
                  key={step.id}
                  onClick={() => setActiveStep(step.id)}
                  className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-all ${
                    activeStep === step.id
                      ? 'bg-red-600 text-white shadow-lg shadow-red-500/25'
                      : 'bg-white text-slate-600 border border-slate-200 hover:border-red-200 hover:text-red-600'
                  }`}
                >
                  <step.icon className="w-4 h-4" />
                  {step.title}
                </button>
              ))}
            </div>

            <div className="max-w-4xl">

              {/* ========== ETAPA 1: O PROBLEMA ========== */}
              {activeStep === 0 && (
                <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
                  <div className="flex items-center gap-3 mb-2">
                    <div className="w-10 h-10 rounded-xl bg-red-100 flex items-center justify-center">
                      <Search className="w-5 h-5 text-red-600" />
                    </div>
                    <div>
                      <span className="text-xs font-bold text-red-600 uppercase tracking-wider">Etapa 1 de 6</span>
                      <h2 className="text-2xl sm:text-3xl font-bold text-slate-800">Identifique o Problema</h2>
                    </div>
                  </div>

                  <div className="bg-white rounded-xl border border-slate-200 p-6 sm:p-8 space-y-5">
                    <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 flex items-start gap-3">
                      <AlertTriangle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
                      <div>
                        <p className="text-sm font-semibold text-amber-800 mb-1">Princípio Fundamental</p>
                        <p className="text-sm text-amber-700">
                          Toda hipótese começa com um problema real. Sem um problema bem definido, sua hipótese será frágil e seu experimento não terá direção.
                        </p>
                      </div>
                    </div>

                    <h3 className="text-lg font-bold text-slate-800">O que é um &quot;problema&quot; no contexto de experimentação?</h3>
                    <p className="text-slate-600 leading-relaxed">
                      Um problema é uma <strong>lacuna entre o estado atual e o estado desejado</strong>. Pode ser uma dor do cliente, uma ineficiência operacional, uma oportunidade de receita não capturada, ou qualquer situação onde você acredita que pode haver uma melhoria significativa.
                    </p>

                    <div className="bg-slate-50 rounded-xl p-5 border border-slate-200">
                      <h4 className="font-bold text-slate-800 mb-3 flex items-center gap-2">
                        <Zap className="w-4 h-4 text-red-500" /> Exemplos de Bons Problemas
                      </h4>
                      <ul className="space-y-2">
                        {[
                          'Clientes abandonam o carrinho de compras em 70% dos casos no app',
                          'O tempo médio de atendimento (TMA) no call center aumentou 25% no último trimestre',
                          '30% dos chamados técnicos são resolvidos apenas na segunda visita do técnico',
                          'A taxa de conversão da campanha de marketing está 40% abaixo da meta',
                        ].map((ex, i) => (
                          <li key={i} className="flex items-start gap-2 text-sm text-slate-700">
                            <span className="text-red-500 mt-0.5">•</span> {ex}
                          </li>
                        ))}
                      </ul>
                    </div>

                    <div className="bg-red-50 rounded-xl p-5 border border-red-200">
                      <h4 className="font-bold text-red-800 mb-3 flex items-center gap-2">
                        <XCircle className="w-4 h-4" /> Problemas Mal Definidos (Evite!)
                      </h4>
                      <ul className="space-y-2">
                        {[
                          '"Precisamos de IA em algum lugar" — vago, sem foco, sem métrica',
                          '"O sistema está lento" — sem quantificação, sem contexto',
                          '"Vamos inovar" — não é um problema, é uma intenção',
                          '"O cliente não está satisfeito" — como você sabe? Qual a evidência?',
                        ].map((ex, i) => (
                          <li key={i} className="flex items-start gap-2 text-sm text-red-700">
                            <span className="text-red-400 mt-0.5">•</span> {ex}
                          </li>
                        ))}
                      </ul>
                    </div>

                    <h3 className="text-lg font-bold text-slate-800">Ferramenta: Canvas de Definição do Problema</h3>
                    <div className="overflow-x-auto">
                      <table className="w-full text-sm border-collapse">
                        <thead>
                          <tr className="bg-slate-100">
                            <th className="border border-slate-200 p-3 text-left font-semibold text-slate-700">Dimensão</th>
                            <th className="border border-slate-200 p-3 text-left font-semibold text-slate-700">Pergunta</th>
                            <th className="border border-slate-200 p-3 text-left font-semibold text-slate-700">Exemplo</th>
                          </tr>
                        </thead>
                        <tbody>
                          {[
                            ['O QUÊ', 'Qual é exatamente o problema?', 'TMA 40% acima da meta'],
                            ['QUEM', 'Quem é impactado?', 'Clientes do segmento empresarial'],
                            ['QUANTO', 'Qual a magnitude? (dados!)', '+R$ 500K/ano em custo operacional'],
                            ['ONDE', 'Em qual contexto ocorre?', 'Call center — 1º nível de atendimento'],
                            ['DESDE QUANDO', 'Há quanto tempo existe?', '6 meses, agravando nos últimos 2'],
                          ].map((row, i) => (
                            <tr key={i} className={i % 2 === 0 ? '' : 'bg-slate-50'}>
                              <td className="border border-slate-200 p-3 font-medium text-slate-700">{row[0]}</td>
                              <td className="border border-slate-200 p-3 text-slate-600">{row[1]}</td>
                              <td className="border border-slate-200 p-3 text-slate-600">{row[2]}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>

                    <div className="bg-gradient-to-r from-red-50 to-amber-50 rounded-xl p-5 border border-red-100">
                      <p className="text-sm font-bold text-red-800 mb-2">✅ Checklist da Etapa 1</p>
                      <ul className="space-y-1.5 text-sm text-slate-700">
                        {[
                          'O problema está descrito em uma frase clara?',
                          'Há dados quantitativos que comprovam a existência do problema?',
                          'Você consegue identificar quem é impactado?',
                          'A magnitude do problema justifica um experimento?',
                          'O problema está delimitado no tempo e no espaço?',
                        ].map((item, i) => (
                          <li key={i} className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-green-500 flex-shrink-0" /> {item}</li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </div>
              )}

              {/* ========== ETAPA 2: A OBSERVAÇÃO ========== */}
              {activeStep === 1 && (
                <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
                  <div className="flex items-center gap-3 mb-2">
                    <div className="w-10 h-10 rounded-xl bg-blue-100 flex items-center justify-center">
                      <Eye className="w-5 h-5 text-blue-600" />
                    </div>
                    <div>
                      <span className="text-xs font-bold text-blue-600 uppercase tracking-wider">Etapa 2 de 6</span>
                      <h2 className="text-2xl sm:text-3xl font-bold text-slate-800">Observe e Colete Evidências</h2>
                    </div>
                  </div>

                  <div className="bg-white rounded-xl border border-slate-200 p-6 sm:p-8 space-y-5">
                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 flex items-start gap-3">
                      <Eye className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
                      <div>
                        <p className="text-sm font-semibold text-blue-800 mb-1">Princípio Fundamental</p>
                        <p className="text-sm text-blue-700">
                          Antes de formular qualquer hipótese, você precisa entender profundamente o contexto do problema. Observação sem viés é a base do método científico.
                        </p>
                      </div>
                    </div>

                    <h3 className="text-lg font-bold text-slate-800">Os 3 Tipos de Evidência que Você Precisa</h3>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      {[
                        {
                          title: '📊 Dados Quantitativos',
                          items: ['Métricas de sistema', 'Relatórios financeiros', 'Logs e telemetria', 'Pesquisas com escala Likert', 'Análise de séries temporais'],
                          color: 'border-blue-200 bg-blue-50',
                        },
                        {
                          title: '🗣️ Dados Qualitativos',
                          items: ['Entrevistas com usuários', 'Sessões de observação', 'Feedback de stakeholders', 'Análise de reclamações', 'Grupos focais'],
                          color: 'border-green-200 bg-green-50',
                        },
                        {
                          title: '🔍 Benchmarks',
                          items: ['Concorrentes diretos', 'Mercados análogos', 'Literatura acadêmica', 'Cases de outras indústrias', 'Dados de consultorias'],
                          color: 'border-purple-200 bg-purple-50',
                        },
                      ].map((col, i) => (
                        <div key={i} className={`rounded-xl p-4 border ${col.color}`}>
                          <h4 className="font-bold text-sm text-slate-800 mb-2">{col.title}</h4>
                          <ul className="space-y-1">
                            {col.items.map((item, j) => (
                              <li key={j} className="text-xs text-slate-600 flex items-start gap-1.5">
                                <span className="text-slate-400 mt-0.5">•</span> {item}
                              </li>
                            ))}
                          </ul>
                        </div>
                      ))}
                    </div>

                    <h3 className="text-lg font-bold text-slate-800">Técnica: Os 5 Porquês</h3>
                    <p className="text-slate-600 leading-relaxed">
                      Uma técnica simples mas poderosa para ir da superfície até a causa raiz. Para cada resposta, pergunte &quot;por quê?&quot; novamente — até 5 vezes.
                    </p>

                    <div className="bg-slate-50 rounded-xl p-5 border border-slate-200">
                      <h4 className="font-bold text-slate-800 mb-3">Exemplo Prático: TMA Elevado no Call Center</h4>
                      <div className="space-y-3">
                        {[
                          { q: '1. Por que o TMA está alto?', a: 'Porque os atendentes passam muito tempo buscando informações.' },
                          { q: '2. Por que passam muito tempo buscando informações?', a: 'Porque os sistemas não são integrados e exigem múltiplas consultas.' },
                          { q: '3. Por que os sistemas não são integrados?', a: 'Porque cada área comprou seu próprio sistema sem governança central.' },
                          { q: '4. Por que não há governança central?', a: 'Porque a TI nunca priorizou a integração de canais de atendimento.' },
                          { q: '5. Por que a TI nunca priorizou isso?', a: 'Porque não havia métricas que demonstrassem o impacto financeiro da falta de integração.' },
                        ].map((item, i) => (
                          <div key={i} className="text-sm">
                            <p className="font-semibold text-slate-700">{item.q}</p>
                            <p className="text-slate-600 ml-4 mt-0.5">→ {item.a}</p>
                          </div>
                        ))}
                      </div>
                      <div className="mt-4 p-3 bg-green-50 border border-green-200 rounded-lg">
                        <p className="text-sm font-bold text-green-800">🔎 Causa Raiz Identificada:</p>
                        <p className="text-sm text-green-700 mt-1">
                          Falta de visibilidade do impacto financeiro da desintegração de sistemas — não é um problema técnico, é um problema de gestão e métricas.
                        </p>
                      </div>
                    </div>

                    <div className="bg-gradient-to-r from-blue-50 to-cyan-50 rounded-xl p-5 border border-blue-100">
                      <p className="text-sm font-bold text-blue-800 mb-2">✅ Checklist da Etapa 2</p>
                      <ul className="space-y-1.5 text-sm text-slate-700">
                        {[
                          'Você coletou dados quantitativos sobre o problema?',
                          'Você ouviu pelo menos 3 pessoas impactadas pelo problema?',
                          'Você identificou a causa raiz (não apenas os sintomas)?',
                          'Você documentou as evidências de forma que outros possam revisar?',
                          'Você eliminou vieses de confirmação? (procurou dados que contradizem sua intuição?)',
                        ].map((item, i) => (
                          <li key={i} className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-green-500 flex-shrink-0" /> {item}</li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </div>
              )}

              {/* ========== ETAPA 3: A PERGUNTA ========== */}
              {activeStep === 2 && (
                <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
                  <div className="flex items-center gap-3 mb-2">
                    <div className="w-10 h-10 rounded-xl bg-purple-100 flex items-center justify-center">
                      <Lightbulb className="w-5 h-5 text-purple-600" />
                    </div>
                    <div>
                      <span className="text-xs font-bold text-purple-600 uppercase tracking-wider">Etapa 3 de 6</span>
                      <h2 className="text-2xl sm:text-3xl font-bold text-slate-800">Formule a Pergunta Certa</h2>
                    </div>
                  </div>

                  <div className="bg-white rounded-xl border border-slate-200 p-6 sm:p-8 space-y-5">
                    <div className="bg-purple-50 border border-purple-200 rounded-lg p-4 flex items-start gap-3">
                      <Lightbulb className="w-5 h-5 text-purple-600 flex-shrink-0 mt-0.5" />
                      <div>
                        <p className="text-sm font-semibold text-purple-800 mb-1">Princípio Fundamental</p>
                        <p className="text-sm text-purple-700">
                          Uma boa pergunta de pesquisa é específica, mensurável e acionável. A qualidade da sua pergunta determina a qualidade do seu experimento.
                        </p>
                      </div>
                    </div>

                    <h3 className="text-lg font-bold text-slate-800">A Estrutura PICOT</h3>
                    <p className="text-slate-600 leading-relaxed">
                      Originada na medicina baseada em evidências, a estrutura PICOT é uma ferramenta poderosa para transformar problemas vagos em perguntas de pesquisa precisas.
                    </p>

                    <div className="overflow-x-auto">
                      <table className="w-full text-sm border-collapse">
                        <thead>
                          <tr className="bg-slate-100">
                            <th className="border border-slate-200 p-3 text-left font-semibold text-slate-700">Letra</th>
                            <th className="border border-slate-200 p-3 text-left font-semibold text-slate-700">Significado</th>
                            <th className="border border-slate-200 p-3 text-left font-semibold text-slate-700">Pergunta-chave</th>
                            <th className="border border-slate-200 p-3 text-left font-semibold text-slate-700">Exemplo</th>
                          </tr>
                        </thead>
                        <tbody>
                          {[
                            ['P', 'População / Problema', 'Quem ou o que é afetado?', 'Atendentes do call center nível 1'],
                            ['I', 'Intervenção', 'O que você vai fazer?', 'Assistente IA que unifica consultas em uma tela'],
                            ['C', 'Comparação', 'Com o que você compara?', 'Processo atual (múltiplas consultas manuais)'],
                            ['O', 'Outcome (Desfecho)', 'O que você espera melhorar?', 'Redução de 30% no TMA'],
                            ['T', 'Tempo', 'Em quanto tempo?', '4 semanas após implementação'],
                          ].map((row, i) => (
                            <tr key={i} className={i % 2 === 0 ? '' : 'bg-slate-50'}>
                              <td className="border border-slate-200 p-3 font-medium text-slate-700">{row[0]}</td>
                              <td className="border border-slate-200 p-3 text-slate-600">{row[1]}</td>
                              <td className="border border-slate-200 p-3 text-slate-600">{row[2]}</td>
                              <td className="border border-slate-200 p-3 text-slate-600">{row[3]}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>

                    <div className="p-4 bg-purple-50 border border-purple-200 rounded-lg">
                      <p className="text-sm font-semibold text-purple-800 mb-2">Pergunta PICOT completa:</p>
                      <p className="text-sm text-purple-700 italic">
                        &quot;Em <strong>atendentes de call center nível 1 (P)</strong>, a implantação de um <strong>assistente IA que unifica consultas (I)</strong>, comparado ao <strong>processo atual de múltiplas consultas manuais (C)</strong>, reduz o <strong>TMA em 30% (O)</strong> em um período de <strong>4 semanas (T)</strong>?&quot;
                      </p>
                    </div>

                    <div className="bg-gradient-to-r from-purple-50 to-pink-50 rounded-xl p-5 border border-purple-100">
                      <p className="text-sm font-bold text-purple-800 mb-2">✅ Checklist da Etapa 3</p>
                      <ul className="space-y-1.5 text-sm text-slate-700">
                        {[
                          'Sua pergunta é específica o suficiente para ser testada?',
                          'Você consegue medir o resultado?',
                          'A pergunta está livre de vieses? (não sugere a resposta)',
                          'A pergunta é relevante para o negócio?',
                          'Você definiu claramente com o que vai comparar?',
                        ].map((item, i) => (
                          <li key={i} className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-green-500 flex-shrink-0" /> {item}</li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </div>
              )}

              {/* ========== ETAPA 4: A HIPÓTESE ========== */}
              {activeStep === 3 && (
                <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
                  <div className="flex items-center gap-3 mb-2">
                    <div className="w-10 h-10 rounded-xl bg-green-100 flex items-center justify-center">
                      <FlaskConical className="w-5 h-5 text-green-600" />
                    </div>
                    <div>
                      <span className="text-xs font-bold text-green-600 uppercase tracking-wider">Etapa 4 de 6</span>
                      <h2 className="text-2xl sm:text-3xl font-bold text-slate-800">Escreva a Hipótese</h2>
                    </div>
                  </div>

                  <div className="bg-white rounded-xl border border-slate-200 p-6 sm:p-8 space-y-5">
                    <div className="bg-green-50 border border-green-200 rounded-lg p-4 flex items-start gap-3">
                      <FlaskConical className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                      <div>
                        <p className="text-sm font-semibold text-green-800 mb-1">Princípio Fundamental</p>
                        <p className="text-sm text-green-700">
                          Uma hipótese é uma afirmação testável que prevê uma relação de causa e efeito. Não é um palpite — é uma proposição fundamentada em evidências.
                        </p>
                      </div>
                    </div>

                    <h3 className="text-lg font-bold text-slate-800">A Fórmula de Ouro: SE → ENTÃO → PORQUE</h3>
                    <p className="text-slate-600 leading-relaxed">
                      Toda hipótese bem formulada segue esta estrutura de três partes. Ela conecta a ação (SE), o resultado esperado (ENTÃO) e a lógica por trás (PORQUE).
                    </p>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      {[
                        { label: '🔵 SE (Ação)', desc: 'O que você vai fazer. A intervenção, a mudança, o tratamento.', example: 'SE implantarmos um assistente IA que unifica as consultas em uma única tela...' },
                        { label: '🟢 ENTÃO (Resultado)', desc: 'O que você espera que aconteça. Deve ser mensurável.', example: 'ENTÃO o TMA reduzirá em pelo menos 30%...' },
                        { label: '🟡 PORQUE (Lógica)', desc: 'Por que você acredita nisso. A teoria ou evidência que sustenta.', example: 'PORQUE os atendentes não precisarão alternar entre 5 sistemas diferentes para cada atendimento.' },
                      ].map((col, i) => (
                        <div key={i} className="bg-slate-50 rounded-xl p-4 border border-slate-200">
                          <h4 className="font-bold text-sm text-slate-800 mb-2">{col.label}</h4>
                          <p className="text-xs text-slate-600 mb-3">{col.desc}</p>
                          <p className="text-xs text-slate-500 italic bg-white p-2 rounded border border-slate-100">&quot;{col.example}&quot;</p>
                        </div>
                      ))}
                    </div>

                    <div className="p-5 bg-gradient-to-r from-green-50 to-emerald-50 rounded-xl border border-green-200">
                      <h4 className="font-bold text-green-800 mb-3">Hipótese Completa (Exemplo)</h4>
                      <p className="text-sm text-green-700 leading-relaxed">
                        <strong>SE</strong> implantarmos um assistente IA que unifica as consultas em uma única tela para atendentes de call center nível 1, <strong>ENTÃO</strong> o TMA reduzirá em pelo menos 30% em 4 semanas, <strong>PORQUE</strong> os atendentes não precisarão alternar entre 5 sistemas diferentes para cada atendimento, eliminando o tempo de troca de contexto.
                      </p>
                    </div>

                    <h3 className="text-lg font-bold text-slate-800">Boa Hipótese vs. Hipótese Fraca</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="bg-green-50 rounded-xl p-4 border border-green-200">
                        <h4 className="font-bold text-green-800 mb-2 flex items-center gap-1.5"><CheckCircle2 className="w-4 h-4" /> Boa Hipótese</h4>
                        <ul className="space-y-1.5 text-sm text-green-700">
                          <li>• Específica e testável</li>
                          <li>• Resultado mensurável</li>
                          <li>• Lógica clara e fundamentada</li>
                          <li>• Prazo definido</li>
                          <li>• Pode ser falseada (provada errada)</li>
                        </ul>
                      </div>
                      <div className="bg-red-50 rounded-xl p-4 border border-red-200">
                        <h4 className="font-bold text-red-800 mb-2 flex items-center gap-1.5"><XCircle className="w-4 h-4" /> Hipótese Fraca</h4>
                        <ul className="space-y-1.5 text-sm text-red-700">
                          <li>• &quot;IA vai melhorar o atendimento&quot;</li>
                          <li>• &quot;Vamos ver o que acontece&quot;</li>
                          <li>• Sem mecanismo causal</li>
                          <li>• Sem prazo ou métrica</li>
                          <li>• Não pode ser provada errada</li>
                        </ul>
                      </div>
                    </div>

                    <div className="bg-gradient-to-r from-green-50 to-emerald-50 rounded-xl p-5 border border-green-100">
                      <p className="text-sm font-bold text-green-800 mb-2">✅ Checklist da Etapa 4</p>
                      <ul className="space-y-1.5 text-sm text-slate-700">
                        {[
                          'Sua hipótese segue a estrutura SE → ENTÃO → PORQUE?',
                          'O resultado é mensurável? (números, não opiniões)',
                          'A lógica (PORQUE) é baseada em evidências, não em achismos?',
                          'Sua hipótese pode ser provada falsa? (falseabilidade)',
                          'Alguém que não conhece o projeto consegue entender sua hipótese?',
                        ].map((item, i) => (
                          <li key={i} className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-green-500 flex-shrink-0" /> {item}</li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </div>
              )}

              {/* ========== ETAPA 5: AS MÉTRICAS ========== */}
              {activeStep === 4 && (
                <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
                  <div className="flex items-center gap-3 mb-2">
                    <div className="w-10 h-10 rounded-xl bg-orange-100 flex items-center justify-center">
                      <BarChart3 className="w-5 h-5 text-orange-600" />
                    </div>
                    <div>
                      <span className="text-xs font-bold text-orange-600 uppercase tracking-wider">Etapa 5 de 6</span>
                      <h2 className="text-2xl sm:text-3xl font-bold text-slate-800">Defina as Métricas de Sucesso</h2>
                    </div>
                  </div>

                  <div className="bg-white rounded-xl border border-slate-200 p-6 sm:p-8 space-y-5">
                    <div className="bg-orange-50 border border-orange-200 rounded-lg p-4 flex items-start gap-3">
                      <BarChart3 className="w-5 h-5 text-orange-600 flex-shrink-0 mt-0.5" />
                      <div>
                        <p className="text-sm font-semibold text-orange-800 mb-1">Princípio Fundamental</p>
                        <p className="text-sm text-orange-700">
                          Se você não sabe como medir o sucesso, você não sabe se teve sucesso. Defina métricas ANTES de começar o experimento, nunca depois.
                        </p>
                      </div>
                    </div>

                    <h3 className="text-lg font-bold text-slate-800">Os 4 Tipos de Métricas que Você Precisa</h3>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      {[
                        {
                          title: '📊 Métrica Primária',
                          desc: 'O indicador principal. É a métrica que define se o experimento foi bem-sucedido.',
                          example: 'Redução de 30% no TMA',
                          color: 'border-orange-200 bg-orange-50',
                        },
                        {
                          title: '📋 Métricas Secundárias',
                          desc: 'Indicadores complementares que ajudam a entender efeitos colaterais.',
                          example: 'CSAT, NPS, taxa de resolução no primeiro contato',
                          color: 'border-blue-200 bg-blue-50',
                        },
                        {
                          title: '⚖️ Métricas de Guarda (Guardrails)',
                          desc: 'Métricas que NÃO podem piorar. Se piorarem, o experimento deve ser interrompido.',
                          example: 'Taxa de erro não pode aumentar; receita não pode cair',
                          color: 'border-red-200 bg-red-50',
                        },
                        {
                          title: '🔍 Métricas de Diagnóstico',
                          desc: 'Ajudam a entender o PORQUÊ do resultado, independente de ser positivo ou negativo.',
                          example: 'Tempo por tela, número de cliques por atendimento',
                          color: 'border-purple-200 bg-purple-50',
                        },
                      ].map((col, i) => (
                        <div key={i} className={`rounded-xl p-4 border ${col.color}`}>
                          <h4 className="font-bold text-sm text-slate-800 mb-1">{col.title}</h4>
                          <p className="text-xs text-slate-600 mb-2">{col.desc}</p>
                          <p className="text-xs font-mono bg-white p-2 rounded border border-slate-100 text-slate-700">{col.example}</p>
                        </div>
                      ))}
                    </div>

                    <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 flex items-start gap-3">
                      <AlertTriangle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
                      <div>
                        <p className="text-sm font-semibold text-amber-800 mb-1">Armadilha Comum</p>
                        <p className="text-sm text-amber-700">
                          Não confunda métricas de <strong>vaidade</strong> (page views, downloads, curtidas) com métricas de <strong>resultado</strong> (receita, retenção, eficiência). Métricas de vaidade sobem fácil mas não significam sucesso real.
                        </p>
                      </div>
                    </div>

                    <div className="bg-gradient-to-r from-orange-50 to-amber-50 rounded-xl p-5 border border-orange-100">
                      <p className="text-sm font-bold text-orange-800 mb-2">✅ Checklist da Etapa 5</p>
                      <ul className="space-y-1.5 text-sm text-slate-700">
                        {[
                          'Você definiu UMA métrica primária clara?',
                          'Você sabe exatamente como vai medir cada métrica?',
                          'Você definiu métricas de guarda (o que não pode piorar)?',
                          'Os dados necessários estão disponíveis e são confiáveis?',
                          'Você estabeleceu a linha de base (baseline) antes de começar?',
                        ].map((item, i) => (
                          <li key={i} className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-green-500 flex-shrink-0" /> {item}</li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </div>
              )}

              {/* ========== ETAPA 6: A VALIDAÇÃO ========== */}
              {activeStep === 5 && (
                <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
                  <div className="flex items-center gap-3 mb-2">
                    <div className="w-10 h-10 rounded-xl bg-cyan-100 flex items-center justify-center">
                      <ClipboardCheck className="w-5 h-5 text-cyan-600" />
                    </div>
                    <div>
                      <span className="text-xs font-bold text-cyan-600 uppercase tracking-wider">Etapa 6 de 6</span>
                      <h2 className="text-2xl sm:text-3xl font-bold text-slate-800">Valide, Aprenda e Itere</h2>
                    </div>
                  </div>

                  <div className="bg-white rounded-xl border border-slate-200 p-6 sm:p-8 space-y-5">
                    <div className="bg-cyan-50 border border-cyan-200 rounded-lg p-4 flex items-start gap-3">
                      <ClipboardCheck className="w-5 h-5 text-cyan-600 flex-shrink-0 mt-0.5" />
                      <div>
                        <p className="text-sm font-semibold text-cyan-800 mb-1">Princípio Fundamental</p>
                        <p className="text-sm text-cyan-700">
                          O objetivo de um experimento não é &quot;dar certo&quot; — é gerar aprendizado. Um experimento que &quot;falha&quot; mas gera insights valiosos é um sucesso. Um experimento que &quot;dá certo&quot; mas não ensina nada é um desperdício.
                        </p>
                      </div>
                    </div>

                    <h3 className="text-lg font-bold text-slate-800">Os 4 Resultados Possíveis de um Experimento</h3>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      {[
                        {
                          icon: CheckCircle2,
                          title: '✅ Hipótese Confirmada',
                          desc: 'Os dados mostram que sua intervenção causou o efeito previsto. A hipótese era correta.',
                          action: 'Escale! Amplie o escopo, documente e compartilhe.',
                          color: 'border-green-200 bg-green-50',
                        },
                        {
                          icon: XCircle,
                          title: '❌ Hipótese Refutada',
                          desc: 'Os dados mostram que a intervenção NÃO teve o efeito previsto. A hipótese estava errada.',
                          action: 'Aprenda! Entenda o porquê, documente os insights, pivote.',
                          color: 'border-red-200 bg-red-50',
                        },
                        {
                          icon: AlertTriangle,
                          title: '⚠️ Resultado Inconclusivo',
                          desc: 'Os dados não são suficientes para confirmar nem refutar. Pode ser falta de amostra ou tempo.',
                          action: 'Estenda! Aumente a amostra ou o tempo de observação.',
                          color: 'border-amber-200 bg-amber-50',
                        },
                        {
                          icon: TrendingUp,
                          title: '🔄 Efeito Inesperado',
                          desc: 'A métrica primária não mudou, mas uma métrica secundária teve melhoria significativa.',
                          action: 'Investigue! Pode haver uma oportunidade que você não previu.',
                          color: 'border-blue-200 bg-blue-50',
                        },
                      ].map((col, i) => (
                        <div key={i} className={`rounded-xl p-4 border ${col.color}`}>
                          <div className="flex items-center gap-2 mb-2">
                            <col.icon className="w-5 h-5 text-slate-700" />
                            <h4 className="font-bold text-sm text-slate-800">{col.title}</h4>
                          </div>
                          <p className="text-xs text-slate-600 mb-2">{col.desc}</p>
                          <p className="text-xs font-semibold text-slate-700 bg-white p-2 rounded border border-slate-100">🎯 Ação: {col.action}</p>
                        </div>
                      ))}
                    </div>

                    <h3 className="text-lg font-bold text-slate-800">O Ciclo de Aprendizado</h3>
                    <div className="bg-slate-50 rounded-xl p-5 border border-slate-200">
                      <div className="flex items-center justify-center gap-2 sm:gap-4 flex-wrap">
                        {['Problema', 'Observação', 'Pergunta', 'Hipótese', 'Experimento', 'Resultado'].map((label, i) => (
                          <div key={i} className="flex items-center gap-2">
                            <div className="w-10 h-10 rounded-full bg-red-600 text-white flex items-center justify-center text-xs font-bold">{i + 1}</div>
                            <span className="text-xs font-medium text-slate-700">{label}</span>
                            {i < 5 && <ArrowRight className="w-4 h-4 text-slate-400" />}
                          </div>
                        ))}
                      </div>
                      <div className="flex justify-center mt-4">
                        <div className="flex items-center gap-2 text-xs text-slate-500">
                          <span className="w-16 h-px bg-slate-300" />
                          <span>REPITA</span>
                          <span className="w-16 h-px bg-slate-300" />
                        </div>
                      </div>
                    </div>

                    <div className="bg-gradient-to-r from-cyan-50 to-blue-50 rounded-xl p-5 border border-cyan-100">
                      <p className="text-sm font-bold text-cyan-800 mb-2">✅ Checklist da Etapa 6</p>
                      <ul className="space-y-1.5 text-sm text-slate-700">
                        {[
                          'Você comparou os resultados com a baseline?',
                          'Você documentou tanto o que funcionou quanto o que não funcionou?',
                          'Você identificou os aprendizados independente do resultado?',
                          'Você definiu os próximos passos (escalar, pivotar ou abandonar)?',
                          'Você compartilhou os resultados com o time e a comunidade?',
                        ].map((item, i) => (
                          <li key={i} className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-green-500 flex-shrink-0" /> {item}</li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </div>
              )}

              {/* ========== TEMPLATE DOWNLOAD ========== */}
              <div className="mt-12 bg-gradient-to-r from-slate-800 to-slate-900 rounded-2xl p-8 sm:p-10 text-white">
                <div className="flex flex-col sm:flex-row items-start gap-6">
                  <div className="flex-1">
                    <h3 className="text-xl sm:text-2xl font-bold mb-3 flex items-center gap-2">
                      <Download className="w-6 h-6" /> Template Pronto para Download
                    </h3>
                    <p className="text-slate-300 leading-relaxed mb-4">
                      Baixe nosso canvas de formulação de hipóteses. Um documento editável com todos os campos das 6 etapas, checklist de validação e exemplos preenchidos.
                    </p>
                    <div className="flex flex-wrap gap-3">
                      <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/10 text-xs">
                        <FileText className="w-3 h-3" /> Canvas de Hipótese (.pptx)
                      </span>
                      <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/10 text-xs">
                        <BarChart3 className="w-3 h-3" /> Planilha de Métricas (.xlsx)
                      </span>
                    </div>
                  </div>
                  <button className="flex items-center gap-2 px-6 py-3 bg-red-600 hover:bg-red-500 rounded-xl font-semibold text-sm transition-colors whitespace-nowrap">
                    <Download className="w-4 h-4" /> Baixar Templates
                  </button>
                </div>
              </div>

              {/* ========== NAVEGAÇÃO ENTRE ETAPAS ========== */}
              <div className="mt-8 flex items-center justify-between">
                <button
                  onClick={() => setActiveStep(Math.max(0, activeStep - 1))}
                  disabled={activeStep === 0}
                  className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium border border-slate-200 bg-white text-slate-600 hover:border-slate-300 hover:text-slate-800 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  <ArrowLeft className="w-4 h-4" /> Etapa Anterior
                </button>
                {activeStep < 5 ? (
                  <button
                    onClick={() => setActiveStep(activeStep + 1)}
                    className="flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-semibold bg-red-600 text-white hover:bg-red-500 transition-colors shadow-lg shadow-red-500/25"
                  >
                    Próxima Etapa <ArrowRight className="w-4 h-4" />
                  </button>
                ) : (
                  <button
                    onClick={() => setActiveStep(0)}
                    className="flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-semibold bg-green-600 text-white hover:bg-green-500 transition-colors shadow-lg shadow-green-500/25"
                  >
                    <Sparkles className="w-4 h-4" /> Recomeçar do Início
                  </button>
                )}
              </div>

              {/* ========== COMPARTILHAR ========== */}
              <div className="mt-8 p-5 bg-white rounded-xl border border-slate-200 flex flex-col sm:flex-row items-start sm:items-center gap-4">
                <div className="flex items-center gap-2">
                  <ThumbsUp className="w-5 h-5 text-slate-400" />
                  <span className="text-sm text-slate-600">Este conteúdo foi útil?</span>
                </div>
                <div className="flex items-center gap-3">
                  <button className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-slate-100 hover:bg-slate-200 text-sm font-medium text-slate-700 transition-colors">
                    <ThumbsUp className="w-4 h-4" /> Sim
                  </button>
                  <button className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-slate-100 hover:bg-slate-200 text-sm font-medium text-slate-700 transition-colors">
                    <MessageSquare className="w-4 h-4" /> Comentar
                  </button>
                  <button className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-slate-100 hover:bg-slate-200 text-sm font-medium text-slate-700 transition-colors">
                    <Share2 className="w-4 h-4" /> Compartilhar
                  </button>
                </div>
              </div>

            </div>{/* max-w-4xl */}

          </div>{/* px container */}
        </div>{/* overflow-y-auto */}
      </div>{/* flex-1 */}
    </div>
  )
}