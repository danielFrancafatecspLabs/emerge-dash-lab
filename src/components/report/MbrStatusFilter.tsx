'use client'

/**
 * Barra de filtro por fase/status da experimentação para a página MBR.
 * Cada opção representa uma etapa do pipeline de experimentação.
 */

export type FiltroFase =
  | 'tudo'
  | 'EM EXPERIMENTAÇÃO'
  | 'EM VALIDAÇÃO'
  | 'EM PILOTO'
  | 'EM ESCALA'
  | 'FINALIZADO'
  | 'CANCELADO'

interface MbrStatusFilterProps {
  value: FiltroFase
  onChange: (value: FiltroFase) => void
  contagens: Record<FiltroFase, number>
}

const OPCOES: { value: FiltroFase; label: string }[] = [
  { value: 'tudo', label: 'Total' },
  { value: 'CANCELADO', label: 'Cancelados' },
  { value: 'EM EXPERIMENTAÇÃO', label: 'Em Andamento' },
  { value: 'EM VALIDAÇÃO', label: 'Em Validação' },
  { value: 'FINALIZADO', label: 'Concluídos' },
  { value: 'EM PILOTO', label: 'Pilotos' },
  { value: 'EM ESCALA', label: 'Escala' },
]

export default function MbrStatusFilter({ value, onChange, contagens }: MbrStatusFilterProps) {
  return (
    <div className="flex items-center gap-2">
      <span className="text-xs text-gray-500 font-medium whitespace-nowrap">
        <svg className="inline-block w-4 h-4 mr-1 -mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
        </svg>
        Filtro:
      </span>
      <select
        value={value}
        onChange={e => onChange(e.target.value as FiltroFase)}
        className="text-sm font-medium px-3 py-1.5 rounded-lg border border-gray-200 bg-white text-gray-700 shadow-sm focus:outline-none focus:ring-2 focus:ring-[#8B0000]/30 focus:border-[#8B0000] cursor-pointer"
      >
        {OPCOES.map(opcao => {
          const qtd = contagens[opcao.value] ?? 0
          return (
            <option key={opcao.value} value={opcao.value}>
              {opcao.label} ({qtd})
            </option>
          )
        })}
      </select>
    </div>
  )
}