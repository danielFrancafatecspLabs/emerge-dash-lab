'use client'

import Link from 'next/link'
import { useEffect, useState } from 'react'
import {
  ArrowLeft, ArrowRight, BarChart3, BookOpen, CheckCircle2, ClipboardCopy, Compass, FlaskConical, Lightbulb, Microscope,
  PenTool, PlayCircle, Search, Share2, type LucideIcon,
} from 'lucide-react'
import { useCommunity } from '@/components/comunidade/CommunityProvider'
import { PageHeader } from '@/components/comunidade/CommunityShell'
import { Button, cx, focusRing } from '@/components/comunidade/ui'

interface Etapa {
  n: number
  titulo: string
  icon: LucideIcon
  resumo: string
  explicacao: string
  exemplo: string
  ferramenta: { nome: string; modelo: string }
  criterios: string[]
  materiais: { label: string; href: string }[]
}

// Conteúdo baseado no Playbook de Experimentação e na trilha "Como experimentar" da comunidade.
// O exemplo é o experimento real de Aceitação Remota (Ciclo 1), da Diretoria de Implantação e Rede Móvel.
const ETAPAS: Etapa[] = [
  {
    n: 1, titulo: 'Identificar o problema e a oportunidade', icon: Search,
    resumo: 'Comece pela dor do negócio, não pela tecnologia.',
    explicacao: 'Um problema é a lacuna entre o estado atual e o desejado, com evidência. “Queremos usar IA generativa” é uma intenção; “30% dos chamados só se resolvem na segunda visita” é um problema. Pergunte “por quê?” até chegar à causa.',
    exemplo: 'Na Aceitação Remota, os engenheiros validavam instalações uma a uma, em três etapas manuais — cerca de 500 horas técnicas por mês.',
    ferramenta: { nome: 'Canvas do problema', modelo: 'Problema (em uma frase):\nQuem é impactado:\nEvidência (dados que comprovam):\nTamanho da oportunidade (R$, horas, clientes):\nSponsor e ponto focal:' },
    criterios: ['O problema cabe em uma frase', 'Há dados que comprovam que ele existe', 'Sabemos quem é impactado e quanto custa', 'Há um sponsor e um ponto focal na área'],
    materiais: [{ label: 'Framework de Hipóteses — O Problema', href: '/comunidade/framework-hipoteses' }],
  },
  {
    n: 2, titulo: 'Formular a hipótese', icon: Lightbulb,
    resumo: 'Transforme o objetivo em algo que pode ser refutado.',
    explicacao: 'Use a fórmula SE → ENTÃO → PORQUE: a ação, o resultado mensurável e a lógica que sustenta a aposta. Uma boa hipótese tem métrica, meta e cabe em um ciclo curto.',
    exemplo: '“Acreditamos que um modelo de visão computacional irá classificar corretamente instalações em fotos com acurácia ≥ 70%.” Problemas grandes viram ciclos: um ciclo, uma hipótese.',
    ferramenta: { nome: 'Modelo de hipótese', modelo: 'Acreditamos que [solução] irá [resultado mensurável] para [público], porque [lógica].\nSaberemos que foi validada quando [métrica] atingir [meta] em [prazo].' },
    criterios: ['Pode ser confirmada ou refutada', 'Tem uma variável principal', 'Tem métrica e meta numérica', 'O “porque” está explícito'],
    materiais: [{ label: 'Framework de Hipóteses — A Hipótese', href: '/comunidade/framework-hipoteses' }],
  },
  {
    n: 3, titulo: 'Definir a estratégia de validação', icon: Compass,
    resumo: 'Decida como vai provar — e contra o quê comparar.',
    explicacao: 'Escolha o tipo de experimento (classificação, extração, reconhecimento, RAG), o baseline (uma pessoa, o processo atual, o acaso ou o mercado) e comece pela abordagem mais simples que pode funcionar. Teste mais de uma e descarte rápido.',
    exemplo: 'O Ciclo 1 usou YOLO com SAM 2.1. Um LLM multimodal foi testado para rotular as imagens e descartado: gerou rótulos alucinados, com custo e tempo altos.',
    ferramenta: { nome: 'Plano de validação', modelo: 'Tipo de experimento:\nBaseline (contra o que comparar):\nAbordagem principal:\nAlternativas a testar:\nO que fica fora do escopo:' },
    criterios: ['O tipo de experimento está claro', 'O baseline está definido', 'Há uma abordagem principal e alternativas'],
    materiais: [{ label: 'Como experimentar — tipos de experimento', href: '/comunidade/como-experimentar' }],
  },
  {
    n: 4, titulo: 'Escolher métricas e amostra', icon: BarChart3,
    resumo: 'Uma métrica decide; as outras explicam e protegem.',
    explicacao: 'Defina a métrica primária, as secundárias e os guardrails (o que não pode piorar). Pergunte: o que é pior para o negócio, um falso positivo ou um falso negativo? Dimensione a amostra: 30 casos para um teste rápido, 100 para uma avaliação confiável, 300–400 para decisões importantes, e pelo menos 30 por categoria.',
    exemplo: 'Precisão, recall e F1 contra a rotulagem manual. 500 imagens: 350 de treino, 75 de validação e 75 de teste nunca vistas.',
    ferramenta: { nome: 'Quadro de métricas', modelo: 'Métrica primária (decide o resultado):\nMetas:\nMétricas secundárias:\nGuardrails (não podem piorar):\nAmostra e divisão treino/teste:' },
    criterios: ['Há uma única métrica primária', 'Ela está ligada ao benefício', 'O baseline também será medido', 'A amostra está dimensionada'],
    materiais: [{ label: 'Framework de Hipóteses — As Métricas', href: '/comunidade/framework-hipoteses' }],
  },
  {
    n: 5, titulo: 'Desenhar o experimento', icon: PenTool,
    resumo: 'Ambiente controlado, uma variável por vez, tudo na Ficha.',
    explicacao: 'Monte um ambiente isolado da operação, com dados reais e aprovados. Mude uma variável por vez, separe dados de teste e use avaliação cega quando houver julgamento humano. Registre tudo na Ficha do Experimento e combine o critério de sucesso com o sponsor antes de começar.',
    exemplo: 'Treino em GPU local, sem integração com sistemas produtivos; calibração só na validação e medição final em fotos nunca vistas.',
    ferramenta: { nome: 'Checklist da Ficha', modelo: 'Objetivo:\nHipótese:\nMetodologia e ambiente:\nMétricas e critérios de sucesso:\nBenefício esperado:\nSponsor, equipe e cronograma:' },
    criterios: ['O ambiente não afeta a operação', 'Os dados de teste estão separados', 'O critério de sucesso foi acordado', 'A Ficha foi apresentada ao sponsor'],
    materiais: [{ label: 'Catálogo de experimentos (exemplos de fichas)', href: '/comunidade/experimentos' }],
  },
  {
    n: 6, titulo: 'Executar e acompanhar', icon: PlayCircle,
    resumo: 'Ciclo curto, acompanhamento semanal, critério intocado.',
    explicacao: 'Execute em ciclos de cerca de 1,5 mês. Acompanhe semanalmente, registre decisões e escale impedimentos cedo. Não mude o critério de sucesso no meio do caminho.',
    exemplo: 'Três pessoas rotularam as imagens por cerca de um mês. Sem especialista da área, os rótulos ficaram inconsistentes — um aprendizado registrado para o ciclo seguinte.',
    ferramenta: { nome: 'Registro semanal', modelo: 'Semana:\nO que avançou:\nDecisões tomadas:\nImpedimentos e quem pode ajudar:\nPróximos passos:' },
    criterios: ['Há acompanhamento semanal', 'Versões e parâmetros estão documentados', 'Impedimentos foram escalados'],
    materiais: [{ label: 'Pedir ajuda na comunidade', href: '/comunidade' }],
  },
  {
    n: 7, titulo: 'Analisar os resultados', icon: Microscope,
    resumo: 'Resultado contra a meta — e o que ele significa.',
    explicacao: 'Compare com o baseline e com o critério. Há quatro desfechos possíveis: hipótese confirmada (GO), refutada (NO GO e aprendizado), inconclusiva (aumentar amostra ou tempo) ou efeito inesperado (registrar e formular nova hipótese).',
    exemplo: 'Recall de 77,5% (meta > 70%), precisão de 72,7% e F1 de 75,1% (meta > 60%): hipótese do Ciclo 1 validada, com a condição de revalidar a rotulagem com os técnicos.',
    ferramenta: { nome: 'Leitura do resultado', modelo: 'Métrica | Meta | Resultado | Atingiu?\n\nDesfecho (confirmada, refutada, inconclusiva, inesperado):\nDecisão (GO / NO GO / novo ciclo):\nCondições para avançar:' },
    criterios: ['O resultado foi comparado à meta', 'O critério não mudou no fim', 'A decisão foi tomada com o sponsor'],
    materiais: [{ label: 'Framework de Hipóteses — A Validação', href: '/comunidade/framework-hipoteses' }],
  },
  {
    n: 8, titulo: 'Registrar e compartilhar aprendizados', icon: Share2,
    resumo: 'O que você aprendeu vira capacidade da empresa.',
    explicacao: 'Publique o Relatório de Resultados — inclusive quando a hipótese é refutada. Compartilhe na comunidade o que funcionou, o que não funcionou e o que faria diferente. Valor de aprendizado conta tanto quanto valor de resultado.',
    exemplo: 'Aprendizados do Ciclo 1: a qualidade da rotulagem é a principal alavanca; variedade de gabinetes pesa mais que o ajuste do modelo; 500 imagens bastam para provar a hipótese, não para operar em escala.',
    ferramenta: { nome: 'Post de aprendizado', modelo: 'Experimento:\nHipótese:\nResultado (métrica × meta):\nO que funcionou:\nO que não funcionou:\nO que faríamos diferente:\nPróximo passo:' },
    criterios: ['O relatório foi publicado', 'O aprendizado foi compartilhado na comunidade', 'O próximo ciclo ou o encerramento está definido'],
    materiais: [{ label: 'Ver experimentos compartilhados', href: '/comunidade' }],
  },
]

export default function TrilhaPage() {
  const { me, patchProfile, openComposer, toast } = useCommunity()
  const concluidas = me?.profile.trilhaConcluida ?? []
  const proxima = ETAPAS.find(e => !concluidas.includes(e.n))?.n ?? ETAPAS.length
  const [atual, setAtual] = useState(1)
  const [iniciado, setIniciado] = useState(false)
  useEffect(() => { if (me && !iniciado) { setAtual(proxima); setIniciado(true) } }, [me, iniciado, proxima])

  const etapa = ETAPAS[atual - 1]
  const feita = concluidas.includes(etapa.n)
  const pct = Math.round((concluidas.length / ETAPAS.length) * 100)

  async function alternar() {
    const ok = await patchProfile({ toggleEtapa: etapa.n }, p => ({
      ...p, trilhaConcluida: (feita ? p.trilhaConcluida.filter(n => n !== etapa.n) : [...p.trilhaConcluida, etapa.n]).sort((a, b) => a - b),
    }))
    if (ok && !feita) {
      toast(etapa.n === ETAPAS.length ? 'Trilha concluída. Que tal compartilhar o que aprendeu?' : `Etapa ${etapa.n} concluída.`)
      if (etapa.n < ETAPAS.length) setAtual(etapa.n + 1)
    }
  }

  async function copiar() {
    try { await navigator.clipboard.writeText(etapa.ferramenta.modelo); toast('Modelo copiado.') } catch { toast('Não foi possível copiar. Selecione o texto manualmente.', 'error') }
  }

  return (
    <div className="mx-auto max-w-[1120px]">
      <PageHeader eyebrow="Trilha de Experimentação" title="Do problema ao aprendizado"
        description="Oito etapas práticas para quem está começando e um roteiro de checagem para quem já experimenta. Avance no seu ritmo." />

      <div className="px-4 sm:px-6">
        <div className="flex items-center gap-4 rounded-2xl bg-comm-soft px-5 py-4">
          <div className="flex-1">
            <div className="flex items-baseline justify-between text-sm">
              <span className="font-semibold text-comm-ink">Seu progresso</span>
              <span className="tabular-nums text-comm-muted">{concluidas.length} de {ETAPAS.length} etapas</span>
            </div>
            <div className="mt-2 h-2 overflow-hidden rounded-full bg-white" role="progressbar" aria-valuenow={pct} aria-valuemin={0} aria-valuemax={100} aria-label="Progresso na trilha">
              <div className="h-full rounded-full bg-comm-red transition-all" style={{ width: `${pct}%` }} />
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-8 px-4 py-8 sm:px-6 lg:grid-cols-[300px_1fr]">
        <nav aria-label="Etapas da trilha" className="min-w-0">
          <ol className="flex gap-2 overflow-x-auto pb-2 [scrollbar-width:none] lg:block lg:space-y-1 lg:overflow-visible">
            {ETAPAS.map(e => {
              const ok = concluidas.includes(e.n)
              const ativa = e.n === atual
              return (
                <li key={e.n} className="shrink-0">
                  <button type="button" onClick={() => setAtual(e.n)} aria-current={ativa ? 'step' : undefined}
                    className={cx('flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left transition-colors', ativa ? 'bg-comm-ink text-white' : 'hover:bg-comm-soft', focusRing)}>
                    <span className={cx('flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs font-bold',
                      ok ? 'bg-emerald-600 text-white' : ativa ? 'bg-white text-comm-ink' : 'bg-comm-soft text-comm-muted')}>
                      {ok ? <CheckCircle2 className="h-4 w-4" aria-label="Concluída" /> : e.n}
                    </span>
                    <span className={cx('text-sm leading-snug lg:block', ativa ? 'font-semibold' : 'text-comm-body', 'hidden')}>{e.titulo}</span>
                    {e.n === proxima && !ok && !ativa && <span className="ml-auto hidden rounded-full bg-comm-tint px-2 py-0.5 text-[10px] font-semibold text-comm-red lg:inline">Próxima</span>}
                  </button>
                </li>
              )
            })}
          </ol>
        </nav>

        <article aria-labelledby="etapa-titulo" className="min-w-0">
          <div className="flex items-start gap-4">
            <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-comm-tint text-comm-red"><etapa.icon className="h-6 w-6" aria-hidden /></span>
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.1em] text-comm-muted">Etapa {etapa.n} de {ETAPAS.length}</p>
              <h2 id="etapa-titulo" className="text-2xl font-semibold tracking-tight">{etapa.titulo}</h2>
              <p className="mt-1 text-[15px] text-comm-muted">{etapa.resumo}</p>
            </div>
          </div>

          <p className="mt-6 text-[15px] leading-relaxed text-comm-body">{etapa.explicacao}</p>

          <div className="mt-6 rounded-2xl border-l-4 border-comm-red bg-comm-tint/50 px-5 py-4">
            <p className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.1em] text-comm-red"><FlaskConical className="h-3.5 w-3.5" aria-hidden /> Na prática · Aceitação Remota</p>
            <p className="mt-1.5 text-[15px] leading-relaxed text-comm-ink">{etapa.exemplo}</p>
          </div>

          <div className="mt-6 grid gap-6 md:grid-cols-2">
            <section>
              <h3 className="text-sm font-semibold text-comm-ink">Ferramenta: {etapa.ferramenta.nome}</h3>
              <pre className="mt-2 whitespace-pre-wrap rounded-xl border border-comm-line bg-white p-4 font-sans text-sm leading-relaxed text-comm-body">{etapa.ferramenta.modelo}</pre>
              <Button size="sm" className="mt-2" icon={ClipboardCopy} onClick={copiar}>Copiar modelo</Button>
            </section>
            <section>
              <h3 className="text-sm font-semibold text-comm-ink">Pronto para avançar quando…</h3>
              <ul className="mt-2 space-y-2">
                {etapa.criterios.map(c => (
                  <li key={c} className="flex gap-2.5 text-sm text-comm-body"><CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600" aria-hidden /> {c}</li>
                ))}
              </ul>
              <h3 className="mt-5 text-sm font-semibold text-comm-ink">Materiais de apoio</h3>
              <ul className="mt-2 space-y-1.5">
                {etapa.materiais.map(m => (
                  <li key={m.label}><Link href={m.href} className="inline-flex items-center gap-2 text-sm font-medium text-comm-red hover:underline"><BookOpen className="h-4 w-4" aria-hidden /> {m.label}</Link></li>
                ))}
                <li><Link href="/comunidade/como-experimentar" className="inline-flex items-center gap-2 text-sm font-medium text-comm-red hover:underline"><BookOpen className="h-4 w-4" aria-hidden /> Mini-curso “Como experimentar”</Link></li>
              </ul>
            </section>
          </div>

          <div className="mt-8 flex flex-wrap items-center gap-3 border-t border-comm-line pt-6">
            <Button variant={feita ? 'secondary' : 'primary'} icon={CheckCircle2} onClick={alternar}>
              {feita ? 'Etapa concluída — desmarcar' : 'Marcar etapa como concluída'}
            </Button>
            {etapa.n === ETAPAS.length && (
              <Button icon={Share2} onClick={() => openComposer({ kind: 'experimento', content: etapa.ferramenta.modelo, tags: ['experimentacao'] })}>Compartilhar aprendizado</Button>
            )}
            <div className="ml-auto flex gap-2">
              <Button variant="ghost" icon={ArrowLeft} disabled={etapa.n === 1} onClick={() => setAtual(etapa.n - 1)}>Anterior</Button>
              <Button variant="ghost" disabled={etapa.n === ETAPAS.length} onClick={() => setAtual(etapa.n + 1)}>Próxima <ArrowRight className="h-4 w-4" aria-hidden /></Button>
            </div>
          </div>
        </article>
      </div>
    </div>
  )
}
