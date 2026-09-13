'use client'

import { useEffect, useRef, useState } from 'react'
import {
  Lightbulb, FileText, Cog, Clock, FlaskConical, BarChart3,
  AlertTriangle, User, Rocket, ArrowRightLeft, Target, Award, TrendingDown, Sparkles,
} from 'lucide-react'
import type { WeeklyData } from '@/lib/weekly'
import { SlideDownloadButtons } from '@/components/report/slideExport'

/* ── Paleta — rampa ordinal de um único matiz (vermelho da marca) em tons
   escuros, com texto branco em todas as etapas: monotônica, ΔL >= 0.06,
   contraste do texto branco >= 5.3:1 até no tom mais claro. Ver skill de
   dataviz — validado com scripts/validate_palette.js --ordinal. ── */
const RED = '#8B0000'
const RAMP = ['#D11D1A', '#AC1815', '#881311', '#680E0D', '#490A09', '#290605']
const WARNING_INK = '#92400E'
const STAGE_ICONS = [Lightbulb, FileText, Cog, Clock, FlaskConical, BarChart3]

function StageCard({ label, descricao, quantidade, index, total }: { label: string; descricao: string; quantidade: number; index: number; total: number }) {
  const Icon = STAGE_ICONS[index]
  const notch = 18
  let clipPath: string
  if (index === 0) {
    clipPath = `polygon(0% 0%, calc(100% - ${notch}px) 0%, 100% 50%, calc(100% - ${notch}px) 100%, 0% 100%)`
  } else if (index === total - 1) {
    clipPath = `polygon(0% 0%, 100% 0%, 100% 100%, 0% 100%, ${notch}px 50%)`
  } else {
    clipPath = `polygon(0% 0%, calc(100% - ${notch}px) 0%, 100% 50%, calc(100% - ${notch}px) 100%, 0% 100%, ${notch}px 50%)`
  }
  return (
    <div
      style={{
        flex: 1,
        marginLeft: index === 0 ? 0 : -notch,
        clipPath,
        background: RAMP[index],
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        paddingTop: 18,
        paddingBottom: 14,
        paddingLeft: index === 0 ? 10 : notch + 10,
        paddingRight: 10,
        height: 172,
        boxSizing: 'border-box',
      }}
    >
      <div style={{
        width: 36, height: 36, borderRadius: 999, background: 'rgba(255,255,255,0.92)',
        display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
      }}>
        <Icon size={16} color={RED} strokeWidth={2.25} />
      </div>
      <div style={{ fontSize: 13.5, fontWeight: 800, color: '#FFFFFF', textAlign: 'center', lineHeight: 1.15, marginTop: 9 }}>
        {label}
      </div>
      <div style={{ fontSize: 9.5, color: 'rgba(255,255,255,0.8)', textAlign: 'center', lineHeight: 1.3, marginTop: 3, maxWidth: 140, minHeight: 24 }}>
        {descricao}
      </div>
      <div style={{ fontSize: 32, fontWeight: 800, color: '#FFFFFF', marginTop: 5, lineHeight: 1 }}>
        {quantidade}
      </div>
    </div>
  )
}

const TONE_STYLES = {
  neutral: { bar: '#9CA3AF', chip: '#F3F4F6', value: '#111827', bg: '#FAFAFA', border: '#EFEFEF' },
  accent: { bar: RED, chip: '#FBEAEA', value: RED, bg: '#FDF6F6', border: '#F5DEDE' },
  warn: { bar: '#D97706', chip: '#FEF3C7', value: WARNING_INK, bg: '#FFFBEB', border: '#FAE8C4' },
} as const

function MetricCard({
  icon: Icon, label, value, caption, tone = 'neutral',
}: { icon: typeof Rocket; label: string; value: string; caption: string; tone?: keyof typeof TONE_STYLES }) {
  const t = TONE_STYLES[tone]
  return (
    <div style={{
      flex: 1, display: 'flex', flexDirection: 'column', background: t.bg,
      border: `1px solid ${t.border}`, borderRadius: 12, overflow: 'hidden',
    }}>
      <div style={{ height: 3, background: t.bar }} />
      <div style={{ padding: '12px 13px', display: 'flex', flexDirection: 'column', gap: 6 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
          <div style={{
            width: 24, height: 24, borderRadius: 7, flexShrink: 0, background: t.chip,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <Icon size={13} color={t.value} strokeWidth={2.25} />
          </div>
          <div style={{ fontSize: 9.5, fontWeight: 700, color: '#6B7280', textTransform: 'uppercase', letterSpacing: 0.3, lineHeight: 1.25 }}>
            {label}
          </div>
        </div>
        <div style={{ fontSize: 25, fontWeight: 800, color: t.value, lineHeight: 1 }}>
          {value}
        </div>
        <div style={{ fontSize: 9.5, color: '#9CA3AF', lineHeight: 1.3, minHeight: 24 }}>
          {caption}
        </div>
      </div>
    </div>
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
            <div style={{ flex: 1, display: 'flex', alignItems: 'stretch' }}>
              {data.stages.map((stage, i) => (
                <StageCard key={stage.id} label={stage.label} descricao={stage.descricao} quantidade={stage.quantidade} index={i} total={data.stages.length} />
              ))}
            </div>
          </div>

          {/* Métricas da semana — volume, conversão e riscos de dados, todas
              no mesmo formato de card para leitura rápida e comparável */}
          <div>
            <div style={{ fontSize: 10, fontWeight: 700, color: '#9CA3AF', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 8 }}>
              Métricas da semana
            </div>
            <div style={{ display: 'flex', gap: 10 }}>
              <MetricCard icon={Rocket} label="Experimentos iniciados" value={String(data.totalIniciados)} caption="Em andamento + Validação + Concluído" />
              <MetricCard icon={ArrowRightLeft} label="Oportunidades → Experimentos" value={`${data.taxaOportunidadesParaExperimentos}%`} caption="Do backlog que virou experimento" tone="accent" />
              <MetricCard icon={Target} label="Conversão para Piloto" value={`${data.conversaoPiloto}%`} caption="Iniciativas que já chegaram ao piloto" tone="accent" />
              <MetricCard icon={Award} label="Conversão para Escala" value={`${data.conversaoEscala}%`} caption="Iniciativas que já chegaram à escala" tone="accent" />
              <MetricCard icon={AlertTriangle} label="Sem benefício potencial" value={String(data.semBeneficio.count)} caption={`${data.semBeneficio.pct}% dos experimentos, sem R$ nem relato`} tone="warn" />
              <MetricCard icon={User} label="Sem sponsor identificado" value={String(data.semSponsor.count)} caption={`${data.semSponsor.pct}% dos experimentos sem sponsor`} tone="warn" />
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
