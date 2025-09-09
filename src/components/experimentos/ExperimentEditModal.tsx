import React from 'react';
import { InlineDropdown } from './InlineDropdown';

interface ExperimentEditModalProps {
  open: boolean;
  columns: string[];
  editData: any;
  onChange: (key: string, value: string) => void;
  onCancel: () => void;
  onSave: () => void;
  onDelete: () => void;
  optionsMap: Record<string, string[]>;
}

export function ExperimentEditModal({ open, columns, editData, onChange, onCancel, onSave, onDelete, optionsMap }: ExperimentEditModalProps) {
  if (!open || !editData) return null;
  return (
    <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-lg p-6 w-full max-w-4xl flex flex-col">
        <h2 className="text-xl font-bold mb-4">Editar Experimento</h2>
        <div className="grid grid-cols-4 gap-4 mb-4">
          {columns.map((col) => (
            <div key={col} className="flex flex-col">
              <label className="text-sm font-medium text-gray-700 mb-1">{col}</label>
              {optionsMap[col] ? (
                <InlineDropdown
                  value={editData[col] || ''}
                  options={optionsMap[col]}
                  onChange={(v) => onChange(col, v)}
                />
              ) : (
                <input
                  className="border rounded px-2 py-1 text-gray-800"
                  value={editData[col] || ''}
                  onChange={(e) => onChange(col, e.target.value)}
                  disabled={col === '#'}
                />
              )}
            </div>
          ))}
        </div>
        <div className="flex gap-2 justify-end">
          <button onClick={onCancel} className="px-4 py-2 rounded bg-gray-200 text-gray-800">Cancelar</button>
          <button onClick={onSave} className="px-4 py-2 rounded bg-blue-600 text-white">Salvar</button>
          <button onClick={onDelete} className="px-4 py-2 rounded bg-red-600 text-white">Excluir</button>
        </div>
      </div>
    </div>
  );
}
