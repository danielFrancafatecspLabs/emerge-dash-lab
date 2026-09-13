'use client'

import { useRef } from 'react'
import {
  Users, Wrench, Gem, GraduationCap, HelpCircle, BarChart3, Network, Building2, Search, Sparkles,
} from 'lucide-react'
import type { WeeklyData } from '@/lib/weekly'
import { SlideDownloadButtons } from '@/components/report/slideExport'

const RED = '#8B0000'
const PINK_BG = '#FCEAEA'

interface Aprendizado {
  icon: typeof Users
  texto: string
}

// Aprendizados estratégicos do time BeOn Labs sobre como o laboratório
// funciona hoje — conteúdo curado manualmente (não vem do Jira).
const APRENDIZADOS: Aprendizado[] = [
  { icon: Users, texto: 'Poucas iniciativas nascem de sponsors — a maioria vem de gestores de nível médio ou de colaboradores tentando resolver um problema do dia a dia.' },
  { icon: Wrench, texto: 'Muitas chegam com a solução pronta e sem um problema claro por trás (ex.: "queremos uma IA para algo").' },
  { icon: Gem, texto: 'Falta mapear o benefício: entram sem clareza do valor e do ganho real para a empresa.' },
  { icon: GraduationCap, texto: 'Cultura de experimentação ainda em construção — falta entendimento do que de fato é um experimento.' },
  { icon: HelpCircle, texto: 'Muitas iniciativas sem incerteza clara, seja tecnológica ou de negócio.' },
  { icon: BarChart3, texto: 'Experimentos pouco orientados a dados: sem hipótese, critério de sucesso ou forma de teste definidos.' },
  { icon: Network, texto: 'Falta visibilidade entre labs — ainda existem silos e pouco acompanhamento cruzado das iniciativas.' },
  { icon: Building2, texto: 'Falta uma referência clara do que é o beOn Labs — executivos não conhecem a área ou a confundem com outra.' },
  { icon: Search, texto: 'Ainda há muitas oportunidades não identificadas, a explorar junto às áreas de negócio.' },
]

function AprendizadoCell({ icon: Icon, texto }: Aprendizado) {
  return (
    <div style={{ flex: 1, minWidth: 0, display: 'flex', alignItems: 'flex-start', gap: 10 }}>
      <div style={{
        width: 26, height: 26, borderRadius: 999, background: PINK_BG, flexShrink: 0, marginTop: 1,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}>
        <Icon size={13} color={RED} strokeWidth={2.25} />
      </div>
      <div style={{ fontSize: 11.5, color: '#374151', lineHeight: 1.4, width: '100%', overflowWrap: 'break-word' }}>
        {texto}
      </div>
    </div>
  )
}

export default function AprendizadosSlide({ data }: { data: WeeklyData }) {
  const slideRef = useRef<HTMLDivElement>(null)
  const concluidos = data.stages.find(s => s.id === 'concluidos')?.quantidade ?? 0
  const pctDocumentado = concluidos > 0 ? Math.round((data.aprendizadosAcionaveis / concluidos) * 100) : 0

  // Grade 3×3 em flexbox (linhas + itens), não CSS grid — mesmo padrão do
  // resto do repo, mais seguro na exportação via html2canvas.
  const linha1 = APRENDIZADOS.slice(0, 3)
  const linha2 = APRENDIZADOS.slice(3, 6)
  const linha3 = APRENDIZADOS.slice(6, 9)

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center justify-end">
        <SlideDownloadButtons targetRef={slideRef} filename="weekly-principais-aprendizados" />
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
                Principais Aprendizados
              </div>
              <div style={{ fontSize: 13, color: '#6B7280', marginTop: 4 }}>
                O que aprendemos até aqui sobre como o laboratório funciona — e o que precisa evoluir.
              </div>
            </div>
            <div style={{ textAlign: 'right', flexShrink: 0, paddingTop: 4 }}>
              <div style={{ width: 60, height: 3, background: RED, marginLeft: 'auto', marginBottom: 8 }} />
              <div style={{ fontSize: 10, fontWeight: 700, color: '#9CA3AF', letterSpacing: 1, lineHeight: 1.8, textTransform: 'uppercase' }}>
                Ideias<br />Experimentos<br /><span style={{ color: RED }}>Aprendizados</span><br />Impacto
              </div>
            </div>
          </div>

          {/* Lista de aprendizados — grade 3×3 */}
          <div style={{
            flex: 1, display: 'flex', flexDirection: 'column', background: '#FAFAFA',
            border: '1px solid #F0F0F0', borderRadius: 14, padding: '20px 26px',
          }}>
            {[linha1, linha2, linha3].map((linha, li) => (
              <div
                key={li}
                style={{
                  flex: 1, display: 'flex', gap: 28, alignItems: 'center',
                  borderTop: li === 0 ? 'none' : '1px solid #EFEFEF',
                }}
              >
                {linha.map((a, i) => (
                  <AprendizadoCell key={i} {...a} />
                ))}
              </div>
            ))}
          </div>

          {/* Rodapé — leitura executiva do quanto já está documentado */}
          <div style={{
            display: 'flex', alignItems: 'center', gap: 12, background: '#FAFAFA',
            border: '1px solid #F0F0F0', borderRadius: 12, padding: '14px 20px',
          }}>
            <Sparkles size={16} color={RED} style={{ flexShrink: 0 }} />
            <span style={{ fontSize: 12.5, color: '#374151', lineHeight: 1.4 }}>
              <b style={{ color: '#111827' }}>{data.aprendizadosAcionaveis} de {concluidos} experimentos concluídos</b> ({pctDocumentado}%) já
              têm um aprendizado documentado — transformar essa prática em hábito é o que acelera o próximo ciclo do laboratório.
            </span>
          </div>
        </div>
      </div>
    </div>
  )
}
