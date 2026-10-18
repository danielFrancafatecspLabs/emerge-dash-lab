'use client'

import type { CSSProperties, ReactNode } from 'react'

// Slides "de capa" do deck do Comitê (capa, objetivo, divisores e encerramento): a arte original do deck
// (public/semanal/*.jpg, com o logo e o elemento de vidro) e os textos nas mesmas posições do PowerPoint.
// O PPTX editável (lib/semanal-pptx) usa a mesma arte e as mesmas posições.

export const SLIDE_W = 1280
export const SLIDE_H = 720

export function BeonWordmark({ size = 64, color = '#fff' }: { size?: number; color?: string }) {
  return (
    <span style={{ display: 'inline-flex', alignItems: 'flex-end', gap: size * 0.05, color, lineHeight: 1 }}>
      <span style={{ fontSize: size, fontWeight: 800, letterSpacing: -size * 0.04 }}>beOn</span>
      <span style={{ fontSize: size * 0.24, fontWeight: 700, marginBottom: size * 0.02 }}>Labs</span>
    </span>
  )
}

export type FundoSlide = 'capa' | 'objetivo' | 'divisor-check' | 'divisor-frasco' | 'obrigado'

const K = SLIDE_W / 9_144_000                       // px por EMU
const emu = (v: number) => v * K
const pt = (centesimos: number) => (centesimos / 100) * 12_700 * K
const CALIBRI = 'Calibri, Carlito, "Segoe UI", Arial, sans-serif'

/** Texto branco do deck, posicionado em EMU (canto superior esquerdo da caixa). */
function TextoBranco({ x, y, sz, negrito, children, style }: { x: number; y: number; sz: number; negrito?: boolean; children: ReactNode; style?: CSSProperties }) {
  return (
    <div style={{ position: 'absolute', left: emu(x), top: emu(y), fontFamily: CALIBRI, fontSize: pt(sz), fontWeight: negrito ? 700 : 400,
      color: '#fff', lineHeight: 1.2, whiteSpace: 'nowrap', ...style }}>
      {children}
    </div>
  )
}

export function RedSlide({ fundo, children, pagina }: { fundo: FundoSlide; children: ReactNode; pagina?: number }) {
  return (
    <div style={{
      width: SLIDE_W, height: SLIDE_H, position: 'relative', overflow: 'hidden', background: '#5A0609',
      backgroundImage: `url(/jira/semanal/${fundo}.jpg)`, backgroundSize: 'cover', backgroundPosition: 'center',
    }}>
      {children}
      {pagina !== undefined && (
        <span style={{ position: 'absolute', left: emu(8_712_200), top: emu(4_965_700), fontSize: pt(700), fontWeight: 700, color: '#9AA0A6', fontFamily: 'Arial' }}>{pagina}</span>
      )}
    </div>
  )
}

export function CapaSlide({ periodo, pagina }: { periodo: string; pagina?: number }) {
  return (
    <RedSlide fundo="capa" pagina={pagina}>
      <TextoBranco x={977_849} y={2_142_693} sz={4840} negrito>Report</TextoBranco>
      <TextoBranco x={1_058_900} y={2_955_772} sz={1370}>{periodo}</TextoBranco>
    </RedSlide>
  )
}

export const OBJETIVO_LINHAS = [
  'Sinalizar principais problemas, acompanhar',
  'experimentos estratégicos e discussões de como',
  'evoluir o processo de experimentação',
]

export function ObjetivoSlide({ pagina }: { pagina?: number }) {
  return (
    <RedSlide fundo="objetivo" pagina={pagina}>
      <TextoBranco x={1_085_265} y={2_291_511} sz={5410} negrito>Objetivo</TextoBranco>
      {OBJETIVO_LINHAS.map((linha, i) => (
        <TextoBranco key={linha} x={5_094_630} y={[2_247_798, 2_485_288, 2_724_048][i]} sz={1080}>{linha}</TextoBranco>
      ))}
    </RedSlide>
  )
}

/** Posição (topo de cada linha, em EMU) dos títulos dos divisores, como no deck. */
export function linhasDoDivisor(linhas: string[], icone: 'check' | 'flask'): { texto: string; y: number; negrito: boolean }[] {
  const passo = 550_000
  const ultima = icone === 'flask' ? 2_664_409 : 3_018_739
  return linhas.map((texto, i) => ({
    texto,
    y: ultima - (linhas.length - 1 - i) * passo,
    // No deck, "Experimentos" abre os divisores de check em peso normal; o restante é negrito.
    negrito: !(i === 0 && linhas.length > 1 && icone === 'check' && texto === 'Experimentos'),
  }))
}

export function DivisorSlide({ linhas, icone = 'check', pagina }: { linhas: string[]; icone?: 'check' | 'flask'; pagina?: number }) {
  return (
    <RedSlide fundo={icone === 'flask' ? 'divisor-frasco' : 'divisor-check'} pagina={pagina}>
      {linhasDoDivisor(linhas, icone).map(l => (
        <TextoBranco key={l.texto} x={1_466_545} y={l.y} sz={4040} negrito={l.negrito}>{l.texto}</TextoBranco>
      ))}
    </RedSlide>
  )
}

export function ObrigadoSlide({ pagina }: { pagina?: number }) {
  return (
    <RedSlide fundo="obrigado" pagina={pagina}>
      <TextoBranco x={1_466_545} y={2_293_569} sz={4040} negrito>Obrigado</TextoBranco>
    </RedSlide>
  )
}
