'use client'

import { useRef } from 'react'
import { SlideDownloadButtons } from './slideExport'
import { CATEGORIAS, RESUMO_INDICADORES, STATUS_BADGE } from '@/lib/bloqueios-data'
import type { BloqueioCategoria } from '@/lib/bloqueios-data'

/* ── Paleta beOn ── */
const RED = '#7A1212'
const RED_LIGHT = '#FEF2F2'
const GRAY_900 = '#111827'
const GRAY_800 = '#1F2937'
const GRAY_700 = '#374151'
const GRAY_600 = '#4B5563'
const GRAY_500 = '#6B7280'
const GRAY_400 = '#9CA3AF'
const GRAY_300 = '#D1D5DB'
const GRAY_200 = '#E5E7EB'
const GRAY_100 = '#F3F4F6'
const GRAY_50 = '#F9FAFB'
const WHITE = '#FFFFFF'

/* ── Badge de status: fundo neutro, borda 1px ── */
function StatusBadge({ status }: { status: string }) {
  const colors = STATUS_BADGE[status] ?? { bg: GRAY_100, text: GRAY_600, border: GRAY_300 }
  return (
    <span
      className="inline-block text-[7px] font-semibold px-1.5 py-0.5 rounded-sm leading-none border"
      style={{ backgroundColor: colors.bg, color: colors.text, borderColor: colors.border }}
    >
      {status}
    </span>
  )
}

/* ── Tag de problema relacionado ── */
function TagProblema({ label }: { label: string }) {
  return (
    <span
      className="inline-block text-[6px] px-1 py-0.5 rounded-sm leading-none mr-0.5 mb-0.5"
      style={{ backgroundColor: GRAY_100, color: GRAY_500, border: `1px solid ${GRAY_200}` }}
    >
      {label}
    </span>
  )
}

/* ── Tabela de iniciativas (layout compacto original, nome 15px semibold) ── */
function TabelaIniciativas({ items }: { items: BloqueioCategoria['items'] }) {
  return (
    <div className="flex-1 min-h-0">
      <table className="w-full border-collapse">
        <thead>
          <tr className="text-[6px] font-semibold uppercase tracking-[0.08em]" style={{ color: GRAY_400 }}>
            <th className="text-left font-medium pb-0.5 pr-2 w-[50%]">Iniciativa</th>
            <th className="text-left font-medium pb-0.5 px-2 w-[15%]">Status</th>
            <th className="text-left font-medium pb-0.5 px-2 w-[17%]">BO</th>
            <th className="text-left font-medium pb-0.5 pl-2 w-[18%]">Sponsor</th>
          </tr>
        </thead>
        <tbody>
          {items.map((item, i) => (
            <tr
              key={i}
              className="text-[7px]"
              style={{ borderBottom: `1px solid ${GRAY_100}` }}
            >
              <td className="pr-2 py-1">
                <div className="leading-tight" style={{ color: GRAY_900 }}>
                  <span className="font-semibold text-[12px]">{item.nome}</span>
                </div>
                {item.outrosProblemas && item.outrosProblemas.length > 0 && (
                  <div className="mt-0.5 flex flex-wrap">
                    {item.outrosProblemas.map((tag, j) => (
                      <TagProblema key={j} label={tag} />
                    ))}
                  </div>
                )}
                {item.motivo && (
                  <span className="block text-[6px] leading-tight mt-0.5 italic" style={{ color: GRAY_400 }}>
                    {item.motivo}
                  </span>
                )}
              </td>
              <td className="px-2 py-1 align-top">
                <StatusBadge status={item.status} />
              </td>
              <td className="px-2 py-1 align-top" style={{ color: GRAY_700 }}>
                <span className="leading-tight">{item.bo}</span>
              </td>
              <td className="pl-2 py-1 align-top" style={{ color: GRAY_700 }}>
                <span className="leading-tight">{item.sponsor}</span>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

/* ── Quadrante individual (layout compacto original) ── */
function Quadrante({ cat }: { cat: BloqueioCategoria }) {
  return (
    <div
      className="rounded-lg border flex flex-col"
      style={{
        borderColor: GRAY_200,
        backgroundColor: WHITE,
      }}
    >
      {/* Header com marcador lateral */}
      <div
        className="flex items-center justify-between px-3 py-1.5"
        style={{
          borderBottom: `1px solid ${GRAY_100}`,
          borderLeft: `3px solid ${RED}`,
        }}
      >
        <div className="flex items-center gap-2 min-w-0">
          <span className="text-[8px] font-bold uppercase tracking-[0.08em] truncate" style={{ color: GRAY_800 }}>
            {cat.titulo}
          </span>
          <span
            className="text-[7px] font-bold px-1.5 py-0.5 rounded-sm flex-shrink-0"
            style={{ backgroundColor: RED_LIGHT, color: RED }}
          >
            {cat.items.length}
          </span>
        </div>
      </div>

      {/* Tabela */}
      <div className="px-3 py-1.5 flex-1 min-h-0">
        <TabelaIniciativas items={cat.items} />
      </div>

      {/* Footer */}
      <div
        className="px-3 py-1 text-[6px] leading-relaxed mt-auto"
        style={{ backgroundColor: GRAY_50, borderTop: `1px solid ${GRAY_100}`, color: GRAY_500 }}
      >
        <span className="font-semibold" style={{ color: GRAY_700 }}>Impacto:</span>{' '}
        {cat.footer.replace('Impacto: ', '')}
      </div>
    </div>
  )
}

/* ── Sub-componente de slide individual ── */
function SlideContent({
  titulo,
  subtitulo,
  categorias,
  resumo,
  slideNum,
  totalSlides,
}: {
  titulo: string
  subtitulo: string
  categorias: BloqueioCategoria[]
  resumo: typeof RESUMO_INDICADORES
  slideNum: number
  totalSlides: number
}) {
  return (
    <>
      {/* ── Cabeçalho ── */}
      <div className="px-6 pt-5 pb-3">
        <div className="flex items-center justify-between mb-1">
          <p className="text-[10px] font-bold uppercase tracking-[0.25em]" style={{ color: RED }}>
            Comitê BeOn Labs
          </p>
          <span className="text-[8px] font-semibold" style={{ color: GRAY_400 }}>
            {slideNum} / {totalSlides}
          </span>
        </div>
        <h1 className="text-[20px] font-extrabold leading-tight mb-1" style={{ color: GRAY_900 }}>
          {titulo}
        </h1>
        <p className="text-[11px] leading-relaxed max-w-3xl" style={{ color: GRAY_500 }}>
          {subtitulo}
        </p>
      </div>

      {/* ── Resumo Executivo ── */}
      <div className="px-6 mb-3">
        <p className="text-[8px] font-bold uppercase tracking-[0.2em] mb-2" style={{ color: GRAY_400 }}>
          Resumo Executivo
        </p>
        <div className="grid grid-cols-5 gap-2">
          {resumo.map((ind) => (
            <div
              key={ind.titulo}
              className="rounded-lg p-2.5 flex flex-col gap-1"
              style={{ backgroundColor: GRAY_50, border: `1px solid ${GRAY_200}` }}
            >
              <div className="flex items-center gap-1.5">
                <div className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ backgroundColor: RED }} />
                <span className="text-[7px] font-bold uppercase tracking-[0.06em] leading-tight" style={{ color: GRAY_700 }}>
                  {ind.titulo}
                </span>
              </div>
              <div className="text-[22px] font-black leading-none" style={{ color: RED }}>
                {ind.quantidade}
              </div>
              <p className="text-[7px] leading-relaxed" style={{ color: GRAY_500 }}>
                {ind.descricao}
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* ── Detalhamento ── */}
      <div className="px-6 mb-3">
        <p className="text-[8px] font-bold uppercase tracking-[0.2em] mb-2" style={{ color: GRAY_400 }}>
          Detalhamento dos Bloqueios por Problema
        </p>
        <div
          className="grid gap-3"
          style={{
            gridTemplateColumns: `repeat(${Math.min(categorias.length, 3)}, 1fr)`,
          }}
        >
          {categorias.map((cat) => (
            <Quadrante key={cat.id} cat={cat} />
          ))}
        </div>
      </div>

      {/* ── Nota + Rodapé Executivo ── */}
      <div className="px-6 pb-5">
        <div className="flex gap-3">
          <div
            className="rounded-lg border px-3 py-2 text-[7px] leading-relaxed flex items-center"
            style={{ borderColor: GRAY_200, backgroundColor: GRAY_50, color: GRAY_500, flex: '0 0 320px' }}
          >
            <span className="font-semibold" style={{ color: GRAY_700 }}>Nota:</span>{' '}
            Os números do Resumo Executivo refletem a contagem real de iniciativas em cada bloco.
            Iniciativas com múltiplos problemas aparecem em todos os blocos correspondentes.
          </div>
          <div
            className="rounded-lg px-4 py-3 flex-1"
            style={{ backgroundColor: GRAY_900 }}
          >
            <div className="grid grid-cols-2 gap-6">
              <div>
                <p className="text-[7px] font-bold uppercase tracking-[0.2em] mb-1" style={{ color: GRAY_400 }}>
                  Impacto Geral
                </p>
                <p className="text-[8px] leading-relaxed" style={{ color: '#D1D5DB' }}>
                  Os bloqueios identificados comprometem prazos, validações e a capacidade de demonstrar o valor das iniciativas,
                  podendo impactar a evolução e priorização do portfólio do beOn Labs.
                </p>
              </div>
              <div>
                <p className="text-[7px] font-bold uppercase tracking-[0.2em] mb-1" style={{ color: GRAY_400 }}>
                  Próximos Passos
                </p>
                <ul className="text-[7px] leading-relaxed space-y-0.5" style={{ color: '#D1D5DB' }}>
                  {[
                    'Reforçar o engajamento das áreas de negócio.',
                    'Garantir amostras de dados e acessos necessários.',
                    'Mapear e validar os benefícios potenciais das iniciativas.',
                    'Alinhar prioridades e dependências com as áreas parceiras.',
                    'Viabilizar ambientes necessários para testes e experimentação.',
                  ].map((item, i) => (
                    <li key={i} className="flex items-start gap-1.5">
                      <span className="mt-0.5 w-1 h-1 rounded-full flex-shrink-0" style={{ backgroundColor: '#D1D5DB' }} />
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  )
}

/* ── Componente principal: 2 slides (3 + 2 quadrantes) ── */
export default function BloqueiosExecutivoSlide() {
  const slide1Ref = useRef<HTMLDivElement>(null)
  const slide2Ref = useRef<HTMLDivElement>(null)

  const slide1Cats = CATEGORIAS.slice(0, 3) // engajamento, beneficios, amostra-dados
  const slide2Cats = CATEGORIAS.slice(3)    // outras, ambiente

  return (
    <div className="flex flex-col gap-6">
      <div className="no-print flex items-center justify-between">
        <p className="text-xs font-semibold text-gray-400 uppercase tracking-widest">
          Slide Executivo — Bloqueios (2 slides)
        </p>
        <div className="flex gap-2">
          <SlideDownloadButtons targetRef={slide1Ref} filename="bloqueios-executivo-beon-labs-p1" />
          <SlideDownloadButtons targetRef={slide2Ref} filename="bloqueios-executivo-beon-labs-p2" />
        </div>
      </div>

      {/* ═══ Slide 1: 3 quadrantes ═══ */}
      <div ref={slide1Ref} className="relative bg-white rounded-lg overflow-hidden w-full">
        <SlideContent
          titulo="Bloqueios das Iniciativas por Problema"
          subtitulo="Visão executiva dos principais problemas que estão impedindo o avanço das iniciativas do beOn Labs."
          categorias={slide1Cats}
          resumo={RESUMO_INDICADORES}
          slideNum={1}
          totalSlides={2}
        />
      </div>

      {/* ═══ Slide 2: 2 quadrantes ═══ */}
      <div ref={slide2Ref} className="relative bg-white rounded-lg overflow-hidden w-full">
        <SlideContent
          titulo="Bloqueios das Iniciativas por Problema (cont.)"
          subtitulo="Demais bloqueios identificados no portfólio do beOn Labs."
          categorias={slide2Cats}
          resumo={RESUMO_INDICADORES}
          slideNum={2}
          totalSlides={2}
        />
      </div>
    </div>
  )
}