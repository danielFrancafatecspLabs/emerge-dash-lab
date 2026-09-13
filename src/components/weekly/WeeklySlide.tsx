'use client'

import { useEffect, useRef, useState, type ReactNode } from 'react'
import {
  FileText, Cog, Clock, FlaskConical, BarChart3, ChevronRight,
  AlertTriangle, User, Rocket, ArrowRightLeft, TrendingDown, Sparkles,
} from 'lucide-react'
import type { WeeklyData } from '@/lib/weekly'
import { SlideDownloadButtons } from '@/components/report/slideExport'

/* ── Paleta — rampa ordinal de um único matiz (vermelho da marca),
   validada: monotônica, ΔL >= 0.06 entre etapas, extremo claro >= 2:1
   de contraste contra o fundo branco. Ver skill de dataviz. ── */
const RED = '#8B0000'
const RAMP = ['#E79E9E', '#DA7373', '#C94848', '#AE2828', '#8B0000']
const RAMP_TINT = ['#FBEFEF', '#FAEAEA', '#F8E1E1', '#F5D5D5', '#F1C7C7']
const WARNING_INK = '#92400E'
const STAGE_ICONS = [FileText, Cog, Clock, FlaskConical, BarChart3]

function StageCard({ label, descricao, quantidade, index }: { label: string; descricao: string; quantidade: number; index: number }) {
  const Icon = STAGE_ICONS[index]
  return (
    <div
      style={{
        flex: 1,
        background: '#FFFFFF',
        border: '1px solid #EFEFEF',
        borderRadius: 14,
        boxShadow: '0 1px 2px rgba(17,24,39,0.04)',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        padding: '20px 12px 16px',
        boxSizing: 'border-box',
      }}
    >
      <div style={{
        width: 38, height: 38, borderRadius: 999, background: RAMP_TINT[index],
        display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
      }}>
        <Icon size={17} color={RAMP[index]} strokeWidth={2.25} />
      </div>
      <div style={{ fontSize: 13.5, fontWeight: 700, color: '#111827', textAlign: 'center', lineHeight: 1.15, marginTop: 11 }}>
        {label}
      </div>
      <div style={{ fontSize: 9.5, color: '#9CA3AF', textAlign: 'center', lineHeight: 1.3, marginTop: 3, maxWidth: 140, minHeight: 24 }}>
        {descricao}
      </div>
      <div style={{ fontSize: 34, fontWeight: 800, color: '#111827', marginTop: 6, lineHeight: 1 }}>
        {quantidade}
      </div>
      <div style={{ width: 28, height: 3, borderRadius: 999, background: RAMP[index], marginTop: 9 }} />
    </div>
  )
}

function StageConnector() {
  return (
    <div style={{ width: 22, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
      <ChevronRight size={15} color="#D1D5DB" strokeWidth={2.5} />
    </div>
  )
}

function KpiTile({
  icon: Icon, label, value, sublabel, accent, warn,
}: { icon: typeof Rocket; label: string; value: string; sublabel?: string; accent?: boolean; warn?: boolean }) {
  const valueColor = warn ? WARNING_INK : accent ? RED : '#111827'
  return (
    <div style={{ flex: 1, display: 'flex', alignItems: 'flex-start', gap: 10 }}>
      <div style={{
        width: 34, height: 34, borderRadius: 10, flexShrink: 0,
        background: warn ? '#FEF3C7' : accent ? '#FBEAEA' : '#F3F4F6',
        display: 'flex', alignItems: 'center', justifyContent: 'center', marginTop: 1,
      }}>
        <Icon size={16} color={valueColor} strokeWidth={2.25} />
      </div>
      <div style={{ minWidth: 0 }}>
        <div style={{ fontSize: 10, fontWeight: 700, color: '#9CA3AF', textTransform: 'uppercase', letterSpacing: 0.4, lineHeight: 1.3 }}>
          {label}
        </div>
        <div style={{ fontSize: 26, fontWeight: 800, color: valueColor, lineHeight: 1.2, marginTop: 1 }}>
          {value}
        </div>
        {sublabel && (
          <div style={{ fontSize: 10, color: '#9CA3AF', lineHeight: 1.3, marginTop: 1 }}>{sublabel}</div>
        )}
      </div>
    </div>
  )
}

function ConversionRing({ pct }: { pct: number }) {
  const size = 52
  const stroke = 6
  const r = (size - stroke) / 2
  const c = 2 * Math.PI * r
  const offset = c - (Math.min(pct, 100) / 100) * c
  return (
    <svg width={size} height={size} style={{ transform: 'rotate(-90deg)', flexShrink: 0 }}>
      <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="#F3D6D6" strokeWidth={stroke} />
      <circle
        cx={size / 2} cy={size / 2} r={r} fill="none" stroke={RED} strokeWidth={stroke}
        strokeDasharray={c} strokeDashoffset={offset} strokeLinecap="round"
      />
    </svg>
  )
}

export default function WeeklySlide() {
  const [data, setData] = useState<WeeklyData | null>(null)
  const [error, setError] = useState<string | null>(null)
  const slideRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    fetch('/jira/api/weekly', { credentials: 'include' })
      .then(r => r.json())
      .then(json => setData(json))
      .catch(err => setError(err.message))
  }, [])

  if (error) {
    return <p className="text-sm" style={{ color: RED }}>Erro ao carregar dados: {error}</p>
  }
  if (!data) {
    return <p className="text-sm text-gray-400">Carregando…</p>
  }

  const geradoEmLabel = new Date(data.geradoEm).toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' })

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          {data.isSample && (
            <span
              style={{ fontSize: 11, fontWeight: 700, color: WARNING_INK, background: '#FEF3C7', padding: '3px 8px', borderRadius: 999 }}
              title="O Jira não respondeu; estes são dados de exemplo para pré-visualizar o layout."
            >
              Dados de exemplo (Jira indisponível)
            </span>
          )}
          <span className="text-xs text-gray-400">Gerado em {geradoEmLabel}</span>
        </div>
        <SlideDownloadButtons targetRef={slideRef} filename="weekly-pipeline-experimentos" />
      </div>

      {/* ═══ Slide 1280×720 (16:9 — dimensão de slide de PowerPoint) ═══ */}
      <div className="rounded-2xl shadow-xl" style={{ width: 1280, overflow: 'hidden', boxShadow: '0 12px 40px rgba(17,24,39,0.14)' }}>
        <div
          ref={slideRef}
          style={{
            width: 1280,
            height: 720,
            background: '#FFFFFF',
            padding: 46,
            boxSizing: 'border-box',
            display: 'flex',
            flexDirection: 'column',
            gap: 18,
          }}
        >
          {/* Cabeçalho */}
          <div>
            <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: 2, color: '#9CA3AF', textTransform: 'uppercase' }}>
              Jornada de Experimentação · Weekly
            </div>
            <div style={{ fontSize: 30, fontWeight: 800, color: '#111827', marginTop: 5, lineHeight: 1.1, letterSpacing: -0.3 }}>
              Nossa pipeline de experimentos
            </div>
            <div style={{ fontSize: 13, color: '#6B7280', marginTop: 4 }}>
              Da ideia à escala, impulsionando aprendizado, soluções e impacto para o negócio.
            </div>
          </div>

          {/* Funil — volume por etapa */}
          <div style={{ display: 'flex' }}>
            <div style={{ width: 96, display: 'flex', flexDirection: 'column', justifyContent: 'flex-end', paddingBottom: 66, flexShrink: 0 }}>
              <div style={{ fontSize: 10, fontWeight: 700, color: '#9CA3AF', textTransform: 'uppercase', letterSpacing: 0.5, lineHeight: 1.4 }}>
                Etapas da<br />jornada
              </div>
            </div>
            <div style={{ flex: 1, display: 'flex', alignItems: 'stretch', gap: 4 }}>
              {data.stages.map((stage, i) => (
                <StageCard key={stage.id} label={stage.label} descricao={stage.descricao} quantidade={stage.quantidade} index={i} />
              )).reduce((acc: ReactNode[], card, i) => {
                if (i > 0) acc.push(<StageConnector key={`c-${i}`} />)
                acc.push(card)
                return acc
              }, [])}
            </div>
          </div>

          {/* KPIs agregados do funil inteiro */}
          <div style={{ display: 'flex', gap: 28, borderTop: '1px solid #F3F4F6', borderBottom: '1px solid #F3F4F6', padding: '14px 0' }}>
            <KpiTile icon={Rocket} label="Experimentos iniciados" value={String(data.totalIniciados)} sublabel="saíram do backlog" />
            <KpiTile icon={ArrowRightLeft} label="Oportunidades → Experimentos" value={`${data.taxaOportunidadesParaExperimentos}%`} sublabel="taxa de conversão" accent />
            <KpiTile icon={AlertTriangle} label="Sem benefício potencial" value={String(data.semBeneficio.count)} sublabel={`${data.semBeneficio.pct}% do funil`} warn />
            <KpiTile icon={User} label="Sem sponsor identificado" value={String(data.semSponsor.count)} sublabel={`${data.semSponsor.pct}% do funil`} warn />
          </div>

          {/* Conversões — mesma lógica da aba Estratégia: % de todas as
              iniciativas que já chegaram a Piloto / Escala */}
          <div style={{ display: 'flex' }}>
            <div style={{ width: 96, flexShrink: 0, fontSize: 10, fontWeight: 700, color: '#9CA3AF', textTransform: 'uppercase', letterSpacing: 0.5, lineHeight: 1.4, display: 'flex', alignItems: 'center' }}>
              Principais<br />conversões
            </div>
            <div style={{ flex: 1, display: 'flex', alignItems: 'center', gap: 64 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <ConversionRing pct={data.conversaoPiloto} />
                <div style={{ minWidth: 0 }}>
                  <div style={{ fontSize: 22, fontWeight: 800, color: RED, lineHeight: 1.1 }}>{data.conversaoPiloto}%</div>
                  <div style={{ fontSize: 11, color: '#6B7280', lineHeight: 1.3, marginTop: 1 }}>Conversão para Piloto</div>
                </div>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <ConversionRing pct={data.conversaoEscala} />
                <div style={{ minWidth: 0 }}>
                  <div style={{ fontSize: 22, fontWeight: 800, color: RED, lineHeight: 1.1 }}>{data.conversaoEscala}%</div>
                  <div style={{ fontSize: 11, color: '#6B7280', lineHeight: 1.3, marginTop: 1 }}>Conversão para Escala</div>
                </div>
              </div>
              <div style={{ flex: 1, height: 1, background: 'linear-gradient(to right, #F3F4F6, transparent)' }} />
            </div>
          </div>

          {/* Narrativa executiva — gargalo calculado a partir dos dados + leitura geral */}
          <div style={{
            flex: 1, display: 'flex', alignItems: 'stretch', background: '#FAFAFA',
            border: '1px solid #F0F0F0', borderRadius: 12, overflow: 'hidden', minHeight: 0,
          }}>
            <div style={{ width: 5, background: RED, flexShrink: 0 }} />
            <div style={{ flex: 1, padding: '14px 22px', display: 'flex', flexDirection: 'column', justifyContent: 'center', gap: 8 }}>
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10 }}>
                <TrendingDown size={15} color={RED} style={{ flexShrink: 0, marginTop: 2 }} />
                <span style={{ fontSize: 13.5, color: '#111827', fontWeight: 600, lineHeight: 1.4 }}>
                  {data.insightPrincipal}
                </span>
              </div>
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10 }}>
                <Sparkles size={15} color="#9CA3AF" style={{ flexShrink: 0, marginTop: 2 }} />
                <span style={{ fontSize: 12.5, color: '#6B7280', lineHeight: 1.4 }}>
                  {data.insightPositivo}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
