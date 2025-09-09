import React, { useEffect, useState } from "react";
import { Input } from "../components/ui/input";
import { ColumnFilterDropdown } from "../components/ui/ColumnFilterDropdown";
import { ExperimentTable } from "../components/experimentos/ExperimentTable";
import { ExperimentEditModal } from "../components/experimentos/ExperimentEditModal";
import { ExperimentDetailCard } from "../components/experimentos/ExperimentDetailCard";
import { ExperimentNewModal } from "../components/experimentos/ExperimentNewModal";
import { InlineDropdown } from "../components/experimentos/InlineDropdown";
import { BlinkingDot } from "../components/experimentos/BlinkingDot";

// Constants moved here to resolve import error
const IDEA_OPTIONS = [
  "Selecionar tudo",
  "Backlog",
  "Em Backlog",
  "Arquivado",
  "Concluido",
  "Concluído",
  "Em prospecção",
  "Não iniciado",
  "Para",
];
const EXPERIMENTACAO_OPTIONS = [
  "Selecionar tudo",
  "Vazias",
  "Aguardando",
  "Arquivado",
  "Concluido",
  "Concluído-Aguardando GO/ NO GO",
  "Concluido com Arquivamento",
  "Concluido com Pivot",
  "Em Andamento",
  "Em planejamento",
  "Em refinamento",
  "Em validação",
];
const PILOTO_OPTIONS = [
  "Selecionar tudo",
  "Vazias",
  "Concluido",
  "Em andamento",
  "Nõa iniciado",
];
const ESCALA_OPTIONS = [
  "Selecionar tudo",
  "Vazias",
  "Arquivado",
  "Em produtização",
];

export default function ListaDeExperimentos() {
  const [newExpOpen, setNewExpOpen] = useState(false);
  const [newExpData, setNewExpData] = useState<any>({});

  const [data, setData] = useState<any[]>([]);
  const [filtered, setFiltered] = useState<any[]>([]);
  const [search, setSearch] = useState("");
  const [editIdx, setEditIdx] = useState<number | null>(null);
  const [editData, setEditData] = useState<any | null>(null);
  const [selectedIdx, setSelectedIdx] = useState<number | null>(null);
  const [hiddenColumns, setHiddenColumns] = useState<string[]>([]);
  const [manageColumnsOpen, setManageColumnsOpen] = useState(false);
  const [ideaFilter, setIdeaFilter] = useState<string[]>(["Selecionar tudo"]);
  const [experimentacaoFilter, setExperimentacaoFilter] = useState<string[]>([
    "Selecionar tudo",
  ]);
  const [pilotoFilter, setPilotoFilter] = useState<string[]>([
    "Selecionar tudo",
  ]);
  const [escalaFilter, setEscalaFilter] = useState<string[]>([
    "Selecionar tudo",
  ]);

  useEffect(() => {
    fetch("http://localhost:4000/experimentos")
      .then((res) => res.json())
      .then((json) => {
        setData(json as any[]);
        setFiltered(json as any[]);
      });
  }, []);

  // Filtering logic (from previous code)
  useEffect(() => {
    let temp = data;
    if (!ideaFilter.includes("Selecionar tudo")) {
      temp = temp.filter((item) =>
        ideaFilter.some(
          (f) =>
            (item["Ideia / Problema / Oportunidade"] || "")
              .trim()
              .toLowerCase() === f.trim().toLowerCase()
        )
      );
    }
    if (!experimentacaoFilter.includes("Selecionar tudo")) {
      temp = temp.filter((item) =>
        experimentacaoFilter.some(
          (f) =>
            (item["Experimentação"] || "").trim().toLowerCase() ===
            f.trim().toLowerCase()
        )
      );
    }
    if (!pilotoFilter.includes("Selecionar tudo")) {
      temp = temp.filter((item) =>
        pilotoFilter.some(
          (f) =>
            (item["Piloto"] || "").trim().toLowerCase() ===
            f.trim().toLowerCase()
        )
      );
    }
    if (!escalaFilter.includes("Selecionar tudo")) {
      temp = temp.filter((item) =>
        escalaFilter.some(
          (f) =>
            (item["Escala"] || "").trim().toLowerCase() ===
            f.trim().toLowerCase()
        )
      );
    }
    if (search) {
      temp = temp.filter((item) =>
        Object.values(item).some(
          (v) =>
            typeof v === "string" &&
            v.toLowerCase().includes(search.toLowerCase())
        )
      );
    }
    setFiltered(temp);
  }, [
    data,
    ideaFilter,
    experimentacaoFilter,
    pilotoFilter,
    escalaFilter,
    search,
  ]);

  // Garante que a coluna '#' sempre aparece
  const baseCols =
    data.length > 0
      ? Object.keys(data[0])
          .filter((col) => col !== "_id" && col !== "id")
          .filter((col) => !col.toLowerCase().includes("unnamed"))
          .filter((col) => !col.toLowerCase().includes("datas perdidas"))
      : [];
  // Remove '#' column and ensure 'Sinal' is the second column
  let columns = baseCols.filter(
    (col) => col !== "#" && !hiddenColumns.includes(col)
  );
  const sinalIdx = columns.indexOf("Sinal");
  const ideiaIdx = columns.indexOf("Ideia / Problema / Oportunidade");
  if (sinalIdx > -1 && ideiaIdx > -1 && sinalIdx !== ideiaIdx - 1) {
    // Remove 'Sinal' from its current position
    columns.splice(sinalIdx, 1);
    // Insert 'Sinal' before 'Ideia / Problema / Oportunidade'
    columns.splice(ideiaIdx, 0, "Sinal");
  }

  const handleEdit = (idx: number) => {
    setEditIdx(idx);
    setEditData({ ...filtered[idx] });
    setSelectedIdx(idx);
  };
  const handleEditSave = () => {
    if (editIdx !== null && editData) {
      if (editData._id) {
        fetch(`http://localhost:4000/experimentos/${editData._id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(editData),
        }).then(async (res) => {
          if (res.ok) {
            const atualizado = await res.json();
            const updated = data.map((item) =>
              item._id === atualizado._id ? atualizado : item
            );
            setData(updated);
            setFiltered(updated);
            setEditIdx(null);
            setEditData(null);
          }
        });
      }
    }
  };
  const handleEditCancel = () => {
    setEditIdx(null);
    setEditData(null);
  };
  const toggleColumn = (col: string) => {
    setHiddenColumns((prev) =>
      prev.includes(col) ? prev.filter((c) => c !== col) : [...prev, col]
    );
  };

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-4">Lista de Experimentos</h1>
      <div className="flex flex-col gap-4 mb-6 items-start">
        <div className="flex flex-wrap gap-3 items-center">
          <div className="relative">
            <button
              className="px-4 py-2 rounded bg-gray-200 text-gray-800 font-bold border border-gray-400 hover:bg-gray-300"
              onClick={() => setManageColumnsOpen((open) => !open)}
            >
              Gerenciar colunas
            </button>
            {manageColumnsOpen && (
              <div className="absolute z-10 mt-2 bg-white border border-gray-300 rounded shadow-lg p-3 min-w-[200px]">
                <div className="font-bold mb-2 text-sm">
                  Mostrar/ocultar colunas
                </div>
                {columns
                  .filter((col) => col !== "Status")
                  .map((col) => (
                    <label
                      key={col}
                      className="flex items-center gap-2 mb-1 text-sm cursor-pointer"
                    >
                      <input
                        type="checkbox"
                        checked={!hiddenColumns.includes(col)}
                        onChange={() => toggleColumn(col)}
                      />
                      {col}
                    </label>
                  ))}
                <button
                  className="mt-2 px-2 py-1 rounded bg-gray-100 text-xs border border-gray-300 hover:bg-gray-200"
                  onClick={() => setManageColumnsOpen(false)}
                >
                  Fechar
                </button>
              </div>
            )}
          </div>
          <button
            className="px-4 py-2 rounded bg-green-600 text-white font-bold hover:bg-green-700"
            onClick={() => setNewExpOpen(true)}
          >
            Novo Experimento
          </button>
          <ColumnFilterDropdown
            options={IDEA_OPTIONS}
            selected={ideaFilter}
            onChange={setIdeaFilter}
            label="Ideia/Problema/Oportunidade"
          />
          <ColumnFilterDropdown
            options={EXPERIMENTACAO_OPTIONS}
            selected={experimentacaoFilter}
            onChange={setExperimentacaoFilter}
            label="Experimentação"
          />
          <ColumnFilterDropdown
            options={PILOTO_OPTIONS}
            selected={pilotoFilter}
            onChange={setPilotoFilter}
            label="Piloto"
          />
          <ColumnFilterDropdown
            options={ESCALA_OPTIONS}
            selected={escalaFilter}
            onChange={setEscalaFilter}
            label="Escala"
          />
          <Input
            placeholder="Buscar..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-48 text-gray-800 bg-white border border-gray-300 ml-2"
          />
        </div>
        <div className="flex gap-6 items-center mt-2">
          <div className="flex items-center gap-2">
            <BlinkingDot color="#22c55e" />
            <span className="text-sm">Dentro do prazo</span>
          </div>
          <div className="flex items-center gap-2">
            <BlinkingDot color="#ef4444" />
            <span className="text-sm">Fora do prazo</span>
          </div>
          <div className="flex items-center gap-2">
            <BlinkingDot color="#eab308" />
            <span className="text-sm">Pendência</span>
          </div>
        </div>
      </div>
      <ExperimentNewModal
        open={newExpOpen}
        columns={columns}
        newExpData={newExpData}
        onChange={(key, value) =>
          setNewExpData({ ...newExpData, [key]: value })
        }
        onCancel={() => {
          setNewExpOpen(false);
          setNewExpData({});
        }}
        onSave={async () => {
          const res = await fetch("http://localhost:4000/experimentos", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(newExpData),
          });
          if (res.ok) {
            const novo = await res.json();
            setData([novo, ...data]);
            setFiltered([novo, ...filtered]);
            setNewExpOpen(false);
            setNewExpData({});
          }
        }}
        optionsMap={{
          "Ideia / Problema / Oportunidade": IDEA_OPTIONS,
          Experimentação: EXPERIMENTACAO_OPTIONS,
          Piloto: PILOTO_OPTIONS,
          Escala: ESCALA_OPTIONS,
        }}
      />
      {editIdx !== null && !!editData && (
        <ExperimentDetailCard
          experiment={editData}
          onClose={() => {
            setEditIdx(null);
            setEditData(null);
          }}
        />
      )}
      <ExperimentTable
        columns={columns}
        data={data}
        filtered={filtered}
        hiddenColumns={hiddenColumns}
        selectedIdx={selectedIdx}
        setSelectedIdx={setSelectedIdx}
        handleEdit={handleEdit}
        toggleColumn={toggleColumn}
        optionsMap={{
          "Ideia / Problema / Oportunidade": IDEA_OPTIONS,
          Experimentação: EXPERIMENTACAO_OPTIONS,
          Piloto: PILOTO_OPTIONS,
          Escala: ESCALA_OPTIONS,
        }}
        setData={setData}
        setFiltered={setFiltered}
      />
    </div>
  );
}
