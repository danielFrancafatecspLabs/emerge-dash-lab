import React from "react";
import { InlineDropdown } from "./InlineDropdown";
import { XCircle, CheckCircle2, Trash2 } from "lucide-react";

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
  // Remove campos duplicados (ex: "Escala" e "escala", "Sinal" e "sinal", etc.)
  const filteredColumns = React.useMemo(() => {
    if (!columns) return [];
    const normalize = (k: string) =>
      k
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .replace(/[^a-zA-Z0-9]/g, "")
        .toLowerCase();

    interface Entry { original: string; score: number; }
    const map: Record<string, Entry> = {};

    const score = (k: string) => {
      let s = 0;
      if (/[^a-z0-9]/.test(k)) s += 3; // tem espaço, acento ou símbolo -> mais legível
      if (/[A-Z]/.test(k.slice(1))) s += 2; // camelCase/Upper inside
      if (/^[A-ZÁ-Ú]/.test(k)) s += 1; // começa maiúscula
      if (k.length <= 3) s -= 1; // curtas demais (provável duplicata técnica)
      return s;
    };

    for (const col of columns) {
      const isDevRespLabel = /desenvolvedor resp\.?/i.test(col);
      const isDevRespCamel = /^desenvolvedorresp$/i.test(col.replace(/[^a-zA-Z0-9]/g, ""));
      if (isDevRespLabel || isDevRespCamel) continue; // campo tratado separadamente
      const key = normalize(col);
      const colScore = score(col);
      if (!map[key] || colScore > map[key].score) {
        map[key] = { original: col, score: colScore };
      }
    }
    return Object.values(map).map((e) => e.original);
  }, [columns]);

  if (!open || !editData) return null;
  return (
    <div className="h-full flex flex-col">
      {/* Área de scroll dos campos */}
      <div className="flex-1 overflow-y-auto px-1 sm:px-2 md:px-3 lg:px-4 py-2 custom-scroll">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
          {/* Campo Desenvolvedor Resp. sempre visível */}
          <div className="flex flex-col">
            <label className="text-sm font-bold text-[#7a0019] mb-2 flex items-center gap-1">
              Desenvolvedor Resp.
            </label>
            <select
              className="border-2 border-[#7a0019]/30 rounded-lg px-3 py-2 text-gray-800 focus:outline-none focus:ring-2 focus:ring-[#7a0019]/40 transition-all duration-300 ease-in-out w-full"
              value={editData["Desenvolvedor Resp."] || ""}
              onChange={(e) => onChange("Desenvolvedor Resp.", e.target.value)}
            >
              <option value="">Não identificado</option>
              <option value="Daniel França">Daniel França</option>
              <option value="Daniel Frauches">Daniel Frauches</option>
              <option value="Bruno">Bruno</option>
              <option value="Hugo">Hugo</option>
              <option value="Gui Raiol">Gui Raiol</option>
              <option value="Gui Magalhães">Gui Magalhães</option>
              <option value="Luis">Luis</option>
              <option value="Rogério">Rogério</option>
            </select>
          </div>
          {/* Renderiza os outros campos (sem duplicados) */}
          {filteredColumns.map((col) => {
            if (/desenvolvedor resp\.?/i.test(col) || /^desenvolvedorresp$/i.test(col.replace(/[^a-zA-Z0-9]/g, ""))) return null;
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
            } else if (/status\s*piloto|statuspiloto/i.test(col)) {
              // Campo de status detalhado do piloto
              dropdownOptions = [
                "Não iniciado",
                "2.0 - EXECUÇÃO PILOTO",
                "2.1 - APURAÇÃO DE RESULTADOS",
                "2.2 - DEFINIÇÃO DOS CUSTOS",
                "2.2.1 CANVAS",
                "2.2.2 HLE",
                "2.2.3 APROVAÇÃO HLE TI",
                "2.2.4 APROVAÇÃO HLE NEGOCIOS",
                "2.3 GO / NOGO",
                "2.4 - APROVAÇÃO COMITE DE INVESTIMENTO",
                "2.5 - ROLL-OUT",
                "2.6 - CANCELADO",
              ];
            } else if (/^piloto$/i.test(col)) {
              // Campo simples de estágio do piloto (curto)
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
                  <InlineDropdown
                    value={editData[col] || dropdownOptions[0]}
                    options={dropdownOptions}
                    onChange={(v) => onChange(col, v)}
                  />
                ) : optionsMap[col] ? (
                  <InlineDropdown
                    value={editData[col] || ""}
                    options={optionsMap[col]}
                    onChange={(v) => onChange(col, v)}
                  />
                ) : (
                  <input
                    className="border-2 border-[#7a0019]/30 rounded-lg px-3 py-2 text-gray-800 focus:outline-none focus:ring-2 focus:ring-[#7a0019]/40 transition-all duration-300 ease-in-out w-full"
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
      </div>
      {/* Footer / Botões */}
      <div className="shrink-0 mt-2 px-2 md:px-4 pb-2 pt-3 border-t border-rose-100 flex flex-wrap gap-2 justify-end bg-white">
        <button
          onClick={onCancel}
          className="px-4 py-2 rounded-full bg-gray-100 text-gray-700 font-semibold hover:bg-gray-200 transition flex items-center gap-2 shadow"
        >
          <XCircle className="w-5 h-5" /> Cancelar
        </button>
        <button
          onClick={onSave}
          className="px-4 py-2 rounded-full bg-[#7a0019] text-white font-bold shadow hover:bg-[#5a0011] transition flex items-center gap-2"
        >
          <CheckCircle2 className="w-5 h-5" /> Salvar
        </button>
        <button
          onClick={onDelete}
          className="px-4 py-2 rounded-full bg-red-600 text-white font-bold shadow hover:bg-red-700 transition flex items-center gap-2"
        >
          <Trash2 className="w-5 h-5" /> Excluir
        </button>
      </div>
      <style>{`
        .custom-scroll { scrollbar-width: thin; scrollbar-color: #7a0019 #f1f1f1; }
        .custom-scroll::-webkit-scrollbar { width: 10px; }
        .custom-scroll::-webkit-scrollbar-track { background: #f1f1f1; border-radius: 8px; }
        .custom-scroll::-webkit-scrollbar-thumb { background: #b31b38; border-radius: 8px; border:2px solid #f1f1f1; }
        .custom-scroll::-webkit-scrollbar-thumb:hover { background: #7a0019; }
      `}</style>
    </div>
  );
}