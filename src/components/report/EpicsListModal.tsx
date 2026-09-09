"use client"

import React, { useState } from 'react'

interface EpicItem {
  key: string
  nome: string
  iniciativa?: string
  sponsor?: string
  beneficioQuantitativo?: number
  beneficioQualitativo?: string
  status?: { name?: string }
}

export default function EpicsListModal({ title, items, trigger }: { title: string; items: EpicItem[]; trigger?: React.ReactNode }) {
  const [open, setOpen] = useState(false)

  const Trigger = trigger ? (
    <span onClick={() => setOpen(true)} className="inline-flex cursor-pointer hover:underline focus:outline-none" role="button" tabIndex={0} aria-label={`Ver ${items.length} itens`}>
      {trigger}
    </span>
  ) : (
    <button onClick={() => setOpen(true)} className="hover:underline focus:outline-none" aria-label={`Ver ${items.length} itens`}>
      <span className="text-2xl font-bold">{items.length}</span>
    </button>
  )

  return (
    <>
      {Trigger}

      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black/40" onClick={() => setOpen(false)} />
          <div className="relative bg-white rounded-lg shadow-lg w-[min(90%,800px)] max-h-[80vh] overflow-hidden">
            <div className="flex items-center justify-between px-4 py-3 border-b">
              <h3 className="font-semibold">{title} <span className="text-gray-400 text-sm">({items.length})</span></h3>
              <button onClick={() => setOpen(false)} className="text-gray-500 hover:text-gray-800">Fechar</button>
            </div>
            <div className="p-4 overflow-auto" style={{ maxHeight: '60vh' }}>
              {items.length === 0 ? (
                <div className="text-gray-400 text-sm">Nenhum item</div>
              ) : (
                <ul className="space-y-2">
                  {items.map(it => (
                    <li key={it.key} className="flex items-start justify-between">
                      <div className="min-w-0">
                        <div className="font-medium truncate">{it.nome}</div>
                        <div className="text-xs text-gray-500 truncate">{it.iniciativa ?? ''} · {it.sponsor ?? '—'}</div>
                      </div>
                      <div className="text-right text-xs text-gray-500 ml-4">
                        {it.beneficioQuantitativo ? new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(it.beneficioQuantitativo) : (it.beneficioQualitativo ?? '—')}
                        <div className="text-xs text-gray-400">{it.status?.name ?? ''}</div>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  )
}
