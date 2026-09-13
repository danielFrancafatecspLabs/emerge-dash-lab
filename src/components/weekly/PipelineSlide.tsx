'use client'

import { useRef } from 'react'
import {
  Inbox, Cog, XCircle, CheckCircle2, Hourglass, FlaskConical, Rocket as StageRocket,
  AlertTriangle, User, Rocket, ArrowRightLeft, Target, Award, TrendingDown, Sparkles,
} from 'lucide-react'
import type { WeeklyData, WeeklyStageMotivo } from '@/lib/weekly'
import { SlideDownloadButtons } from '@/components/report/slideExport'

/* ── Paleta — rampa ordinal de um único matiz (vinho/vermelho escuro da
   marca), monotônica, ΔL >= 0.06, matiz único (spread 2°), contraste do
   texto branco entre 5.8:1 e 19.9:1 em todas as etapas. Validado com a
   skill de dataviz — scripts/validate_palette.js --ordinal. ── */
const RED = '#8B0000'
const WARNING_INK = '#92400E'
const RAMP = ['#C42420', '#A81715', '#8B1210', '#6E0E0D', '#500908', '#350505', '#1A0202']
// Ordem: Backlog, Em andamento, Cancelados, Concluídos, Aguardando piloto, Piloto, Em escala
const STAGE_ICONS = [Inbox, Cog, XCircle, CheckCircle2, Hourglass, FlaskConical, StageRocket]
const STAGE_TEXT = '#FFFFFF'
const STAGE_MUTED = 'rgba(255,255,255,0.82)'

// Trunca em JS em vez de depender de overflow:hidden + text-overflow:ellipsis —
// essa combinação, dentro de um card com clip-path, não é recortada corretamente
// pelo html2canvas na exportação (o texto "vaza" para o card vizinho), embora
// renderize certinho ao vivo no navegador. Ver notas de exportação no repo.
function truncate(str: string, max: number): string {
  if (str.length <= max) return str
  return str.slice(0, max - 1).trimEnd() + '…'
}

// Fileira de setas: TODOS os cards mantêm a MESMA altura fixa (172px) — inclusive
// o card de Cancelados, que encaixa a lista de motivos no mesmo espaço em vez de
// crescer. Misturar alturas diferentes na mesma linha já quebrou o clip-path no
// html2canvas em rodadas anteriores; ver notas de exportação no restante do repo.
function StageCard({ label, descricao, quantidade, index, total, motivos }: { label: string; descricao: string; quantidade: number; index: number; total: number; motivos?: WeeklyStageMotivo[] }) {
  const Icon = STAGE_ICONS[index]
  const text = STAGE_TEXT
  const muted = STAGE_MUTED
  const notch = 18
  let clipPath: string
  if (index === 0) {
    clipPath = `polygon(0% 0%, calc(100% - ${notch}px) 0%, 100% 50%, calc(100% - ${notch}px) 100%, 0% 100%)`
  } else if (index === total - 1) {
    clipPath = `polygon(0% 0%, 100% 0%, 100% 100%, 0% 100%, ${notch}px 50%)`
  } else {
    clipPath = `polygon(0% 0%, calc(100% - ${notch}px) 0%, 100% 50%, calc(100% - ${notch}px) 100%, 0% 100%, ${notch}px 50%)`
  }
  const temMotivos = !!motivos && motivos.length > 0
  return (
    <div
      style={{
        flex: 1,
        minWidth: 0,
        marginLeft: index === 0 ? 0 : -notch,
        clipPath,
        background: RAMP[index],
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        paddingTop: 16,
        paddingBottom: 12,
        paddingLeft: index === 0 ? 6 : notch + 6,
        paddingRight: 6,
        height: 172,
        boxSizing: 'border-box',
      }}
    >
      <div style={{
        width: 30, height: 30, borderRadius: 999, background: '#FFFFFF',
        display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
      }}>
        <Icon size={14} color={RED} strokeWidth={2.25} />
      </div>
      <div style={{ fontSize: 10.5, fontWeight: 800, color: text, textAlign: 'center', lineHeight: 1.15, marginTop: 7, width: '100%', overflowWrap: 'break-word', letterSpacing: -0.1 }}>
        {label}
      </div>
      <div style={{ fontSize: 22, fontWeight: 800, color: text, marginTop: 3, lineHeight: 1 }}>
        {quantidade}
      </div>
      {temMotivos ? (
        <div style={{ width: '100%', marginTop: 6, display: 'flex', flexDirection: 'column', gap: 2 }}>
          <div style={{ fontSize: 7, fontWeight: 700, color: muted, textAlign: 'center', textTransform: 'uppercase', letterSpacing: 0.4 }}>
            Principais motivos
          </div>
          {motivos!.map((m, i) => (
            <div key={i} style={{
              fontSize: 8, color: '#FFFFFF', lineHeight: 1.3, textAlign: 'left',
              width: '100%', overflowWrap: 'break-word',
            }}>
              <b>{m.count}×</b> {truncate(m.motivo, 20)}
            </div>
          ))}
        </div>
      ) : (
        <div style={{ fontSize: 8.5, color: muted, textAlign: 'center', lineHeight: 1.3, marginTop: 3, width: '100%', overflowWrap: 'break-word', minHeight: 22 }}>
          {descricao}
        </div>
      )}
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

export default function PipelineSlide({ data }: { data: WeeklyData }) {
  const slideRef = useRef<HTMLDivElement>(null)

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center justify-end">
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
            <div style={{ flex: 1, display: 'flex' }}>
              {data.stages.map((stage, i) => (
                <StageCard key={stage.id} label={stage.label} descricao={stage.descricao} quantidade={stage.quantidade} index={i} total={data.stages.length} motivos={stage.motivos} />
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
              <MetricCard icon={Target} label="Conversão para Piloto" value={`${data.conversaoPiloto}%`} caption={`${data.conversaoPilotoNumerador} de ${data.conversaoDenominador} iniciativas já em piloto`} tone="accent" />
              <MetricCard icon={Award} label="Conversão para Escala" value={`${data.conversaoEscala}%`} caption={`${data.conversaoEscalaNumerador} de ${data.conversaoDenominador} iniciativas já em escala`} tone="accent" />
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
