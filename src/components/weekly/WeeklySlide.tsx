'use client'

import { useEffect, useState } from 'react'
import type { WeeklyData } from '@/lib/weekly'
import IntakeSlide from './IntakeSlide'
import PipelineSlide from './PipelineSlide'

const RED = '#8B0000'
const WARNING_INK = '#92400E'

export default function WeeklySlide() {
  const [data, setData] = useState<WeeklyData | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetch('/jira/api/weekly', { credentials: 'include' })
      .then(r => r.json())
      .then(json => setData(json))
      .catch(err => setError(err.message))
  }, [])

  if (error) {
    return <p className="text-sm" style={{ color: RED }}>Erro ao carregar dados: {error}</p>
  }
  if (!data) {
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

      <IntakeSlide experimentosAprovados={data.experimentosAprovados} />
      <PipelineSlide data={data} />
    </div>
  )
}
