'use client'

import type { ReactNode } from 'react'
import type { LucideIcon } from 'lucide-react'
import { CheckCircle2, Cpu, FlaskConical, Network, Satellite, Search, Settings } from 'lucide-react'

// Slides "de capa" do deck do Comitê (capa, objetivo, divisores e encerramento):
// fundo vermelho com ondas de luz e um elemento de vidro à direita.

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

function Waves() {
  // Feixes de luz curvos atravessando o slide (substituem a arte fotográfica do deck original).
  const paths = [
    'M-40 300 C 260 200, 520 520, 900 380 S 1300 240, 1340 330',
    'M-40 330 C 280 240, 540 560, 920 410 S 1300 280, 1340 360',
    'M-40 360 C 300 300, 560 600, 940 440 S 1300 330, 1340 400',
    'M-40 250 C 200 120, 560 460, 980 330 S 1300 200, 1340 260',
    'M-40 420 C 320 380, 600 640, 960 500 S 1300 420, 1340 470',
  ]
  return (
    <svg width={SLIDE_W} height={SLIDE_H} viewBox={`0 0 ${SLIDE_W} ${SLIDE_H}`} style={{ position: 'absolute', inset: 0 }}>
      <defs>
        <filter id="semanal-glow" x="-20%" y="-20%" width="140%" height="140%">
          <feGaussianBlur stdDeviation="4" result="b" />
          <feMerge><feMergeNode in="b" /><feMergeNode in="SourceGraphic" /></feMerge>
        </filter>
        <linearGradient id="semanal-beam" x1="0" x2="1">
          <stop offset="0" stopColor="#FF6B6B" stopOpacity="0.15" />
          <stop offset="0.35" stopColor="#FFB3B3" stopOpacity="0.85" />
          <stop offset="1" stopColor="#FF6B6B" stopOpacity="0.1" />
        </linearGradient>
      </defs>
      {paths.map((d, i) => (
        <path key={i} d={d} fill="none" stroke="url(#semanal-beam)" strokeWidth={i === 1 ? 3 : 1.2} opacity={i === 1 ? 0.9 : 0.55} filter="url(#semanal-glow)" />
      ))}
    </svg>
  )
}

function GlassCircle({ size, children }: { size: number; children?: ReactNode }) {
  return (
    <div style={{
      width: size, height: size, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center',
      background: 'radial-gradient(circle at 35% 30%, rgba(255,255,255,0.35), rgba(255,255,255,0.06) 45%, rgba(120,0,0,0.25) 100%)',
      border: '2px solid rgba(255,255,255,0.45)',
      boxShadow: 'inset 0 0 40px rgba(255,255,255,0.18), 0 0 50px rgba(255,80,80,0.35)',
    }}>
      {children}
    </div>
  )
}

export function GlassIcon({ icon: Icon, size = 300 }: { icon: LucideIcon; size?: number }) {
  return (
    <GlassCircle size={size}>
      <Icon size={size * 0.48} color="rgba(255,255,255,0.85)" strokeWidth={1.2} style={{ filter: 'drop-shadow(0 0 12px rgba(255,180,180,0.8))' }} />
    </GlassCircle>
  )
}

/** Cinco esferas de vidro conectadas (capa). */
export function GlassMolecule() {
  const R = 150, size = 150
  const icons: LucideIcon[] = [FlaskConical, Cpu, Network, Satellite, Search]
  const pts = icons.map((_, i) => {
    const a = (-90 + i * 72) * Math.PI / 180
    return [R + R * Math.cos(a), R + R * Math.sin(a)]
  })
  const box = 2 * R + size
  return (
    <div style={{ position: 'relative', width: box, height: box }}>
      <svg width={box} height={box} style={{ position: 'absolute', inset: 0 }}>
        {pts.map(([x, y], i) => {
          const [x2, y2] = pts[(i + 1) % pts.length]
          return <line key={i} x1={x + size / 2} y1={y + size / 2} x2={x2 + size / 2} y2={y2 + size / 2} stroke="rgba(255,255,255,0.35)" strokeWidth={14} strokeLinecap="round" />
        })}
      </svg>
      {pts.map(([x, y], i) => {
        const Icon = icons[i]
        return (
          <div key={i} style={{ position: 'absolute', left: x, top: y }}>
            <GlassCircle size={size}>
              <Icon size={58} color="rgba(255,255,255,0.85)" strokeWidth={1.3} />
            </GlassCircle>
          </div>
        )
      })}
    </div>
  )
}

export function RedSlide({ children, art, pagina }: { children: ReactNode; art?: ReactNode; pagina?: number }) {
  return (
    <div style={{
      width: SLIDE_W, height: SLIDE_H, position: 'relative', overflow: 'hidden', fontFamily: 'Calibri, "Segoe UI", Arial, sans-serif',
      background: 'radial-gradient(ellipse at 25% 45%, #B3121A 0%, #8A0B10 40%, #5A0609 75%, #3D0405 100%)',
    }}>
      <Waves />
      {art && <div style={{ position: 'absolute', right: 70, top: '50%', transform: 'translateY(-50%)' }}>{art}</div>}
      <div style={{ position: 'absolute', inset: 0 }}>{children}</div>
      {pagina !== undefined && (
        <span style={{ position: 'absolute', right: 18, bottom: 10, fontSize: 11, color: 'rgba(255,255,255,0.7)' }}>{pagina}</span>
      )}
    </div>
  )
}

export function CapaSlide({ periodo, pagina }: { periodo: string; pagina?: number }) {
  return (
    <RedSlide art={<GlassMolecule />} pagina={pagina}>
      <div style={{ position: 'absolute', left: 140, top: 300, display: 'flex', alignItems: 'center', gap: 56 }}>
        <span style={{ fontSize: 72, fontWeight: 700, color: '#fff' }}>Report</span>
        <BeonWordmark size={84} />
      </div>
      <div style={{ position: 'absolute', left: 148, top: 412, fontSize: 22, color: '#fff' }}>{periodo}</div>
    </RedSlide>
  )
}

export function ObjetivoSlide({ pagina }: { pagina?: number }) {
  return (
    <RedSlide pagina={pagina}>
      <div style={{ position: 'absolute', left: 150, top: 280 }}>
        <BeonWordmark size={52} />
        <div style={{ fontSize: 96, fontWeight: 700, color: '#fff', lineHeight: 1, marginTop: 4 }}>Objetivo</div>
      </div>
      <div style={{
        position: 'absolute', left: 622, top: 232, width: 574, height: 258, border: '2px solid rgba(255,255,255,0.85)', borderRadius: 18,
        display: 'flex', alignItems: 'center', padding: '0 56px', background: 'rgba(60,0,0,0.12)',
      }}>
        <p style={{ fontSize: 19, lineHeight: 1.75, color: '#fff', margin: 0 }}>
          Sinalizar principais problemas, acompanhar experimentos estratégicos e discussões de como evoluir o processo de experimentação
        </p>
      </div>
    </RedSlide>
  )
}

export function DivisorSlide({ linhas, icone = 'check', pagina }: { linhas: string[]; icone?: 'check' | 'flask'; pagina?: number }) {
  const Icon = icone === 'flask' ? FlaskConical : CheckCircle2
  return (
    <RedSlide art={<GlassIcon icon={Icon} size={360} />} pagina={pagina}>
      <div style={{ position: 'absolute', left: 208, top: '50%', transform: 'translateY(-50%)' }}>
        <BeonWordmark size={60} />
        <div style={{ marginTop: 26 }}>
          {linhas.map((l, i) => (
            <div key={i} style={{ fontSize: 60, lineHeight: 1.18, color: '#fff', fontWeight: i === 0 && linhas.length > 1 && icone !== 'flask' && l === 'Experimentos' ? 300 : 700 }}>{l}</div>
          ))}
        </div>
      </div>
    </RedSlide>
  )
}

export function ObrigadoSlide({ pagina }: { pagina?: number }) {
  return (
    <RedSlide art={<GlassIcon icon={Settings} size={380} />} pagina={pagina}>
      <div style={{ position: 'absolute', left: 208, top: 230 }}>
        <BeonWordmark size={60} />
        <div style={{ fontSize: 64, fontWeight: 700, color: '#fff', marginTop: 34 }}>Obrigado</div>
      </div>
    </RedSlide>
  )
}
