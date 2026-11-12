'use client'

import type { CSSProperties, ReactNode } from 'react'
import { ArrowRight, CalendarDays, Crosshair, FlaskConical, Rocket, Target } from 'lucide-react'
import type { SemanalResumo, SemanalSecaoId } from '@/lib/semanal'
import { formatMilhoes, PAINEL, PAINEL_COR, PAINEL_ETAPAS, PAINEL_FATIA, reaisMi, segmentosDaBarra, setaDoPainel } from '@/lib/semanal-deck'
import { SLIDE_H, SLIDE_W } from './SlideArt'

// Slide "beOn Labs — Painel de experimentos": o total de experimentos e a composição, o benefício potencial total,
// o funil Exploração → Experimentação → Piloto → Em escala (setas encaixadas, com um cartão debaixo de cada uma) e as
// duas conversões. A geometria fica em lib/semanal-deck.ts (PAINEL), a mesma do PPTX.

const c = (h: string) => `#${h}`
const C = Object.fromEntries(Object.entries(PAINEL_COR).map(([k, v]) => [k, c(v)])) as Record<keyof typeof PAINEL_COR, string>
const FONTE = '"Segoe UI", Calibri, Arial, sans-serif'

const ICONE_RODAPE = [Target, FlaskConical, Crosshair, Rocket]

function Caixa({ x, y, w, h, style, children }: { x: number; y: number; w: number; h: number; style?: CSSProperties; children?: ReactNode }) {
  return <div style={{ position: 'absolute', left: x, top: y, width: w, height: h, ...style }}>{children}</div>
}

/** Cabeçalho comum ao painel e ao slide de cancelamento: marca, título do slide, data da leitura e logo. */
export function CabecalhoPainel({ titulo, data }: { titulo: string; data: string }) {
  return (
    <>
      <div style={{ position: 'absolute', left: PAINEL.margem, top: 30, height: 40, display: 'flex', alignItems: 'center' }}>
        <span style={{ fontSize: 30, fontWeight: 700, color: C.vermelho, letterSpacing: -0.3 }}>beOn Labs</span>
        <span style={{ width: 1, height: 28, background: '#DCD3D2', margin: '0 16px 0 58px' }} />
        <span style={{ fontSize: 14.5, color: C.tinta }}>{titulo}</span>
        <span style={{ marginLeft: 42, height: 30, padding: '0 14px', borderRadius: 999, border: `1.5px solid #E9B8B8`, background: '#fff',
          display: 'inline-flex', alignItems: 'center', gap: 8, fontSize: 14, fontWeight: 700, color: C.tinta }}>
          <CalendarDays size={16} color={C.vermelhoForte} />{data}
        </span>
      </div>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src="/jira/semanal/logo.png" alt="beOn Labs" style={{ position: 'absolute', right: 1280 - PAINEL.direita, top: 32, height: 36 }} />
    </>
  )
}

function Detalhes({ onClick }: { onClick?: () => void }) {
  return (
    <button type="button" onClick={onClick} style={{ border: 'none', background: 'none', padding: 0, cursor: onClick ? 'pointer' : 'default',
      color: C.vermelho, fontSize: 11, fontWeight: 800, letterSpacing: 0.4, display: 'inline-flex', alignItems: 'center', gap: 3, fontFamily: FONTE }}>
      DETALHES <ArrowRight size={13} strokeWidth={2.6} />
    </button>
  )
}

function Donut({ pct, cor }: { pct: number; cor: string }) {
  const r = 28, circ = 2 * Math.PI * r
  return (
    <svg width={68} height={68} viewBox="0 0 68 68" style={{ flexShrink: 0 }}>
      <circle cx={34} cy={34} r={r} fill="none" stroke="#EDE7E6" strokeWidth={9} />
      <circle cx={34} cy={34} r={r} fill="none" stroke={cor} strokeWidth={9} strokeDasharray={`${(Math.min(100, pct) / 100) * circ} ${circ}`}
        transform="rotate(-90 34 34)" />
      <text x={34} y={39} textAnchor="middle" fontSize={13} fontWeight={700} fill={C.tinta}>{pct.toLocaleString('pt-BR', { maximumFractionDigits: 1 })}%</text>
    </svg>
  )
}

/** Uma linha do cartão de Piloto (aguardando, em execução ou o outlier). */
function LinhaPiloto({ n, rotulo, nome, valor, destaque, onClick, y, h }: {
  n: number; rotulo: string; nome?: string; valor: number; destaque?: boolean; onClick?: () => void; y: number; h: number
}) {
  return (
    <div onClick={onClick} style={{ position: 'absolute', left: 17, right: 17, top: y, height: h, borderRadius: 8, cursor: onClick ? 'pointer' : 'default',
      background: destaque ? C.amarelo : C.linhaRosa, display: 'flex', alignItems: 'center', gap: 12, padding: '0 12px' }}>
      <b style={{ fontSize: 20, color: destaque ? C.tinta : C.vermelho, minWidth: 24 }}>{n}</b>
      <div style={{ minWidth: 0, flex: 1 }}>
        <div style={{ fontSize: 11, fontWeight: 800, letterSpacing: 0.6, color: C.tinta }}>{rotulo}</div>
        {nome && <div style={{ fontSize: 11, color: C.tinta, lineHeight: 1.15, marginTop: 1, overflow: 'hidden', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' }}>{nome}</div>}
      </div>
      <div style={{ textAlign: 'right', flexShrink: 0 }}>
        <div style={{ fontSize: 8.5, color: destaque ? '#5B4A1F' : C.apagado }}>benefício potencial</div>
        <div style={{ fontSize: 14, fontWeight: 800, color: C.tinta, whiteSpace: 'nowrap' }}>{reaisMi(valor)}</div>
      </div>
    </div>
  )
}

export default function ResumoSlide({ resumo: r, dataLabel, onDetalhes, onDetalhesBeneficio, pagina }: {
  resumo: SemanalResumo
  /** Data da leitura do Jira ("16/11/2026"). */
  dataLabel: string
  onDetalhes?: (secao: SemanalSecaoId) => void
  /** Abre a lista dos experimentos que compõem o benefício potencial total. */
  onDetalhesBeneficio?: () => void
  pagina?: number
}) {
  const det = (id: SemanalSecaoId) => (onDetalhes ? () => onDetalhes(id) : undefined)
  const P = PAINEL
  const segs = segmentosDaBarra(r.fatias.map(f => f.quantidade))
  const { destaque, demais } = r.piloto.execucao
  const cartoes: { numero: number; rotulo: string; conteudo: ReactNode; detalhes: SemanalSecaoId }[] = [
    { numero: r.exploracao.oportunidades, rotulo: 'oportunidades', detalhes: 'backlog', conteudo: (
      <>
        {r.exploracao.ideiasNaoAvaliadas > 0 && (
          <div style={{ position: 'absolute', left: 17, top: 72, height: 21, padding: '0 12px', borderRadius: 4, background: C.areia,
            fontSize: 8.5, fontWeight: 800, letterSpacing: 1.1, color: C.tinta, display: 'flex', alignItems: 'center' }}>
            + {r.exploracao.ideiasNaoAvaliadas} IDEIAS NÃO AVALIADAS
          </div>
        )}
        <Beneficio texto="Em análise" />
      </>
    ) },
    { numero: r.experimentacao.experimentos, rotulo: 'experimentos', detalhes: 'andamento', conteudo: <Beneficio texto={reaisMi(r.experimentacao.beneficio)} /> },
    { numero: r.piloto.total, rotulo: 'experimentos', detalhes: 'aguardando', conteudo: (
      <>
        <LinhaPiloto y={73} h={42} n={r.piloto.aguardando.quantidade} rotulo="AGUARDANDO" valor={r.piloto.aguardando.beneficio} onClick={det('aguardando')} />
        {destaque && demais ? (
          <>
            <LinhaPiloto y={121} h={42} n={demais.quantidade} rotulo="EM EXECUÇÃO" valor={demais.beneficio} onClick={det('piloto')} />
            <LinhaPiloto y={169} h={54} n={1} rotulo="OUTLIER" nome={destaque.nome} valor={destaque.beneficio} destaque onClick={det('piloto')} />
          </>
        ) : (
          <LinhaPiloto y={121} h={42} n={r.piloto.execucao.quantidade} rotulo="EM EXECUÇÃO" valor={r.piloto.execucao.beneficio} onClick={det('piloto')} />
        )}
      </>
    ) },
    { numero: r.escala.experimentos, rotulo: 'experimentos', detalhes: 'escala', conteudo: <Beneficio texto={reaisMi(r.escala.beneficio)} /> },
  ]

  return (
    <div style={{ width: SLIDE_W, height: SLIDE_H, position: 'relative', overflow: 'hidden', background: C.fundo, color: C.tinta, fontFamily: FONTE }}>
      <CabecalhoPainel titulo="Painel de experimentos" data={dataLabel} />

      {/* Total e composição */}
      <Caixa x={P.total.x} y={P.topoCartoes} w={P.total.w} h={P.alturaTopo} style={{ background: '#fff', borderRadius: 14, boxShadow: '0 1px 3px rgba(60,20,20,0.06)' }} />
      <Caixa x={82} y={125} w={56} h={56} style={{ background: C.rosa, borderRadius: 12, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <FlaskConical size={28} color={C.vermelhoForte} />
      </Caixa>
      <Caixa x={152} y={112} w={200} h={60} style={{ fontSize: 54, fontWeight: 800, lineHeight: '60px', letterSpacing: -1 }}>{r.totalExperimentos}</Caixa>
      <Caixa x={152} y={171} w={200} h={20} style={{ fontSize: 13.5, color: C.apagado }}>experimentos no beOn Labs</Caixa>
      <Caixa x={358} y={110} w={1} h={86} style={{ background: C.linha }} />
      {segs.map(s => (
        <Caixa key={s.i} x={s.x} y={P.barra.y} w={s.w} h={P.barra.h} style={{ background: c(PAINEL_FATIA[r.fatias[s.i].id]) }} />
      ))}
      {r.fatias.map((f, i) => (
        <Caixa key={f.id} x={P.barra.x + i * P.barra.passoLegenda} y={142} w={96} h={60}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
            <span style={{ width: 7, height: 7, borderRadius: '50%', background: c(PAINEL_FATIA[f.id]) }} />
            <b style={{ fontSize: 21 }}>{f.quantidade}</b>
            <span style={{ fontSize: 10.5, color: C.apagado }}>{f.pctDecimal.toLocaleString('pt-BR', { minimumFractionDigits: 1, maximumFractionDigits: 1 })}%</span>
          </div>
          <div style={{ fontSize: 11.5, color: C.apagado, lineHeight: 1.25, marginTop: 4 }}>{f.label}</div>
        </Caixa>
      ))}

      {/* Benefício potencial total */}
      <Caixa x={P.beneficio.x} y={P.topoCartoes} w={P.beneficio.w} h={P.alturaTopo}
        style={{ background: C.escuro, borderRadius: 14, color: '#fff', textAlign: 'center', cursor: onDetalhesBeneficio ? 'pointer' : 'default' }}>
        <div onClick={onDetalhesBeneficio} title="Ver os experimentos que compõem o benefício" style={{ position: 'absolute', inset: 0 }}>
          <div style={{ marginTop: 26, fontSize: 10.5, fontWeight: 800, letterSpacing: 2.6 }}>BENEFÍCIO POTENCIAL TOTAL</div>
          <div style={{ marginTop: 10, display: 'flex', alignItems: 'baseline', justifyContent: 'center', gap: 8 }}>
            <span style={{ fontSize: 17 }}>R$</span>
            <span style={{ fontSize: 28, fontWeight: 800 }}>{formatMilhoes(r.beneficioTotal, '', true).trim()}</span>
            <span style={{ fontSize: 20, fontWeight: 800 }}>milhões</span>
          </div>
          <div style={{ margin: '6px auto 0', width: 250, fontSize: 10.5, lineHeight: 1.35, color: '#E6E1E0' }}>
            Concedido pelas áreas de negócio para os experimentos (sem cancelados e refutados)
          </div>
        </div>
      </Caixa>

      {/* Setas das etapas */}
      {PAINEL_ETAPAS.map((e, i) => {
        const s = setaDoPainel(i)
        const poly = s.pontos.map(([px, py]) => `${px}px ${py}px`).join(', ')
        const xTexto = (i === 0 ? s.x : P.colunas[i]) + 10
        const fimTexto = s.x + s.w - (i === 3 ? 12 : P.ponta + 4)
        return (
          <div key={e.n} style={{ position: 'absolute', left: s.x, top: P.setaTopo, width: s.w, height: P.setaAltura, overflow: 'hidden',
            borderTopLeftRadius: i === 0 ? 14 : 0, borderTopRightRadius: i === 3 ? 14 : 0 }}>
            <div style={{ position: 'absolute', inset: 0, background: c(e.bg), clipPath: `polygon(${poly})` }} />
            <div style={{ position: 'absolute', left: xTexto - s.x, top: 0, width: fimTexto - xTexto, height: P.setaAltura, display: 'flex', alignItems: 'center', gap: 10 }}>
              <span style={{ width: 28, height: 28, borderRadius: '50%', background: c(e.nbg), color: c(e.nfg), fontWeight: 800, fontSize: 13,
                display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>{e.n}</span>
              <div style={{ minWidth: 0 }}>
                <div style={{ fontSize: 16, fontWeight: 700, color: c(e.titulo) }}>{e.t}</div>
                <div style={{ fontSize: 10.5, lineHeight: 1.2, color: c(e.texto), marginTop: 2 }}>{e.d}</div>
              </div>
            </div>
          </div>
        )
      })}

      {/* Cartões das etapas */}
      {cartoes.map((k, i) => {
        const Icone = ICONE_RODAPE[i]
        return (
          <Caixa key={i} x={P.colunas[i]} y={P.cartaoTopo} w={P.larguraColuna} h={P.cartaoAltura}
            style={{ background: '#fff', borderRadius: '0 0 14px 14px', boxShadow: '0 1px 3px rgba(60,20,20,0.06)' }}>
            <div style={{ position: 'absolute', left: 22, top: 14, display: 'flex', alignItems: 'center', gap: 16 }}>
              <span style={{ fontSize: 44, fontWeight: 800, letterSpacing: -1 }}>{k.numero}</span>
              <span style={{ fontSize: 13.5, color: C.apagado }}>{k.rotulo}</span>
            </div>
            {k.conteudo}
            <div style={{ position: 'absolute', left: 17, right: 17, top: 238, borderTop: `1px solid ${C.linha}`, paddingTop: 12,
              display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: 7, fontSize: 11.5, color: C.tinta }}>
                <Icone size={14} color={C.vermelhoForte} />{PAINEL_ETAPAS[i].rodape}
              </span>
              <Detalhes onClick={det(k.detalhes)} />
            </div>
          </Caixa>
        )
      })}

      {/* Principais métricas */}
      <Caixa x={P.margem} y={616} w={160} h={50}>
        <div style={{ fontSize: 10, fontWeight: 800, color: C.vermelho, letterSpacing: 3 }}>PRINCIPAIS</div>
        <div style={{ fontSize: 22, fontWeight: 800, marginTop: 2 }}>Métricas</div>
      </Caixa>
      {r.metricas.slice(0, 2).map((m, i) => (
        <Caixa key={m.titulo} x={P.metricas[i].x} y={P.metricasTopo} w={P.metricas[i].w} h={P.metricasAltura}
          style={{ background: '#fff', borderRadius: 14, display: 'flex', alignItems: 'center', gap: 20, padding: '0 24px', boxShadow: '0 1px 3px rgba(60,20,20,0.06)' }}>
          <Donut pct={m.pct} cor={i === 0 ? C.vermelhoForte : C.bordo} />
          <div>
            <div style={{ fontSize: 17, fontWeight: 700 }}>{m.titulo}</div>
            <div style={{ fontSize: 11.5, color: C.apagado, marginTop: 4 }}>{m.descricao}</div>
          </div>
        </Caixa>
      ))}

      {pagina !== undefined && <span style={{ position: 'absolute', right: 14, bottom: 8, fontSize: 11, color: C.apagado }}>{pagina}</span>}
    </div>
  )
}

function Beneficio({ texto }: { texto: string }) {
  return (
    <div style={{ position: 'absolute', left: 17, right: 17, top: 104, borderTop: `1px solid ${C.linha}`, paddingTop: 20 }}>
      <div style={{ fontSize: 12, color: C.apagado }}>Benefício potencial</div>
      <div style={{ fontSize: 28, fontWeight: 800, color: C.vermelho, marginTop: 8, letterSpacing: -0.3 }}>{texto}</div>
    </div>
  )
}
