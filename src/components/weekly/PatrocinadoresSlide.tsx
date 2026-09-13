'use client'

import { useRef } from 'react'
import { Users, Building2, AlertTriangle } from 'lucide-react'
import type { WeeklyData, WeeklyRanking } from '@/lib/weekly'
import { SlideDownloadButtons } from '@/components/report/slideExport'

const RED = '#8B0000'
const PINK_BG = '#FCEAEA'
const WARNING_INK = '#92400E'

function RankingPanel({
  titulo, icon: Icon, dados,
}: { titulo: string; icon: typeof Users; dados: WeeklyRanking[] }) {
  const max = dados[0]?.count ?? 1
  return (
    <div style={{
      flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', background: '#FFFFFF',
      border: '1px solid #F0F0F0', borderRadius: 14, padding: '20px 24px',
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 9, marginBottom: 16 }}>
        <div style={{
          width: 28, height: 28, borderRadius: 999, background: PINK_BG, flexShrink: 0,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          <Icon size={14} color={RED} strokeWidth={2.25} />
        </div>
        <span style={{ fontSize: 13, fontWeight: 800, color: '#111827' }}>{titulo}</span>
      </div>

      {dados.length === 0 ? (
        <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#9CA3AF', fontSize: 12 }}>
          Nenhum dado identificado ainda.
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 22, flex: 1, justifyContent: 'center' }}>
          {dados.map((d, i) => {
            const widthPct = Math.max(8, Math.round((d.count / max) * 100))
            return (
              <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <div style={{ width: 18, fontSize: 12.5, fontWeight: 800, color: i === 0 ? RED : '#C4C9D1', textAlign: 'right', flexShrink: 0 }}>
                  {i + 1}
                </div>
                <div style={{
                  width: 120, fontSize: 12, fontWeight: 700, color: '#374151', flexShrink: 0,
                  lineHeight: 1.25, overflowWrap: 'break-word',
                }}>
                  {d.nome}
                </div>
                <div style={{ flex: 1, height: 17, background: '#F3F4F6', borderRadius: 8, overflow: 'hidden' }}>
                  <div style={{ width: `${widthPct}%`, height: '100%', background: RED, borderRadius: 8 }} />
                </div>
                <div style={{ width: 26, fontSize: 13.5, fontWeight: 800, color: '#111827', textAlign: 'right', flexShrink: 0 }}>
                  {d.count}
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}

export default function PatrocinadoresSlide({ data }: { data: WeeklyData }) {
  const slideRef = useRef<HTMLDivElement>(null)

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center justify-end">
        <SlideDownloadButtons targetRef={slideRef} filename="weekly-principais-patrocinadores" />
      </div>

      {/* ═══ Slide 1280×720 (16:9 — dimensão de slide de PowerPoint) ═══ */}
      <div className="rounded-2xl shadow-xl" style={{ width: 1280, overflow: 'hidden', boxShadow: '0 12px 40px rgba(17,24,39,0.14)' }}>
        <div
          ref={slideRef}
          style={{
            width: 1280, height: 720, background: '#FFFFFF', padding: 46, boxSizing: 'border-box',
            display: 'flex', flexDirection: 'column', gap: 18,
          }}
        >
          {/* Cabeçalho */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div>
              <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: 2, color: '#9CA3AF', textTransform: 'uppercase' }}>
                Jornada de Experimentação · Weekly
              </div>
              <div style={{ fontSize: 30, fontWeight: 800, color: '#111827', marginTop: 5, lineHeight: 1.1, letterSpacing: -0.3 }}>
                Nossos principais patrocinadores
              </div>
              <div style={{ fontSize: 13, color: '#6B7280', marginTop: 4 }}>
                Quem sustenta a experimentação hoje — concentração dos {data.experimentosAprovados} experimentos aprovados por sponsor e por diretoria.
              </div>
            </div>
            <div style={{ textAlign: 'right', flexShrink: 0, paddingTop: 4 }}>
              <div style={{ width: 60, height: 3, background: RED, marginLeft: 'auto', marginBottom: 8 }} />
              <div style={{ fontSize: 10, fontWeight: 700, color: '#9CA3AF', letterSpacing: 1, lineHeight: 1.8, textTransform: 'uppercase' }}>
                Ideias<br />Experimentos<br />Aprendizados<br /><span style={{ color: RED }}>Impacto</span>
              </div>
            </div>
          </div>

          {/* Rankings — Sponsor e Diretoria lado a lado */}
          <div style={{ flex: 1, display: 'flex', gap: 16 }}>
            <RankingPanel titulo="Experimentos por Sponsor" icon={Users} dados={data.topSponsors} />
            <RankingPanel titulo="Experimentos por Diretoria" icon={Building2} dados={data.topDiretorias} />
          </div>

          {/* Rodapé — oportunidade de engajamento executivo */}
          <div style={{
            display: 'flex', alignItems: 'center', gap: 12, background: '#FFFBEB',
            border: '1px solid #FAE8C4', borderRadius: 12, padding: '14px 20px',
          }}>
            <AlertTriangle size={16} color={WARNING_INK} style={{ flexShrink: 0 }} />
            <span style={{ fontSize: 12.5, color: '#374151', lineHeight: 1.4 }}>
              <b style={{ color: '#111827' }}>{data.semSponsor.count} experimentos</b> ({data.semSponsor.pct}%) ainda não têm um sponsor
              identificado — fortalecer esse engajamento é o que sustenta a próxima onda de experimentos.
            </span>
          </div>
        </div>
      </div>
    </div>
  )
}
