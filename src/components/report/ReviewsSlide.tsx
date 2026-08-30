'use client'

import { useRef } from 'react'
import { SlideDownloadButtons } from './slideExport'

/* ── Paleta executiva ── */
const RED_PRIMARY = '#7A1212'
const RED_MUTED = '#A53A3A'
const RED_ACCENT = '#B91C1C'
const RED_BORDER = '#E8C5C5'
const RED_LIGHT = '#FDF2F2'

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
          <h2 className="text-2xl font-extrabold tracking-tight text-white">
            Reviews dos Últimos 15 Dias
          </h2>
          <img src="/jira/logobeonlabs.png" alt="beOn Labs" className="h-9 w-auto brightness-0 invert" />
        </div>

        {/* ── Grid de cards ── */}
        <div className="grid gap-5 grid-cols-3">
          {/* ═══════════════ Card 1: Primeiro Comitê ═══════════════ */}
          <div className="rounded-xl border p-5 flex flex-col gap-3 bg-white" style={{ borderColor: RED_BORDER }}>
            <div className="flex items-center gap-3">
              <div
                className="flex-shrink-0 rounded-xl px-3 py-1.5 shadow-sm"
                style={{ backgroundColor: RED_PRIMARY }}
              >
                <span className="text-white text-xs font-extrabold tracking-wide">19/08</span>
              </div>
              <p className="text-sm font-extrabold" style={{ color: RED_PRIMARY }}>
                Primeiro Comitê do beOn Labs
              </p>
            </div>

            <div className="border-t" style={{ borderColor: RED_BORDER }} />

            <ul className="space-y-2 text-xs text-gray-700 leading-relaxed">
              <li className="flex items-start gap-2">
                <span className="mt-[5px] h-1.5 w-1.5 rounded-full flex-shrink-0" style={{ backgroundColor: RED_ACCENT }} />
                <span><strong>Participação</strong> de 2 executivos (Gaiotto e Lívia)</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="mt-[5px] h-1.5 w-1.5 rounded-full flex-shrink-0" style={{ backgroundColor: RED_ACCENT }} />
                <span><strong>1 Laboratório</strong> Participante (beOn Labs)</span>
              </li>
            </ul>

            <div className="border-t" style={{ borderColor: RED_BORDER }} />

            <p className="text-[11px] font-bold uppercase tracking-wider" style={{ color: RED_MUTED }}>
              Encaminhamentos
            </p>

            <ul className="space-y-2 text-xs text-gray-700 leading-relaxed">
              <li className="flex items-start gap-2">
                <span className="mt-[5px] h-1.5 w-1.5 rounded-full flex-shrink-0" style={{ backgroundColor: RED_ACCENT }} />
                <span><strong>Pedido 1</strong> — Lívia solicita explicação de como endereçar novas iniciativas ao beOn Labs. <em className="text-gray-500">Resp: Daniel França</em></span>
              </li>
              <li className="flex items-start gap-2">
                <span className="mt-[5px] h-1.5 w-1.5 rounded-full flex-shrink-0" style={{ backgroundColor: RED_ACCENT }} />
                <span><strong>Pedido 2</strong> — Rodrigo Peres: quais perguntas/informações complementar na entrada de uma ideia/oportunidade na esteira do beOn Labs para captura de benefício.</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="mt-[5px] h-1.5 w-1.5 rounded-full flex-shrink-0" style={{ backgroundColor: RED_ACCENT }} />
                <span><strong>Pedido 3</strong> — Apresentar soluções de IA para incluir no catálogo do beOn Labs.</span>
              </li>
            </ul>
          </div>

          {/* ═══════════════ Card 2: Comunidade de Experimentação ═══════════════ */}
          <div className="rounded-xl border p-5 flex flex-col gap-3 bg-white" style={{ borderColor: RED_BORDER }}>
            <div className="flex items-center gap-3">
              <div
                className="flex-shrink-0 rounded-xl px-3 py-1.5 shadow-sm"
                style={{ backgroundColor: RED_PRIMARY }}
              >
                <span className="text-white text-xs font-extrabold tracking-wide">20/08</span>
              </div>
              <p className="text-sm font-extrabold" style={{ color: RED_PRIMARY }}>
                Comunidade de Experimentação beOn Labs
              </p>
            </div>

            <div className="border-t" style={{ borderColor: RED_BORDER }} />

            <ul className="space-y-2 text-xs text-gray-700 leading-relaxed">
              <li className="flex items-start gap-2">
                <span className="mt-[5px] h-1.5 w-1.5 rounded-full flex-shrink-0" style={{ backgroundColor: RED_ACCENT }} />
                <span>Apresentação do <strong>Processo de Experimentação</strong> — <em className="text-gray-500">Resp: Daniel França</em></span>
              </li>
            </ul>

            <div className="border-t" style={{ borderColor: RED_BORDER }} />

            <p className="text-[11px] font-bold uppercase tracking-wider" style={{ color: RED_MUTED }}>
              Principais Pontos Discutidos
            </p>

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
          </div>

          {/* ═══════════════ Card 3: Fórum de Tecnologia ═══════════════ */}
          <div className="rounded-xl border p-5 flex flex-col gap-3 bg-white" style={{ borderColor: RED_BORDER }}>
            <div className="flex items-center gap-3">
              <div
                className="flex-shrink-0 rounded-xl px-3 py-1.5 shadow-sm"
                style={{ backgroundColor: RED_PRIMARY }}
              >
                <span className="text-white text-xs font-extrabold tracking-wide">26/08</span>
              </div>
              <p className="text-sm font-extrabold" style={{ color: RED_PRIMARY }}>
                Fórum de Tecnologia do beOn Labs
              </p>
            </div>

            <div className="border-t" style={{ borderColor: RED_BORDER }} />

            <ul className="space-y-2 text-xs text-gray-700 leading-relaxed">
              <li className="flex items-start gap-2">
                <span className="mt-[5px] h-1.5 w-1.5 rounded-full flex-shrink-0" style={{ backgroundColor: RED_ACCENT }} />
                <span><strong>Participação</strong> de 28 pessoas</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="mt-[5px] h-1.5 w-1.5 rounded-full flex-shrink-0" style={{ backgroundColor: RED_ACCENT }} />
                <span><strong>2 Executivos</strong> Presentes (Gaiotto e Bordout)</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="mt-[5px] h-1.5 w-1.5 rounded-full flex-shrink-0" style={{ backgroundColor: RED_ACCENT }} />
                <span>Apresentação do Experimento <strong>CORI AGENT</strong> — Iniciativa de Operações Técnicas</span>
              </li>
            </ul>

            <div className="border-t" style={{ borderColor: RED_BORDER }} />

            <p className="text-[11px] font-bold uppercase tracking-wider" style={{ color: RED_MUTED }}>
              Principais Pontos Discutidos
            </p>

            <ul className="space-y-2 text-xs text-gray-700 leading-relaxed">
              <li className="flex items-start gap-2">
                <span className="mt-[5px] h-1.5 w-1.5 rounded-full flex-shrink-0" style={{ backgroundColor: RED_ACCENT }} />
                <span><strong>Modelos Open Source</strong> — Discussão sobre flexibilidade do Hub absorver modelos como Kimi, Qwen e Deepseek. <em className="text-gray-500">Gaiotto contribuiu com insights e se dispôs a avaliar caso a caso.</em></span>
              </li>
              <li className="flex items-start gap-2">
                <span className="mt-[5px] h-1.5 w-1.5 rounded-full flex-shrink-0" style={{ backgroundColor: RED_ACCENT }} />
                <span><strong>Otimização de Custos</strong> — Como otimizar custos com soluções robustas integrando vários modelos para tarefas específicas.</span>
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