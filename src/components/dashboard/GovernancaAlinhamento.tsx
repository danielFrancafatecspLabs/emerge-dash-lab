'use client'

import { useState } from 'react'
import { DashboardData } from '@/lib/types'
import { List } from 'lucide-react'
import EpicModal from './EpicModal'

interface Props { data: DashboardData }

const ALINHAMENTOS = [
  { label: 'Eficiencia Operacional', pct: 0.30, color: '#CC0000' },
  { label: 'Receita',               pct: 0.28, color: '#CC0000' },
  { label: 'Experiencia do Cliente', pct: 0.19, color: '#CC0000' },
]

const BLOQUEIOS = [
  'Dados e integrações',
  'Tempo de aprovação',
  'Recursos especializados',
  'Infraestrutura',
]

const DECISOES = [
  'Priorização de 2 MVPs',
  'Aprovação de orçamento',
  'Acesso a dados críticos',
  'Acordos com parceiros',
]

export default function GovernancaAlinhamento({ data }: Props) {
  const [modal, setModal] = useState<string | null>(null)
  const total = data.totalEpicsAtivos || 1

  return (
    <>
      <div className="bg-white rounded-lg p-4 border border-gray-200 h-full flex flex-col gap-4">
        <div className="flex items-center justify-between">
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-widest">
            Governança e Alinhamento
          </p>
          <button
            className="text-xs px-2 py-0.5 rounded border border-gray-300 text-gray-600"
            style={{ fontSize: 9 }}
          >
            Semestre Atual ▾
          </button>
        </div>

        {/* Sponsors */}
        <div>
          <p className="text-xs font-semibold text-gray-700 mb-2">Sponsors Ativos (Top 5)</p>
          <div className="space-y-2">
            {data.topSponsors.map(s => (
              <div key={s.nome} className="flex items-center gap-2 group">
                <div
                  className="rounded-full flex items-center justify-center text-white font-bold flex-shrink-0"
                  style={{ width: 26, height: 26, background: '#CC0000', fontSize: 10 }}
                >
                  {s.nome.split(' ').map(p => p[0]).join('').slice(0, 2).toUpperCase()}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-gray-800 truncate" style={{ fontSize: 11, fontWeight: 500 }}>{s.nome}</p>
                  <p className="text-gray-500" style={{ fontSize: 9 }}>{s.count} experimentos</p>
                </div>
                <button
                  onClick={() => setModal(s.nome)}
                  className="rounded p-1 hover:bg-gray-100 transition-colors text-gray-400 hover:text-gray-600 opacity-0 group-hover:opacity-100"
                  title="Ver experimentos deste sponsor"
                >
                  <List size={12} />
                </button>
              </div>
            ))}
            {data.topSponsors.length === 0 && (
              <p className="text-gray-400 text-xs">Nenhum sponsor informado</p>
            )}
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3 flex-1">
          {/* Alinhamento Estratégico */}
          <div>
            <p className="text-xs font-semibold text-gray-700 mb-2">Alinhamento Estratégico</p>
            <div className="space-y-2">
              {ALINHAMENTOS.map(a => {
                const count = Math.round(total * a.pct)
                const pct = Math.round(a.pct * 100)
                return (
                  <div key={a.label}>
                    <div className="flex justify-between mb-0.5" style={{ fontSize: 9 }}>
                      <span className="text-gray-700">{a.label}</span>
                      <span className="font-semibold text-gray-800">{count} ({pct}%)</span>
                    </div>
                    <div className="h-1.5 bg-gray-200 rounded-full">
                      <div
                        className="h-1.5 rounded-full"
                        style={{ width: `${pct * 3}%`, background: a.color }}
                      />
                    </div>
                  </div>
                )
              })}
            </div>
          </div>

          {/* Bloqueios + Decisões */}
          <div className="flex flex-col gap-3">
            <div>
              <p className="text-xs font-semibold text-gray-700 mb-1.5">Principais Bloqueios</p>
              <div className="space-y-1">
                {BLOQUEIOS.map(b => (
                  <div key={b} className="flex items-center gap-1.5">
                    <div className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ background: '#CC0000' }} />
                    <span className="text-gray-700" style={{ fontSize: 10 }}>{b}</span>
                  </div>
                ))}
              </div>
            </div>
            <div>
              <p className="text-xs font-semibold text-gray-700 mb-1.5">Decisões Pendentes</p>
              <div className="space-y-1">
                {DECISOES.map(d => (
                  <div key={d} className="flex items-center gap-1.5">
                    <div className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ background: '#FF8C00' }} />
                    <span className="text-gray-700" style={{ fontSize: 10 }}>{d}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      {modal && (
        <EpicModal
          title={`Sponsor: ${modal}`}
          epics={data.allEpics.filter(e => e.sponsor === modal)}
          onClose={() => setModal(null)}
        />
      )}
    </>
  )
}
