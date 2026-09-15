import React from "react";
import { InlineDropdown } from "./InlineDropdown";

interface ExperimentNewModalProps {
  open: boolean;
  columns: string[];
  newExpData: Record<string, string>;
  onChange: (key: string, value: string) => void;
  onCancel: () => void;
  onSave: () => void;
  optionsMap: Record<string, string[]>;
}

export function ExperimentNewModal({
  open,
  columns,
  newExpData,
  onChange,
  onCancel,
  onSave,
  optionsMap,
}: ExperimentNewModalProps) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50">
      <div
        className="bg-white rounded-2xl shadow-2xl p-8 w-full max-w-4xl flex flex-col"
        style={{ maxHeight: "90vh", overflowY: "auto" }}
      >
        <h2 className="text-2xl font-extrabold mb-6 text-[#7a0019]">
          Novo Experimento
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
          {columns.map((col) => (
            <div key={col} className="flex flex-col">
              <label className="text-sm font-bold text-[#7a0019] mb-2">
                {col}
              </label>
              {optionsMap[col] ? (
                <InlineDropdown
                  value={newExpData[col] || ""}
                  options={optionsMap[col]}
                  onChange={(v) => onChange(col, v)}
                />
              ) : (
                <input
                  className="border border-gray-300 rounded-lg px-3 py-2 text-gray-800 focus:outline-none focus:ring-2 focus:ring-[#7a0019]/40 transition"
                  value={newExpData[col] || ""}
                  onChange={(e) => onChange(col, e.target.value)}
                  placeholder={`Digite ${col.toLowerCase()}`}
                />
              )}
            </div>
          ))}
        </div>
        <div className="flex gap-3 justify-end mt-2">
          <button
            onClick={onCancel}
            className="px-5 py-2 rounded-lg bg-gray-100 text-gray-700 font-semibold hover:bg-gray-200 transition"
          >
            Cancelar
          </button>
          <button
            onClick={onSave}
            className="px-5 py-2 rounded-lg bg-[#009e3c] text-white font-bold shadow hover:bg-[#007c2c] transition"
          >
            Salvar
          </button>
        </div>
      </div>
    </div>
  );
}
