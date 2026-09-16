'use client'

import { useEffect, useMemo, useState } from 'react'
import type { WeeklyData } from '@/lib/weekly'
import { filterBloqueados } from '@/lib/governanca'
import GovernancaSlide from './GovernancaSlide'
import PipelineSlide from './PipelineSlide'
import { WARNING_INK, WARNING_LIGHT, WARNING_LIGHTER, WARNING_RAMP } from './palette'

const RED = '#8B0000'
const BLOQUEIOS_THEME = { accent: WARNING_INK, accentLight: WARNING_LIGHT, accentLighter: WARNING_LIGHTER, ramp: WARNING_RAMP }

export default function WeeklySlide() {
  const [data, setData] = useState<WeeklyData | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetch('/jira/api/weekly', { credentials: 'include' })
      .then(r => r.json())
      .then(json => setData(json))
      .catch(err => setError(err.message))
  }, [])

  // Hooks sempre no topo, antes de qualquer return condicional (loading/erro)
  // — senão a ordem de hooks muda entre renders e o React quebra.
  const bloqueiosData = useMemo(() => data ? filterBloqueados(data.governanca) : null, [data])

  if (error) {
    return <p className="text-sm" style={{ color: RED }}>Erro ao carregar dados: {error}</p>
  }
  if (!data || !bloqueiosData) {
    return <p className="text-sm text-gray-400">Carregando…</p>
  }

  const geradoEmLabel = new Date(data.geradoEm).toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' })

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center gap-2">
        {data.isSample && (
          <span
            style={{ fontSize: 11, fontWeight: 700, color: WARNING_INK, background: '#FEF3C7', padding: '3px 8px', borderRadius: 999 }}
            title="O Jira não respondeu; estes são dados de exemplo para pré-visualizar o layout."
          >
            Dados de exemplo (Jira indisponível)
          </span>
        )}
        <span className="text-xs text-gray-400">Gerado em {geradoEmLabel}</span>
      </div>

      <GovernancaSlide data={data.governanca} />
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
      <PipelineSlide data={data} />
    </div>
  )
}
