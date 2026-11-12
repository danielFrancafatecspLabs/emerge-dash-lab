'use client'

import { CircleX } from 'lucide-react'
import type { SemanalCancelamento } from '@/lib/semanal'
import { CANCELAMENTO_PAINEL as L, fraseDestaque, PAINEL, PAINEL_COR, pctUmaCasa } from '@/lib/semanal-deck'
import { CabecalhoPainel } from './ResumoSlide'
import { SLIDE_H, SLIDE_W } from './SlideArt'

// Slide "Principais motivos de cancelamento", no estilo do painel: quantos foram cancelados e o peso no total, quanto
// os dois principais motivos concentram e o ranking dos motivos (campo "Saída" do épico no Jira).

const c = (h: string) => `#${h}`
const C = Object.fromEntries(Object.entries(PAINEL_COR).map(([k, v]) => [k, c(v)])) as Record<keyof typeof PAINEL_COR, string>
const FONTE = '"Segoe UI", Calibri, Arial, sans-serif'
const BARRA = [C.vermelhoForte, C.bordo]
const BARRA_DEMAIS = '#D5CCCB'

export default function CancelamentoSlide({ cancelamento: k, dataLabel }: { cancelamento: SemanalCancelamento; dataLabel: string }) {
  const max = Math.max(1, ...k.motivos.map(m => m.quantidade))
  const passo = L.alturaLinhas / Math.max(5, k.motivos.length)
  const principais = k.destaque?.motivos.length ?? 0
  const peso = k.totalExperimentos ? (k.total / k.totalExperimentos) * 100 : null
  const fonte = k.fonte === 'bloqueio' ? 'Motivo de Bloqueio do épico no Jira (nenhum épico cancelado tem a Saída preenchida)' : 'campo Saída do épico no Jira'
  const P = PAINEL
  return (
    <div style={{ width: SLIDE_W, height: SLIDE_H, position: 'relative', overflow: 'hidden', background: C.fundo, color: C.tinta, fontFamily: FONTE }}>
      <CabecalhoPainel titulo="Principais motivos de cancelamento" data={dataLabel} />

      {/* Total de cancelados */}
      <div style={{ position: 'absolute', left: L.total.x, top: P.topoCartoes, width: L.total.w, height: P.alturaTopo, background: '#fff', borderRadius: 14,
        boxShadow: '0 1px 3px rgba(60,20,20,0.06)' }}>
        <div style={{ position: 'absolute', left: 24, top: 37, width: 56, height: 56, borderRadius: 12, background: C.rosa, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <CircleX size={28} color={C.vermelhoForte} />
        </div>
        <div style={{ position: 'absolute', left: 96, top: 24, fontSize: 54, fontWeight: 800, letterSpacing: -1, lineHeight: '60px' }}>{k.total}</div>
        <div style={{ position: 'absolute', left: 96, top: 84, fontSize: 13.5, color: C.apagado }}>experimentos cancelados</div>
        {peso !== null && (
          <>
            <div style={{ position: 'absolute', left: 300, top: 22, width: 1, height: 86, background: C.linha }} />
            <div style={{ position: 'absolute', left: 326, top: 34, fontSize: 30, fontWeight: 800, color: C.vermelho }}>{pctUmaCasa(Math.round(peso * 10) / 10)}</div>
            <div style={{ position: 'absolute', left: 326, top: 78, width: 210, fontSize: 12, color: C.apagado, lineHeight: 1.3 }}>
              dos {k.totalExperimentos} experimentos do beOn Labs
            </div>
          </>
        )}
      </div>

      {/* Concentração nos dois principais motivos */}
      <div style={{ position: 'absolute', left: L.destaque.x, top: P.topoCartoes, width: L.destaque.w, height: P.alturaTopo, background: C.escuro, borderRadius: 14, color: '#fff' }}>
        <div style={{ position: 'absolute', left: 30, top: 24, fontSize: 10.5, fontWeight: 800, letterSpacing: 2.6 }}>CONCENTRAÇÃO</div>
        {k.destaque ? (
          <>
            <div style={{ position: 'absolute', left: 30, top: 46, fontSize: 44, fontWeight: 800, letterSpacing: -0.5 }}>{pctUmaCasa(k.destaque.pct)}</div>
            <div style={{ position: 'absolute', left: 210, top: 52, width: 360, fontSize: 15, lineHeight: 1.35, color: '#EDE8E7' }}>{fraseDestaque(k)}</div>
          </>
        ) : (
          <div style={{ position: 'absolute', left: 30, top: 56, fontSize: 15, color: '#EDE8E7' }}>Nenhum motivo registrado ainda.</div>
        )}
      </div>

      {/* Ranking dos motivos */}
      <div style={{ position: 'absolute', left: L.tabela.x, top: L.tabela.y, width: L.tabela.w, height: L.tabela.h, background: '#fff', borderRadius: 14,
        boxShadow: '0 1px 3px rgba(60,20,20,0.06)' }} />
      {[['MOTIVO DA SAÍDA', L.colMotivo, 'left'], ['QUANTIDADE DE EXPERIMENTOS', L.colBarra, 'left'], ['% DO TOTAL', L.colPct - 120, 'right']].map(([t, x, a]) => (
        <div key={t as string} style={{ position: 'absolute', left: x as number, top: 256, width: a === 'right' ? 120 : 400, textAlign: a as 'left' | 'right',
          fontSize: 10, fontWeight: 800, letterSpacing: 1.6, color: C.apagado }}>{t}</div>
      ))}
      <div style={{ position: 'absolute', left: 82, right: 1280 - L.tabela.x - L.tabela.w + 24, top: 280, borderTop: `1px solid ${C.linha}` }} />
      {k.motivos.map((m, i) => {
        const y = L.topoLinhas + i * passo
        const principal = i < principais
        const w = Math.max(4, (m.quantidade / max) * L.barraMaxW)
        return (
          <div key={m.motivo}>
            {i > 0 && <div style={{ position: 'absolute', left: 82, width: L.tabela.w - 48, top: y - 8, borderTop: `1px solid ${C.linha}` }} />}
            <div style={{ position: 'absolute', left: 82, top: y + 4, width: 26, height: 26, borderRadius: '50%', fontSize: 12, fontWeight: 800,
              background: principal ? C.vermelhoForte : C.linhaRosa, color: principal ? '#fff' : C.vermelho, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>{i + 1}</div>
            <div style={{ position: 'absolute', left: L.colMotivo, top: y, width: 560 }}>
              <div style={{ fontSize: 17, fontWeight: principal ? 800 : 600, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{m.motivo}</div>
              {m.descricao && <div style={{ fontSize: 11.5, color: C.apagado, marginTop: 3, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{m.descricao}</div>}
            </div>
            <div style={{ position: 'absolute', left: L.colBarra, top: y + 6, width: w, height: 22, borderRadius: 4, background: principal ? BARRA[i] : BARRA_DEMAIS }} />
            <div style={{ position: 'absolute', left: L.colBarra + w + 10, top: y + 6, fontSize: 16, fontWeight: 800, lineHeight: '22px' }}>{m.quantidade}</div>
            <div style={{ position: 'absolute', left: L.colPct - 120, width: 120, top: y + 4, textAlign: 'right', fontSize: 19, fontWeight: 800,
              color: principal ? C.vermelho : C.apagado }}>{pctUmaCasa(m.pct)}</div>
          </div>
        )
      })}
      <div style={{ position: 'absolute', left: 82, top: L.tabela.y + L.tabela.h - 34, fontSize: 11, color: C.apagado }}>
        Base: {k.total} experimentos cancelados. Motivo pelo {fonte}. Percentuais com uma casa decimal.
      </div>
    </div>
  )
}
