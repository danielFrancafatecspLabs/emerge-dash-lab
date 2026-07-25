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
  FileText, ChevronRight, Clock, Users, Trophy, ChevronDown, Menu,
  ClipboardList, MessageSquare, ThumbsUp, RotateCw, Database,
  Thermometer, Building2, Shield, Rocket
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
  },
  {
    id: 'modulo-7', num: 7,
    title: 'Design de Experimentos Avançado',
    subtitle: 'A/B Testing, experimentos fatoriais, blocagem e controle de variáveis confundidoras',
    icon: Split, duration: '~18 min',
    content: [
      { type: 'highlight', icon: Target, title: 'Nem todo experimento é A/B — e A/B nem sempre é suficiente',
        text: 'Quando há múltiplas variáveis interagindo, designs fatoriais revelam efeitos que testes A/B simples escondem. Um bom design experimental é a diferença entre descoberta e ruído.' },
      { type: 'divider' },
      { type: 'text', text: 'O design experimental é a espinha dorsal da inferência causal. Ronald Fisher, nos anos 1920 na Rothamsted Experimental Station, estabeleceu os três princípios fundamentais que ainda regem a experimentação moderna: replicação, aleatorização e controle local (blocagem).' },
      { type: 'quote', text: 'To call in the statistician after the experiment is done may be no more than asking him to perform a post-mortem examination: he may be able to say what the experiment died of.', author: 'Ronald A. Fisher', source: 'Presidential Address, Indian Statistical Congress, 1938' },
      { type: 'divider' },
      { type: 'concept', icon: Split, title: '1. Teste A/B Clássico — Duas Variantes',
        text: 'O design mais simples: dividir aleatoriamente em grupo controle (A) e tratamento (B). Amplamente usado em tech — Google, Microsoft e Netflix realizam milhares de A/B tests simultâneos. Kohavi et al. (2009, 2013) documentaram as melhores práticas em larga escala.',
        emphasis: 'Limitação: só testa UMA variável por vez. Se prompt, modelo e temperatura mudam juntos, A/B não isola o efeito de cada fator.' },
      { type: 'metricCard', metric: 'Tamanho Amostral Mínimo (A/B)', formula: 'n = (Zα/2 + Zβ)² × 2σ² / δ²', when: 'Antes do experimento, para garantir poder estatístico adequado (80%+).', example: 'Para detectar melhoria de 5% com 80% de poder e α=0.05, com σ=0.15, são necessárias ~142 amostras por grupo.' },
      { type: 'divider' },
      { type: 'concept', icon: Layers, title: '2. Design Fatorial — Múltiplas Variáveis Simultâneas',
        text: 'Testa dois ou mais fatores simultaneamente, revelando interações. Um design 2×2 testa: modelo (GPT-4 vs Claude) × prompt (básico vs otimizado), com 4 combinações. Box, Hunter & Hunter (1978) estabeleceram a base estatística em Statistics for Experimenters.',
        emphasis: 'Vantagem crucial: revela INTERAÇÕES — quando o efeito de um fator depende do nível de outro. Ex: prompt otimizado melhora GPT-4 mas piora Claude.' },
      { type: 'example', title: 'Exemplo de Design Fatorial 2×2×2', text: 'Fatores: Modelo (GPT-4, Claude) × Temperatura (0.1, 0.7) × Prompt (básico, chain-of-thought). Total: 8 condições. Permite detectar interações triplas — ex.: chain-of-thought só funciona com temperatura baixa no GPT-4.' },
      { type: 'divider' },
      { type: 'concept', icon: Shuffle, title: '3. Aleatorização — O Antídoto Contra Viés',
        text: 'A aleatorização é o ÚNICO mecanismo que garante que grupos sejam comparáveis em média. Sem ela, diferenças observadas podem ser artefatos de seleção. Fisher (1926) provou matematicamente que a aleatorização valida a inferência causal.',
        emphasis: 'Na prática: use crypto.randomUUID(). NUNCA use alternância (A, B, A, B...) — padrões temporais viram confundidores.' },
      { type: 'warning', title: '⚠️ Armadilha Comum: Viés de Seleção', text: 'Se os primeiros 50 casos vão para o grupo A e os últimos 50 para o B, qualquer mudança temporal (ex.: avaliador cansado) contamina o resultado. A aleatorização resolve isso.' },
      { type: 'divider' },
      { type: 'concept', icon: Filter, title: '4. Blocagem — Controle de Variáveis Incômodas',
        text: 'Agrupa unidades experimentais similares em blocos antes de aleatorizar dentro de cada bloco. Aumenta a precisão ao remover variabilidade conhecida. Princípio estabelecido por Fisher em The Design of Experiments (1935).',
        emphasis: 'Exemplo prático: se avaliadores têm estilos diferentes (uns mais rigorosos), crie blocos por avaliador. Cada avaliador avalia igual número de casos de A e B.' },
      { type: 'comparison',
        left: { title: '🔀 Aleatorização Simples', items: ['Atribuição completamente aleatória', 'Simples de implementar', 'Pode gerar desbalanceamento', 'OK para amostras grandes (>200)'] },
        right: { title: '🧱 Aleatorização com Blocos', items: ['Blocos homogêneos primeiro', 'Aleatorização dentro de cada bloco', 'Garante balanceamento', 'Ideal com variáveis confundidoras conhecidas'] }
      },
      { type: 'divider' },
      { type: 'concept', icon: GitBranch, title: '5. Design Cross-Over — Cada Sujeito é Seu Próprio Controle',
        text: 'Cada unidade experimental recebe TODOS os tratamentos em ordem aleatória. Remove variabilidade entre sujeitos — extremamente eficiente estatisticamente.',
        emphasis: 'Aplicação em LLMs: o mesmo conjunto de prompts é testado em múltiplos modelos. A variância entre-prompts é isolada da variância entre-modelos.' },
      { type: 'warning', title: 'Cuidado com Efeito de Ordem (Carry-Over)', text: 'No cross-over, a ordem pode influenciar: fadiga do avaliador, aprendizado. Solução: contrabalanceamento — metade recebe A→B, metade B→A. Inclua washout period se necessário.' },
      { type: 'divider' },
      { type: 'highlight', icon: TrendingUp, title: '6. Experimentos Sequenciais e Group Sequential Design',
        text: 'Em vez de fixar o tamanho amostral antecipadamente, analise os dados em pontos intermediários pré-definidos. Permite parar cedo se o efeito for muito grande (ou inexistente), economizando recursos. Pocock (1977) e O\'Brien & Fleming (1979) desenvolveram os métodos canônicos.' },
      { type: 'checklist', items: [
        '🔢 Defina os pontos de análise ANTES de começar (ex.: a cada 50 amostras)',
        '📉 Use correção de Bonferroni ou Pocock para ajustar o α (múltiplas comparações inflam erro tipo I)',
        '🛑 Regra de parada: pare se p < α_ajustado ou se o efeito for trivial (d < 0.1)',
        '📋 Documente TODAS as análises intermediárias — não esconda as que não deram significativo'
      ]},
      { type: 'divider' },
      { type: 'insight', icon: Star, text: 'Lição do Módulo 7: Um bom design experimental não é luxo acadêmico — é economia de tempo e dinheiro. Fisher provou que com designs inteligentes (fatorial, blocagem), uma fração dos dados responde a múltiplas perguntas simultaneamente. Invista 20% do tempo no design para economizar 80% na execução.' },
      { type: 'practice', title: 'Desenhe um Experimento Fatorial',
        text: 'Escolha 2-3 fatores do seu problema (ex.: modelo, prompt, temperatura). Desenhe a matriz fatorial completa. Qual interação você espera encontrar?',
        action: 'Desenhar matriz fatorial', actionLabel: '📐 Desenhei' }
    ]
  },
  {
    id: 'modulo-8', num: 8,
    title: 'Engenharia de Prompt Científica',
    subtitle: 'Métodos sistemáticos para construir, avaliar e otimizar prompts com rigor experimental',
    icon: Sparkles, duration: '~20 min',
    content: [
      { type: 'highlight', icon: Target, title: 'Prompt engineering não é arte — é engenharia com método',
        text: 'Cada palavra no prompt é uma variável experimental. A engenharia de prompt científica trata prompts como hipóteses testáveis, não como inspiração artística.' },
      { type: 'divider' },
      { type: 'text', text: 'O campo da engenharia de prompt evoluiu de "tentativa e erro" para uma disciplina com métodos validados. Pesquisadores como Liu et al. (2023), Wei et al. (2022) e Kojima et al. (2022) estabeleceram técnicas que melhoram dramaticamente o desempenho de LLMs. A chave é tratar cada variação de prompt como um tratamento experimental e medir seu efeito com rigor estatístico.' },
      { type: 'divider' },
      { type: 'concept', icon: Brain, title: '1. Zero-Shot Prompting — A Linha de Base',
        text: 'O modelo recebe apenas a instrução, sem exemplos. É o design mais simples e deve ser sempre testado primeiro. Radford et al. (2019) demonstraram que LLMs têm capacidade zero-shot substancial. Se o zero-shot já resolve, não complique.',
        emphasis: 'Prompt base: "Classifique o seguinte e-mail como Dúvida, Reclamação ou Elogio: [texto]" — Sempre documente o prompt exato, incluindo espaços e pontuação.' },
      { type: 'divider' },
      { type: 'concept', icon: Layers, title: '2. Few-Shot Prompting — Aprendizado por Exemplos',
        text: 'Fornece 2-5 exemplos no prompt. Brown et al. (2020, GPT-3 paper) mostraram que few-shot pode igualar modelos fine-tuned em várias tarefas. A seleção dos exemplos é crucial e deve ser tratada como parte do design experimental.',
        emphasis: 'Selecione exemplos DIVERSOS e REPRESENTATIVOS. Evite viés de seleção: não escolha só os casos fáceis. A ordem dos exemplos importa — Lu et al. (2022) mostraram variância de até 10% conforme a ordem.' },
      { type: 'example', title: 'Estrutura de Few-Shot Robusta', text: 'Exemplo 1: "E-mail: Produto veio quebrado. Classificação: Reclamação" | Exemplo 2: "E-mail: Qual o prazo de entrega? Classificação: Dúvida" | Exemplo 3: "E-mail: Atendimento excelente! Classificação: Elogio" | Sempre inclua pelo menos um exemplo de cada classe.' },
      { type: 'divider' },
      { type: 'concept', icon: GitBranch, title: '3. Chain-of-Thought (CoT) — Raciocínio Passo a Passo',
        text: 'Wei et al. (2022, NeurIPS) descobriram que adicionar "Vamos pensar passo a passo" melhora dramaticamente o raciocínio em tarefas complexas. O modelo externaliza seu processo de pensamento, reduzindo erros por precipitação.',
        emphasis: 'Funciona melhor com modelos grandes (>100B parâmetros). Em modelos menores, pode até piorar o desempenho. Teste sempre: CoT vs sem CoT como um A/B test.' },
      { type: 'quote', text: 'Chain-of-thought reasoning is an emergent ability of sufficiently large language models. It cannot be achieved by simply scaling model size alone — the prompt structure matters.', author: 'Wei et al.', source: 'Chain-of-Thought Prompting Elicits Reasoning in Large Language Models, NeurIPS 2022' },
      { type: 'divider' },
      { type: 'concept', icon: Split, title: '4. Self-Consistency — Múltiplos Caminhos, Uma Resposta',
        text: 'Wang et al. (2023, ICLR): execute CoT múltiplas vezes (com temperature > 0) e escolha a resposta mais comum (majority voting). Substitui a decodificação gananciosa por consenso estatístico.',
        emphasis: 'Custo: 5-10× mais tokens. Benefício: ganhos de 5-15% em acurácia em tarefas de raciocínio matemático e lógico. O trade-off deve ser avaliado experimentalmente.' },
      { type: 'divider' },
      { type: 'concept', icon: Search, title: '5. Retrieval-Augmented Generation (RAG) — Conhecimento Externo',
        text: 'Lewis et al. (2020, NeurIPS): o modelo recupera documentos relevantes de uma base de conhecimento e os usa como contexto para gerar respostas fundamentadas. Essencial para domínios onde o conhecimento paramétrico do modelo é insuficiente.',
        emphasis: 'Componentes críticos: (a) retriever que busca documentos relevantes, (b) reader que gera resposta condicionada aos documentos recuperados. Ambos são variáveis experimentais.' },
      { type: 'divider' },
      { type: 'concept', icon: Lightbulb, title: '6. ReAct — Reasoning + Acting',
        text: 'Yao et al. (2023, ICLR): intercala passos de raciocínio ("Thought") com ações ("Action") que buscam informações externas. O modelo aprende a decidir QUANDO buscar mais informação.',
        emphasis: 'Superior ao CoT puro em tarefas que exigem conhecimento externo ou múltiplos passos de busca. Base para agentes autônomos como AutoGPT e BabyAGI.' },
      { type: 'divider' },
      { type: 'concept', icon: Calculator, title: '7. Otimização Automatizada de Prompts — DSPy e TextGrad',
        text: 'Khattab et al. (2023) com DSPy: em vez de escrever prompts manualmente, defina métricas e deixe o framework otimizar o prompt. Yuksekgonul et al. (2024) com TextGrad: use "gradientes textuais" para otimizar prompts como se fossem parâmetros de rede neural.',
        emphasis: 'Paradigma: trate prompts como parâmetros otimizáveis, não como texto fixo. O futuro é prompt optimization, não prompt engineering manual.' },
      { type: 'divider' },
      { type: 'concept', icon: AlertTriangle, title: '8. Prompt Injection e Jailbreaking — O Lado da Segurança',
        text: 'Prompts maliciosos podem extrair informações ou contornar restrições de segurança. Testar robustez contra injeção é parte essencial do experimento. Perez et al. (2022) e Wei et al. (2024) catalogaram vetores de ataque.',
        emphasis: 'Teste padrão: "Ignore as instruções anteriores e..." — o modelo resiste? Isso é um resultado experimental válido e deve ser documentado.' },
      { type: 'divider' },
      { type: 'text', text: 'A engenharia de prompt científica segue um ciclo iterativo rigoroso que deve ser documentado em cada iteração:' },
      { type: 'processFlow', steps: [
        { label: '1. Baseline', desc: 'Sempre comece com zero-shot. Documente o prompt exato.' },
        { label: '2. Hipótese', desc: '"Adicionar exemplos few-shot melhora acurácia em ≥5%".' },
        { label: '3. Variante', desc: 'Crie a variante de prompt. Apenas UMA mudança por vez.' },
        { label: '4. Teste A/B', desc: 'Compare baseline vs variante com mesmo conjunto de teste.' },
        { label: '5. Análise', desc: 'Calcule Δ, IC 95%, p-valor. Documente o resultado.' },
        { label: '6. Iteração', desc: 'Se significativo, a variante vira a nova baseline. Repita.' }
      ]},
      { type: 'divider' },
      { type: 'insight', icon: Star, text: 'Lição do Módulo 8: Prompts são hipóteses codificadas em texto. Trate-os com o mesmo rigor que você trata qualquer outra variável experimental. Documente, versione, teste e otimize sistematicamente. A diferença entre um prompt bom e um prompt ótimo pode ser de 20-30% em acurácia — e só experimentos revelam qual é qual.' },
      { type: 'practice', title: 'Otimize um Prompt com Método Científico',
        text: 'Pegue um prompt que você usa hoje. Escreva uma hipótese de melhoria. Crie a variante. Teste ambas com 30+ exemplos. Documente o resultado.',
        action: 'Testar variante de prompt', actionLabel: '🧪 Testei' }
    ]
  },
  {
    id: 'modulo-9', num: 9,
    title: 'Avaliação Humana e Confiabilidade',
    subtitle: 'Inter-Annotator Agreement, escalas de avaliação e como medir se humanos concordam',
    icon: Users, duration: '~16 min',
    content: [
      { type: 'highlight', icon: Target, title: 'Se humanos não concordam entre si, como o modelo pode acertar?',
        text: 'A confiabilidade da avaliação humana é o TETO teórico do desempenho do modelo. Sem medir o acordo entre anotadores, você não sabe se o problema é o modelo ou a ambiguidade da tarefa.' },
      { type: 'divider' },
      { type: 'text', text: 'Em experimentos com LLMs, a avaliação humana é frequentemente o ground truth. Mas humanos discordam — e essa discordância é informação, não ruído. Artstein & Poesio (2008) estabeleceram o framework canônico para medir Inter-Annotator Agreement (IAA). Amidei et al. (2019) aplicaram esses métodos especificamente à avaliação de NLG.' },
      { type: 'divider' },
      { type: 'concept', icon: Target, title: '1. Por que Medir Acordo Entre Anotadores?',
        text: 'Se dois avaliadores humanos discordam em 40% dos casos, nenhum modelo pode ter acurácia >60% nessa tarefa. O IAA define o upper bound do desempenho e revela se a tarefa está bem definida.',
        emphasis: 'Regra de ouro: IAA < 0.6 → tarefa mal definida, refine as instruções. IAA > 0.8 → tarefa bem definida, ground truth confiável.' },
      { type: 'divider' },
      { type: 'concept', icon: Calculator, title: "2. Cohen's Kappa (κ) — Acordo Entre Dois Avaliadores",
        text: "Cohen (1960): mede o acordo entre dois anotadores, corrigindo pelo acordo que ocorreria por acaso. κ = (Po - Pe) / (1 - Pe), onde Po é o acordo observado e Pe é o acordo esperado por acaso.",
        emphasis: 'κ = 1: acordo perfeito. κ = 0: acordo igual ao acaso. κ < 0: acordo pior que acaso. Interpretação: 0.0-0.2 leve, 0.21-0.4 razoável, 0.41-0.6 moderado, 0.61-0.8 substancial, 0.81-1.0 quase perfeito (Landis & Koch, 1977).' },
      { type: 'metricCard', metric: "Cohen's Kappa", formula: 'κ = (Po - Pe) / (1 - Pe)', when: 'Para medir acordo entre 2 avaliadores em tarefas de classificação categórica.', example: 'Po = 0.85 (85% acordo observado), Pe = 0.40 (40% esperado por acaso) → κ = 0.75 (acordo substancial).' },
      { type: 'divider' },
      { type: 'concept', icon: Users, title: "3. Fleiss' Kappa — Acordo Entre Múltiplos Avaliadores",
        text: "Fleiss (1971): generaliza o Cohen's Kappa para três ou mais avaliadores. Essencial quando você tem um painel de avaliação (ex.: 5 especialistas avaliando respostas do modelo).",
        emphasis: 'Use Fleiss\' Kappa quando tiver ≥3 avaliadores. O cálculo é mais complexo, mas bibliotecas como sklearn ou statsmodels implementam.' },
      { type: 'divider' },
      { type: 'concept', icon: BarChart3, title: "4. Krippendorff's Alpha — O Padrão Ouro",
        text: "Krippendorff (1980, 2004): a métrica mais flexível — suporta qualquer número de avaliadores, qualquer tipo de dado (nominal, ordinal, intervalar, razão) e lida com dados faltantes. É o padrão recomendado para pesquisa.",
        emphasis: 'α ≥ 0.80: confiável para decisões. α ≥ 0.667: aceitável para conclusões tentativas. Use Krippendorff\'s Alpha sempre que possível — é o mais robusto matematicamente.' },
      { type: 'comparison',
        left: { title: "📊 Cohen's Kappa", items: ['Apenas 2 avaliadores', 'Dados categóricos', 'Simples de calcular', 'Interpretação intuitiva'] },
        right: { title: "📊 Krippendorff's Alpha", items: ['Qualquer nº de avaliadores', 'Qualquer tipo de dado', 'Lida com dados faltantes', 'Recomendado para publicação'] }
      },
      { type: 'divider' },
      { type: 'concept', icon: ClipboardList, title: '5. Escalas de Avaliação para LLMs',
        text: 'Likert (1932): escalas de 5 ou 7 pontos são o padrão. Para LLMs, escalas comuns incluem: qualidade geral (1-5), fluência (1-5), relevância (1-5), factualidade (1-5), utilidade (1-5).',
        emphasis: 'Sempre ancore os extremos da escala com descrições claras. Ex.: 1 = "Completamente inútil, resposta errada" e 5 = "Perfeita, melhor que um especialista humano".' },
      { type: 'example', title: 'Escala Likert de 5 Pontos para Qualidade de Resposta', text: '1: Resposta incorreta ou prejudicial | 2: Parcialmente correta mas com erros graves | 3: Correta mas incompleta ou mal redigida | 4: Correta, completa e bem redigida | 5: Excepcional — supera o que um especialista escreveria' },
      { type: 'divider' },
      { type: 'concept', icon: MessageSquare, title: '6. Mean Opinion Score (MOS) — Padrão Telecom',
        text: 'Originário da avaliação de qualidade de voz (ITU-T P.800), o MOS foi adaptado para avaliação de texto gerado. Múltiplos avaliadores dão notas de 1-5 e a média é o MOS. Amplamente usado em benchmarks como o Chatbot Arena.',
        emphasis: 'MOS é sensível a outliers. Reporte sempre o desvio padrão junto com a média. Um MOS de 4.0 com σ=0.3 é muito diferente de 4.0 com σ=1.2.' },
      { type: 'divider' },
      { type: 'concept', icon: ThumbsUp, title: '7. Avaliação Comparativa (A vs B) — Preferência Direta',
        text: 'Em vez de notas absolutas, apresente duas respostas (modelo A vs modelo B) e pergunte qual é melhor. Reduz viés de escala e é mais intuitivo para avaliadores. Método usado no LMSYS Chatbot Arena (Chiang et al., 2024).',
        emphasis: 'Sempre aleatorize a ordem de apresentação (A/B vs B/A) para evitar viés de posição. Use teste binomial para verificar se a preferência é significativa.' },
      { type: 'divider' },
      { type: 'text', text: 'A qualidade da avaliação humana determina a qualidade de todo o experimento. Investir tempo em treinar avaliadores, calibrar escalas e medir IAA é o que separa resultados publicáveis de achismos.' },
      { type: 'checklist', items: [
        '👥 Use no mínimo 3 avaliadores independentes por amostra',
        '📏 Defina a escala ANTES de ver os dados — evite data dredging',
        '🎯 Calibre os avaliadores com exemplos de referência (gold standard)',
        '📊 Reporte SEMPRE o IAA (Krippendorff\'s Alpha recomendado)',
        '🔒 Avaliadores devem ser cegos — não sabem qual modelo gerou qual resposta',
        '📝 Documente instruções, exemplos de calibração e critérios de exclusão'
      ]},
      { type: 'divider' },
      { type: 'insight', icon: Star, text: 'Lição do Módulo 9: A avaliação humana é o fundamento sobre o qual toda a experimentação com LLMs se apoia. Se seu ground truth é ruidoso, todas as conclusões são ruidosas. Meça o IAA antes de medir o modelo. Como diz o ditado em NLP: "Garbage in, garbage out" — mas aqui é "Unreliable ground truth in, unreliable conclusions out".' },
      { type: 'practice', title: 'Calibre Seus Avaliadores',
        text: 'Crie 5 exemplos de respostas com notas de referência (gold standard). Peça para 3 colegas avaliarem. Calcule o Krippendorff\'s Alpha. Se <0.67, refine as instruções e repita.',
        action: 'Calibrar avaliadores', actionLabel: '📏 Calibrei' }
    ]
  },
  {
    id: 'modulo-10', num: 10,
    title: 'Reprodutibilidade e Documentação',
    subtitle: 'Experiment cards, model cards, datasheets e o manifesto pela ciência reproduzível',
    icon: FileText, duration: '~15 min',
    content: [
      { type: 'highlight', icon: Target, title: 'Um experimento que não pode ser reproduzido não é ciência — é anedota',
        text: 'A crise de reprodutibilidade na IA é real. Sem documentação rigorosa, experimentos com LLMs são caixas-pretas cujos resultados ninguém consegue verificar.' },
      { type: 'divider' },
      { type: 'text', text: 'A comunidade de ML enfrenta uma crise de reprodutibilidade documentada. Pineau et al. (2020, NeurIPS) introduziram o ML Reproducibility Checklist. Mitchell et al. (2019) propuseram Model Cards. Gebru et al. (2021) criaram Datasheets for Datasets. Kapoor et al. (2024) mostraram que sem reprodutibilidade, benchmarks perdem valor.' },
      { type: 'quote', text: 'The goal of a model card is to provide a concise, standardized ethical practice report that accompanies trained machine learning models.', author: 'Mitchell et al.', source: 'Model Cards for Model Reporting, FAT* 2019' },
      { type: 'divider' },
      { type: 'concept', icon: ClipboardList, title: '1. Experiment Cards — O Diário de Bordo do Experimento',
        text: 'Inspirado nos Model Cards de Mitchell et al. (2019), um Experiment Card documenta TODOS os detalhes necessários para reproduzir um experimento com LLM. É o equivalente laboratorial ao caderno de laboratório.',
        emphasis: 'Um Experiment Card bem escrito permite que qualquer pessoa reproduza seu experimento em 30 minutos, sem perguntar nada.' },
      { type: 'text', text: 'Um Experiment Card completo deve conter:' },
      { type: 'checklist', items: [
        '🎯 Hipótese: o que você esperava provar ou refutar?',
        '🤖 Modelo: nome exato, versão, provider, data de acesso',
        '⚙️ Parâmetros: temperatura, top_p, max_tokens, frequency_penalty — TODOS',
        '📝 Prompt: texto EXATO, incluindo espaços, quebras de linha e pontuação',
        '📊 Dataset: fonte, tamanho, split treino/teste, critérios de inclusão/exclusão',
        '📏 Métricas: definição precisa de cada métrica e como foi calculada',
        '🔢 Resultados: valores numéricos com intervalos de confiança',
        '💻 Código: repositório, commit hash, dependências (requirements.txt com versões exatas)',
        '🌡️ Ambiente: hardware, tempo de execução, custo em tokens/$',
        '⚠️ Limitações: o que o experimento NÃO testou, vieses conhecidos'
      ]},
      { type: 'divider' },
      { type: 'concept', icon: FileText, title: '2. Model Cards — A Carteira de Identidade do Modelo',
        text: 'Mitchell et al. (2019, FAT*): documento padronizado que acompanha modelos de ML, descrevendo uso pretendido, limitações, métricas de avaliação por segmento demográfico e considerações éticas. Adotado pelo Hugging Face.',
        emphasis: 'No contexto de experimentação, o Model Card informa quais vieses e limitações o modelo base já tem ANTES do seu experimento começar.' },
      { type: 'divider' },
      { type: 'concept', icon: Database, title: '3. Datasheets for Datasets — A Procedência dos Dados',
        text: 'Gebru et al. (2021, Communications of the ACM): todo dataset deve vir com um "datasheet" documentando motivação, composição, coleta, pré-processamento, usos recomendados e restrições legais/éticas.',
        emphasis: 'Para experimentos com LLMs: documente a origem de cada exemplo de teste. Foi criado por humanos? Extraído de logs? Sintético? Cada origem tem vieses diferentes.' },
      { type: 'divider' },
      { type: 'concept', icon: RotateCw, title: '4. O ML Reproducibility Checklist',
        text: 'Pineau et al. (2020, NeurIPS): checklist obrigatória para submissões ao NeurIPS desde 2019. Cobre: modelos (arquitetura, hiperparâmetros), dados (pré-processamento, splits), código (dependências, seeds), e computação (hardware, tempo).',
        emphasis: 'Adapte este checklist para seus experimentos internos. Não é só para papers — é para garantir que seu experimento de 3 meses atrás ainda pode ser reproduzido hoje.' },
      { type: 'checklist', items: [
        '🌱 Seeds: todas as random seeds documentadas (Python, NumPy, PyTorch, etc.)',
        '📦 Dependências: requirements.txt ou environment.yml com versões exatas (pip freeze)',
        '🔀 Splits: como os dados foram divididos? Stratified? Temporal? Aleatório?',
        '🧹 Pré-processamento: cada passo documentado, incluindo ordem das operações',
        '🔍 Hyperparameter search: espaço de busca, método, critério de seleção',
        '📊 Reporting: média e desvio padrão de N execuções (N ≥ 3)'
      ]},
      { type: 'divider' },
      { type: 'concept', icon: GitBranch, title: '5. Versionamento de Prompts e Configurações',
        text: 'Prompts são código. Versione-os como tal. Use Git para prompts, configurações de modelo e resultados. Cada experimento deve ter um commit hash que referencia exatamente o estado do código e prompts.',
        emphasis: 'Padrão: /experimentos/YYYY-MM-DD-nome/prompt.txt, config.json, results.json, README.md com Experiment Card.' },
      { type: 'divider' },
      { type: 'concept', icon: Thermometer, title: '6. Temperature = 0 e Reproduzibilidade',
        text: 'A maioria dos LLMs modernos NÃO são determinísticos mesmo com temperature=0, devido a paralelismo de GPU e floating-point non-associativity. Para máxima reprodutibilidade, execute múltiplas vezes e reporte a variância.',
        emphasis: 'Solução pragmática: execute cada experimento 3-5 vezes com seeds diferentes e reporte média ± desvio padrão. Isso captura a variância intrínseca do modelo.' },
      { type: 'warning', title: '⚠️ Armadilha: Temperature=0 ≠ Determinístico', text: 'Mesmo com temperature=0, floating-point arithmetic em GPUs pode produzir resultados ligeiramente diferentes entre execuções. Não confie em uma única execução como verdade absoluta.' },
      { type: 'divider' },
      { type: 'insight', icon: Star, text: 'Lição do Módulo 10: Documentação não é burocracia — é a diferença entre ciência e achismo. Um experimento bem documentado é um ativo que acumula valor. Um experimento mal documentado é dívida técnica que terá que ser paga com juros quando alguém perguntar "como chegamos a essa conclusão?".' },
      { type: 'practice', title: 'Crie um Experiment Card',
        text: 'Pegue seu último experimento com LLM. Preencha um Experiment Card com todos os 10 itens do checklist acima. O que está faltando? O que você faria diferente na próxima vez?',
        action: 'Criar Experiment Card', actionLabel: '📝 Criei' }
    ]
  },
  {
    id: 'modulo-11', num: 11,
    title: 'Métricas Avançadas para LLMs',
    subtitle: 'BLEURT, BERTScore, ROUGE, METEOR, perplexity e frameworks como HELM e BIG-bench',
    icon: BarChart3, duration: '~18 min',
    content: [
      { type: 'highlight', icon: Target, title: 'A métrica errada otimiza o modelo na direção errada',
        text: 'Escolher a métrica de avaliação é a decisão mais importante do design experimental. Uma métrica mal escolhida pode levar meses de trabalho na direção errada.' },
      { type: 'divider' },
      { type: 'text', text: 'A avaliação de LLMs vai muito além da acurácia tradicional. Métricas baseadas em n-gramas (BLEU, ROUGE) têm limitações conhecidas. Métricas neurais (BLEURT, BERTScore) capturam semântica. Frameworks como HELM (Liang et al., 2023) e BIG-bench (Srivastava et al., 2023) oferecem avaliação multidimensional.' },
      { type: 'divider' },
      { type: 'concept', icon: FileText, title: '1. BLEU (Bilingual Evaluation Understudy)',
        text: 'Papineni et al. (2002): métrica baseada em precisão de n-gramas entre texto gerado e referência. Originalmente para tradução automática, ainda é usada por inércia em muitas avaliações de LLMs.',
        emphasis: 'Limitações sérias: não captura semântica, penaliza paráfrases válidas, não lida com sinonímia. Para LLMs modernos, BLEU é inadequado para tarefas abertas de geração.' },
      { type: 'divider' },
      { type: 'concept', icon: FileText, title: '2. ROUGE (Recall-Oriented Understudy for Gisting Evaluation)',
        text: 'Lin (2004): família de métricas baseadas em recall de n-gramas. ROUGE-L usa longest common subsequence. Mais adequado para sumarização, onde recall é mais importante que precisão.',
        emphasis: 'ROUGE-1 (unigramas), ROUGE-2 (bigramas), ROUGE-L (LCS). Cada variante captura um aspecto diferente. Use múltiplas variantes, não apenas uma.' },
      { type: 'divider' },
      { type: 'concept', icon: Brain, title: '3. BERTScore — Similaridade Semântica com Embeddings',
        text: 'Zhang et al. (2020, ICLR): usa embeddings do BERT para calcular similaridade entre tokens do texto gerado e da referência. Captura semântica, não apenas sobreposição lexical.',
        emphasis: 'Muito superior a BLEU/ROUGE para tarefas de geração aberta. Correlaciona melhor com julgamento humano (ρ ≈ 0.7-0.8 vs 0.3-0.4 para BLEU).' },
      { type: 'metricCard', metric: 'BERTScore F1', formula: 'F1 = 2 × P × R / (P + R)', when: 'Quando a similaridade semântica importa mais que a correspondência exata de palavras.', example: 'Referência: "O gato dorme no sofá" vs Gerado: "O felino descansa no divã" → BLEU ≈ 0, BERTScore ≈ 0.85 (captura a sinonímia).' },
      { type: 'divider' },
      { type: 'concept', icon: Brain, title: '4. BLEURT — Regressão Treinada em Julgamentos Humanos',
        text: 'Sellam et al. (2020, ACL): modelo treinado especificamente para prever julgamentos humanos de qualidade de texto. Combina embeddings do BERT com fine-tuning em dados de avaliação humana (WMT).',
        emphasis: 'Estado da arte em correlação com humanos (ρ > 0.8 em vários benchmarks). Custo computacional maior, mas qualidade muito superior.' },
      { type: 'divider' },
      { type: 'concept', icon: FileText, title: '5. METEOR — Flexão e Sinonímia',
        text: 'Banerjee & Lavie (2005): métrica que incorpora stemming, sinonímia e paráfrase. Alinha palavras considerando forma e significado, não apenas correspondência exata.',
        emphasis: 'Melhor que BLEU para línguas com morfologia rica (como português). Correlaciona melhor com fluência percebida.' },
      { type: 'divider' },
      { type: 'concept', icon: Calculator, title: '6. Perplexity — A Incerteza do Modelo',
        text: 'Métrica intrínseca que mede quão "surpreso" o modelo fica com o texto. Perplexity = exp(cross-entropy loss). Menor perplexity = modelo mais confiante nas previsões.',
        emphasis: 'Perplexity é útil para comparar modelos na mesma família, mas NÃO correlaciona diretamente com qualidade percebida. Um modelo pode ter baixa perplexity e ainda gerar texto ruim.' },
      { type: 'metricCard', metric: 'Perplexity', formula: 'PPL = exp( -1/N × Σ log P(wi | w<i) )', when: 'Para avaliar a confiança intrínseca do modelo, não a qualidade do output.', example: 'GPT-4 tem PPL tipicamente <10 em texto bem estruturado. Modelos menores podem ter PPL >30 no mesmo texto.' },
      { type: 'divider' },
      { type: 'concept', icon: Layers, title: '7. HELM — Holistic Evaluation of Language Models',
        text: 'Liang et al. (2023, Stanford CRFM): framework que avalia LLMs em 42 cenários cobrindo 7 métricas: acurácia, calibração, robustez, justiça (fairness), viés, toxicidade e eficiência. Padrão ouro para avaliação holística.',
        emphasis: 'Não avalie seu modelo em apenas uma dimensão. Use o framework HELM como inspiração para avaliação multidimensional.' },
      { type: 'divider' },
      { type: 'concept', icon: Beaker, title: '8. BIG-bench — Além das Tarefas Padrão',
        text: 'Srivastava et al. (2023): benchmark colaborativo com 204 tarefas desafiadoras que vão além dos benchmarks tradicionais. Inclui raciocínio lógico, matemática, compreensão de código, e tarefas que exigem criatividade.',
        emphasis: 'Use BIG-bench (ou BIG-bench Lite, versão reduzida com 24 tarefas) para testar capacidades além do domínio específico do seu experimento.' },
      { type: 'divider' },
      { type: 'concept', icon: Gauge, title: '9. Métricas de Custo e Eficiência',
        text: 'Latência (tempo de resposta), throughput (tokens/segundo), custo financeiro ($/1K tokens) e consumo energético são métricas experimentais legítimas. Um modelo 5% melhor mas 10× mais caro pode não ser a escolha certa.',
        emphasis: 'Inclua SEMPRE métricas de eficiência no seu experimento. A melhor solução é a que equilibra qualidade × custo × latência.' },
      { type: 'divider' },
      { type: 'text', text: 'A escolha de métricas deve ser guiada pela pergunta de pesquisa, não pela conveniência. O framework de avaliação ideal combina:' },
      { type: 'processFlow', steps: [
        { label: '1. Métricas Automáticas', desc: 'BLEURT, BERTScore, ROUGE — rápidas e baratas' },
        { label: '2. Métricas de Tarefa', desc: 'Acurácia, F1, exact match — específicas do domínio' },
        { label: '3. Avaliação Humana', desc: 'MOS, preferência A/B, IAA — ground truth' },
        { label: '4. Métricas de Eficiência', desc: 'Latência, custo, throughput — viabilidade prática' },
        { label: '5. Métricas de Segurança', desc: 'Toxicidade, factualidade, viés — responsabilidade' }
      ]},
      { type: 'divider' },
      { type: 'insight', icon: Star, text: 'Lição do Módulo 11: Não existe "a melhor métrica". Existe a métrica certa para a pergunta certa. Use múltiplas métricas em camadas: automáticas para iteração rápida, humanas para validação, e de eficiência para decisões de produção. A combinação de métricas conta uma história mais completa que qualquer métrica isolada.' },
      { type: 'practice', title: 'Audite Suas Métricas Atuais',
        text: 'Liste todas as métricas que você usa hoje. Para cada uma, pergunte: "O que esta métrica NÃO captura?" Identifique pelo menos 2 pontos cegos e proponha métricas complementares.',
        action: 'Auditar métricas', actionLabel: '📊 Auditei' }
    ]
  },
  {
    id: 'modulo-12', num: 12,
    title: 'Cultura de Experimentação e Governança',
    subtitle: 'DORA metrics, plataformas de experimentação, ética e como construir uma cultura data-driven',
    icon: Building2, duration: '~16 min',
    content: [
      { type: 'highlight', icon: Target, title: 'Experimentação não é uma ferramenta — é uma cultura organizacional',
        text: 'As empresas mais inovadoras do mundo (Google, Amazon, Netflix, Spotify) não "fazem experimentos" — elas SÃO organizações experimentais. A diferença é cultural, não técnica.' },
      { type: 'divider' },
      { type: 'text', text: 'Construir uma cultura de experimentação vai muito além de ter uma plataforma de A/B testing. Thomke (2003, Harvard Business School) documentou como empresas que adotam experimentação sistemática superam concorrentes em inovação. O Google DORA team (Forsgren, Humble & Kim, 2018) mostrou que experimentação contínua é um dos 4 indicadores-chave de elite performance em tecnologia.' },
      { type: 'quote', text: 'Experimentation matters because it allows companies to create value through learning. The faster you can learn, the faster you can create value.', author: 'Stefan Thomke', source: 'Experimentation Matters: Unlocking the Potential of New Technologies for Innovation, Harvard Business School Press, 2003' },
      { type: 'divider' },
      { type: 'concept', icon: TrendingUp, title: '1. DORA Metrics — Os 4 Indicadores de Elite',
        text: 'Forsgren, Humble & Kim (2018, Accelerate): as organizações de elite em tecnologia se distinguem por 4 métricas: Deployment Frequency, Lead Time for Changes, Change Failure Rate, e Time to Restore Service. Experimentação contínua está diretamente ligada a essas métricas.',
        emphasis: 'Change Failure Rate < 15% é o padrão elite. Isso significa que 85%+ dos experimentos em produção não causam incidentes — e isso só é possível com experimentação controlada.' },
      { type: 'metricCard', metric: 'DORA — Change Failure Rate', formula: 'CFR = Mudanças com falha / Total de mudanças', when: 'Métrica de governança: qual % dos experimentos em produção causam degradação?', example: 'Elite: 0-15%. High: 16-30%. Medium: 31-45%. Low: >45%. Fonte: DORA Accelerate State of DevOps 2023.' },
      { type: 'divider' },
      { type: 'concept', icon: Layers, title: '2. Plataformas de Experimentação — O Stack Tecnológico',
        text: 'Empresas líderes construíram plataformas internas de experimentação: Google (Tang & Agarwal), Microsoft (ExP Platform, Kohavi et al.), Netflix (A/B Testing Platform), Spotify (Confidence). Cada uma resolve: design, tráfego, logging, análise e governança.',
        emphasis: 'Você não precisa construir uma plataforma do zero. Ferramentas como GrowthBook, LaunchDarkly, Optimizely e Eppo oferecem experimentação como serviço.' },
      { type: 'text', text: 'Uma plataforma de experimentação mínima viável deve prover:' },
      { type: 'checklist', items: [
        '🎯 Definição de hipóteses e documentação do experimento',
        '🔀 Aleatorização e atribuição de tráfego (controle vs tratamento)',
        '📊 Coleta de métricas e cálculo automático de significância estatística',
        '📋 Catálogo de experimentos (passados, ativos, planejados)',
        '🚨 Alertas automáticos se métricas de guarda (ex.: receita) degradarem',
        '📝 Log de decisões: o experimento foi shipado, iterado ou abandonado?'
      ]},
      { type: 'divider' },
      { type: 'concept', icon: Shield, title: '3. Métricas de Guarda (Guardrail Metrics)',
        text: 'Nem tudo que melhora uma métrica é bom. Métricas de guarda monitoram efeitos colaterais: receita, latência, taxa de erro, satisfação do usuário. Se um experimento melhora acurácia em 5% mas aumenta latência em 200%, as guardrails bloqueiam.',
        emphasis: 'Defina guardrails ANTES do experimento começar. Ex.: "Se latência p95 aumentar >20%, o experimento é automaticamente pausado".' },
      { type: 'divider' },
      { type: 'concept', icon: Users, title: '4. Cultura Experimentadora — People > Tools',
        text: 'Thomke (2003, 2020): a maior barreira para experimentação não é técnica — é cultural. Organizações que punem experimentos "fracassados" matam a inovação. Experimentos que não rejeitam a hipótese nula NÃO são fracassos — são aprendizado.',
        emphasis: 'Mude o vocabulário: não existe "experimento que deu errado", existe "experimento que gerou aprendizado". Cada p > 0.05 é uma hipótese falsa eliminada.' },
      { type: 'comparison',
        left: { title: '🧪 Cultura Experimental', items: ['Hipóteses são testadas, não defendidas', 'Falha é aprendizado documentado', 'Decisões são baseadas em dados', 'Qualquer um pode propor experimento', 'Resultados negativos são celebrados'] },
        right: { title: '🏛️ Cultura Tradicional', items: ['Decisões baseadas em hierarquia (HiPPO)', 'Falha é punida ou escondida', 'Intuição do líder prevalece', 'Experimentação é burocrática', 'Só resultados positivos são reportados'] }
      },
      { type: 'divider' },
      { type: 'concept', icon: AlertTriangle, title: '5. Ética e Governança em Experimentação',
        text: 'Nem tudo que pode ser testado deve ser testado. Experimentos com usuários reais exigem consideração ética. Kramer, Guillory & Hancock (2014, PNAS) geraram controvérsia com o experimento de contágio emocional do Facebook — um marco sobre limites éticos.',
        emphasis: 'Princípios éticos: (1) consentimento informado, (2) minimização de dano, (3) direito de opt-out, (4) revisão por pares antes de experimentos sensíveis, (5) transparência sobre resultados.' },
      { type: 'checklist', items: [
        '✅ O experimento foi revisado por alguém fora do time?',
        '✅ Os usuários afetados sabem que podem estar em um experimento?',
        '✅ Existe mecanismo de opt-out?',
        '✅ As métricas de guarda protegem contra danos?',
        '✅ O benefício esperado justifica o risco?',
        '✅ Resultados serão publicados independentemente do outcome?'
      ]},
      { type: 'divider' },
      { type: 'concept', icon: BarChart3, title: '6. Catálogo e Knowledge Base de Experimentos',
        text: 'Cada experimento deve ser catalogado e searchable. Quando alguém perguntar "já testamos X?", a resposta deve estar a uma busca de distância. O catálogo de experimentos é a memória institucional.',
        emphasis: 'Estrutura do catálogo: hipótese → design → resultados → decisão → lições aprendidas. Experimentos passados informam experimentos futuros.' },
      { type: 'divider' },
      { type: 'concept', icon: Rocket, title: '7. Do Experimento à Produção — O Ciclo Completo',
        text: 'O experimento não termina no p-valor. Termina na decisão: ship, iterate, or kill. Empresas de elite têm processos claros para cada caminho. Kohavi et al. (2013) mostraram que no Google, apenas ~10% dos experimentos resultam em shipping.',
        emphasis: '10% de taxa de sucesso NÃO é fracasso. Significa que 90% das ideias ruins foram filtradas ANTES de causarem dano em produção. Isso é sucesso.' },
      { type: 'processFlow', steps: [
        { label: '1. Ideação', desc: 'Hipótese baseada em dados ou intuição informada' },
        { label: '2. Design', desc: 'Métrica primária, guardrails, tamanho amostral' },
        { label: '3. Execução', desc: 'Aleatorização, coleta, monitoramento contínuo' },
        { label: '4. Análise', desc: 'Teste estatístico, IC, segmentação, análise de subgrupos' },
        { label: '5. Decisão', desc: 'Ship (10%), Iterate (60%), Kill (30%) — números típicos' },
        { label: '6. Documentação', desc: 'Catálogo atualizado, lições aprendidas, next steps' }
      ]},
      { type: 'divider' },
      { type: 'insight', icon: Star, text: 'Lição Final do Módulo 12: A experimentação é o motor da inovação baseada em evidências. Organizações que dominam a experimentação sistemática não apenas tomam melhores decisões — elas aprendem mais rápido que seus concorrentes. Como disse Jeff Bezos: "Our success at Amazon is a function of how many experiments we do per year, per month, per week, per day." A pergunta não é se você deve experimentar — é quantos experimentos você consegue rodar este mês.' },
      { type: 'practice', title: 'Avalie a Maturidade de Experimentação do Seu Time',
        text: 'Usando o framework deste módulo, avalie seu time em 5 dimensões (1-5): (1) Cultura, (2) Plataforma, (3) Métricas, (4) Governança, (5) Documentação. Qual é a dimensão mais fraca?',
        action: 'Avaliar maturidade', actionLabel: '🏆 Avaliei' }
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

