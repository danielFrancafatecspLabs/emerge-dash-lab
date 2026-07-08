'use client'

import { EpicDetail } from '@/lib/types'
import { formatBRL, META_LABELS } from '@/lib/mappers'
import { X } from 'lucide-react'

interface Props {
  epic: EpicDetail
  onClose: () => void
}

const META_COLORS: Record<string, { background: string; color: string }> = {
  'EBITDA':  { background: '#DBEAFE', color: '#1D4ED8' },
  'Receita': { background: '#DCFCE7', color: '#166534' },
  'NPS':     { background: '#FEE2E2', color: '#991B1B' },
}

function Field({ label, value }: { label: string; value: string | null | undefined }) {
  return (
    <div>
      <p className="text-gray-400 uppercase font-semibold tracking-widest mb-0.5" style={{ fontSize: 9 }}>
        {label}
      </p>
      <p className="text-gray-800 font-medium" style={{ fontSize: 12 }}>
        {value ?? <span className="text-gray-300 font-normal">—</span>}
      </p>
    </div>
  )
}

export default function ExperimentoModal({ epic, onClose }: Props) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center"
      style={{ background: 'rgba(0,0,0,0.55)' }}
      onClick={onClose}
    >
      <div
        className="bg-white rounded-xl shadow-2xl flex flex-col"
        style={{ width: '92vw', maxWidth: 780, maxHeight: '90vh' }}
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div
          className="flex items-start justify-between px-5 py-4 border-b border-gray-200 flex-shrink-0"
          style={{ borderTopLeftRadius: '0.75rem', borderTopRightRadius: '0.75rem' }}
        >
          <div className="flex-1 min-w-0 pr-4">
            <div className="flex items-center gap-2 flex-wrap mb-1">
              <span className="font-mono font-bold text-xs px-2 py-0.5 rounded" style={{ background: '#FFF0F0', color: '#CC0000' }}>
                {epic.key}
              </span>
              <span className="text-xs px-2 py-0.5 rounded bg-gray-100 text-gray-600 font-medium">
                {epic.status.name}
              </span>
              {epic.tipo && (
                <span className="text-xs px-2 py-0.5 rounded bg-gray-100 text-gray-500">
                  {epic.tipo}
                </span>
              )}
              {epic.metaCategoria && (
                <span
                  className="text-xs px-2 py-0.5 rounded font-semibold"
                  style={META_COLORS[epic.metaCategoria] ?? { background: '#F3F4F6', color: '#374151' }}
                >
                  {META_LABELS[epic.metaCategoria] ?? epic.metaCategoria}
                </span>
              )}
            </div>
            <p className="font-bold text-gray-900 leading-snug" style={{ fontSize: 15 }}>
              {epic.nome}
            </p>
          </div>
          <button
            onClick={onClose}
            className="rounded-full p-1.5 hover:bg-gray-100 transition-colors text-gray-400 flex-shrink-0"
          >
            <X size={18} />
          </button>
        </div>

        {/* Body */}
        <div className="overflow-auto flex-1 px-5 py-4 flex flex-col gap-5">

          {/* Bloqueio — alerta em destaque */}
          {epic.motivoBloqueio && (
            <div className="rounded-lg px-3 py-2.5 flex items-start gap-2" style={{ background: '#FFF3CD', border: '1px solid #F59E0B' }}>
              <span style={{ fontSize: 14 }}>⚠️</span>
              <div>
                <p className="font-semibold text-xs uppercase tracking-widest" style={{ color: '#92400E' }}>Motivo de Bloqueio</p>
                <p className="text-gray-800 mt-0.5" style={{ fontSize: 12 }}>{epic.motivoBloqueio}</p>
              </div>
            </div>
          )}

          {/* Descrição */}
          {epic.descricao && (
            <div>
              <p className="text-xs font-semibold uppercase tracking-widest text-gray-400 mb-2">Descrição</p>
              <p className="text-gray-700 leading-relaxed" style={{ fontSize: 12 }}>{epic.descricao}</p>
            </div>
          )}

          {/* Financeiro */}
          <div className="rounded-lg p-3 border" style={{ background: '#FFF8F8', borderColor: '#FECACA' }}>
            <p className="text-xs font-semibold uppercase tracking-widest mb-3" style={{ color: '#CC0000' }}>
              Financeiro
            </p>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div>
                <p className="text-gray-400 uppercase font-semibold tracking-widest mb-0.5" style={{ fontSize: 9 }}>
                  Benefício Potencial
                </p>
                <p className="font-bold" style={{ fontSize: 16, color: epic.beneficioQuantitativo ? '#CC0000' : '#D1D5DB' }}>
                  {epic.beneficioQuantitativo ? formatBRL(epic.beneficioQuantitativo) : '—'}
                </p>
              </div>
              <div>
                <p className="text-gray-400 uppercase font-semibold tracking-widest mb-0.5" style={{ fontSize: 9 }}>
                  Custo Estimado
                </p>
                <p className="font-bold text-gray-800" style={{ fontSize: 16 }}>
                  {epic.custoEstimado ? formatBRL(epic.custoEstimado) : '—'}
                </p>
              </div>
              <div className="sm:col-span-2">
                <p className="text-gray-400 uppercase font-semibold tracking-widest mb-0.5" style={{ fontSize: 9 }}>
                  Custo Realizado
                </p>
                <p className="font-medium text-gray-800" style={{ fontSize: 12 }}>
                  {epic.custoRealizado ?? <span className="text-gray-300">—</span>}
                </p>
              </div>
            </div>
            {epic.beneficioQualitativo && (
              <div className="mt-3">
                <p className="text-gray-400 uppercase font-semibold tracking-widest mb-0.5" style={{ fontSize: 9 }}>
                  Benefício Qualitativo
                </p>
                <p className="text-gray-700" style={{ fontSize: 12 }}>{epic.beneficioQualitativo}</p>
              </div>
            )}
          </div>

          {/* Responsáveis */}
          <div>
            <p className="text-xs font-semibold uppercase tracking-widest text-gray-400 mb-3">Responsáveis</p>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
              <Field label="Sponsor"          value={epic.sponsor} />
              <Field label="Business Owner"   value={epic.bo} />
              <Field label="Time Responsável" value={epic.timeResponsavel} />
              <Field label="Diretoria"        value={epic.diretoria} />
            </div>
          </div>

          {/* Classificação */}
          <div>
            <p className="text-xs font-semibold uppercase tracking-widest text-gray-400 mb-3">Classificação</p>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
              <Field label="Domínio"      value={epic.dominio} />
              <Field label="Segmento"     value={epic.segmento ?? epic.mercado} />
              <Field label="Portfólio"    value={epic.portfolio} />
              <Field label="Complexidade" value={epic.complexidade} />
            </div>
          </div>

        </div>
      </div>
    </div>
  )
}
