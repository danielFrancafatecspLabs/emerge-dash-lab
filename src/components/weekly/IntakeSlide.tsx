'use client'

import { useRef } from 'react'
import {
  Users, Lightbulb, FileSearch, Target, HelpCircle, BarChart3, Star, Gem, Ban,
  FlaskConical, Megaphone, ArrowRight, Clock,
} from 'lucide-react'
import { SlideDownloadButtons } from '@/components/report/slideExport'

const RED = '#8B0000'
const PINK_BG = '#FCEAEA'
const PINK_BORDER = '#F6D5D5'
// Amarelo mais escuro — mesmo tom usado como aviso no resto do dashboard,
// aqui como fundo sólido (contraste do texto branco: 7.1:1).
const PENDENTE_COLOR = '#92400E'

interface Criterio {
  icon: typeof Target
  before: string
  bold: string
  after: string
}

const CRITERIOS: Criterio[] = [
  { icon: Target, before: 'O problema ', bold: 'vale a pena', after: ' ser resolvido?' },
  { icon: HelpCircle, before: 'Existem ', bold: 'incertezas tecnológicas', after: ' ou de negócio relevantes?' },
  { icon: BarChart3, before: 'Está associado à ', bold: 'estratégia', after: ' da empresa (70-70-50)?' },
  { icon: Star, before: 'É uma iniciativa ', bold: 'estratégica', after: ' de um C-Level?' },
  { icon: Gem, before: 'Tem ', bold: 'benefício potencial', after: '?' },
  { icon: Users, before: '', bold: 'Patrocinador', after: ' identificado?' },
  { icon: Ban, before: 'Não existe ', bold: 'iniciativa em andamento', after: ' ou solução existente para o problema?' },
]

function EntryCard({ icon: Icon, title, descricao }: { icon: typeof Users; title: string; descricao: string }) {
  return (
    <div style={{
      flex: 1, background: PINK_BG, border: `1px solid ${PINK_BORDER}`, borderRadius: 14,
      padding: '14px 16px', display: 'flex', flexDirection: 'column', gap: 6,
    }}>
      <Icon size={22} color={RED} strokeWidth={2} />
      <div style={{ fontSize: 13.5, fontWeight: 800, color: '#111827', lineHeight: 1.2 }}>{title}</div>
      <div style={{ fontSize: 10.5, color: '#6B7280', lineHeight: 1.35 }}>{descricao}</div>
    </div>
  )
}

// Iniciativas do board de Ideação em Backlog + Em Refinamento — ainda não
// avaliadas pelos critérios de entrada, portanto ainda não viraram
// experimento. Fica entre as portas de entrada e a avaliação, em amarelo
// mais escuro para se distinguir dos cards rosados do resto do fluxo.
function PendenteCard({ quantidade }: { quantidade: number }) {
  return (
    <div style={{
      flex: 1, background: PENDENTE_COLOR, borderRadius: 14,
      padding: '16px 14px', display: 'flex', flexDirection: 'column', alignItems: 'center',
      justifyContent: 'center', gap: 6, textAlign: 'center',
    }}>
      <Clock size={24} color="#FFFFFF" strokeWidth={1.8} />
      <div style={{ fontSize: 13.5, fontWeight: 800, color: '#FFFFFF', lineHeight: 1.2 }}>
        Pendente para Análise
      </div>
      <div style={{ fontSize: 26, fontWeight: 800, color: '#FFFFFF', lineHeight: 1 }}>
        {quantidade}
      </div>
      <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.85)', lineHeight: 1.35 }}>
        Iniciativas no board de Ideação
      </div>
    </div>
  )
}

function FlowArrow() {
  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, width: 28 }}>
      <ArrowRight size={20} color={RED} strokeWidth={2.5} />
    </div>
  )
}

export default function IntakeSlide({ experimentosAprovados, pendenteAnalise }: { experimentosAprovados: number; pendenteAnalise: number }) {
  const slideRef = useRef<HTMLDivElement>(null)

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center justify-end">
        <SlideDownloadButtons targetRef={slideRef} filename="weekly-entrada-laboratorio" />
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
            justifyContent: 'space-between',
          }}
        >
          {/* Cabeçalho */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div>
              <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: 2, color: '#9CA3AF', textTransform: 'uppercase' }}>
                Jornada de Experimentação
              </div>
              <div style={{ fontSize: 28, fontWeight: 800, color: '#111827', marginTop: 5, lineHeight: 1.1, letterSpacing: -0.3 }}>
                Como um experimento entra no laboratório?
              </div>
              <div style={{ fontSize: 13, color: '#6B7280', marginTop: 4 }}>
                Duas portas de entrada, um mesmo propósito: transformar desafios em aprendizados de valor.
              </div>
            </div>
            <div style={{ textAlign: 'right', flexShrink: 0, paddingTop: 4 }}>
              <div style={{ width: 60, height: 3, background: RED, marginLeft: 'auto', marginBottom: 8 }} />
              <div style={{ fontSize: 10, fontWeight: 700, color: '#9CA3AF', letterSpacing: 1, lineHeight: 1.8, textTransform: 'uppercase' }}>
                Ideias<br />Experimentos<br />Aprendizados<br />Impacto
              </div>
            </div>
          </div>

          {/* Fluxo: portas de entrada -> avaliação -> critérios -> aprovado */}
          <div style={{ display: 'flex', alignItems: 'stretch', gap: 0 }}>
            <div style={{ width: 200, display: 'flex', flexDirection: 'column', gap: 8, flexShrink: 0 }}>
              <EntryCard
                icon={Users}
                title="Solicitação das áreas de negócio"
                descricao="Desafios e oportunidades trazidos pelas áreas de negócio, com necessidades reais a serem exploradas."
              />
              <EntryCard
                icon={Lightbulb}
                title="Iniciativas do beOn Labs"
                descricao="Propostas identificadas ativamente pelo beOn Labs em parceria com as áreas de negócio."
              />
            </div>

            <FlowArrow />

            <div style={{ width: 150, flexShrink: 0, display: 'flex' }}>
              <PendenteCard quantidade={pendenteAnalise} />
            </div>

            <FlowArrow />

            <div style={{ width: 170, flexShrink: 0, display: 'flex' }}>
              <div style={{
                flex: 1, background: PINK_BG, border: `1px solid ${PINK_BORDER}`, borderRadius: 14,
                padding: '16px 14px', display: 'flex', flexDirection: 'column', alignItems: 'center',
                justifyContent: 'center', gap: 8, textAlign: 'center',
              }}>
                <FileSearch size={26} color={RED} strokeWidth={1.8} />
                <div style={{ fontSize: 13.5, fontWeight: 800, color: '#111827', lineHeight: 1.2 }}>
                  Avaliação de critérios de entrada
                </div>
                <div style={{ fontSize: 10.5, color: '#6B7280', lineHeight: 1.35 }}>
                  A proposta é analisada com base em critérios objetivos.
                </div>
              </div>
            </div>

            <FlowArrow />

            <div style={{ flex: 1, minWidth: 0, borderRadius: 14, overflow: 'hidden', border: '1px solid #F0D5D5', display: 'flex', flexDirection: 'column' }}>
              <div style={{ background: RED, padding: '10px 16px', display: 'flex', alignItems: 'baseline', gap: 10, flexWrap: 'wrap' }}>
                <span style={{ fontSize: 12.5, fontWeight: 800, color: '#FFFFFF', letterSpacing: 0.3 }}>CRITÉRIOS DE ENTRADA</span>
                <span style={{ fontSize: 10.5, color: 'rgba(255,255,255,0.85)' }}>A iniciativa deve atender aos seguintes critérios:</span>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column' }}>
                {CRITERIOS.map((c, i) => {
                  const Icon = c.icon
                  return (
                    <div key={i} style={{
                      display: 'flex', alignItems: 'center', gap: 10, padding: '7px 16px',
                      borderTop: i === 0 ? 'none' : '1px solid #F3E4E4',
                    }}>
                      <div style={{
                        width: 26, height: 26, borderRadius: 999, background: PINK_BG, flexShrink: 0,
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                      }}>
                        <Icon size={13} color={RED} strokeWidth={2} />
                      </div>
                      <div style={{ fontSize: 11.5, color: '#374151', lineHeight: 1.3 }}>
                        {c.before}<b style={{ color: '#111827' }}>{c.bold}</b>{c.after}
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>

            <FlowArrow />

            <div style={{ width: 190, flexShrink: 0, display: 'flex' }}>
              <div style={{
                flex: 1, background: PINK_BG, border: `1px solid ${PINK_BORDER}`, borderRadius: 14,
                padding: '16px 14px', display: 'flex', flexDirection: 'column', alignItems: 'center',
                justifyContent: 'center', gap: 6, textAlign: 'center',
              }}>
                <FlaskConical size={26} color={RED} strokeWidth={1.8} />
                <div style={{ fontSize: 13.5, fontWeight: 800, color: '#111827', lineHeight: 1.2 }}>
                  Experimento aprovado
                </div>
                <div style={{ fontSize: 30, fontWeight: 800, color: RED, lineHeight: 1 }}>
                  {experimentosAprovados}
                </div>
                <div style={{ fontSize: 10, color: '#6B7280', lineHeight: 1.35 }}>
                  Segue para planejamento e execução no beOn Labs.
                </div>
              </div>
            </div>
          </div>

          {/* Banner de aviso */}
          <div style={{
            display: 'flex', alignItems: 'flex-start', gap: 12, background: '#F9FAFB',
            border: '1px solid #F0F0F0', borderRadius: 12, padding: '14px 20px',
          }}>
            <Megaphone size={18} color={RED} style={{ flexShrink: 0, marginTop: 1 }} />
            <div style={{ fontSize: 11.5, color: '#374151', lineHeight: 1.45 }}>
              <span style={{ fontWeight: 800, color: RED, letterSpacing: 0.3 }}>IMPORTANTE&nbsp; </span>
              Nos casos em que a proposta não atende aos critérios de entrada, ainda assim{' '}
              <b>incentivamos, apoiamos e direcionamos</b> a experimentação com os próprios recursos das áreas, para
              fortalecer a cultura de experimentação e estimular o surgimento de novas iniciativas e Labs.
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
