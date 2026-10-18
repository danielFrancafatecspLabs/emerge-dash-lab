'use client'

import { useEffect, useMemo, useState } from 'react'
import { Presentation } from 'lucide-react'
import type { WeeklyData } from '@/lib/weekly'
import { filterBloqueados } from '@/lib/governanca'
import GovernancaSlide from './GovernancaSlide'
import AprendizadosSlide from './AprendizadosSlide'
import PatrocinadoresSlide from './PatrocinadoresSlide'
import PresentationOverlay from './PresentationOverlay'
import { WARNING_INK, WARNING_LIGHT, WARNING_LIGHTER, WARNING_RAMP } from './palette'

// Acompanhamento da semana, exibido na aba Semanal depois do deck do Comitê: governança por domínio e fase,
// bloqueios que pedem ação do executivo, patrocinadores e aprendizados. Cada slide tem download em PNG/JPG.

const RED = '#8B0000'
const BLOQUEIOS_THEME = { accent: WARNING_INK, accentLight: WARNING_LIGHT, accentLighter: WARNING_LIGHTER, ramp: WARNING_RAMP }

export default function AcompanhamentoSemanal() {
  const [data, setData] = useState<WeeklyData | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [presentIndex, setPresentIndex] = useState<number | null>(null)

  useEffect(() => {
    fetch('/jira/api/weekly', { credentials: 'include' })
      .then(r => r.json())
      .then(json => setData(json))
      .catch(err => setError(err.message))
  }, [])

  // Hooks sempre no topo, antes de qualquer return condicional (loading/erro)
  // — senão a ordem de hooks muda entre renders e o React quebra.
  const bloqueiosData = useMemo(() => data ? filterBloqueados(data.governanca) : null, [data])

  const slides = useMemo(() => {
    if (!data || !bloqueiosData) return []
    return [
      { key: 'governanca', label: 'Governança beOn Labs', node: <GovernancaSlide data={data.governanca} beneficioPotencial={data.beneficioTotal} experimentosConcluidos={data.experimentosConcluidos} experimentosCancelados={data.experimentosCancelados} totalEpicsGeral={data.totalEpics} /> },
      {
        key: 'bloqueios', label: 'Bloqueios — Ação do Executivo', node: (
          <GovernancaSlide
            data={bloqueiosData}
            titulo="Bloqueios"
            tituloDestaque="— Ação do Executivo"
            totalLabel="Total Bloqueados"
            filename="weekly-bloqueios-beon-labs"
            theme={BLOQUEIOS_THEME}
            showBloqueioBadge={false}
            emptyState="Nenhum Epic bloqueado nesta semana."
          />
        ),
      },
      { key: 'patrocinadores', label: 'Principais patrocinadores', node: <PatrocinadoresSlide data={data} /> },
      { key: 'aprendizados', label: 'Principais aprendizados', node: <AprendizadosSlide data={data} /> },
    ]
  }, [data, bloqueiosData])

  if (error) {
    return <p className="text-sm" style={{ color: RED }}>Erro ao carregar o acompanhamento da semana: {error}</p>
  }
  if (!data || !bloqueiosData) {
    return <p className="text-sm text-gray-400">Carregando o acompanhamento da semana…</p>
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between gap-2">
        <div>
          <h2 className="text-base font-semibold text-gray-900">Acompanhamento da semana</h2>
          <p className="text-xs text-gray-500">Governança, bloqueios, patrocinadores e aprendizados</p>
        </div>
        <button
          onClick={() => setPresentIndex(0)}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-white transition-colors"
          style={{ background: RED }}
        >
          <Presentation size={13} />
          Apresentar
        </button>
      </div>

      <GovernancaSlide data={data.governanca} beneficioPotencial={data.beneficioTotal} experimentosConcluidos={data.experimentosConcluidos} experimentosCancelados={data.experimentosCancelados} totalEpicsGeral={data.totalEpics} onMaximize={() => setPresentIndex(0)} fitToContainer />
      <GovernancaSlide
        data={bloqueiosData}
        titulo="Bloqueios"
        tituloDestaque="— Ação do Executivo"
        totalLabel="Total Bloqueados"
        filename="weekly-bloqueios-beon-labs"
        theme={BLOQUEIOS_THEME}
        showBloqueioBadge={false}
        emptyState="Nenhum Epic bloqueado nesta semana."
        onMaximize={() => setPresentIndex(1)}
        fitToContainer
      />
      <PatrocinadoresSlide data={data} onMaximize={() => setPresentIndex(2)} />
      <AprendizadosSlide data={data} onMaximize={() => setPresentIndex(3)} />

      {presentIndex !== null && (
        <PresentationOverlay slides={slides} initialIndex={presentIndex} onClose={() => setPresentIndex(null)} />
      )}
    </div>
  )
}
