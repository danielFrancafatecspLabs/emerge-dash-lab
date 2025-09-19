import React from "react";
import { InlineDropdown } from "./InlineDropdown";
import { Pencil, XCircle, CheckCircle2, Trash2 } from "lucide-react";

interface ExperimentEditModalProps {
  open: boolean;
  columns: string[];
  editData: Record<string, string>;
  onChange: (key: string, value: string) => void;
  onCancel: () => void;
  onSave: () => void;
  onDelete: () => void;
  optionsMap: Record<string, string[]>;
}

export function ExperimentEditModal({
  open,
  columns,
  editData,
  onChange,
  onCancel,
  onSave,
  onDelete,
  optionsMap,
}: ExperimentEditModalProps) {
  if (!open || !editData) return null;
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 transition-all duration-500 ease-in-out">
      <div className="bg-white rounded-2xl shadow-2xl p-8 w-full max-w-4xl flex flex-col border-2 border-[#7a0019]/30 relative animate-modal-pop">
        <button
          onClick={onCancel}
          className="absolute top-4 right-4 text-[#7a0019] bg-white rounded-full p-2 shadow hover:bg-rose-50 transition"
          title="Fechar"
        >
          <XCircle className="w-6 h-6" />
        </button>
        <div className="flex items-center gap-3 mb-6">
          <Pencil className="w-8 h-8 text-[#7a0019]" />
          <h2 className="text-2xl font-extrabold text-[#7a0019] tracking-tight">
            Editar Experimento
          </h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
          {columns.map((col) => {
            let dropdownOptions: string[] | undefined = undefined;
            // Opções customizadas para colunas específicas
            if (/tamanho do experimento/i.test(col)) {
              dropdownOptions = ["Selecionar tamanho", "P", "M", "G"];
            } else if (/ideia|problema|oportunidade/i.test(col)) {
              dropdownOptions = [
                "Backlog",
                "Em Prospecção",
                "Concluído",
                "Arquivado",
                "Cancelado",
              ];
            } else if (/experimentação/i.test(col)) {
              dropdownOptions = [
                "Arquivado",
                "Concluido",
                "Concluido - Aguardando Go/No para Piloto",
                "Concluido com Pivot",
                "Em andamento",
                "Em backlog",
                "Em planejamento",
                "Em refinamento",
                "Em Testes",
                "Em Validação",
              ];
            } else if (/piloto/i.test(col)) {
              dropdownOptions = ["Não iniciado", "Em andamento", "Concluido"];
            } else if (/escala/i.test(col)) {
              dropdownOptions = ["Não iniciado", "Em andamento", "Concluido"];
            } else if (/tecnologia/i.test(col)) {
              dropdownOptions = [
                "Gen IA",
                "WEB 3",
                "Future Network",
                "Outras tecnologias",
              ];
            }
            return (
              <div key={col} className="flex flex-col">
                <label className="text-sm font-bold text-[#7a0019] mb-2 flex items-center gap-1">
                  {col}
                </label>
                {dropdownOptions ? (
                  <div className="transition-all duration-300 ease-in-out">
                    <InlineDropdown
                      value={
                        editData[col] && ["P", "M", "G"].includes(editData[col])
                          ? editData[col]
                          : "Selecionar tamanho"
                      }
                      options={dropdownOptions}
                      onChange={(v) => onChange(col, v)}
                    />
                  </div>
                ) : optionsMap[col] ? (
                  <div className="transition-all duration-300 ease-in-out">
                    <InlineDropdown
                      value={editData[col] || ""}
                      options={optionsMap[col]}
                      onChange={(v) => onChange(col, v)}
                    />
                  </div>
                ) : (
                  <input
                    className="border-2 border-[#7a0019]/30 rounded-lg px-3 py-2 text-gray-800 focus:outline-none focus:ring-2 focus:ring-[#7a0019]/40 transition-all duration-300 ease-in-out"
                    value={editData[col] || ""}
                    onChange={(e) => onChange(col, e.target.value)}
                    disabled={col === "#"}
                    placeholder={`Digite ${col.toLowerCase()}`}
                  />
                )}
              </div>
            );
          })}
        </div>
        <div className="flex gap-4 justify-end mt-2">
          <button
            onClick={onCancel}
            className="px-5 py-2 rounded-full bg-gray-100 text-gray-700 font-semibold hover:bg-gray-200 transition flex items-center gap-2 shadow"
          >
            <XCircle className="w-5 h-5" /> Cancelar
          </button>
          <button
            onClick={onSave}
            className="px-5 py-2 rounded-full bg-[#7a0019] text-white font-bold shadow hover:bg-[#5a0011] transition flex items-center gap-2"
          >
            <CheckCircle2 className="w-5 h-5" /> Salvar
          </button>
          <button
            onClick={onDelete}
            className="px-5 py-2 rounded-full bg-red-600 text-white font-bold shadow hover:bg-red-700 transition flex items-center gap-2"
          >
            <Trash2 className="w-5 h-5" /> Excluir
          </button>
        </div>
        <style>{`
          @keyframes modal-pop {
            0% { opacity: 0; transform: scale(0.95) translateY(30px); }
            100% { opacity: 1; transform: scale(1) translateY(0); }
          }
          .animate-modal-pop { animation: modal-pop 0.5s cubic-bezier(.4,0,.2,1); }
        `}</style>
      </div>
    </div>
  );
}
