'use client'

import { useEffect, useMemo, useState } from 'react'
import { Download, Maximize2, Presentation } from 'lucide-react'
import type { WeeklyData } from '@/lib/weekly'
import type { ComiteResumoView } from '@/lib/comite-resumo'
import { filterBloqueados } from '@/lib/governanca'
import GovernancaSlide from './GovernancaSlide'
import PipelineSlide from './PipelineSlide'
import AprendizadosSlide from './AprendizadosSlide'
import PatrocinadoresSlide from './PatrocinadoresSlide'
import PresentationOverlay from './PresentationOverlay'
import FitSlide from './FitSlide'
import { ComiteResumoSlide } from './ComiteResumoSlide'
import { WARNING_INK, WARNING_LIGHT, WARNING_LIGHTER, WARNING_RAMP } from './palette'

const RED = '#8B0000'
const BLOQUEIOS_THEME = { accent: WARNING_INK, accentLight: WARNING_LIGHT, accentLighter: WARNING_LIGHTER, ramp: WARNING_RAMP }

export default function WeeklySlide() {
  const [data, setData] = useState<WeeklyData | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [presentIndex, setPresentIndex] = useState<number | null>(null)
  const [comite, setComite] = useState<ComiteResumoView | null>(null)
  const [comiteErro, setComiteErro] = useState<string | null>(null)

  useEffect(() => {
    fetch('/jira/api/weekly', { credentials: 'include' })
      .then(r => r.json())
      .then(json => setData(json))
      .catch(err => setError(err.message))
    // Slide "beOn Labs — visão geral" do Comitê (mesmos números da aba Semanal).
    fetch('/jira/api/weekly/comite', { credentials: 'include' })
      .then(r => {
        if (!r.ok) throw new Error(`HTTP ${r.status}`)
        return r.json()
      })
      .then(json => setComite(json.view))
      .catch(err => setComiteErro(err.message))
  }, [])

  // Hooks sempre no topo, antes de qualquer return condicional (loading/erro)
  // — senão a ordem de hooks muda entre renders e o React quebra.
  const bloqueiosData = useMemo(() => data ? filterBloqueados(data.governanca) : null, [data])

  const slides = useMemo(() => {
    if (!data || !bloqueiosData) return []
    return [
      ...(comite ? [{ key: 'comite', label: 'beOn Labs — visão geral', node: <ComiteResumoSlide v={comite} /> }] : []),
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
      { key: 'pipeline', label: 'Nossa pipeline de experimentos', node: <PipelineSlide data={data} /> },
      { key: 'aprendizados', label: 'Principais aprendizados', node: <AprendizadosSlide data={data} /> },
      { key: 'patrocinadores', label: 'Principais patrocinadores', node: <PatrocinadoresSlide data={data} /> },
    ]
  }, [data, bloqueiosData, comite])

  if (error) {
    return <p className="text-sm" style={{ color: RED }}>Erro ao carregar dados: {error}</p>
  }
  if (!data || !bloqueiosData) {
    return <p className="text-sm text-gray-400">Carregando…</p>
  }

  const geradoEmLabel = new Date(data.geradoEm).toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' })
  const desloc = comite ? 1 : 0
  const apresentar = (i: number) => setPresentIndex(i + desloc)

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between gap-2">
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
        <button
          onClick={() => setPresentIndex(0)}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-white transition-colors"
          style={{ background: RED }}
        >
          <Presentation size={13} />
          Apresentar
        </button>
      </div>

      <section className="flex flex-col gap-2" aria-label="beOn Labs — visão geral">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <span className="text-xs font-semibold text-gray-500">beOn Labs — visão geral · deck do Comitê</span>
          <div className="flex items-center gap-2">
            <a
              href="/jira/api/weekly/comite/pptx"
              download
              className="flex items-center gap-1.5 rounded-lg border border-gray-300 bg-white px-3 py-1.5 text-xs font-semibold text-gray-700 hover:bg-gray-50"
              title="PowerPoint editável, com o mesmo design do deck e os dados atuais do Jira"
            >
              <Download size={13} />
              Baixar PPTX editável
            </a>
            {comite && (
              <button type="button" onClick={() => setPresentIndex(0)} className="text-gray-400 hover:text-gray-700" title="Apresentar este slide" aria-label="Apresentar este slide">
                <Maximize2 size={15} />
              </button>
            )}
          </div>
        </div>
        {comite ? (
          <FitSlide><ComiteResumoSlide v={comite} /></FitSlide>
        ) : comiteErro ? (
          <p className="text-sm" style={{ color: RED }}>Não foi possível montar o slide: {comiteErro}</p>
        ) : (
          <p className="text-sm text-gray-400">Montando o slide com os dados do Jira…</p>
        )}
      </section>

      <GovernancaSlide data={data.governanca} beneficioPotencial={data.beneficioTotal} experimentosConcluidos={data.experimentosConcluidos} experimentosCancelados={data.experimentosCancelados} totalEpicsGeral={data.totalEpics} onMaximize={() => apresentar(0)} fitToContainer />
      <GovernancaSlide
        data={bloqueiosData}
        titulo="Bloqueios"
        tituloDestaque="— Ação do Executivo"
        totalLabel="Total Bloqueados"
        filename="weekly-bloqueios-beon-labs"
        theme={BLOQUEIOS_THEME}
        showBloqueioBadge={false}
        emptyState="Nenhum Epic bloqueado nesta semana."
        onMaximize={() => apresentar(1)}
        fitToContainer
      />
      <PipelineSlide data={data} onMaximize={() => apresentar(2)} />
      <AprendizadosSlide data={data} onMaximize={() => apresentar(3)} />
      <PatrocinadoresSlide data={data} onMaximize={() => apresentar(4)} />

      {presentIndex !== null && (
        <PresentationOverlay slides={slides} initialIndex={presentIndex} onClose={() => setPresentIndex(null)} />
      )}
    </div>
  )
}
