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
    // aplicar filtros por coluna
    Object.entries(colFilters).forEach(([col, values]) => {
      const vals = (values || []).filter(
        (v) => v && v.toLowerCase() !== "selecionar tudo".toLowerCase()
      );
      if (vals.length === 0) return;
      rows = rows.filter((item) => {
        const raw = item[col];
        const s =
          typeof raw === "string"
            ? raw
            : raw !== undefined && raw !== null
            ? String(raw)
            : "";
        return vals.some(
          (v) => s.trim().toLowerCase() === v.trim().toLowerCase()
        );
      });
    });
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
  }, [data, colFilters, sortConfig]);

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

  return (
    <div className="rounded-2xl shadow-2xl bg-white/90 backdrop-blur p-4 border border-[#7a0019]/20">
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
              <TableHead className="sticky top-0 left-0 z-20 min-w-[3rem] w-[3rem] bg-[#7a0019] text-white font-bold text-sm tracking-wide rounded-tl-xl border-r border-white/10">
                <Star className="inline mr-1 text-yellow-300" /> #
              </TableHead>
              <TableHead className="sticky top-0 left-[3rem] z-20 min-w-[3.5rem] w-[3.5rem] bg-[#7a0019] text-white border-r border-white/10"></TableHead>
              {columns.map((col) => (
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
                    <button
                      className="inline-flex items-center gap-1 hover:opacity-90"
                      onClick={() => toggleSort(col)}
                      title={
                        sortConfig.col === col
                          ? `Ordenado ${sortConfig.dir === "asc" ? "↑" : "↓"}`
                          : "Ordenar coluna"
                      }
                    >
                      <span>{col}</span>
                      {sortConfig.col !== col && (
                        <ArrowUpDown className="w-3.5 h-3.5 text-white/80" />
                      )}
                      {sortConfig.col === col && sortConfig.dir === "asc" && (
                        <ChevronUp className="w-3.5 h-3.5 text-white" />
                      )}
                      {sortConfig.col === col && sortConfig.dir === "desc" && (
                        <ChevronDown className="w-3.5 h-3.5 text-white" />
                      )}
                    </button>
                    <button
                      className="ml-1 p-1 rounded-full bg-white/10 hover:bg-white/20 transition-colors"
                      onClick={() => toggleColumn(col)}
                      title={
                        hiddenColumns.includes(col)
                          ? "Exibir coluna"
                          : "Ocultar coluna"
                      }
                    >
                      {hiddenColumns.includes(col) ? (
                        <Eye className="w-4 h-4 text-emerald-200" />
                      ) : (
                        <EyeOff className="w-4 h-4 text-red-200" />
                      )}
                    </button>
                    {optionsMap[col] && (
                      <button
                        className={`ml-1 p-1 rounded-full transition-colors ${
                          openFilterCol === col
                            ? "bg-white/30"
                            : "bg-white/10 hover:bg-white/20"
                        }`}
                        title="Filtrar coluna"
                        onClick={(e) => {
                          e.stopPropagation();
                          setOpenFilterCol((prev) =>
                            prev === col ? null : col
                          );
                        }}
                      >
                        <Filter className="w-4 h-4 text-white" />
                      </button>
                    )}
                    {colFilters[col] && colFilters[col].length > 0 && (
                      <span className="ml-1 text-[10px] bg-white/20 px-1.5 py-0.5 rounded-full">
                        {colFilters[col].length}
                      </span>
                    )}
                    {openFilterCol === col && optionsMap[col] && (
                      <div className="absolute top-full mt-2 left-0 bg-white text-[#42000c] rounded-lg shadow-2xl p-3 w-56 z-20 border border-[#7a0019]/20">
                        <div className="text-xs font-bold mb-2">
                          Filtrar {col}
                        </div>
                        <div className="max-h-56 overflow-auto pr-1 space-y-1">
                          {optionsMap[col].map((opt) => (
                            <label
                              key={opt}
                              className="flex items-center gap-2 text-sm"
                            >
                              <input
                                type="checkbox"
                                className="accent-[#7a0019]"
                                checked={(colFilters[col] || []).includes(opt)}
                                onChange={(e) => {
                                  setColFilters((prev) => {
                                    const prevArr = prev[col]
                                      ? [...prev[col]]
                                      : [];
                                    if (e.target.checked) {
                                      if (!prevArr.includes(opt))
                                        prevArr.push(opt);
                                    } else {
                                      const idx = prevArr.indexOf(opt);
                                      if (idx >= 0) prevArr.splice(idx, 1);
                                    }
                                    return { ...prev, [col]: prevArr };
                                  });
                                }}
                              />
                              <span>{opt}</span>
                            </label>
                          ))}
                        </div>
                        <div className="flex justify-between mt-3 text-xs">
                          <button
                            className="px-2 py-1 rounded bg-[#7a0019] text-white hover:opacity-90"
                            onClick={() => setOpenFilterCol(null)}
                          >
                            Fechar
                          </button>
                          <div className="space-x-2">
                            <button
                              className="px-2 py-1 rounded bg-gray-100 hover:bg-gray-200"
                              onClick={() =>
                                setColFilters((p) => ({ ...p, [col]: [] }))
                              }
                            >
                              Limpar
                            </button>
                            <button
                              className="px-2 py-1 rounded bg-gray-100 hover:bg-gray-200"
                              onClick={() =>
                                setColFilters((p) => ({
                                  ...p,
                                  [col]: [...optionsMap[col]],
                                }))
                              }
                            >
                              Todos
                            </button>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            {displayRows.map((row, idx) => (
              <TableRow
                key={row._id || idx}
                className={
                  selectedIdx === idx
                    ? "border border-[#7a0019]/40 bg-rose-50 cursor-pointer transition-colors"
                    : "odd:bg-white even:bg-rose-50/40 hover:bg-rose-50 cursor-pointer transition-colors"
                }
                style={{
                  fontSize: "0.95rem",
                  fontFamily: "Inter, Arial, sans-serif",
                }}
                onClick={() => setSelectedIdx(idx)}
              >
                <TableCell className="sticky left-0 z-10 min-w-[3rem] w-[3rem] font-bold text-[#7a0019] bg-white border-r border-rose-50">
                  {idx + 1}
                </TableCell>
                <TableCell className="sticky left-[3rem] z-10 min-w-[3.5rem] w-[3.5rem] bg-white border-r border-rose-50">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleEdit(row);
                    }}
                    className="p-2 rounded-full bg-[#7a0019] hover:bg-[#5a0011] text-white hover:scale-105 transition-transform shadow-md"
                    title="Editar"
                  >
                    <Pencil className="w-4 h-4" />
                  </button>
                </TableCell>
                {columns.map((col) => (
                  <TableCell
                    key={col}
                    className="align-top border-r border-rose-50"
                  >
                    <div className="flex items-start gap-2">
                      <div className="flex-1 min-w-0">
                        {col === "Comentários/Pendências e Ações" ? (
                          <div>
                            {row["Situação Atual e Próximos passos"] ||
                            row["Situacao Atual e Proximos passos"] ||
                            row["Situacao Atual"] ? (
                              <div className="mb-1 text-xs font-semibold text-[#5a0011] flex items-center gap-1">
                                <MessageCircle className="w-3 h-3 text-[#7a0019]" />
                                <span>
                                  Situação atual:{" "}
                                  {(() => {
                                    const value =
                                      row["Situação Atual e Próximos passos"] ||
                                      row["Situacao Atual e Proximos passos"] ||
                                      row["Situacao Atual"];
                                    if (Array.isArray(value)) {
                                      return value.length > 0
                                        ? value[value.length - 1].texto
                                        : "";
                                    }
                                    return (value as string) ?? "";
                                  })()}
                                </span>
                              </div>
                            ) : Array.isArray(row[col]) &&
                              row[col].length > 0 ? (
                              <div className="mb-1 text-xs font-semibold text-[#5a0011] flex items-center gap-1">
                                <MessageCircle className="w-3 h-3 text-[#7a0019]" />
                                <span>
                                  Situação atual:{" "}
                                  {
                                    (row[col] as ExperimentHistory[])[
                                      (row[col] as ExperimentHistory[]).length -
                                        1
                                    ].texto
                                  }
                                </span>
                              </div>
                            ) : null}

                            <div className="flex items-center gap-2">
                              <input
                                type="text"
                                className="border-2 border-[#7a0019]/40 rounded-lg px-3 py-1.5 w-full bg-white text-gray-900 focus:ring-2 focus:ring-[#7a0019] transition-all shadow-sm"
                                value={comentarioDraft[row._id] ?? ""}
                                placeholder="Adicionar comentário..."
                                onChange={(e) =>
                                  setComentarioDraft((prev) => ({
                                    ...prev,
                                    [row._id]: e.target.value,
                                  }))
                                }
                                onClick={(e) => e.stopPropagation()}
                              />
                              {comentarioDraft[row._id] &&
                                comentarioDraft[row._id].trim() && (
                                  <button
                                    className="px-3 py-1.5 bg-[#7a0019] text-white rounded-lg text-xs font-bold shadow-md hover:scale-105 transition-transform"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      handleSalvarComentario(row);
                                    }}
                                  >
                                    Salvar
                                  </button>
                                )}
                              <button
                                className="text-xs text-[#7a0019] underline ml-1 hover:text-[#5a0011]"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setHistoryModal({ row, col });
                                }}
                              >
                                Ver histórico
                              </button>
                            </div>
                          </div>
                        ) : optionsMap[col] ? (
                          <InlineDropdown
                            value={
                              typeof row[col] === "string"
                                ? (row[col] as string)
                                : row[col] !== undefined && row[col] !== null
                                ? String(row[col])
                                : ""
                            }
                            options={optionsMap[col]}
                            onChange={async (novoValor) => {
                              const atualizado = { ...row, [col]: novoValor };
                              const res = await fetch(
                                `/api/experimentos/${row._id}`,
                                {
                                  method: "PUT",
                                  headers: {
                                    "Content-Type": "application/json",
                                  },
                                  body: JSON.stringify(atualizado),
                                }
                              );
                              if (res.ok) {
                                const updatedObj = await res.json();
                                setData(
                                  data.map((item) =>
                                    item._id === row._id ? updatedObj : item
                                  )
                                );
                                setFiltered(
                                  filtered.map((item) =>
                                    item._id === row._id ? updatedObj : item
                                  )
                                );
                                setShowPopup(true);
                                setTimeout(() => setShowPopup(false), 1600);
                              }
                            }}
                          />
                        ) : col === "Iniciativa" ? (
                          <div className="flex flex-col gap-1">
                            <span className="font-semibold text-[#5a0011]">
                              {typeof row[col] === "object" && row[col] !== null
                                ? Array.isArray(row[col])
                                  ? JSON.stringify(row[col])
                                  : (row[col] as { texto?: string }).texto ??
                                    JSON.stringify(row[col])
                                : String(row[col])}
                            </span>
                            <span className="text-xs text-gray-600 flex items-center gap-1">
                              <CalendarDays className="w-3 h-3 text-[#7a0019]" />
                              {(() => {
                                const startDateRaw =
                                  row["Início "] ||
                                  row["Início"] ||
                                  row["Data de Início"];
                                if (!startDateRaw) return null;
                                const startDate = new Date(
                                  String(startDateRaw)
                                );
                                if (isNaN(startDate.getTime())) return null;
                                const today = new Date();
                                const diffDays = Math.max(
                                  0,
                                  Math.floor(
                                    (today.getTime() - startDate.getTime()) /
                                      (1000 * 60 * 60 * 24)
                                  )
                                );
                                return `${diffDays} dias na coluna`;
                              })()}
                            </span>
                          </div>
                        ) : col === "Sinal" ? (
                          (() => {
                            const status =
                              row["#"] || row["Sinal"] || row["Status"];
                            if (status === "1.0")
                              return <BlinkingDot color="#ef4444" />;
                            if (status === "2.0")
                              return <BlinkingDot color="#eab308" />;
                            if (status === "3.0")
                              return <BlinkingDot color="#22c55e" />;
                            if (status) return <BlinkingDot color="#a3a3a3" />;
                            return <BlinkingDot color="#d1d5db" />;
                          })()
                        ) : col.toLowerCase().includes("previsão de término") &&
                          row[col] ? (
                          <span className="inline-flex items-center bg-[#7a0019] text-white px-2 py-0.5 rounded-full shadow-sm text-xs">
                            {String(row[col]).split(" ")[0]}
                          </span>
                        ) : typeof row[col] === "object" &&
                          row[col] !== null ? (
                          (row[col] as { texto?: string }).texto ??
                          JSON.stringify(row[col])
                        ) : (
                          <span className="text-gray-900 font-medium break-words">
                            {String(row[col] ?? "")}
                          </span>
                        )}
                      </div>
                    </div>
                  </TableCell>
                ))}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {showPopup && (
        <div
          className="fixed top-6 right-6 bg-[#7a0019] text-white px-5 py-2 rounded-xl shadow-2xl z-50 font-bold text-sm"
          role="status"
          aria-live="polite"
        >
          <BadgeCheck className="inline w-4 h-4 mr-1" /> Atualizado com sucesso!
        </div>
      )}

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
