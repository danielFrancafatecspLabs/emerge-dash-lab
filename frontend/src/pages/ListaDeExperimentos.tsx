import React, { useEffect, useMemo, useState } from "react";
import { Input } from "../components/ui/input";
import { ExperimentTable } from "../components/experimentos/ExperimentTable";
import type { Experiment } from "../components/experimentos/ExperimentTable";
import { ExperimentDetailCard } from "../components/experimentos/ExperimentDetailCard";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "../components/ui/dialog";
import { Plus, SlidersHorizontal } from "lucide-react";
import { ExperimentNewModal } from "../components/experimentos/ExperimentNewModal";
import { BlinkingDot } from "../components/experimentos/BlinkingDot";

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
  "Não iniciado",
];
const ESCALA_OPTIONS = [
  "Selecionar tudo",
  "Vazias",
  "Arquivado",
  "Em produtização",
];

export default function ListaDeExperimentos() {
  const [data, setData] = useState<Experiment[]>([]);
  const [filtered, setFiltered] = useState<Experiment[]>([]);
  const [search, setSearch] = useState("");
  const [selectedIdx, setSelectedIdx] = useState<number | null>(null);
  const [hiddenColumns, setHiddenColumns] = useState<string[]>([]);
  const [showColManager, setShowColManager] = useState(false);
  const [showNewExp, setShowNewExp] = useState(false);
  const [newExpData, setNewExpData] = useState<Record<string, unknown>>({});
  const [detailOpen, setDetailOpen] = useState(false);
  const [detailExperiment, setDetailExperiment] = useState<Experiment | null>(
    null
  );

  useEffect(() => {
    fetch("http://localhost:3001/api/experimentos")
      .then((res) => res.json())
      .then((json) => {
        setData(json as Experiment[]);
        setFiltered(json as Experiment[]);
      });
  }, []);

  const baseCols = useMemo(() => {
    return data.length > 0
      ? Object.keys(data[0])
          .filter((col) => col !== "_id" && col !== "id")
          .filter((col) => !col.toLowerCase().includes("unnamed"))
          .filter((col) => !col.toLowerCase().includes("datas perdidas"))
      : [];
  }, [data]);

  const columns = useMemo(() => {
    const cols = baseCols.filter(
      (col) => col !== "#" && !hiddenColumns.includes(col)
    );
    const sinalIdx = cols.indexOf("Sinal");
    const ideiaIdx = cols.indexOf("Ideia / Problema / Oportunidade");
    if (sinalIdx > -1 && ideiaIdx > -1 && sinalIdx !== ideiaIdx - 1) {
      cols.splice(sinalIdx, 1);
      cols.splice(ideiaIdx, 0, "Sinal");
    }
    return cols;
  }, [baseCols, hiddenColumns]);

  const columnsMapOptions: Record<string, string[]> = useMemo(
    () => ({
      "Ideia / Problema / Oportunidade": IDEA_OPTIONS,
      Experimentação: EXPERIMENTACAO_OPTIONS,
      Piloto: PILOTO_OPTIONS,
      Escala: ESCALA_OPTIONS,
    }),
    []
  );

  const toggleColumn = (col: string) => {
    setHiddenColumns((prev) =>
      prev.includes(col) ? prev.filter((c) => c !== col) : [...prev, col]
    );
  };

  const searchAppliedData = useMemo(() => {
    if (!search) return data;
    const q = search.toLowerCase();
    return data.filter((item) =>
      Object.values(item).some((v) =>
        typeof v === "string" ? v.toLowerCase().includes(q) : false
      )
    );
  }, [data, search]);

  return (
    <div className="min-h-screen bg-gradient-to-b from-white to-rose-50 p-3 md:p-4">
      <div className="h-full w-full flex flex-col gap-3">
        <div className="flex flex-wrap items-center gap-3">
          <h1 className="text-2xl font-extrabold text-[#7a0019] mr-2">
            Lista de Experimentos
          </h1>
          <span className="text-sm text-gray-600 mr-2">
            {search
              ? `${searchAppliedData.length} de ${data.length}`
              : `${data.length}`}{" "}
            itens
          </span>
          <div className="relative">
            <Input
              placeholder="Buscar por título, squad, status..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-72 text-gray-900 bg-white border-2 border-[#7a0019]/30 rounded-xl pl-10 shadow-sm focus:ring-2 focus:ring-[#7a0019]"
            />
            <span className="absolute left-3 top-2.5 text-[#7a0019]/70">
              🔎
            </span>
          </div>
          <div className="flex items-center gap-4 text-sm text-gray-700">
            <div className="flex items-center gap-2">
              <BlinkingDot color="#22c55e" />
              <span>Dentro do prazo</span>
            </div>
            <div className="flex items-center gap-2">
              <BlinkingDot color="#ef4444" />
              <span>Fora do prazo</span>
            </div>
            <div className="flex items-center gap-2">
              <BlinkingDot color="#eab308" />
              <span>Pendência</span>
            </div>
          </div>
          <button
            className="inline-flex items-center gap-2 px-3 py-2 rounded-lg bg-[#7a0019] text-white hover:bg-[#5a0011] shadow"
            onClick={() => setShowNewExp(true)}
          >
            <Plus className="w-4 h-4" /> Novo experimento
          </button>
          <button
            className="inline-flex items-center gap-2 px-3 py-2 rounded-lg bg-white border-2 border-[#7a0019]/30 text-[#7a0019] hover:bg-rose-50"
            onClick={() => setShowColManager(true)}
          >
            <SlidersHorizontal className="w-4 h-4" /> Gerenciar colunas
          </button>
        </div>

        <div className="flex-1">
          <div>
            <ExperimentTable
              columns={columns}
              data={searchAppliedData}
              filtered={filtered}
              hiddenColumns={hiddenColumns}
              selectedIdx={selectedIdx}
              setSelectedIdx={setSelectedIdx}
              handleEdit={(row) => {
                const idx = searchAppliedData.findIndex(
                  (r) => r._id === row._id
                );
                setSelectedIdx(idx >= 0 ? idx : null);
                setDetailExperiment(row);
                setDetailOpen(true);
              }}
              toggleColumn={toggleColumn}
              optionsMap={columnsMapOptions}
              setData={setData}
              setFiltered={setFiltered}
            />
          </div>
        </div>

        {/* Dialog: Gerenciar Colunas */}
        <Dialog open={showColManager} onOpenChange={setShowColManager}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle className="text-[#7a0019]">
                Gerenciar colunas
              </DialogTitle>
            </DialogHeader>
            <div className="grid grid-cols-2 gap-3 mt-2">
              {baseCols
                .filter((c) => c !== "#")
                .map((col) => (
                  <label key={col} className="flex items-center gap-2 text-sm">
                    <input
                      type="checkbox"
                      className="accent-[#7a0019]"
                      checked={!hiddenColumns.includes(col)}
                      onChange={() => toggleColumn(col)}
                    />
                    <span className="truncate" title={col}>
                      {col}
                    </span>
                  </label>
                ))}
            </div>
            <div className="flex justify-end mt-4">
              <button
                className="px-3 py-2 rounded bg-[#7a0019] text-white hover:bg-[#5a0011]"
                onClick={() => setShowColManager(false)}
              >
                Fechar
              </button>
            </div>
          </DialogContent>
        </Dialog>

        {/* Modal: Novo Experimento */}
        <ExperimentNewModal
          open={showNewExp}
          columns={baseCols.filter((c) => c !== "_id" && c !== "id")}
          newExpData={newExpData}
          onChange={(key, value) =>
            setNewExpData((p) => ({ ...p, [key]: value }))
          }
          onCancel={() => {
            setShowNewExp(false);
            setNewExpData({});
          }}
          onSave={async () => {
            try {
              const res = await fetch(
                "http://localhost:3001/api/experimentos",
                {
                  method: "POST",
                  headers: { "Content-Type": "application/json" },
                  body: JSON.stringify(newExpData),
                }
              );
              if (res.ok) {
                const created = (await res.json()) as Experiment;
                setData((p) => [created, ...p]);
                setFiltered((p) => [created, ...p]);
                setShowNewExp(false);
                setNewExpData({});
              }
            } catch (e) {
              console.error(e);
            }
          }}
          optionsMap={columnsMapOptions}
        />

        {/* Modal: Detalhe do Experimento */}
        {detailOpen && detailExperiment && (
          <ExperimentDetailCard
            experiment={detailExperiment}
            columns={[
              ...new Set([...(columns || []), "Responsavel", "Relator"]),
            ]}
            optionsMap={columnsMapOptions}
            onClose={() => {
              setDetailOpen(false);
              setDetailExperiment(null);
            }}
            onSaved={(updated) => {
              setData((p) =>
                p.map((it) => (it._id === updated._id ? updated : it))
              );
              setFiltered((p) =>
                p.map((it) => (it._id === updated._id ? updated : it))
              );
              setDetailExperiment(updated);
            }}
            onDeleted={(id) => {
              setData((p) => p.filter((it) => it._id !== id));
              setFiltered((p) => p.filter((it) => it._id !== id));
              setDetailOpen(false);
              setDetailExperiment(null);
            }}
          />
        )}
      </div>
    </div>
  );
}
