import React from 'react';
import { InlineDropdown } from './InlineDropdown';

interface ExperimentNewModalProps {
  open: boolean;
  columns: string[];
  newExpData: any;
  onChange: (key: string, value: string) => void;
  onCancel: () => void;
  onSave: () => void;
  optionsMap: Record<string, string[]>;
}

export function ExperimentNewModal({ open, columns, newExpData, onChange, onCancel, onSave, optionsMap }: ExperimentNewModalProps) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-lg p-6 w-full max-w-3xl flex flex-col">
        <h2 className="text-xl font-bold mb-4">Novo Experimento</h2>
        <div className="grid grid-cols-3 gap-4 mb-4">
          {columns.map((col) => (
            <div key={col} className="flex flex-col">
              <label className="text-sm font-medium text-gray-700 mb-1">{col}</label>
              {optionsMap[col] ? (
                <InlineDropdown
                  value={newExpData[col] || ''}
                  options={optionsMap[col]}
                  onChange={(v) => onChange(col, v)}
                />
              ) : (
                <input
                  className="border rounded px-2 py-1 text-gray-800"
                  value={newExpData[col] || ''}
                  onChange={(e) => onChange(col, e.target.value)}
                />
              )}
            </div>
          ))}
        </div>
        <div className="flex gap-2 justify-end">
          <button onClick={onCancel} className="px-4 py-2 rounded bg-gray-200 text-gray-800">Cancelar</button>
          <button onClick={onSave} className="px-4 py-2 rounded bg-green-600 text-white">Salvar</button>
        </div>
      </div>
    </div>
  );
}
