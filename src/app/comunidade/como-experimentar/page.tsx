'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import Link from 'next/link'
import Sidebar from '@/components/layout/Sidebar'
import LogoutButton from '@/components/layout/LogoutButton'
import {
  Beaker, Target, Search, BarChart3, Lightbulb, CheckCircle2,
  ArrowLeft, AlertTriangle, Shuffle, EyeOff, Hash, TrendingUp,
  Calculator, Brain, Layers, Filter, Split, Sparkles, FlaskConical,
  BookOpen, Zap, ArrowRight, Star, Info, GitBranch, Gauge,
  ArrowDown, ArrowUp, GraduationCap, Map, ClipboardCheck, Play,
  FileText, ChevronRight, Clock, Users, Trophy, ChevronDown, Menu
} from 'lucide-react'

// ====================== TYPES ======================

type ContentBlock =
  | { type: 'text'; text: string }
  | { type: 'highlight'; icon: any; title: string; text: string }
  | { type: 'example'; title: string; text: string }
  | { type: 'warning'; title: string; text: string }
  | { type: 'formula'; title: string; formula: string; vars: { symbol: string; desc: string }[] }
  | { type: 'checklist'; items: string[] }
  | { type: 'comparison'; left: { title: string; items: string[] }; right: { title: string; items: string[] } }
  | { type: 'step'; num: number; title: string; text: string }
  | { type: 'metricCard'; metric: string; formula: string; when: string; example: string }
  | { type: 'definition'; term: string; text: string }
  | { type: 'processFlow'; steps: { label: string; desc: string }[] }
  | { type: 'insight'; icon: any; text: string }
  | { type: 'quote'; text: string; author: string; source: string }
  | { type: 'concept'; icon: any; title: string; text: string; emphasis?: string }
  | { type: 'divider' }
  | { type: 'practice'; title: string; text: string; action?: string; actionLabel?: string }

interface ModuleData {
  id: string
  num: number
  title: string
  subtitle: string
  icon: any
  duration: string
  content: ContentBlock[]
}

// ====================== MODULES DATA ======================

const MODULES: ModuleData[] = [
  {
    id: 'modulo-1', num: 1,
    title: 'Por que Experimentar?',
    subtitle: 'O valor da experimentação sistemática e a filosofia da inovação',
    icon: Lightbulb, duration: '~8 min',
    content: [
      { type: 'highlight', icon: Target, title: 'Inovação não é só tecnologia — é método',
        text: 'Experimentar com IA não é sobre programar. É sobre aplicar o método científico para verificar se um sistema funciona bem para uma tarefa específica. Você formula uma hipótese, controla variáveis, coleta evidências e decide se a IA é confiável para uso prático.' },
      { type: 'divider' },
      { type: 'text', text: 'Antes das técnicas, precisamos entender por que a experimentação bem-feita é o coração da inovação. O pesquisador Thales Novaes de Andrade (2007) nos dá uma perspectiva fundamental:' },
      { type: 'quote', text: 'A inovação depende menos de investimento intensivo de capital e inventividade técnica, e mais da criação de redes de circulação de informação e conhecimento.', author: 'Thales Novaes de Andrade', source: 'O Problema da Experimentação na Inovação Tecnológica, RBCI, 2007' },
      { type: 'concept', icon: GitBranch, title: 'O Paradoxo da Gestão da Inovação',
        text: 'Os arranjos organizacionais e formatos interativos tomam o centro do debate inovativo. No limite, qualquer tecnologia pode ser válida — desde que bem gerenciada. Mas o excesso de controle sufoca a criatividade e a experimentação livre.',
        emphasis: 'Gerir bem é essencial, mas o excesso de controle sufoca a experimentação.' },
      { type: 'warning', title: 'O Risco do Excesso de Planejamento',
        text: 'O filósofo Bernard Stiegler (1998) alerta: o excesso de planejamento insere variáveis não-técnicas que se sobrepõem à transformação propriamente técnica. A capacidade de correr riscos ou realizar experimentações livres fica condicionada a cronogramas e metas.' },
      { type: 'divider' },
      { type: 'highlight', icon: Zap, title: 'Simondon: A Concretização dos Objetos Técnicos',
        text: 'Gilbert Simondon (1969) mostrou que objetos técnicos evoluem de "abstratos" (dependentes de intervenção humana) para "concretos" (sinérgicos, autossuficientes). O motor de aviões não precisa de refrigeração externa — ela emerge do próprio funcionamento. Essa sofisticação veio da experimentação contínua e do aperfeiçoamento pelo uso, não de metas exógenas.' },
      { type: 'quote', text: "É necessário que as condições técnicas predominem na evolução técnica; sobretudo nos domínios em que as condições técnicas prevalecem sobre as econômicas ocorrem os progressos mais ativos.", author: 'Gilbert Simondon', source: "Du mode d'existence des objets techniques, 1969" },
      { type: 'divider' },
      { type: 'highlight', icon: TrendingUp, title: 'Rosenberg: Aprendizado pelo Uso',
        text: 'Nathan Rosenberg (2006) mostrou que em tecnologias complexas, o conhecimento não pode ser previsto — ele emerge da experiência prolongada do usuário final (learning by using). Em sistemas complexos, não há como prever o desempenho de componentes sem experimentação real.' },
      { type: 'quote', text: 'Boa parte do conhecimento técnico nas sociedades de alta tecnologia tende a ser extremamente especializado... Esse conhecimento não pode ser predito com precisão a partir dos princípios da ciência.', author: 'Nathan Rosenberg', source: 'Por Dentro da Caixa-Preta, Ed. Unicamp, 2006' },
      { type: 'divider' },
      { type: 'insight', icon: Star, text: 'Lição do Módulo 1: A experimentação livre permite combinações que, abertas ao acaso, engendram novas possibilidades. A inventividade técnica é independente tanto da metodologia científica como da produção econômica. Precisamos de método — mas também de espaço para o inesperado.' },
      { type: 'practice', title: 'Reflexão Prática',
        text: 'Pense em um problema do seu dia a dia que poderia ser resolvido com IA. Anote: (1) qual é o problema, (2) o que significaria "resolver bem", e (3) como você saberia se a solução funcionou.',
        action: 'Anotar no caderno', actionLabel: '📝 Anotei' }
    ]
  },
  {
    id: 'modulo-2', num: 2,
    title: 'O Que é um Experimento com IA?',
    subtitle: 'Os tipos de experimento e como identificá-los no mundo real',
    icon: FlaskConical, duration: '~10 min',
    content: [
      { type: 'highlight', icon: Lightbulb, title: 'Experimentar é fazer um "teste de qualidade"',
        text: 'Você dá um problema para a IA, avalia a resposta e, com base em várias tentativas, decide se ela é confiável para uso prático.' },
      { type: 'warning', title: 'O custo de NÃO experimentar',
        text: 'Um experimento bem feito evita que você adote uma ferramenta que não funciona ou que gera mais problemas do que soluções.' },
      { type: 'divider' },
      { type: 'text', text: 'Existem quatro tipos principais de experimentos com IA:' },
      { type: 'concept', icon: Filter, title: '1. Classificação — "Em qual categoria isso se encaixa?"',
        text: 'A IA recebe um dado e o coloca em uma categoria pré-definida.',
        emphasis: 'Exemplo: classificar e-mails em "Dúvida", "Reclamação" ou "Elogio".' },
      { type: 'concept', icon: Search, title: '2. Extração de Informações — "O que está escondido neste texto?"',
        text: 'A IA age como um detetive: encontra e coleta dados específicos dentro de um texto longo.',
        emphasis: 'Exemplo: extrair número da apólice e data do sinistro de um relatório.' },
      { type: 'concept', icon: Hash, title: '3. Reconhecimento de Entidades (NER)',
        text: 'A IA identifica e rotula entidades como nomes, organizações, locais, datas.',
        emphasis: 'Exemplo: identificar político, partido e cidade em uma notícia.' },
      { type: 'concept', icon: Brain, title: '4. RAG — Geração Aumentada por Recuperação',
        text: 'A IA busca informações em uma base de dados e gera uma resposta fundamentada.',
        emphasis: 'Exemplo: chatbot respondendo sobre políticas com base em documentos.' },
      { type: 'divider' },
      { type: 'comparison',
        left: { title: '🧪 Classificação / Extração / NER', items: ['Avaliado com métricas objetivas (acurácia, precisão, recall)', 'Tem "gabarito" — resposta certa definida', 'Mais fácil de automatizar a avaliação', 'Foco em consistência e precisão'] },
        right: { title: '💬 RAG / Chatbots / Geração', items: ['Avaliado com métricas subjetivas (MOS, NPS)', 'Não tem "gabarito" único', 'Requer avaliação humana', 'Foco em utilidade, fluidez e naturalidade'] }
      },
      { type: 'practice', title: 'Exercício de Identificação',
        text: 'Dos quatro tipos, qual melhor se aplica ao problema do Módulo 1?',
        action: 'Classificar meu problema', actionLabel: '✅ Classifiquei' }
    ]
  },
  {
    id: 'modulo-3', num: 3,
    title: 'Planejando seu Experimento',
    subtitle: 'Hipóteses, variáveis, baseline, amostras e vieses',
    icon: Map, duration: '~15 min',
    content: [
      { type: 'highlight', icon: Target, title: 'O método científico aplicado à IA',
        text: 'Um experimento bem planejado segue 5 passos: (1) Observar, (2) Formular hipótese, (3) Testar em condições controladas, (4) Analisar com rigor estatístico, (5) Concluir.' },
      { type: 'processFlow', steps: [
        { label: '1. Observação', desc: 'Identifique o problema que a IA deve resolver' },
        { label: '2. Hipótese', desc: 'Defina o que significa "funcionar bem" com métricas claras' },
        { label: '3. Experimentação', desc: 'Teste a IA em condições controladas' },
        { label: '4. Análise', desc: 'Avalie os resultados com rigor estatístico' },
        { label: '5. Conclusão', desc: 'Decida se a IA atende aos critérios de qualidade' }
      ]},
      { type: 'divider' },
      { type: 'definition', term: 'Hipótese Nula (H₀)', text: 'A IA NÃO tem desempenho melhor que o baseline. "Réu inocente até prova em contrário".' },
      { type: 'definition', term: 'Hipótese Alternativa (H₁)', text: 'A IA TEM desempenho superior. É o que você espera provar.' },
      { type: 'comparison',
        left: { title: '🔬 Variável Independente', items: ['O que você MANIPULA', 'Ex: modelo de IA', 'Ex: prompt usado', 'Ex: temperatura do modelo'] },
        right: { title: '📏 Variável Dependente', items: ['O que você MEDE', 'Ex: acurácia', 'Ex: tempo de resposta', 'Ex: nota MOS'] }
      },
      { type: 'warning', title: '⚠️ Regra de Ouro', text: 'Mude UMA variável por vez. Se alterar modelo E prompt juntos, não saberá qual causou o efeito.' },
      { type: 'divider' },
      { type: 'highlight', icon: GitBranch, title: 'Baseline: Toda melhoria precisa de referência', text: 'Um experimento sem baseline é como correr sem linha de partida.' },
      { type: 'checklist', items: ['🎯 Baseline Humano: desempenho médio de uma pessoa', '🤖 Baseline Automatizado: sistema anterior ou heurística', '🎲 Baseline Aleatória: acurácia por chute', '📊 Baseline de Mercado: soluções similares'] },
      { type: 'example', title: 'Exemplo', text: 'IA com 85% vs humano 90% → ainda não pronta. IA com 85% vs legado 70% → grande melhoria.' },
      { type: 'divider' },
      { type: 'highlight', icon: Layers, title: 'Divisão Treino vs. Teste', text: 'Modelo pode "decorar" dados de treino e falhar no mundo real.' },
      { type: 'comparison',
        left: { title: '📚 Treino (~80%)', items: ['Usado para ensinar o modelo', 'Modelo vê perguntas E respostas', 'Como livros de estudo'] },
        right: { title: '📝 Teste (~20%)', items: ['SAGRADO — nunca visto', 'Usado UMA vez no final', 'Como prova final inédita'] }
      },
      { type: 'warning', title: '⚠️ Regra de Ouro', text: 'Nunca treine ou ajuste usando dados de teste. Resultados serão artificialmente otimistas.' },
      { type: 'divider' },
      { type: 'text', text: 'A partir de 30 amostras, resultados começam a ser estatisticamente confiáveis.' },
      { type: 'checklist', items: ['🔬 Teste Rápido: mínimo 30 amostras', '✅ Avaliação Confiável: mínimo 100 amostras', '🏛️ Decisões Importantes: 300-400 amostras'] },
      { type: 'warning', title: 'Regra dos 30 por Classe', text: 'Mínimo de 30 por categoria, não no total. Use Amostragem Estratificada.' },
      { type: 'divider' },
      { type: 'highlight', icon: EyeOff, title: 'Cuidado com os Vieses', text: 'Viés de Seleção: amostra não representa o todo. Viés de Confirmação: procurar o que confirma crenças. Solução: Teste Cego — avaliador não sabe qual resposta é da IA.' },
      { type: 'practice', title: 'Planejamento do Seu Experimento',
        text: 'Defina: (1) Hipótese nula e alternativa, (2) Variáveis independentes e dependentes, (3) Baseline, (4) Tamanho da amostra.',
        action: 'Planejar experimento', actionLabel: '📋 Planejei' }
    ]
  },

{
    id: 'modulo-4', num: 4,
    title: 'Executando e Medindo',
    subtitle: 'Métricas de avaliação para cada tipo de experimento',
    icon: BarChart3, duration: '~12 min',
    content: [
      { type: 'highlight', icon: Target, title: 'A métrica certa depende do que é pior para o seu negócio',
        text: 'Sempre se pergunte: o que é pior — um alarme falso ou uma ameaça não detectada? A resposta define se você prioriza Precisão ou Recall.' },
      { type: 'divider' },
      { type: 'text', text: 'Para Classificação e Extração, as métricas fundamentais são:' },
      { type: 'metricCard', metric: 'Acurácia', formula: '(Acertos Totais) / (Tentativas Totais)', when: 'Quando as classes são balanceadas e o custo de todos os erros é igual.', example: 'Detecção de fraude com 1% de casos: errar todos ainda dá 99% de acurácia — péssimo!' },
      { type: 'metricCard', metric: 'Precisão (Precision)', formula: 'VP / (VP + FP)', when: 'Quando o custo de um falso positivo é alto.', example: 'Anti-spam: alta precisão evita enviar e-mails importantes para o spam.' },
      { type: 'metricCard', metric: 'Recall (Revocação)', formula: 'VP / (VP + FN)', when: 'Quando o custo de um falso negativo é alto.', example: 'Diagnóstico de doenças: altíssimo recall para não deixar de identificar um paciente doente.' },
      { type: 'comparison',
        left: { title: '🔴 Falso Positivo (FP)', items: ['A IA "viu" algo que não existe', 'Alarme falso', 'Ex: e-mail legítimo no spam', 'Custo: perda de informação útil'] },
        right: { title: '🔴 Falso Negativo (FN)', items: ['A IA NÃO viu algo que existe', 'Ameaça não detectada', 'Ex: fraude não identificada', 'Custo: prejuízo financeiro ou risco'] }
      },
      { type: 'formula', title: 'F1-Score: Média Harmônica', formula: 'F1 = 2 × (Precisão × Recall) / (Precisão + Recall)', vars: [
        { symbol: 'F1', desc: 'Balanceia Precisão e Recall quando ambos são importantes' },
        { symbol: 'Precisão', desc: 'Dos exemplos que a IA classificou como positivos, quantos realmente são' },
        { symbol: 'Recall', desc: 'Dos exemplos positivos reais, quantos a IA encontrou' }
      ]},
      { type: 'divider' },
      { type: 'text', text: 'Para RAG e Chatbots, as métricas são diferentes:' },
      { type: 'metricCard', metric: 'MOS (Mean Opinion Score)', formula: 'Média de notas humanas (1-5)', when: 'Avaliação subjetiva de qualidade.', example: '3 avaliadores dão notas 4, 5, 4 para fluidez do chatbot → MOS = 4.3' },
      { type: 'metricCard', metric: 'NPS (Net Promoter Score)', formula: '% Promotores − % Detratores', when: 'Medir satisfação e lealdade do usuário.', example: '70% promotores, 10% detratores → NPS = 60 (excelente)' },
      { type: 'metricCard', metric: 'Taxa de Alucinação', formula: '(Respostas com fatos incorretos) / (Total)', when: 'Critical para RAG em domínios sensíveis.', example: '3 alucinações em 100 respostas → 3% de taxa de alucinação' },
      { type: 'practice', title: 'Escolha suas Métricas',
        text: 'Com base no tipo de experimento (Módulo 2), escolha 2-3 métricas principais. Justifique cada escolha.',
        action: 'Definir métricas', actionLabel: '📏 Defini' }
    ]
  },
  {
    id: 'modulo-5', num: 5,
    title: 'Interpretando Resultados',
    subtitle: 'Significância estatística, intervalos de confiança e testes',
    icon: Calculator, duration: '~15 min',
    content: [
      { type: 'highlight', icon: Target, title: 'Resultado bom ≠ resultado confiável',
        text: 'Uma diferença de 5% pode ser real ou pode ser ruído. Precisamos de ferramentas estatísticas para distinguir sinal de ruído.' },
      { type: 'divider' },
      { type: 'definition', term: 'Intervalo de Confiança (IC 95%)', text: 'Se repetíssemos o experimento 100 vezes, em 95 delas o valor real estaria dentro deste intervalo. Um IC estreito = estimativa precisa.' },
      { type: 'example', title: 'Exemplo', text: 'Acurácia = 85% com IC 95% [82%, 88%]. Significa que a acurácia real provavelmente está entre 82% e 88%. Se o baseline é 80%, a melhoria é significativa (IC não inclui 80%).' },
      { type: 'divider' },
      { type: 'highlight', icon: Shuffle, title: 'Teste de Permutação (Fisher-Pitman)',
        text: 'Técnica não-paramétrica que não assume distribuição normal. Embaralha os resultados muitas vezes para ver se a diferença observada poderia ter surgido por acaso.' },
      { type: 'processFlow', steps: [
        { label: '1. Diferença Real', desc: 'Calcule a diferença de desempenho entre IA e baseline' },
        { label: '2. Embaralhe', desc: 'Misture os resultados dos dois grupos aleatoriamente (1000+ vezes)' },
        { label: '3. Distribuição Nula', desc: 'Para cada embaralhamento, recalcule a diferença' },
        { label: '4. p-valor', desc: '% de embaralhamentos com diferença ≥ diferença real' }
      ]},
      { type: 'warning', title: 'Interpretação do p-valor', text: 'Se p < 0.05, a probabilidade de a diferença ser obra do acaso é menor que 5% → resultado estatisticamente significativo. Mas p-valor NÃO mede magnitude do efeito!' },
      { type: 'divider' },
      { type: 'highlight', icon: TrendingUp, title: "Tamanho do Efeito (Cohen's d)",
        text: 'Mede a magnitude prática da diferença, não apenas se ela existe. d ≈ 0.2 (pequeno), d ≈ 0.5 (médio), d ≈ 0.8 (grande).' },
      { type: 'checklist', items: [
        '✅ Relate sempre: métrica, IC 95%, p-valor e tamanho do efeito',
        '✅ Não persiga p < 0.05 a qualquer custo (p-hacking)',
        '✅ Resultado não-significativo também é resultado — publique!',
        '✅ Considere significância prática, não só estatística'
      ]},
      { type: 'practice', title: 'Interpretação dos Seus Resultados',
        text: 'Se seu experimento mostrar 85% vs baseline 80%, com IC 95% [83%, 87%] e p = 0.03, o que você conclui?',
        action: 'Interpretar', actionLabel: '📊 Interpretei' }
    ]
  },
  {
    id: 'modulo-6', num: 6,
    title: 'Checklist Final e Próximos Passos',
    subtitle: 'Tudo que você precisa para começar seu primeiro experimento',
    icon: ClipboardCheck, duration: '~8 min',
    content: [
      { type: 'highlight', icon: Star, title: 'Parabéns! Você completou o mini-curso 🎉',
        text: 'Agora você tem a base teórica e prática para planejar, executar e interpretar experimentos com IA.' },
      { type: 'divider' },
      { type: 'text', text: 'Use este checklist para não esquecer nada:' },
      { type: 'step', num: 1, title: 'Defina o problema', text: 'Qual problema de negócio a IA vai resolver? Seja específico.' },
      { type: 'step', num: 2, title: 'Escolha o tipo de experimento', text: 'Classificação? Extração? NER? RAG? Cada um tem suas métricas.' },
      { type: 'step', num: 3, title: 'Formule hipóteses', text: 'H₀ (nula) e H₁ (alternativa). O que você espera provar?' },
      { type: 'step', num: 4, title: 'Defina baseline e métricas', text: 'Contra o que comparar? Quais métricas importam para o negócio?' },
      { type: 'step', num: 5, title: 'Prepare os dados', text: 'Mínimo 30 amostras por classe. Separe treino (80%) e teste (20%).' },
      { type: 'step', num: 6, title: 'Execute com controle', text: 'Mude uma variável por vez. Documente tudo. Use teste cego se possível.' },
      { type: 'step', num: 7, title: 'Analise com rigor', text: 'Calcule métricas, IC 95%, teste de permutação. Não faça p-hacking.' },
      { type: 'divider' },
      { type: 'insight', icon: Zap, text: 'Lembre-se de Simondon: a experimentação livre produz os progressos mais ativos. Método sim, rigidez não. Permita-se descobrir o inesperado.' },
      { type: 'divider' },
      { type: 'practice', title: '🎯 Seu Primeiro Experimento',
        text: 'Volte ao problema que você definiu no Módulo 1. Aplique o checklist completo e execute seu primeiro experimento. Compartilhe os resultados com o time!',
        action: 'Começar experimento', actionLabel: '🚀 Comecei' }
    ]
  }
]

// ====================== CONTENT BLOCK RENDERER ======================

function ContentBlockView({ block }: { block: ContentBlock }) {
  if (block.type === 'divider') {
    return <div className="my-8 border-t border-amber-200/50" />
  }

  if (block.type === 'text') {
    return <p className="text-gray-700 leading-relaxed text-[15px]">{block.text}</p>
  }

  if (block.type === 'highlight') {
    const Icon = block.icon
    return (
      <div className="bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200 rounded-xl p-5">
        <div className="flex items-start gap-3">
          <div className="w-9 h-9 rounded-lg bg-amber-100 flex items-center justify-center flex-shrink-0 mt-0.5">
            <Icon className="w-5 h-5 text-amber-700" />
          </div>
          <div>
            <h4 className="font-semibold text-amber-900 mb-1">{block.title}</h4>
            <p className="text-amber-800 text-sm leading-relaxed">{block.text}</p>
          </div>
        </div>
      </div>
    )
  }

  if (block.type === 'example') {
    return (
      <div className="bg-green-50 border border-green-200 rounded-xl p-4">
        <div className="flex items-center gap-2 mb-2">
          <CheckCircle2 className="w-4 h-4 text-green-600" />
          <span className="font-semibold text-green-800 text-sm">{block.title}</span>
        </div>
        <p className="text-green-700 text-sm leading-relaxed">{block.text}</p>
      </div>
    )
  }

  if (block.type === 'warning') {
    return (
      <div className="bg-amber-50 border border-amber-300 rounded-xl p-4">
        <div className="flex items-center gap-2 mb-2">
          <AlertTriangle className="w-4 h-4 text-amber-600" />
          <span className="font-semibold text-amber-800 text-sm">{block.title}</span>
        </div>
        <p className="text-amber-700 text-sm leading-relaxed">{block.text}</p>
      </div>
    )
  }

  if (block.type === 'formula') {
    return (
      <div className="bg-slate-50 border border-slate-200 rounded-xl p-5">
        <h4 className="font-semibold text-slate-800 mb-3">{block.title}</h4>
        <div className="bg-white border border-slate-200 rounded-lg p-4 mb-3 text-center">
          <code className="text-lg font-mono text-slate-800">{block.formula}</code>
        </div>
        <div className="space-y-1.5">
          {block.vars.map((v, i) => (
            <div key={i} className="flex gap-2 text-sm">
              <span className="font-mono font-semibold text-amber-700 min-w-[30px]">{v.symbol}</span>
              <span className="text-slate-600">— {v.desc}</span>
            </div>
          ))}
        </div>
      </div>
    )
  }

  if (block.type === 'checklist') {
    return (
      <div className="bg-slate-50 border border-slate-200 rounded-xl p-4">
        <ul className="space-y-2">
          {block.items.map((item, i) => (
            <li key={i} className="flex items-start gap-2 text-sm text-slate-700">
              <CheckCircle2 className="w-4 h-4 text-slate-400 flex-shrink-0 mt-0.5" />
              <span>{item}</span>
            </li>
          ))}
        </ul>
      </div>
    )
  }

  if (block.type === 'comparison') {
    return (
      <div className="grid grid-cols-2 gap-4">
        <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
          <h5 className="font-semibold text-blue-800 text-sm mb-2">{block.left.title}</h5>
          <ul className="space-y-1.5">
            {block.left.items.map((item, i) => (
              <li key={i} className="text-blue-700 text-sm flex items-start gap-1.5">
                <ArrowRight className="w-3.5 h-3.5 flex-shrink-0 mt-0.5" />
                {item}
              </li>
            ))}
          </ul>
        </div>
        <div className="bg-purple-50 border border-purple-200 rounded-xl p-4">
          <h5 className="font-semibold text-purple-800 text-sm mb-2">{block.right.title}</h5>
          <ul className="space-y-1.5">
            {block.right.items.map((item, i) => (
              <li key={i} className="text-purple-700 text-sm flex items-start gap-1.5">
                <ArrowRight className="w-3.5 h-3.5 flex-shrink-0 mt-0.5" />
                {item}
              </li>
            ))}
          </ul>
        </div>
      </div>
    )
  }

  if (block.type === 'step') {
    return (
      <div className="flex gap-4 bg-white border border-slate-200 rounded-xl p-4 hover:border-amber-300 transition-colors">
        <div className="w-8 h-8 rounded-full bg-amber-100 flex items-center justify-center flex-shrink-0">
          <span className="text-amber-700 font-bold text-sm">{block.num}</span>
        </div>
        <div>
          <h5 className="font-semibold text-slate-800 text-sm">{block.title}</h5>
          <p className="text-slate-600 text-sm mt-0.5">{block.text}</p>
        </div>
      </div>
    )
  }

  if (block.type === 'metricCard') {
    return (
      <div className="bg-white border border-slate-200 rounded-xl p-4 hover:shadow-md transition-shadow">
        <h5 className="font-bold text-amber-700 mb-1">{block.metric}</h5>
        <div className="bg-slate-50 rounded-lg p-2 mb-2 text-center">
          <code className="text-sm font-mono text-slate-700">{block.formula}</code>
        </div>
        <p className="text-xs text-slate-500 mb-1"><strong>Quando usar:</strong> {block.when}</p>
        <p className="text-xs text-slate-500"><strong>Exemplo:</strong> {block.example}</p>
      </div>
    )
  }

  if (block.type === 'definition') {
    return (
      <div className="bg-indigo-50 border border-indigo-200 rounded-xl p-4">
        <div className="flex items-center gap-2 mb-1">
          <BookOpen className="w-4 h-4 text-indigo-600" />
          <span className="font-semibold text-indigo-800 text-sm">{block.term}</span>
        </div>
        <p className="text-indigo-700 text-sm leading-relaxed">{block.text}</p>
      </div>
    )
  }

  if (block.type === 'processFlow') {
    return (
      <div className="bg-slate-50 border border-slate-200 rounded-xl p-5">
        <div className="space-y-3">
          {block.steps.map((step, i) => (
            <div key={i} className="flex items-start gap-3">
              <div className="flex flex-col items-center">
                <div className="w-7 h-7 rounded-full bg-amber-100 border-2 border-amber-300 flex items-center justify-center flex-shrink-0">
                  <span className="text-amber-700 font-bold text-xs">{i + 1}</span>
                </div>
                {i < block.steps.length - 1 && (
                  <div className="w-0.5 h-6 bg-amber-200 my-0.5" />
                )}
              </div>
              <div className="pb-1">
                <span className="font-semibold text-slate-800 text-sm">{step.label}</span>
                <p className="text-slate-600 text-xs">{step.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    )
  }

  if (block.type === 'insight') {
    const Icon = block.icon
    return (
      <div className="bg-gradient-to-r from-purple-50 to-pink-50 border border-purple-200 rounded-xl p-5">
        <div className="flex items-start gap-3">
          <div className="w-9 h-9 rounded-lg bg-purple-100 flex items-center justify-center flex-shrink-0 mt-0.5">
            <Icon className="w-5 h-5 text-purple-700" />
          </div>
          <p className="text-purple-800 text-sm leading-relaxed italic">{block.text}</p>
        </div>
      </div>
    )
  }

  if (block.type === 'quote') {
    return (
      <div className="bg-slate-50 border-l-4 border-amber-400 rounded-r-xl p-5 my-2">
        <blockquote className="text-slate-700 text-sm leading-relaxed italic mb-3">
          &ldquo;{block.text}&rdquo;
        </blockquote>
        <div className="flex items-center gap-2 text-xs text-slate-500">
          <span className="font-semibold text-slate-600">{block.author}</span>
          <span className="text-slate-300">|</span>
          <span>{block.source}</span>
        </div>
      </div>
    )
  }

  if (block.type === 'concept') {
    const Icon = block.icon
    return (
      <div className="bg-white border border-slate-200 rounded-xl p-5 hover:border-amber-300 transition-colors">
        <div className="flex items-start gap-3">
          <div className="w-9 h-9 rounded-lg bg-slate-100 flex items-center justify-center flex-shrink-0 mt-0.5">
            <Icon className="w-5 h-5 text-slate-600" />
          </div>
          <div>
            <h4 className="font-semibold text-slate-800 mb-1">{block.title}</h4>
            <p className="text-slate-600 text-sm leading-relaxed">{block.text}</p>
            {block.emphasis && (
              <p className="mt-2 text-xs font-medium text-amber-700 bg-amber-50 rounded-lg px-3 py-1.5 inline-block">
                💡 {block.emphasis}
              </p>
            )}
          </div>
        </div>
      </div>
    )
  }

  if (block.type === 'practice') {
    return (
      <div className="bg-gradient-to-r from-green-50 to-emerald-50 border-2 border-dashed border-green-300 rounded-xl p-5">
        <div className="flex items-center gap-2 mb-3">
          <Play className="w-5 h-5 text-green-600" />
          <h4 className="font-semibold text-green-800">{block.title}</h4>
        </div>
        <p className="text-green-700 text-sm leading-relaxed mb-4">{block.text}</p>
        {block.action && (
          <button
            onClick={() => {}}
            className="inline-flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors"
          >
            {block.actionLabel || '▶'} {block.action}
          </button>
        )}
      </div>
    )
  }

  return null
}

// ====================== MODULE CARD ======================

function ModuleCard({
  module,
  index,
  activeModule,
  completedModules,
  onSelect,
}: {
  module: ModuleData
  index: number
  activeModule: number
  completedModules: Set<number>
  onSelect: (index: number) => void
}) {
  const Icon = module.icon
  const isActive = activeModule === index
  const isCompleted = completedModules.has(index)

  return (
    <button
      onClick={() => onSelect(index)}
      className={`w-full text-left p-3 rounded-xl transition-all duration-200 flex items-start gap-3 ${
        isActive
          ? 'bg-amber-100 border-2 border-amber-400 shadow-md'
          : isCompleted
          ? 'bg-green-50 border border-green-200 hover:border-green-300'
          : 'bg-white border border-slate-200 hover:border-amber-200 hover:shadow-sm'
      }`}
    >
      <div
        className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${
          isActive
            ? 'bg-amber-200 text-amber-700'
            : isCompleted
            ? 'bg-green-100 text-green-600'
            : 'bg-slate-100 text-slate-500'
        }`}
      >
        {isCompleted ? (
          <CheckCircle2 className="w-4 h-4" />
        ) : (
          <Icon className="w-4 h-4" />
        )}
      </div>
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <span className={`text-xs font-bold ${isActive ? 'text-amber-700' : isCompleted ? 'text-green-600' : 'text-slate-400'}`}>
            MÓDULO {module.num}
          </span>
          <span className="text-[10px] text-slate-400 flex items-center gap-0.5">
            <Clock className="w-3 h-3" />
            {module.duration}
          </span>
        </div>
        <p className={`text-sm font-semibold mt-0.5 truncate ${isActive ? 'text-amber-900' : 'text-slate-700'}`}>
          {module.title}
        </p>
        {!isActive && (
          <p className="text-[11px] text-slate-400 mt-0.5 truncate">{module.subtitle}</p>
        )}
      </div>
    </button>
  )
}

// ====================== MAIN PAGE ======================

export default function ComoExperimentarPage() {
  const [activeModule, setActiveModule] = useState(0)
  const [completedModules, setCompletedModules] = useState<Set<number>>(new Set())
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const contentRef = useRef<HTMLDivElement>(null)

  const module = MODULES[activeModule]
  const ModuleIcon = module.icon

  const progress = ((completedModules.size) / MODULES.length) * 100

  const handleModuleSelect = useCallback((index: number) => {
    setActiveModule(index)
    contentRef.current?.scrollTo({ top: 0, behavior: 'smooth' })
  }, [])

  const handleNextModule = useCallback(() => {
    const newCompleted = new Set(completedModules)
    newCompleted.add(activeModule)
    setCompletedModules(newCompleted)
    if (activeModule < MODULES.length - 1) {
      setActiveModule(activeModule + 1)
      contentRef.current?.scrollTo({ top: 0, behavior: 'smooth' })
    }
  }, [activeModule, completedModules])

  const handlePrevModule = useCallback(() => {
    if (activeModule > 0) {
      setActiveModule(activeModule - 1)
      contentRef.current?.scrollTo({ top: 0, behavior: 'smooth' })
    }
  }, [activeModule])

  return (
    <div className="flex min-h-dvh bg-slate-50">
      <Sidebar
        sidebarOpen={sidebarOpen}
        setSidebarOpen={setSidebarOpen}
        user={null}
      />

      <div className="flex-1 flex flex-col lg:ml-64">
        {/* Header */}
        <header className="sticky top-0 z-30 bg-white/90 backdrop-blur-sm border-b border-slate-200 px-4 lg:px-8 py-3">
          <div className="flex items-center justify-between max-w-6xl mx-auto">
            <div className="flex items-center gap-3">
              <button
                onClick={() => setSidebarOpen(!sidebarOpen)}
                className="lg:hidden p-2 rounded-lg hover:bg-slate-100"
              >
                <Menu className="w-5 h-5" />
              </button>
              <Link href="/comunidade" className="flex items-center gap-2 text-slate-500 hover:text-slate-700 transition-colors">
                <ArrowLeft className="w-4 h-4" />
                <span className="text-sm">Comunidade</span>
              </Link>
            </div>
            <LogoutButton />
          </div>
        </header>

        {/* Progress Bar */}
        <div className="h-1 bg-slate-200">
          <div
            className="h-full bg-gradient-to-r from-amber-400 to-orange-500 transition-all duration-500 ease-out"
            style={{ width: `${progress}%` }}
          />
        </div>

        <div className="flex-1 flex max-w-6xl mx-auto w-full">
          {/* Module Navigation Sidebar */}
          <aside className="hidden lg:flex flex-col w-64 flex-shrink-0 border-r border-slate-200 bg-white p-4 gap-2 sticky top-[57px] h-[calc(100dvh-57px-4px)] overflow-y-auto">
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1 px-1">
              Roteiro do Curso
            </h3>
            {MODULES.map((mod, i) => (
              <ModuleCard
                key={mod.id}
                module={mod}
                index={i}
                activeModule={activeModule}
                completedModules={completedModules}
                onSelect={handleModuleSelect}
              />
            ))}
            {/* Progress summary */}
            <div className="mt-4 pt-4 border-t border-slate-100 px-1">
              <div className="flex items-center gap-2 text-xs text-slate-500">
                <Trophy className="w-3.5 h-3.5 text-amber-500" />
                <span>{completedModules.size}/{MODULES.length} módulos concluídos</span>
              </div>
              <div className="mt-2 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-amber-400 to-orange-500 rounded-full transition-all duration-500"
                  style={{ width: `${progress}%` }}
                />
              </div>
            </div>
          </aside>

          {/* Mobile Module Selector */}
          <div className="lg:hidden w-full px-4 pt-4">
            <div className="flex gap-2 overflow-x-auto pb-2">
              {MODULES.map((mod, i) => (
                <button
                  key={mod.id}
                  onClick={() => handleModuleSelect(i)}
                  className={`flex-shrink-0 px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
                    activeModule === i
                      ? 'bg-amber-100 text-amber-800 border border-amber-300'
                      : completedModules.has(i)
                      ? 'bg-green-50 text-green-700 border border-green-200'
                      : 'bg-white text-slate-500 border border-slate-200'
                  }`}
                >
                  {completedModules.has(i) ? '✓ ' : ''}M{mod.num}
                </button>
              ))}
            </div>
          </div>

          {/* Main Content */}
          <main className="flex-1 min-w-0" ref={contentRef}>
            <div className="px-4 lg:px-8 py-6 lg:py-10 max-w-3xl mx-auto">
              {/* Module Header */}
              <div className="mb-8">
                <div className="flex items-center gap-3 mb-2">
                  <span className="text-xs font-bold text-amber-600 bg-amber-50 px-2.5 py-1 rounded-full">
                    MÓDULO {module.num} DE {MODULES.length}
                  </span>
                  <span className="text-xs text-slate-400 flex items-center gap-1">
                    <Clock className="w-3.5 h-3.5" />
                    {module.duration}
                  </span>
                </div>
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center flex-shrink-0 shadow-lg">
                    <ModuleIcon className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h1 className="text-2xl lg:text-3xl font-bold text-slate-800 mb-1">
                      {module.title}
                    </h1>
                    <p className="text-slate-500 text-sm lg:text-base">
                      {module.subtitle}
                    </p>
                  </div>
                </div>
              </div>

              {/* Module Content */}
              <div className="space-y-5">
                {module.content.map((block, i) => (
                  <ContentBlockView key={i} block={block} />
                ))}
              </div>

              {/* Module Navigation Footer */}
              <div className="mt-10 pt-8 border-t border-slate-200 flex items-center justify-between">
                <button
                  onClick={handlePrevModule}
                  disabled={activeModule === 0}
                  className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                    activeModule === 0
                      ? 'text-slate-300 cursor-not-allowed'
                      : 'text-slate-600 hover:text-slate-800 hover:bg-slate-100'
                  }`}
                >
                  <ArrowLeft className="w-4 h-4" />
                  Módulo Anterior
                </button>

                <span className="text-xs text-slate-400">
                  {activeModule + 1} / {MODULES.length}
                </span>

                {activeModule < MODULES.length - 1 ? (
                  <button
                    onClick={handleNextModule}
                    className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white rounded-lg text-sm font-medium transition-all shadow-md hover:shadow-lg"
                  >
                    Próximo Módulo
                    <ArrowRight className="w-4 h-4" />
                  </button>
                ) : (
                  <button
                    onClick={handleNextModule}
                    className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 text-white rounded-lg text-sm font-medium transition-all shadow-md hover:shadow-lg"
                  >
                    <Trophy className="w-4 h-4" />
                    Concluir Curso
                  </button>
                )}
              </div>
            </div>
          </main>
        </div>
      </div>
    </div>
  )
}

