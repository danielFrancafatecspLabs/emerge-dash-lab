import React from "react";
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from "../ui/table";
import {
  Pencil,
  BadgeCheck,
  CalendarDays,
  MessageCircle,
  Eye,
  EyeOff,
  Filter,
  XCircle,
  Star,
  Lightbulb,
} from "lucide-react";
import { ArrowUpDown, ChevronUp, ChevronDown, X as XIcon } from "lucide-react";
import { InlineDropdown } from "./InlineDropdown";
import { BlinkingDot } from "./BlinkingDot";

export interface Experiment {
  _id: string;
  [key: string]:
    | string
    | number
    | boolean
    | null
    | undefined
    | ExperimentHistory[];
}

export interface ExperimentHistory {
  texto: string;
  data: string;
}

interface ExperimentTableProps {
  columns: string[];
  data: Experiment[];
  filtered: Experiment[]; // será ignorado na renderização, mas atualizado via setFiltered
  hiddenColumns: string[];
  selectedIdx: number | null;
  setSelectedIdx: (idx: number | null) => void;
  handleEdit: (row: Experiment) => void;
  toggleColumn: (col: string) => void;
  optionsMap: Record<string, string[]>;
  setData: (data: Experiment[]) => void;
  setFiltered: (data: Experiment[]) => void;
}

export function ExperimentTable({
  columns,
  data,
  filtered,
  hiddenColumns,
  selectedIdx,
  setSelectedIdx,
  handleEdit,
  toggleColumn,
  optionsMap,
  setData,
  setFiltered,
}: ExperimentTableProps) {
  // Debug: mostra os dados recebidos
  console.log("ExperimentTable data:", data);
  const bottomScrollRef = React.useRef<HTMLDivElement | null>(null);
  const [historyModal, setHistoryModal] = React.useState<{
    row: Experiment;
    col: string;
  } | null>(null);
  const [comentarioDraft, setComentarioDraft] = React.useState<
    Record<string, string>
  >({});
  const [showPopup, setShowPopup] = React.useState(false);
  const [openFilterCol, setOpenFilterCol] = React.useState<string | null>(null);
  const [colFilters, setColFilters] = React.useState<Record<string, string[]>>(
    {}
  );
  const [sortConfig, setSortConfig] = React.useState<{
    col: string | null;
    dir: "asc" | "desc";
  }>({ col: null, dir: "asc" });

  async function handleSalvarComentario(row: Experiment) {
    const novoValor = comentarioDraft[row._id];
    if (!novoValor || !novoValor.trim()) return;
    const historico: ExperimentHistory[] = Array.isArray(
      row["Comentários/Pendências e Ações"]
    )
      ? [...(row["Comentários/Pendências e Ações"] as ExperimentHistory[])]
      : [];
    historico.push({ texto: novoValor, data: new Date().toISOString() });
    const atualizado = { ...row, "Comentários/Pendências e Ações": historico };
    const res = await fetch(`/api/experimentos/${row._id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(atualizado),
    });
    if (res.ok) {
      const updatedObj = await res.json();
      setData(data.map((item) => (item._id === row._id ? updatedObj : item)));
      setFiltered(
        filtered.map((item) => (item._id === row._id ? updatedObj : item))
      );
      setComentarioDraft((prev) => ({ ...prev, [row._id]: "" }));
      setShowPopup(true);
      setTimeout(() => setShowPopup(false), 1800);
    }
  }

  const displayRows = React.useMemo(() => {
    let rows = data;
    // aplicar ordenação se houver
    if (sortConfig.col) {
      const col = sortConfig.col;
      const dir = sortConfig.dir === "asc" ? 1 : -1;
      rows = [...rows].sort((a, b) => {
        const av = a[col];
        const bv = b[col];
        const as = av === undefined || av === null ? "" : String(av);
        const bs = bv === undefined || bv === null ? "" : String(bv);
        // tenta converter datas, senão compara string lowercase
        const ad = Date.parse(as);
        const bd = Date.parse(bs);
        if (!isNaN(ad) && !isNaN(bd)) {
          return (ad - bd) * dir;
        }
        return as.localeCompare(bs, undefined, { sensitivity: "base" }) * dir;
      });
    }
    return rows;
  }, [data, sortConfig]);

  function toggleSort(col: string) {
    setSortConfig((prev) => {
      if (prev.col !== col) return { col, dir: "asc" };
      return { col, dir: prev.dir === "asc" ? "desc" : "asc" };
    });
  }

  React.useEffect(() => {
    setFiltered(displayRows);
  }, [displayRows, setFiltered]);

  // Shift + scroll do mouse para rolagem horizontal
  React.useEffect(() => {
    const bottom = bottomScrollRef.current;
    if (!bottom) return;
    const onWheel = (e: WheelEvent) => {
      if (!e.shiftKey) return;
      if (bottom.scrollWidth <= bottom.clientWidth) return;
      e.preventDefault();
      bottom.scrollLeft += e.deltaY;
    };
    bottom.addEventListener("wheel", onWheel, { passive: false });
    return () => bottom.removeEventListener("wheel", onWheel);
  }, [columns, data, filtered]);

  // Helper: Move Sinal column before Ideia/Problema/Oportunidade
  const columnsOrdered = React.useMemo(() => {
    // Remove '#' and '_id' from columns, as we'll show them together in a new column
    const cols = columns.filter((c) => c !== "#" && c !== "_id");
    const sinalIdx = cols.indexOf("Sinal");
    const ideiaIdx = cols.findIndex(
      (c) =>
        c.toLowerCase().includes("ideia") ||
        c.toLowerCase().includes("problema") ||
        c.toLowerCase().includes("oportunidade")
    );
    if (sinalIdx > -1 && ideiaIdx > -1 && sinalIdx > ideiaIdx) {
      const [sinalCol] = cols.splice(sinalIdx, 1);
      cols.splice(ideiaIdx, 0, sinalCol);
    }
    return cols;
  }, [columns]);

  return (
    <div className="rounded-2xl shadow-2xl bg-white/90 backdrop-blur p-4 border border-[#7a0019]/20 relative">
      {/* Chips de filtros ativos */}
      {Object.entries(colFilters).some(([, arr]) => (arr || []).length > 0) && (
        <div className="mb-3 flex flex-wrap items-center gap-2">
          {Object.entries(colFilters).map(([col, arr]) =>
            (arr || []).map((val) => (
              <span
                key={`${col}:${val}`}
                className="inline-flex items-center gap-1 bg-rose-50 text-[#5a0011] border border-[#7a0019]/20 px-2 py-1 rounded-full text-xs"
                title={`${col}: ${val}`}
              >
                <span className="font-semibold">{col}:</span> {val}
                <button
                  className="ml-1 hover:text-[#7a0019]"
                  onClick={() =>
                    setColFilters((p) => ({
                      ...p,
                      [col]: (p[col] || []).filter((v) => v !== val),
                    }))
                  }
                  aria-label="Remover filtro"
                >
                  <XIcon className="w-3 h-3" />
                </button>
              </span>
            ))
          )}
          <button
            className="ml-auto text-xs px-2 py-1 rounded bg-gray-100 hover:bg-gray-200"
            onClick={() => setColFilters({})}
          >
            Limpar filtros
          </button>
        </div>
      )}

      <div
        ref={bottomScrollRef}
        className="relative overflow-x-auto rounded-xl"
      >
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="sticky left-0 z-20 bg-[#7a0019] text-white font-semibold text-sm border-r border-white/10 w-12 text-center">
                #
              </TableHead>
              {columnsOrdered.map((col) => (
                <TableHead
                  key={col}
                  className="sticky top-0 z-10 bg-[#7a0019] text-white relative group text-sm font-semibold border-r border-white/10"
                >
                  <div className="flex items-center gap-2">
                    {col === "Sinal" && (
                      <BadgeCheck className="w-4 h-4 text-emerald-200" />
                    )}
                    {/data|início|inicio|término|termino/i.test(col) && (
                      <CalendarDays className="w-4 h-4 text-rose-200" />
                    )}
                    {/coment|pendên|pendenc|ação|acao/i.test(col) && (
                      <MessageCircle className="w-4 h-4 text-rose-200" />
                    )}
                    <span>{col}</span>
                    <button
                      className="ml-1 text-white hover:text-yellow-300"
                      title={`Filtrar ${col}`}
                      onClick={() => setOpenFilterCol(col)}
                      style={{ lineHeight: 0 }}
                    >
                      <Filter className="w-4 h-4" />
                    </button>
                  </div>
                </TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            {displayRows.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={columnsOrdered.length + 1}
                  className="text-center py-8 text-gray-400"
                >
                  Nenhum experimento encontrado.
                </TableCell>
              </TableRow>
            ) : (
              displayRows.map((row, idx) => (
                <TableRow key={row._id || idx}>
                  <TableCell className="sticky left-0 z-10 bg-white border-r border-gray-200">
                    {idx + 1}
                  </TableCell>
                  {columnsOrdered.map((col) => (
                    <TableCell key={col}>
                      {typeof row[col] === "object" && row[col] !== null
                        ? JSON.stringify(row[col])
                        : String(row[col] ?? "")}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* Filtro flutuante fora do TableHeader, sobre a tabela */}
      {openFilterCol && (
        <div
          style={{
            position: "absolute",
            left: 0,
            top: 48,
            minWidth: "180px",
            zIndex: 40,
            background: "white",
            border: "1px solid #e5e7eb",
            borderRadius: "0.5rem",
            boxShadow: "0 2px 8px rgba(0,0,0,0.08)",
            padding: "0.5rem 1rem",
          }}
        >
          <div
            style={{
              marginBottom: "0.5rem",
              fontWeight: 500,
              color: "#7a0019",
            }}
          >
            Filtro: {openFilterCol}
          </div>
          {optionsMap[openFilterCol] && optionsMap[openFilterCol].length > 0 ? (
            optionsMap[openFilterCol].map((option) => (
              <button
                key={option}
                className={`block w-full text-left px-2 py-1 rounded ${
                  colFilters[openFilterCol]?.includes(option)
                    ? "bg-yellow-200 text-[#7a0019] font-bold"
                    : "bg-gray-100 text-gray-700"
                }`}
                onClick={() => {
                  setColFilters((prev) => {
                    const already = prev[openFilterCol] || [];
                    return {
                      ...prev,
                      [openFilterCol]: already.includes(option)
                        ? already.filter((v) => v !== option)
                        : [...already, option],
                    };
                  });
                }}
              >
                {option}
              </button>
            ))
          ) : (
            <span className="text-gray-400">Sem opções de filtro</span>
          )}
          <div style={{ marginTop: "0.5rem", display: "flex", gap: "0.5rem" }}>
            <button
              className="px-2 py-1 rounded bg-gray-200 text-gray-700"
              onClick={() => setOpenFilterCol(null)}
            >
              Fechar
            </button>
            <button
              className="px-2 py-1 rounded bg-gray-100 text-gray-700"
              onClick={() =>
                setColFilters((prev) => ({ ...prev, [openFilterCol]: [] }))
              }
            >
              Limpar
            </button>
            <button
              className="px-2 py-1 rounded bg-gray-100 text-gray-700"
              onClick={() =>
                setColFilters((prev) => ({
                  ...prev,
                  [openFilterCol]: [...(optionsMap[openFilterCol] || [])],
                }))
              }
            >
              Todos
            </button>
          </div>
        </div>
      )}
      <div
        className={`fixed top-6 right-6 bg-[#7a0019] text-white px-5 py-2 rounded-xl shadow-2xl z-50 font-bold text-sm transition-opacity duration-300 ${
          showPopup ? "opacity-100" : "opacity-0 pointer-events-none"
        }`}
        role="status"
        aria-live="polite"
      >
        <BadgeCheck className="inline w-4 h-4 mr-1" /> Atualizado com sucesso!
      </div>

      {historyModal && (
        <div
          className="fixed inset-0 bg-black/60 flex items-center justify-center z-50"
          role="dialog"
          aria-modal="true"
        >
          <div className="bg-white rounded-2xl shadow-2xl p-6 max-w-lg w-full relative border border-[#7a0019]/30">
            <button
              className="absolute top-3 right-3 text-gray-500 hover:text-[#7a0019] bg-white rounded-full p-1 shadow"
              onClick={() => setHistoryModal(null)}
              aria-label="Fechar histórico"
            >
              <XCircle className="w-5 h-5" />
            </button>
            <h2 className="text-xl font-extrabold mb-4 text-[#7a0019] flex items-center gap-2">
              <MessageCircle className="w-5 h-5 text-[#7a0019]" /> Histórico de
              Situação Atual
            </h2>
            {Array.isArray(historyModal.row[historyModal.col]) ? (
              (historyModal.row[historyModal.col] as ExperimentHistory[])
                .slice()
                .sort(
                  (a, b) =>
                    new Date(b.data).getTime() - new Date(a.data).getTime()
                )
                .map((coment, idx) => (
                  <div
                    key={idx}
                    className="mb-3 p-3 border rounded-xl bg-rose-50"
                  >
                    <div className="text-xs text-gray-600 mb-1 flex items-center gap-1">
                      <CalendarDays className="w-4 h-4 text-[#7a0019]" />
                      {coment.data
                        ? new Date(coment.data).toLocaleString()
                        : "Sem data"}
                    </div>
                    <div className="font-semibold text-gray-900">
                      {coment.texto || "Sem texto"}
                    </div>
                  </div>
                ))
            ) : (
              <div className="text-gray-400">Nenhum histórico disponível.</div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
