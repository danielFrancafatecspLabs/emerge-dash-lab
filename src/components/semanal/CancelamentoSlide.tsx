'use client'

import type { SemanalCancelamento } from '@/lib/semanal'
import { CANCELAMENTO_LAYOUT as L, fraseDestaque, pctUmaCasa } from '@/lib/semanal-deck'
import { SLIDE_H, SLIDE_W } from './SlideArt'

// Slide "Principais motivos de cancelamento dos Experimentos" (deck do Comitê): total de cancelados, quanto os
// dois principais motivos concentram e a distribuição por motivo — os dois maiores em vermelho, os demais em cinza.

const RED = '#CC0000'
const INK = '#1F2328'
const MUTED = '#6B7280'
const BARRAS = ['#CC0000', '#8B0000']
const BARRA_DEMAIS = '#C4C7CE'
const ARIAL = 'Arial, "Helvetica Neue", Helvetica, sans-serif'

export default function CancelamentoSlide({ cancelamento: c }: { cancelamento: SemanalCancelamento }) {
  const max = Math.max(1, ...c.motivos.map(m => m.quantidade))
  return (
    <div style={{ width: SLIDE_W, height: SLIDE_H, position: 'relative', overflow: 'hidden', background: '#fff', color: INK, fontFamily: ARIAL }}>
      <div style={{ position: 'absolute', left: 44, top: 30, fontSize: 38, fontWeight: 700, color: RED }}>Principais motivos de cancelamento dos Experimentos</div>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src="/jira/semanal/logo.png" alt="beOn Labs" style={{ position: 'absolute', right: 44, top: 36, height: 44 }} />

      <div style={{ position: 'absolute', left: 44, top: 116, fontSize: 70, fontWeight: 700, color: RED, lineHeight: 1 }}>{c.total}</div>
      <div style={{ position: 'absolute', left: 180, top: 130, fontSize: 21, color: MUTED, lineHeight: 1.2 }}>experimentos<br />cancelados</div>
      {c.destaque && (
        <>
          <div style={{ position: 'absolute', left: 500, top: 122, width: 200, textAlign: 'right', fontSize: 56, fontWeight: 700, color: RED, lineHeight: 1 }}>
            {pctUmaCasa(c.destaque.pct)}
          </div>
          <div style={{ position: 'absolute', left: 722, top: 126, width: 520, fontSize: 21, lineHeight: 1.25, color: INK }}>{fraseDestaque(c)}</div>
        </>
      )}

      <div style={{ position: 'absolute', left: 44, top: 232, fontSize: 15, fontWeight: 700, color: MUTED, letterSpacing: 0.5 }}>MOTIVO</div>
      <div style={{ position: 'absolute', left: L.pctDireita - 160, width: 160, top: 232, fontSize: 15, fontWeight: 700, color: MUTED, textAlign: 'right' }}>% DO TOTAL</div>
      <div style={{ position: 'absolute', left: L.barraX + 10, top: 232, fontSize: 15, fontWeight: 700, color: MUTED }}>QUANTIDADE DE EXPERIMENTOS</div>

      {c.motivos.map((m, i) => {
        const y = L.linhaTopo + i * L.passo(c.motivos.length)
        const principal = i < (c.destaque?.motivos.length ?? 0)
        const w = Math.max(4, (m.quantidade / max) * L.barraMaxW)
        return (
          <div key={m.motivo}>
            <div style={{ position: 'absolute', left: 44, top: y, width: 640, fontSize: 25, fontWeight: principal ? 700 : 400, color: INK, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{m.motivo}</div>
            {m.descricao && (
              <div style={{ position: 'absolute', left: 52, top: y + 33, width: 640, fontSize: 14, color: INK, fontFamily: 'Calibri, Carlito, "Segoe UI", Arial, sans-serif' }}>{m.descricao}</div>
            )}
            <div style={{ position: 'absolute', left: L.pctDireita - 160, width: 160, top: y, textAlign: 'right', fontSize: 25, fontWeight: 700, color: principal ? RED : MUTED }}>{pctUmaCasa(m.pct)}</div>
            <div style={{ position: 'absolute', left: L.barraX, top: y - 4, width: w, height: L.barraH, background: principal ? BARRAS[i] : BARRA_DEMAIS }} />
            <div style={{ position: 'absolute', left: L.barraX + w + 8, top: y + 1, fontSize: 21, fontWeight: 700, color: INK }}>{m.quantidade}</div>
          </div>
        )
      })}

      <div style={{ position: 'absolute', left: 44, top: 668, fontSize: 15, color: MUTED }}>
        Base: {c.total} experimentos cancelados. Percentuais arredondados a uma casa decimal.
      </div>
    </div>
  )
}
