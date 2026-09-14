'use client'

import { useRef, useState } from 'react'
import {
  Inbox, Cog, XCircle, CheckCircle2, Hourglass, FlaskConical, Rocket as StageRocket,
  AlertTriangle, User, Rocket, Target, Award, TrendingDown, CornerDownRight, Lightbulb,
  ListFilter, ChevronDown, ChevronUp, Link2,
} from 'lucide-react'
import type { WeeklyData, WeeklyStageMotivo } from '@/lib/weekly'
import { SlideDownloadButtons } from '@/components/report/slideExport'
import StageDetalhesSlides from './StageDetalhesSlides'
import AprendizadosSlide from './AprendizadosSlide'
import PatrocinadoresSlide from './PatrocinadoresSlide'

/* ── Paleta — rampa ordinal de um único matiz (vinho/vermelho escuro da
   marca), monotônica, ΔL >= 0.06, matiz único (spread 2°), contraste do
   texto branco entre 5.8:1 e 19.9:1 em todas as etapas. Validado com a
   skill de dataviz — scripts/validate_palette.js --ordinal. ── */
const RED = '#8B0000'
const WARNING_INK = '#92400E'
const RAMP = ['#C42420', '#A81715', '#8B1210', '#6E0E0D', '#500908', '#350505', '#1A0202']
// Ordem: Backlog, Em andamento, Cancelados, Concluídos (funil principal) —
// Aguardando piloto, Piloto, Em escala continuam a rampa, mas nascem DENTRO
// de Concluídos (ver ramo abaixo), não como fases sequenciais independentes.
const STAGE_ICONS = [Inbox, Cog, XCircle, CheckCircle2, Hourglass, FlaskConical, StageRocket]
const STAGE_TEXT = '#FFFFFF'
const STAGE_MUTED = 'rgba(255,255,255,0.82)'
const MAIN_STAGE_COUNT = 4
const LABEL_COLUMN_WIDTH = 96
// Offset onde o funil principal (Backlog) começa — usado para alinhar as
// fileiras de anotação abaixo dele com a coluna de rótulo "Etapas da jornada".
const FUNNEL_START_OFFSET = LABEL_COLUMN_WIDTH

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

const MINI_STAGE_ICONS = [Hourglass, FlaskConical, StageRocket]
const MINI_STAGE_HEIGHT = 78

// Ramo derivado de Concluídos: mesma técnica de seta/chevron do funil
// principal (altura uniforme na fileira, sem calc()/position:absolute) só
// que menor, para deixar visualmente claro que é um sub-funil, não uma
// continuação da mesma hierarquia.
function MiniStageCard({ label, quantidade, index, total }: { label: string; quantidade: number; index: number; total: number }) {
  const Icon = MINI_STAGE_ICONS[index]
  const notch = 12
  let clipPath: string
  if (index === 0) {
    clipPath = `polygon(0% 0%, calc(100% - ${notch}px) 0%, 100% 50%, calc(100% - ${notch}px) 100%, 0% 100%)`
  } else if (index === total - 1) {
    clipPath = `polygon(0% 0%, 100% 0%, 100% 100%, 0% 100%, ${notch}px 50%)`
  } else {
    clipPath = `polygon(0% 0%, calc(100% - ${notch}px) 0%, 100% 50%, calc(100% - ${notch}px) 100%, 0% 100%, ${notch}px 50%)`
  }
  return (
    <div style={{
      flex: 1, minWidth: 0, marginLeft: index === 0 ? 0 : -notch, clipPath,
      background: RAMP[MAIN_STAGE_COUNT + index], display: 'flex', flexDirection: 'column',
      alignItems: 'center', justifyContent: 'center', paddingTop: 7, paddingBottom: 6,
      paddingLeft: index === 0 ? 6 : notch + 6, paddingRight: 6, height: MINI_STAGE_HEIGHT, boxSizing: 'border-box',
    }}>
      <div style={{
        width: 19, height: 19, borderRadius: 999, background: '#FFFFFF', flexShrink: 0,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}>
        <Icon size={10} color={RED} strokeWidth={2.25} />
      </div>
      <div style={{ fontSize: 9, fontWeight: 800, color: '#FFFFFF', textAlign: 'center', lineHeight: 1.1, marginTop: 4, width: '100%', overflowWrap: 'break-word' }}>
        {label}
      </div>
      <div style={{ fontSize: 15, fontWeight: 800, color: '#FFFFFF', marginTop: 1, lineHeight: 1 }}>
        {quantidade}
      </div>
    </div>
  )
}

// Card do outro ramo (não segue o formato de seta de propósito): o
// aprendizado que NÃO avançou para piloto/escala tem o mesmo peso visual dos
// mini-cards ao lado, mas sem ser mais uma "etapa" — é o fim de um caminho.
function AprendizadoRamoCard({ quantidade }: { quantidade: number }) {
  return (
    <div style={{
      flex: 1, minWidth: 0, height: MINI_STAGE_HEIGHT, boxSizing: 'border-box',
      background: '#FCEAEA', border: '1px dashed #E8B4B4', borderRadius: 10,
      display: 'flex', alignItems: 'center', gap: 10, padding: '0 14px',
    }}>
      <div style={{
        width: 26, height: 26, borderRadius: 999, background: '#FFFFFF', flexShrink: 0,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}>
        <Lightbulb size={13} color={RED} strokeWidth={2.25} />
      </div>
      <div style={{ minWidth: 0 }}>
        <div style={{ fontSize: 9.5, fontWeight: 800, color: RED, lineHeight: 1.2, textTransform: 'uppercase', letterSpacing: 0.2 }}>
          Aprendizado sem escalar
        </div>
        <div style={{ fontSize: 9, color: '#7A4B4B', lineHeight: 1.25, marginTop: 2 }}>
          <b style={{ fontSize: 16, color: RED }}>{quantidade}</b> concluídos viraram benchmark ou hipótese validada/refutada, sem seguir para piloto
        </div>
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
      <div style={{ padding: '9px 13px', display: 'flex', flexDirection: 'column', gap: 4 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
          <div style={{
            width: 22, height: 22, borderRadius: 7, flexShrink: 0, background: t.chip,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <Icon size={12} color={t.value} strokeWidth={2.25} />
          </div>
          <div style={{ fontSize: 9.5, fontWeight: 700, color: '#6B7280', textTransform: 'uppercase', letterSpacing: 0.3, lineHeight: 1.25 }}>
            {label}
          </div>
        </div>
        <div style={{ fontSize: 22, fontWeight: 800, color: t.value, lineHeight: 1 }}>
          {value}
        </div>
        <div style={{ fontSize: 9.5, color: '#9CA3AF', lineHeight: 1.3, minHeight: 20 }}>
          {caption}
        </div>
      </div>
    </div>
  )
}

export default function PipelineSlide({ data }: { data: WeeklyData }) {
  const slideRef = useRef<HTMLDivElement>(null)
  const [stageAberta, setStageAberta] = useState<string | null>(null)

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
            padding: '40px 46px',
            boxSizing: 'border-box',
            display: 'flex',
            flexDirection: 'column',
            gap: 11,
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

          {/* Funil principal — Backlog até Concluídos (experimentos já
              aprovados, board de Experimentação). "Pendente para Análise"
              (ideias cruas do board de Ideação) fica no slide 1. */}
          <div style={{ display: 'flex', gap: 10 }}>
            <div style={{ width: LABEL_COLUMN_WIDTH, display: 'flex', flexDirection: 'column', justifyContent: 'flex-end', paddingBottom: 66, flexShrink: 0 }}>
              <div style={{ fontSize: 10, fontWeight: 700, color: '#9CA3AF', textTransform: 'uppercase', letterSpacing: 0.5, lineHeight: 1.4 }}>
                Etapas da<br />jornada
              </div>
            </div>
            <div style={{ flex: 1, display: 'flex' }}>
              {data.stages.slice(0, MAIN_STAGE_COUNT).map((stage, i) => (
                <StageCard key={stage.id} label={stage.label} descricao={stage.descricao} quantidade={stage.quantidade} index={i} total={MAIN_STAGE_COUNT} motivos={stage.motivos} />
              ))}
            </div>
          </div>

          {/* Anotações do funil: (1) interligação Em andamento + Concluídos =
              fatia dos experimentos aprovados (slide 1) já em execução real ou
              concluída; (2) Aguardando piloto/Piloto/Em escala nascem DENTRO
              do total de Concluídos, não são uma continuação sequencial. */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <div style={{ width: FUNNEL_START_OFFSET, flexShrink: 0 }} />
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <Link2 size={11} color={RED} strokeWidth={2.5} />
                <span style={{ fontSize: 9, fontWeight: 800, color: RED, textTransform: 'uppercase', letterSpacing: 0.3 }}>
                  Em andamento + Concluídos = {data.emAndamentoMaisConcluidos}
                </span>
                <span style={{ fontSize: 9, color: '#9CA3AF' }}>
                  de {data.experimentosAprovados} experimentos aprovados (slide 1) já em execução real ou concluída
                </span>
              </div>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <div style={{ width: FUNNEL_START_OFFSET, flexShrink: 0 }} />
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <CornerDownRight size={11} color={RED} strokeWidth={2.5} />
                <span style={{ fontSize: 9, fontWeight: 800, color: RED, textTransform: 'uppercase', letterSpacing: 0.3 }}>
                  Dentro dos {data.stages[3].quantidade} concluídos
                </span>
                <span style={{ fontSize: 9, color: '#9CA3AF' }}>
                  — parte segue para piloto/escala, o restante já é aprendizado validado
                </span>
              </div>
            </div>
          </div>
          <div style={{ display: 'flex', gap: 14 }}>
            <div style={{ width: FUNNEL_START_OFFSET, flexShrink: 0 }} />
            <div style={{ flex: 1.5, display: 'flex' }}>
              {data.stages.slice(MAIN_STAGE_COUNT).map((stage, i) => (
                <MiniStageCard key={stage.id} label={stage.label} quantidade={stage.quantidade} index={i} total={3} />
              ))}
            </div>
            <AprendizadoRamoCard quantidade={data.aprendizadosSemEscalar} />
          </div>

          {/* Métricas da semana — conversão e riscos de dados, no mesmo
              formato de card para leitura rápida e comparável */}
          <div>
            <div style={{ fontSize: 10, fontWeight: 700, color: '#9CA3AF', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 6 }}>
              Métricas da semana
            </div>
            <div style={{ display: 'flex', gap: 10 }}>
              <MetricCard icon={Target} label="Conversão para Piloto" value={`${data.conversaoPiloto}%`} caption={`${data.conversaoPilotoNumerador} de ${data.conversaoDenominador} experimentos aprovados já em piloto`} tone="accent" />
              <MetricCard icon={Award} label="Conversão para Escala" value={`${data.conversaoEscala}%`} caption={`${data.conversaoEscalaNumerador} de ${data.conversaoDenominador} experimentos aprovados já em escala`} tone="accent" />
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
                <AlertTriangle size={15} color={WARNING_INK} style={{ flexShrink: 0, marginTop: 2 }} />
                <span style={{ fontSize: 12.5, color: WARNING_INK, fontWeight: 600, lineHeight: 1.4 }}>
                  {data.insightSecundario}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <AprendizadosSlide data={data} />

      <PatrocinadoresSlide data={data} />

      {/* Ver detalhes por etapa — fora do slide exportável: cada clique abre a
          lista de experimentos daquela fase, vinda do Jira, como slides
          tabulares próprios (reusa o mesmo padrão de IniciativasSlides). */}
      <div className="flex flex-wrap items-center gap-2 mt-1">
        <span className="flex items-center gap-1.5 text-xs font-semibold text-gray-400 uppercase tracking-wide mr-1">
          <ListFilter size={13} /> Ver detalhes:
        </span>
        {data.stages.map((stage, i) => {
          const aberta = stageAberta === stage.id
          return (
            <button
              key={stage.id}
              onClick={() => setStageAberta(aberta ? null : stage.id)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors"
              style={{
                background: aberta ? RAMP[i] : '#F3F4F6',
                color: aberta ? '#FFFFFF' : '#374151',
                border: `1px solid ${aberta ? RAMP[i] : '#E5E7EB'}`,
              }}
            >
              {stage.label} ({stage.quantidade})
              {aberta ? <ChevronUp size={13} /> : <ChevronDown size={13} />}
            </button>
          )
        })}
      </div>

      {stageAberta && (
        <div className="mt-1">
          {(() => {
            const stage = data.stages.find(s => s.id === stageAberta)!
            return <StageDetalhesSlides stageId={stage.id} stageLabel={stage.label} rows={stage.experimentos} />
          })()}
        </div>
      )}
    </div>
  )
}
