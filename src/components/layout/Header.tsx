import { Radio } from 'lucide-react'
import LogoutButton from './LogoutButton'

export default function Header() {
  return (
    <header
      className="flex items-center justify-between px-5 py-3"
      style={{ background: '#8B0000', minHeight: 52 }}
    >
      <div className="flex items-center gap-3">
        <Radio size={20} color="white" />
        <h1 className="text-white font-bold tracking-wide" style={{ fontSize: 15, letterSpacing: '0.08em' }}>
          DASHBOARD EXECUTIVO DE EXPERIMENTOS TELECOM
        </h1>
      </div>
      <div className="flex items-center gap-3">
        <span className="text-white/80 text-xs">Visão Geral do Portfólio</span>
        <button
          className="text-xs font-semibold px-3 py-1 rounded border border-white/40 text-white"
          style={{ background: 'rgba(255,255,255,0.15)' }}
        >
          Semestre Atual ▾
        </button>
        <LogoutButton />
      </div>
    </header>
  )
}
