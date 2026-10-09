'use client'

import type { ReactNode } from 'react'
import { Coins, FlaskConical, Lightbulb, Microscope, Rocket, Settings } from 'lucide-react'
import type { SemanalResumo, SemanalSecaoId } from '@/lib/semanal'
import { BeonWordmark, SLIDE_H, SLIDE_W } from './SlideArt'

// Slide "beOn Labs — até mês/aa": composição do total de experimentos,
// funil Exploração → Experimentação → Piloto → Em escala e principais métricas.

const RED = '#CC0000'
const TITLE_RED = '#B00000'
const INK = '#1F2328'
const MUTED = '#5B6472'
const BORDER = '#E5E7EB'

const FATIA_COR: Record<string, string> = {
  exploracao: '#E07B00', andamento: '#F2B8B8', validadas: '#CC0000', refutadas: '#C5C9D0', cancelados: '#6B0000',
}

/** R$ em milhões, no formato do deck: "R$ 27,3 milhões" / "R$ 416 milhões". */
export function formatMilhoes(valor: number, sufixo = 'milhões', semDecimais = false): string {
  const mm = valor / 1_000_000
  const casas = semDecimais || Number.isInteger(Math.round(mm * 10) / 10) ? 0 : 1
  return `${mm.toLocaleString('pt-BR', { minimumFractionDigits: casas, maximumFractionDigits: casas })} ${sufixo}`
}

function Card({ children, x, y, w, h, style }: { children: ReactNode; x: number; y: number; w: number; h: number; style?: React.CSSProperties }) {
  return (
    <div style={{ position: 'absolute', left: x, top: y, width: w, height: h, background: '#fff', border: `1px solid ${BORDER}`, borderRadius: 12,
      boxShadow: '0 2px 6px rgba(15,23,42,0.08)', ...style }}>
      {children}
    </div>
  )
}

function Detalhes({ onClick, style }: { onClick?: () => void; style?: React.CSSProperties }) {
  return (
    <button type="button" onClick={onClick} style={{
      border: `1.5px solid ${RED}`, color: RED, background: '#fff', borderRadius: 4, fontSize: 11.5, fontWeight: 700,
      textDecoration: 'underline', cursor: onClick ? 'pointer' : 'default', height: 22, ...style,
    }}>DETALHES</button>
  )
}

function Donut({ pct }: { pct: number }) {
  const r = 26, c = 2 * Math.PI * r
  return (
    <svg width={64} height={64} viewBox="0 0 64 64" style={{ flexShrink: 0 }}>
      <circle cx={32} cy={32} r={r} fill="none" stroke="#EDEFF2" strokeWidth={7} />
      <circle cx={32} cy={32} r={r} fill="none" stroke={RED} strokeWidth={7} strokeDasharray={`${(pct / 100) * c} ${c}`}
        transform="rotate(-90 32 32)" />
      <text x={32} y={37} textAnchor="middle" fontSize={14} fontWeight={700} fill={INK}>{pct}%</text>
    </svg>
  )
}

const ETAPAS = [
  { n: 1, t: 'Exploração', d: 'Entender e validar o problema, o benefício potencial e definir as bases para experimentação', bg: '#FBE4E4', fg: INK, nbg: RED, nfg: '#fff' },
  { n: 2, t: 'Experimentação', d: 'Testar hipóteses rapidamente para gerar evidências e reduzir incertezas.', bg: '#F5C0C0', fg: INK, nbg: '#5A0609', nfg: '#fff' },
  { n: 3, t: 'Piloto', d: 'Aguardando e em execução. Validar solução em ambiente controlado e confirmar seu potencial de escala.', bg: '#CC0000', fg: '#fff', nbg: '#fff', nfg: RED },
  { n: 4, t: 'Em escala', d: 'Operar, evoluir e ampliar a adoção da solução, maximizando a geração de valor para o negócio.', bg: '#6B0000', fg: '#fff', nbg: '#fff', nfg: '#6B0000' },
]

export default function ResumoSlide({ resumo, ateLabel, onDetalhes, pagina }: {
  resumo: SemanalResumo
  ateLabel: string
  onDetalhes?: (secao: SemanalSecaoId) => void
  pagina?: number
}) {
  const r = resumo
  const det = (id: SemanalSecaoId) => onDetalhes ? () => onDetalhes(id) : undefined
  const chevW = 312, chevX = (i: number) => 44 + i * (chevW - 14)

  return (
    <div style={{ width: SLIDE_W, height: SLIDE_H, position: 'relative', overflow: 'hidden', background: '#fff', color: INK,
      fontFamily: 'Calibri, "Segoe UI", Arial, sans-serif' }}>
      {/* Título */}
      <div style={{ position: 'absolute', left: 44, top: 28, display: 'flex', alignItems: 'baseline', gap: 22 }}>
        <span style={{ fontSize: 40, fontWeight: 700, color: TITLE_RED }}>beOn Labs</span>
        <span style={{ fontSize: 14, fontWeight: 700 }}>{ateLabel}</span>
      </div>
      <div style={{ position: 'absolute', right: 40, top: 32 }}><BeonWordmark size={36} color={RED} /></div>

      {/* Total + composição */}
      <Card x={44} y={90} w={930} h={104}>
        <div style={{ position: 'absolute', left: 18, top: 24, width: 56, height: 56, borderRadius: '50%', background: '#FBE4E4',
          display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <FlaskConical size={28} color={RED} />
        </div>
        <div style={{ position: 'absolute', left: 88, top: 8, fontSize: 46, fontWeight: 800, color: RED, lineHeight: 1.1 }}>{r.totalExperimentos}</div>
        <div style={{ position: 'absolute', left: 88, top: 62, width: 190, fontSize: 14, lineHeight: 1.15, color: MUTED }}>Total de experimentos no beOn Labs</div>
        {r.fatias.map((f, i) => {
          const x = 300 + i * 126
          return (
            <div key={f.id} style={{ position: 'absolute', left: x, top: 14, width: 116 }}>
              <div style={{ display: 'flex', alignItems: 'baseline', gap: 6, justifyContent: 'center' }}>
                <span style={{ width: 10, height: 10, borderRadius: '50%', background: FATIA_COR[f.id], alignSelf: 'center' }} />
                <span style={{ fontSize: 30, fontWeight: 700 }}>{f.quantidade}</span>
                <span style={{ fontSize: 13, color: MUTED }}>{f.pct}%</span>
              </div>
              <div style={{ fontSize: 12.5, color: MUTED, textAlign: 'center', marginTop: 2, whiteSpace: 'nowrap' }}>{f.label}</div>
              <div style={{ height: 11, background: FATIA_COR[f.id], marginTop: 8, borderRadius: 1 }} />
            </div>
          )
        })}
      </Card>

      {/* Benefício potencial total */}
      <div style={{ position: 'absolute', left: 988, top: 90, width: 248, height: 104, background: '#1F2328', borderRadius: 10, padding: '12px 16px', color: '#fff' }}>
        <div style={{ fontSize: 24, fontWeight: 700 }}>R$ {formatMilhoes(r.beneficioTotal, 'milhões', true)}</div>
        <div style={{ fontSize: 14, marginTop: 2 }}>Benefício potencial total</div>
        <div style={{ fontSize: 10.5, color: '#B8BEC6', marginTop: 4, lineHeight: 1.2 }}>
          Concedido pelas áreas de negócio para os {r.totalExperimentos} experimentos
        </div>
        <div style={{ position: 'absolute', right: 16, top: 12, width: 40, height: 40, borderRadius: '50%', background: RED,
          display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <Coins size={22} color="#fff" />
        </div>
      </div>

      {/* Etapas */}
      {ETAPAS.map((e, i) => (
        <div key={e.n} style={{
          position: 'absolute', left: chevX(i), top: 214, width: chevW, height: 86, background: e.bg, color: e.fg,
          clipPath: i === 0 ? 'polygon(0 0, 91% 0, 100% 50%, 91% 100%, 0 100%)' : 'polygon(0 0, 91% 0, 100% 50%, 91% 100%, 0 100%, 9% 50%)',
          display: 'flex', alignItems: 'center', gap: 12, padding: i === 0 ? '0 34px 0 18px' : '0 34px 0 42px',
        }}>
          <span style={{ width: 30, height: 30, borderRadius: '50%', background: e.nbg, color: e.nfg, fontWeight: 700, fontSize: 15,
            display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>{e.n}</span>
          <div>
            <div style={{ fontSize: 15, fontWeight: 700 }}>{e.t}</div>
            <div style={{ fontSize: 12.5, lineHeight: 1.2 }}>{e.d}</div>
          </div>
        </div>
      ))}

      {/* Exploração */}
      <Card x={44} y={314} w={262} h={250}>
        <div style={{ position: 'absolute', left: 18, top: 10, fontSize: 12.5, color: MUTED }}>{r.exploracao.ideiasNaoAvaliadas} ideias não avaliadas</div>
        <BigNumber x={18} y={26} n={r.exploracao.oportunidades} label="oportunidades" />
        <Beneficio y={96} valor={r.exploracao.beneficio} />
        <Rodape icon={<Lightbulb size={16} color={RED} />} texto="Triagem e priorização de ideias" y={178} />
        <Detalhes onClick={det('backlog')} style={{ position: 'absolute', left: 18, right: 18, bottom: 12, width: 'auto' }} />
      </Card>

      {/* Experimentação */}
      <Card x={318} y={314} w={240} h={250}>
        <BigNumber x={18} y={14} n={r.experimentacao.experimentos} label="experimentos" />
        <Beneficio y={96} valor={r.experimentacao.beneficio} />
        <Rodape icon={<Settings size={16} color={RED} />} texto="Construção e validação da solução" y={178} />
        <Detalhes onClick={det('andamento')} style={{ position: 'absolute', left: 18, right: 18, bottom: 12, width: 'auto' }} />
      </Card>

      {/* Piloto */}
      <Card x={592} y={314} w={376} h={250}>
        <BigNumber x={16} y={6} n={r.piloto.total} label="experimentos" />
        <Detalhes onClick={det('aguardando')} style={{ position: 'absolute', right: 16, top: 16, width: 180 }} />
        <div style={{ position: 'absolute', left: 14, right: 14, top: 58, height: 38, border: `1.5px solid ${RED}`, borderRadius: 6,
          display: 'flex', alignItems: 'center', padding: '0 12px', justifyContent: 'space-between' }}>
          <span><b style={{ fontSize: 20, color: RED }}>{r.piloto.aguardando.quantidade}</b> <span style={{ fontSize: 12, color: RED, marginLeft: 4 }}>AGUARDANDO PILOTO</span></span>
          <Potencial valor={r.piloto.aguardando.beneficio} />
        </div>
        <div style={{ position: 'absolute', left: 14, right: 14, top: 102, height: 112, border: `1.5px solid ${RED}`, borderRadius: 6, padding: '6px 12px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span><b style={{ fontSize: 20, color: RED }}>{r.piloto.execucao.quantidade}</b> <span style={{ fontSize: 12, color: RED, marginLeft: 4 }}>EM EXECUÇÃO</span></span>
            <Potencial valor={r.piloto.execucao.beneficio} onDetalhes={det('piloto')} />
          </div>
          {r.piloto.execucao.destaque && r.piloto.execucao.demais && (
            <div style={{ display: 'flex', gap: 6, marginTop: 6 }}>
              <SubBox n={1} titulo={`Outlier ${r.piloto.execucao.destaque.nome}`} valor={r.piloto.execucao.destaque.beneficio} />
              <SubBox n={r.piloto.execucao.demais.quantidade} valor={r.piloto.execucao.demais.beneficio} />
            </div>
          )}
        </div>
        <Rodape icon={<Microscope size={16} color={RED} />} texto="Avaliação e execução de pilotos em ambiente real" y={218} />
      </Card>

      {/* Em escala */}
      <Card x={980} y={314} w={256} h={250}>
        <BigNumber x={18} y={14} n={r.escala.experimentos} label="experimentos" />
        <Beneficio y={96} valor={r.escala.beneficio} />
        <Rodape icon={<Rocket size={16} color={RED} />} texto="Escala e geração de valor" y={178} />
        <Detalhes onClick={det('escala')} style={{ position: 'absolute', left: 18, right: 18, bottom: 12, width: 'auto' }} />
      </Card>

      {/* Principais métricas */}
      <div style={{ position: 'absolute', left: 44, top: 580, fontSize: 12.5, fontWeight: 700, color: RED, letterSpacing: 3 }}>PRINCIPAIS MÉTRICAS</div>
      {r.metricas.map((m, i) => (
        <Card key={m.titulo} x={44 + i * 302} y={602} w={290} h={78} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '0 14px' }}>
          <Donut pct={m.pct} />
          <div>
            <div style={{ fontSize: 15, fontWeight: 700 }}>{m.titulo}</div>
            <div style={{ fontSize: 11.5, color: MUTED, lineHeight: 1.2, marginTop: 2 }}>{m.descricao}</div>
          </div>
        </Card>
      ))}

      {pagina !== undefined && <span style={{ position: 'absolute', right: 18, bottom: 8, fontSize: 11, color: MUTED }}>{pagina}</span>}
    </div>
  )
}

function BigNumber({ x, y, n, label }: { x: number; y: number; n: number; label: string }) {
  return (
    <div style={{ position: 'absolute', left: x, top: y, display: 'flex', alignItems: 'center', gap: 12 }}>
      <span style={{ fontSize: 40, fontWeight: 700 }}>{n}</span>
      <span style={{ fontSize: 13, color: MUTED }}>{label}</span>
    </div>
  )
}

function Beneficio({ y, valor }: { y: number; valor: number }) {
  return (
    <div style={{ position: 'absolute', left: 18, right: 18, top: y - 20, borderTop: `1px solid ${BORDER}`, paddingTop: 14 }}>
      <div style={{ fontSize: 13, color: MUTED }}>Benefício potencial</div>
      <div style={{ fontSize: 24, fontWeight: 700, color: RED, marginTop: 6 }}>R$ {formatMilhoes(valor)}</div>
    </div>
  )
}

function Potencial({ valor, onDetalhes }: { valor: number; onDetalhes?: () => void }) {
  return (
    <div style={{ textAlign: 'left', cursor: onDetalhes ? 'pointer' : 'default' }} onClick={onDetalhes}>
      <div style={{ fontSize: 9.5, color: MUTED }}>Com benefício potencial de:</div>
      <div style={{ fontSize: 15, fontWeight: 700 }}>{formatMilhoes(valor, 'Milhões')}</div>
    </div>
  )
}

function SubBox({ n, titulo, valor }: { n: number; titulo?: string; valor: number }) {
  return (
    <div style={{ flex: 1, background: '#FBE4E4', borderRadius: 4, display: 'flex', alignItems: 'center', gap: 6, padding: '4px 8px', minWidth: 0, height: 52 }}>
      <b style={{ fontSize: 18 }}>{n}</b>
      {titulo && <span style={{ fontSize: 9, fontWeight: 700, lineHeight: 1.1, maxWidth: 62 }}>{titulo}</span>}
      <div style={{ marginLeft: 'auto', textAlign: 'right' }}>
        <div style={{ fontSize: 13, fontWeight: 700, color: RED, textDecoration: 'underline', whiteSpace: 'nowrap' }}>{formatMilhoes(valor)}</div>
        <div style={{ fontSize: 8, color: MUTED, whiteSpace: 'nowrap' }}>Em benefício potencial</div>
      </div>
    </div>
  )
}

function Rodape({ icon, texto, y }: { icon: ReactNode; texto: string; y: number }) {
  return (
    <div style={{ position: 'absolute', left: 18, right: 12, top: y, display: 'flex', alignItems: 'center', gap: 10, fontSize: 12.5, color: INK }}>
      <span style={{ width: 28, height: 28, borderRadius: '50%', background: '#FBE4E4', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>{icon}</span>
      {texto}
    </div>
  )
}
