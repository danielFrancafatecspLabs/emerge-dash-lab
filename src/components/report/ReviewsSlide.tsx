'use client'

import { useRef } from 'react'
import {
  Users, Star, Lightbulb, MessageSquare, Target,
  Clock, CheckCircle2, ArrowRight, Building2, UserCheck,
  Sparkles, FlaskConical, Presentation,
} from 'lucide-react'
import { SlideDownloadButtons } from './slideExport'

/* ── Paleta executiva ── */
const RED_PRIMARY = '#7A1212'
const RED_MUTED = '#A53A3A'
const RED_ACCENT = '#B91C1C'
const RED_BORDER = '#E0D0D0'
const RED_LIGHT = '#FDF2F2'

/* ── Estilo consistente de cards ── */
const CARD_BASE = 'rounded-xl border p-5 flex flex-col gap-3 bg-white'
const CARD_BORDER = 'border-[#E0D0D0]'

/* ── Badge de status para ações ── */
function StatusBadge({ status }: { status: 'pendente' | 'concluido' }) {
  if (status === 'concluido') {
    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-green-50 px-2 py-0.5 text-[10px] font-bold text-green-700 border border-green-200 flex-shrink-0 mt-0.5">
        <CheckCircle2 size={10} />
        Concluído
      </span>
    )
  }
  return (
    <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 px-2 py-0.5 text-[10px] font-bold text-amber-700 border border-amber-200 flex-shrink-0 mt-0.5">
      <Clock size={10} />
      Pendente
    </span>
  )
}

export default function ReviewsSlide() {
  const slideRef = useRef<HTMLDivElement>(null)

  return (
    <div className="flex flex-col gap-2">
      <div className="no-print flex items-center justify-between">
        <p className="text-xs font-semibold text-gray-400 uppercase tracking-widest">
          Slide 1 de 1
        </p>
        <SlideDownloadButtons
          targetRef={slideRef}
          filename="reviews-15-dias"
        />
      </div>

      {/* ═══ Slide exportável ═══ */}
      <div
        ref={slideRef}
        className="relative bg-white rounded-2xl p-8"
        style={{ minWidth: 1180 }}
      >
        {/* ── Cabeçalho: barra vermelha com logo ── */}
        <div
          className="flex items-center justify-between rounded-xl px-6 py-4 mb-6"
          style={{ backgroundColor: RED_PRIMARY }}
        >
            <div className="flex items-center gap-3">
            <MessageSquare size={22} className="text-white/80" />
            <h2 className="text-2xl font-extrabold tracking-tight text-white">
              Review
            </h2>
          </div>
          <img src="/jira/logobeonlabs.png" alt="beOn Labs" className="h-9 w-auto brightness-0 invert" />
        </div>

        {/* ── Grid de cards ── */}
        <div className="grid gap-5 grid-cols-3">
          {/* ═══════════════ Card 1: Primeiro Comitê ═══════════════ */}
          <div className={`${CARD_BASE} ${CARD_BORDER}`}>
            {/* Header do card */}
            <div className="flex items-start gap-3">
              <div
                className="flex-shrink-0 rounded-xl p-2.5 shadow-sm"
                style={{ backgroundColor: RED_PRIMARY }}
              >
                <Star size={18} color="white" />
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2 mb-0.5">
                  <span className="text-[10px] font-bold text-white bg-red-700 rounded-md px-2 py-0.5">19/08</span>
                  <span className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider">Comitê</span>
                </div>
                <p className="text-sm font-extrabold leading-tight" style={{ color: RED_PRIMARY }}>
                  Primeiro Comitê do beOn Labs
                </p>
              </div>
            </div>

            <div className="border-t" style={{ borderColor: RED_BORDER }} />

            {/* Métricas do evento */}
            <div className="flex gap-3">
              <div className="flex-1 rounded-lg bg-red-50/60 border border-red-100 p-2.5 text-center">
                <Users size={14} className="mx-auto mb-0.5" style={{ color: RED_MUTED }} />
                <p className="text-lg font-extrabold leading-none" style={{ color: RED_PRIMARY }}>12</p>
                <p className="text-[9px] text-gray-500 font-medium leading-tight">Participantes</p>
              </div>
              <div className="flex-1 rounded-lg bg-red-50/60 border border-red-100 p-2.5 text-center">
                <Building2 size={14} className="mx-auto mb-0.5" style={{ color: RED_MUTED }} />
                <p className="text-lg font-extrabold leading-none" style={{ color: RED_PRIMARY }}>1</p>
                <p className="text-[9px] text-gray-500 font-medium leading-tight">Laboratório</p>
              </div>
            </div>

            <div className="border-t" style={{ borderColor: RED_BORDER }} />

            {/* Encaminhamentos */}
            <div className="flex items-center gap-1.5">
              <ArrowRight size={12} style={{ color: RED_ACCENT }} />
              <p className="text-[11px] font-bold uppercase tracking-wider" style={{ color: RED_MUTED }}>
                Encaminhamentos
              </p>
            </div>

            <div className="space-y-3">
              {/* Pedido 1 */}
              <div className="rounded-lg bg-amber-50/50 border border-amber-100 p-3">
                <div className="flex items-start gap-2 mb-2">
                  <Lightbulb size={13} className="text-amber-600 flex-shrink-0 mt-0.5" />
                  <p className="text-[11px] text-gray-700 leading-snug">
                    <strong>Pedido 1</strong> — Lívia solicita explicação de como endereçar novas iniciativas ao beOn Labs.
                    <span className="text-gray-400 ml-1">Resp: Daniel França</span>
                  </p>
                </div>
                <div className="space-y-1.5 ml-5">
                  <div className="flex items-start gap-2">
                    <StatusBadge status="pendente" />
                    <p className="text-[10px] text-gray-600 leading-snug pt-0.5">Compartilhar Formulário do beOn Labs para encaminhar novas iniciativas no dia 02/09</p>
                  </div>
                  <div className="flex items-start gap-2">
                    <StatusBadge status="pendente" />
                    <p className="text-[10px] text-gray-600 leading-snug pt-0.5">Sugestão de agenda para apresentação do beOn Labs e o recebimento dessas iniciativas</p>
                  </div>
                </div>
              </div>

              {/* Pedido 2 */}
              <div className="rounded-lg bg-amber-50/50 border border-amber-100 p-3">
                <div className="flex items-start gap-2 mb-2">
                  <Lightbulb size={13} className="text-amber-600 flex-shrink-0 mt-0.5" />
                  <p className="text-[11px] text-gray-700 leading-snug">
                    <strong>Pedido 2</strong> — Rodrigo Peres: quais perguntas/informações complementar na entrada de uma ideia/oportunidade na esteira do beOn Labs para captura de benefício.
                  </p>
                </div>
                <div className="space-y-1.5 ml-5">
                  <div className="flex items-start gap-2">
                    <StatusBadge status="pendente" />
                    <p className="text-[10px] text-gray-600 leading-snug pt-0.5">Sugestão de agenda com time do Peres para entender as perguntas para complementar entrada</p>
                  </div>
                </div>
              </div>

              {/* Pedido 3 */}
              <div className="rounded-lg bg-green-50/50 border border-green-100 p-3">
                <div className="flex items-start gap-2 mb-2">
                  <Target size={13} className="text-green-600 flex-shrink-0 mt-0.5" />
                  <p className="text-[11px] text-gray-700 leading-snug">
                    <strong>Pedido 3</strong> — Apresentar soluções de IA para incluir no catálogo do beOn Labs.
                  </p>
                </div>
                <div className="space-y-1.5 ml-5">
                  <div className="flex items-start gap-2">
                    <StatusBadge status="concluido" />
                    <p className="text-[10px] text-gray-600 leading-snug pt-0.5">Realizado no dia 21/08 por Carlos Bueno apresentando os cases do Catálogo de Soluções de IA.</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* ═══════════════ Card 2: Comunidade de Experimentação ═══════════════ */}
          <div className={`${CARD_BASE} ${CARD_BORDER}`}>
            {/* Header do card */}
            <div className="flex items-start gap-3">
              <div
                className="flex-shrink-0 rounded-xl p-2.5 shadow-sm"
                style={{ backgroundColor: RED_PRIMARY }}
              >
                <FlaskConical size={18} color="white" />
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2 mb-0.5">
                  <span className="text-[10px] font-bold text-white bg-red-700 rounded-md px-2 py-0.5">20/08</span>
                  <span className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider">Comunidade</span>
                </div>
                <p className="text-sm font-extrabold leading-tight" style={{ color: RED_PRIMARY }}>
                  Comunidade de Experimentação beOn Labs
                </p>
              </div>
            </div>

            <div className="border-t" style={{ borderColor: RED_BORDER }} />

            {/* Destaque */}
            <div className="rounded-lg bg-red-50/60 border border-red-100 p-3">
              <div className="flex items-start gap-2">
                <Presentation size={14} className="flex-shrink-0 mt-0.5" style={{ color: RED_ACCENT }} />
                <p className="text-[11px] text-gray-700 leading-snug">
                  Apresentação do <strong>Processo de Experimentação</strong> — <span className="text-gray-400">Resp: Daniel França</span>
                </p>
              </div>
            </div>

            <div className="border-t" style={{ borderColor: RED_BORDER }} />

            {/* Pontos Discutidos */}
            <div className="flex items-center gap-1.5">
              <MessageSquare size={12} style={{ color: RED_ACCENT }} />
              <p className="text-[11px] font-bold uppercase tracking-wider" style={{ color: RED_MUTED }}>
                Principais Pontos Discutidos
              </p>
            </div>

            <ul className="space-y-2 text-xs text-gray-700 leading-relaxed">
              <li className="flex items-start gap-2">
                <span className="mt-[5px] h-1.5 w-1.5 rounded-full flex-shrink-0" style={{ backgroundColor: RED_ACCENT }} />
                <span>Como estabelecer um <strong>padrão</strong> relacionado ao processo de experimentação em <strong>todos os Labs</strong>?</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="mt-[5px] h-1.5 w-1.5 rounded-full flex-shrink-0" style={{ backgroundColor: RED_ACCENT }} />
                <span>Como estabelecer <strong>critérios</strong> para experimentar, pilotar e escalar?</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="mt-[5px] h-1.5 w-1.5 rounded-full flex-shrink-0" style={{ backgroundColor: RED_ACCENT }} />
                <span>Como <strong>não burocratizar</strong> a entrada de novas iniciativas?</span>
              </li>
            </ul>

            <div className="border-t" style={{ borderColor: RED_BORDER }} />

            {/* Ações */}
            <div className="flex items-center gap-1.5">
              <ArrowRight size={12} style={{ color: RED_ACCENT }} />
              <p className="text-[11px] font-bold uppercase tracking-wider" style={{ color: RED_MUTED }}>
                Ações
              </p>
            </div>

            <div className="rounded-lg bg-amber-50/50 border border-amber-100 p-3">
              <div className="flex items-start gap-2">
                <StatusBadge status="pendente" />
                <p className="text-[10px] text-gray-600 leading-snug pt-0.5">Discutir pautas sobre critérios para experimentação, fichas de experimentação em outros laboratórios.</p>
              </div>
            </div>
          </div>

          {/* ═══════════════ Card 3: Fórum de Tecnologia ═══════════════ */}
          <div className={`${CARD_BASE} ${CARD_BORDER}`}>
            {/* Header do card */}
            <div className="flex items-start gap-3">
              <div
                className="flex-shrink-0 rounded-xl p-2.5 shadow-sm"
                style={{ backgroundColor: RED_PRIMARY }}
              >
                <Sparkles size={18} color="white" />
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2 mb-0.5">
                  <span className="text-[10px] font-bold text-white bg-red-700 rounded-md px-2 py-0.5">26/08</span>
                  <span className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider">Fórum</span>
                </div>
                <p className="text-sm font-extrabold leading-tight" style={{ color: RED_PRIMARY }}>
                  Fórum de Tecnologia do beOn Labs
                </p>
              </div>
            </div>

            <div className="border-t" style={{ borderColor: RED_BORDER }} />

            {/* Métricas do evento */}
            <div className="flex gap-3">
              <div className="flex-1 rounded-lg bg-red-50/60 border border-red-100 p-2.5 text-center">
                <Users size={14} className="mx-auto mb-0.5" style={{ color: RED_MUTED }} />
                <p className="text-lg font-extrabold leading-none" style={{ color: RED_PRIMARY }}>28</p>
                <p className="text-[9px] text-gray-500 font-medium leading-tight">Participantes</p>
              </div>
              <div className="flex-1 rounded-lg bg-red-50/60 border border-red-100 p-2.5 text-center">
                <Target size={14} className="mx-auto mb-0.5" style={{ color: RED_MUTED }} />
                <p className="text-lg font-extrabold leading-none" style={{ color: RED_PRIMARY }}>1</p>
                <p className="text-[9px] text-gray-500 font-medium leading-tight">Experimento</p>
              </div>
            </div>

            <div className="border-t" style={{ borderColor: RED_BORDER }} />

            {/* Destaque do experimento */}
            <div className="rounded-lg bg-red-50/60 border border-red-100 p-3">
              <div className="flex items-start gap-2">
                <FlaskConical size={14} className="flex-shrink-0 mt-0.5" style={{ color: RED_ACCENT }} />
                <p className="text-[11px] text-gray-700 leading-snug">
                  Apresentação do Experimento <strong>CORI AGENT</strong> — Iniciativa de Operações Técnicas
                </p>
              </div>
            </div>

            <div className="border-t" style={{ borderColor: RED_BORDER }} />

            {/* Pontos Discutidos */}
            <div className="flex items-center gap-1.5">
              <MessageSquare size={12} style={{ color: RED_ACCENT }} />
              <p className="text-[11px] font-bold uppercase tracking-wider" style={{ color: RED_MUTED }}>
                Principais Pontos Discutidos
              </p>
            </div>

            <ul className="space-y-2 text-xs text-gray-700 leading-relaxed">
              <li className="flex items-start gap-2">
                <span className="mt-[5px] h-1.5 w-1.5 rounded-full flex-shrink-0" style={{ backgroundColor: RED_ACCENT }} />
                <span><strong>Modelos Open Source</strong> — Discussão sobre flexibilidade do Hub absorver modelos como Kimi, Qwen e Deepseek. <em className="text-gray-500">Gaiotto contribuiu com insights e se dispôs a avaliar caso a caso.</em></span>
              </li>
              
            </ul>
          </div>
        </div>

        {/* ── Rodapé com paginação ── */}
        <p className="absolute bottom-3 right-6 text-gray-300" style={{ fontSize: 10 }}>
          01/01
        </p>
      </div>
    </div>
  )
}