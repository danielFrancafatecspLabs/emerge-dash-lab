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
  TestTube,
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
  // Estados para filtro, ordenação, popup, etc
  const [openFilterCol, setOpenFilterCol] = React.useState<string | null>(null);
  const [colFilters, setColFilters] = React.useState<
    Record<string, string[] | string>
  >({});
  const [sortConfig, setSortConfig] = React.useState<{
    col: string;
    dir: "asc" | "desc";
  }>({ col: "", dir: "asc" });
  const [showPopup, setShowPopup] = React.useState(false);
  const [historyModal, setHistoryModal] = React.useState<{
    row: Experiment;
    col: string;
  } | null>(null);
  const bottomScrollRef = React.useRef<HTMLDivElement>(null);

  // Opções fixas para filtros das colunas específicas
  const fixedOptions: Record<string, string[]> = {
    Ideia: ["Backlog", "Em Prospecção", "Concluído", "Não Iniciado"],
    Problema: ["Backlog", "Em Prospecção", "Concluído", "Não Iniciado"],
    Oportunidade: ["Backlog", "Em Prospecção", "Concluído", "Não Iniciado"],
    Experimentação: [
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
    ],
    Piloto: ["Não iniciado", "Em andamento", "Concluido"],
  };

  // Sobrescreve optionsMap para as colunas fixas
  const mergedOptionsMap = { ...optionsMap };
  Object.entries(fixedOptions).forEach(([col, opts]) => {
    mergedOptionsMap[col] = opts;
  });
  // Garante que colunas compostas como 'Ideia / Problema / Oportunidade' também recebam as opções fixas
  columns.forEach((col) => {
    if (/ideia|problema|oportunidade/i.test(col) && !mergedOptionsMap[col]) {
      mergedOptionsMap[col] = [
        "Backlog",
        "Em Prospecção",
        "Concluído",
        "Não Iniciado",
      ];
    }
    // fim do forEach para colunas compostas
  });

  // Filtragem e ordenação das linhas
  const displayRows = React.useMemo(() => {
    let rows = [...data];
    // Filtragem por colunas
    Object.entries(colFilters).forEach(([col, arr]) => {
      if (col.endsWith("_search")) return;
      if (Array.isArray(arr) && arr.length > 0) {
        rows = rows.filter((row) => arr.includes(String(row[col])));
      }
    });
    // Ordenação
    if (sortConfig.col) {
      const dir = sortConfig.dir === "asc" ? 1 : -1;
      rows.sort((a, b) => {
        const as = String(a[sortConfig.col] ?? "");
        const bs = String(b[sortConfig.col] ?? "");
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

  // Helper: Move Sinal column before Ideia/Problema/Oportunidade
  const columnsOrdered = React.useMemo(() => {
    // Remove '#' and '_id' from columns, as we'll show them together in a new column
    const cols = columns.filter((c) => c !== "#" && c !== "_id");
    // Adiciona coluna 'Tamanho do Experimento' se não existir
    if (!cols.includes("Tamanho do Experimento")) {
      cols.push("Tamanho do Experimento");
    }
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
            Array.isArray(arr)
              ? arr.map((val) => (
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
                          [col]: Array.isArray(p[col])
                            ? (p[col] as string[]).filter((v) => v !== val)
                            : [],
                        }))
                      }
                      aria-label="Remover filtro"
                    >
                      <XIcon className="w-3 h-3" />
                    </button>
                  </span>
                ))
              : null
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
              {/* Coluna de edição */}
              <TableHead className="bg-[#7a0019] text-white font-semibold text-sm border-r border-white/10 w-12 text-center">
                Editar
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
                    {/* Dropdown de filtro por coluna */}
                    {openFilterCol === col && (
                      <div
                        style={{
                          position: "absolute",
                          left: 0,
                          top: "100%",
                          minWidth: "260px",
                          zIndex: 40,
                          background: "#222",
                          color: "#fff",
                          border: "1px solid #444",
                          borderRadius: "0.5rem",
                          boxShadow: "0 4px 16px rgba(0,0,0,0.18)",
                          padding: "1rem",
                        }}
                      >
                        <div
                          style={{
                            marginBottom: "0.5rem",
                            fontWeight: 600,
                            fontSize: "1rem",
                          }}
                        >
                          Filtro: {col}
                        </div>
                        <input
                          type="text"
                          placeholder="Pesquisar..."
                          className="w-full mb-2 px-2 py-1 rounded bg-[#333] text-white border border-[#444]"
                          value={colFilters[col + "_search"] || ""}
                          onChange={(e) => {
                            setColFilters((prev) => ({
                              ...prev,
                              [col + "_search"]: e.target.value,
                            }));
                          }}
                        />
                        <label className="flex items-center gap-2 cursor-pointer mb-2">
                          <input
                            type="checkbox"
                            checked={
                              Array.isArray(mergedOptionsMap[col]) &&
                              mergedOptionsMap[col].length > 0
                                ? mergedOptionsMap[col].every((opt) =>
                                    colFilters[col]?.includes(opt)
                                  )
                                : false
                            }
                            onChange={(e) => {
                              setColFilters((prev) => ({
                                ...prev,
                                [col]:
                                  e.target.checked &&
                                  Array.isArray(mergedOptionsMap[col])
                                    ? [...mergedOptionsMap[col]]
                                    : [],
                              }));
                            }}
                            className="accent-[#7a0019] w-4 h-4 rounded"
                          />
                          <span className="text-white text-sm">
                            (Selecionar Tudo)
                          </span>
                        </label>
                        <div className="flex flex-col gap-1 mb-2 max-h-40 overflow-y-auto">
                          {Array.isArray(mergedOptionsMap[col]) &&
                          mergedOptionsMap[col].length > 0 ? (
                            mergedOptionsMap[col]
                              .filter(
                                (opt) =>
                                  (colFilters[col + "_search"] || "") === "" ||
                                  opt
                                    .toLowerCase()
                                    .includes(
                                      typeof colFilters[col + "_search"] ===
                                        "string"
                                        ? (
                                            colFilters[
                                              col + "_search"
                                            ] as string
                                          ).toLowerCase()
                                        : ""
                                    )
                              )
                              .map((option) => (
                                <label
                                  key={option}
                                  className="flex items-center gap-2 cursor-pointer"
                                >
                                  <input
                                    type="checkbox"
                                    checked={
                                      colFilters[col]?.includes(option) || false
                                    }
                                    onChange={() => {
                                      setColFilters((prev) => {
                                        let already = prev[col] || [];
                                        if (typeof already === "string") {
                                          already = [already];
                                        }
                                        return {
                                          ...prev,
                                          [col]: already.includes(option)
                                            ? already.filter(
                                                (v) => v !== option
                                              )
                                            : [...already, option],
                                        };
                                      });
                                    }}
                                    className="accent-[#7a0019] w-4 h-4 rounded"
                                  />
                                  <span className="text-white text-sm">
                                    {option}
                                  </span>
                                </label>
                              ))
                          ) : (
                            <span className="text-gray-400">
                              Sem opções de filtro
                            </span>
                          )}
                        </div>
                        <div
                          style={{
                            marginTop: "0.5rem",
                            display: "flex",
                            gap: "0.5rem",
                          }}
                        >
                          <button
                            className="px-2 py-1 rounded bg-gray-700 text-white border border-[#444]"
                            onClick={() => setOpenFilterCol(null)}
                          >
                            Fechar
                          </button>
                          <button
                            className="px-2 py-1 rounded bg-gray-800 text-white border border-[#444]"
                            onClick={() =>
                              setColFilters((prev) => ({ ...prev, [col]: [] }))
                            }
                          >
                            Limpar
                          </button>
                          <button
                            className="px-2 py-1 rounded bg-gray-800 text-white border border-[#444]"
                            onClick={() =>
                              setColFilters((prev) => ({
                                ...prev,
                                [col]: [...(mergedOptionsMap[col] || [])],
                              }))
                            }
                          >
                            Todos
                          </button>
                        </div>
                      </div>
                    )}
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
                  {/* Botão de edição */}
                  <TableCell className="text-center">
                    <button
                      onClick={() => handleEdit(row)}
                      className="p-1 rounded hover:bg-rose-100"
                      title="Editar experimento"
                    >
                      <Pencil className="w-5 h-5 text-[#7a0019]" />
                    </button>
                  </TableCell>
                  {columnsOrdered.map((col) => {
                    // Renderização especial para coluna 'Tamanho do Experimento'
                    if (col === "Tamanho do Experimento") {
                      // Se estiver em modo edição, mostra select, senão mostra valor ou 'Não Estimado'
                      // Suporta tanto 'tamanho' quanto 'Tamanho do Experimento' vindos do backend
                      let value = "";
                      if (typeof row.tamanho === "string" && row.tamanho) {
                        value = row.tamanho;
                      } else if (
                        typeof row["Tamanho do Experimento"] === "string" &&
                        row["Tamanho do Experimento"]
                      ) {
                        value = row["Tamanho do Experimento"];
                      }
                      if (row._editMode) {
                        return (
                          <TableCell key={col}>
                            <select
                              value={value}
                              onChange={async (e) => {
                                const novo = {
                                  ...row,
                                  tamanho: e.target.value,
                                };
                                await handleEdit(novo); // Atualiza no backend
                              }}
                              className="border rounded px-2 py-1 text-sm"
                            >
                              <option value="">Não Estimado</option>
                              <option value="P">P</option>
                              <option value="M">M</option>
                              <option value="G">G</option>
                            </select>
                          </TableCell>
                        );
                      } else {
                        return (
                          <TableCell key={col}>
                            {value ? (
                              <span>{value}</span>
                            ) : (
                              <span className="text-gray-400 italic">
                                Não Estimado
                              </span>
                            )}
                          </TableCell>
                        );
                      }
                    }
                    const isExperimentacaoCol = /experimenta/i.test(col);
                    const isPilotoCol = /piloto/i.test(col);
                    const isEscalaCol = /escala/i.test(col);
                    const isIdeiaProblemaOportunidade =
                      /(ideia|problema|oportunidade)/i.test(col);
                    const isIniciativaCol = /iniciativa/i.test(col);
                    const value = row[col];
                    let cellContent;

                    if (col === "Sinal") {
                      let val = value;
                      if (typeof val === "string") val = parseFloat(val);
                      let color = "#bbb";
                      if (val === 3) color = "#22c55e";
                      else if (val === 2) color = "#eab308";
                      else if (val === 1) color = "#ef4444";
                      cellContent = (
                        <span className="flex items-center">
                          <BlinkingDot color={color} />
                        </span>
                      );
                    } else if (isIniciativaCol) {
                      const badgeColor =
                        "bg-gradient-to-r from-[#7a0019]/90 to-gray-700/90";
                      const textColor = "text-white";
                      let icon = (
                        <Star className="w-4 h-4 text-[#eab308] animate-spin-slow" />
                      );
                      if (
                        typeof value === "string" &&
                        value.toLowerCase().includes("estratégica")
                      ) {
                        icon = (
                          <Lightbulb className="w-4 h-4 text-[#eab308] animate-pulse" />
                        );
                      }
                      const MAX_INICIATIVA_CHARS = 32;
                      let iniciativaText =
                        typeof value === "string" ? value : "Sem iniciativa";
                      if (iniciativaText.length > MAX_INICIATIVA_CHARS) {
                        iniciativaText =
                          iniciativaText.slice(0, MAX_INICIATIVA_CHARS) + "...";
                      }
                      cellContent = (
                        <span
                          className={`inline-flex items-center gap-2 px-4 py-1 rounded-full shadow-lg border-2 border-[#7a0019]/30 font-bold text-sm ${badgeColor} ${textColor} transition-all duration-300`}
                          style={{
                            fontFamily: "Segoe UI, Arial, sans-serif",
                            minWidth: 140,
                            justifyContent: "center",
                            display: "inline-flex",
                          }}
                        >
                          {icon}
                          {iniciativaText}
                        </span>
                      );
                    } else if (isExperimentacaoCol) {
                      // Merge both blocks: show status pill for Experimentação
                      const status =
                        typeof value === "string"
                          ? value.trim().toLowerCase()
                          : "";
                      let pillBg, textColor, displayValue;
                      if (
                        status === "concluído" ||
                        status === "concluido" ||
                        status.includes("concluido")
                      ) {
                        pillBg = "bg-green-100 border-green-300";
                        textColor = "text-green-800";
                        displayValue = "Concluído";
                      } else if (
                        status === "" ||
                        status === "não iniciado" ||
                        status.includes("não iniciado")
                      ) {
                        pillBg = "bg-gray-50 border-gray-200";
                        textColor = "text-gray-500";
                        displayValue = "Não iniciado";
                      } else if (status === "em prospecção") {
                        pillBg = "bg-orange-100 border-orange-300";
                        textColor = "text-orange-800";
                        displayValue = "Em prospecção";
                      } else if (status === "parado") {
                        pillBg = "bg-red-100 border-red-300";
                        textColor = "text-red-800";
                        displayValue = "Parado";
                      } else if (status.includes("arquivado")) {
                        pillBg = "bg-gray-100 border-gray-300";
                        textColor = "text-gray-700";
                        displayValue = "Arquivado";
                      } else if (status.includes("andamento")) {
                        pillBg = "bg-yellow-100 border-yellow-300";
                        textColor = "text-yellow-800";
                        displayValue = "Em andamento";
                      } else if (status.includes("pivot")) {
                        pillBg = "bg-purple-100 border-purple-300";
                        textColor = "text-purple-800";
                        displayValue = "Pivot";
                      } else if (status.includes("validação")) {
                        pillBg = "bg-blue-100 border-blue-300";
                        textColor = "text-blue-800";
                        displayValue = "Em validação";
                      } else if (status.includes("backlog")) {
                        pillBg = "bg-orange-100 border-orange-300";
                        textColor = "text-orange-800";
                        displayValue = "Backlog";
                      } else {
                        pillBg = "bg-gray-100 border-gray-300";
                        textColor = "text-gray-700";
                        displayValue =
                          typeof value === "string" && value !== ""
                            ? value
                            : "Não iniciado";
                      }
                      cellContent = (
                        <span
                          className={`font-bold text-sm ${pillBg} ${textColor} border rounded-full px-4 py-1 shadow-sm transition-all duration-300`}
                          style={{
                            fontFamily: "Segoe UI, Arial, sans-serif",
                            minWidth: 140,
                            justifyContent: "center",
                            display: "inline-flex",
                          }}
                        >
                          {displayValue}
                        </span>
                      );
                    } else if (isPilotoCol || isEscalaCol) {
                      const pilotoEscalaStatus =
                        typeof value === "string"
                          ? value.trim().toLowerCase()
                          : "";
                      let pilotoEscalaPillBg,
                        pilotoEscalaTextColor,
                        pilotoEscalaDisplayValue;
                      if (pilotoEscalaStatus.includes("concluido")) {
                        pilotoEscalaPillBg = "bg-green-100 border-green-300";
                        pilotoEscalaTextColor = "text-green-800";
                        pilotoEscalaDisplayValue = "Concluído";
                      } else if (pilotoEscalaStatus.includes("arquivado")) {
                        pilotoEscalaPillBg = "bg-gray-100 border-gray-300";
                        pilotoEscalaTextColor = "text-gray-700";
                        pilotoEscalaDisplayValue = "Arquivado";
                      } else if (pilotoEscalaStatus.includes("andamento")) {
                        pilotoEscalaPillBg = "bg-yellow-100 border-yellow-300";
                        pilotoEscalaTextColor = "text-yellow-800";
                        pilotoEscalaDisplayValue = "Em andamento";
                      } else if (
                        pilotoEscalaStatus === "" ||
                        pilotoEscalaStatus.includes("não iniciado")
                      ) {
                        pilotoEscalaPillBg = "bg-gray-50 border-gray-200";
                        pilotoEscalaTextColor = "text-gray-500";
                        pilotoEscalaDisplayValue = "Não iniciado";
                      } else if (pilotoEscalaStatus.includes("pivot")) {
                        pilotoEscalaPillBg = "bg-purple-100 border-purple-300";
                        pilotoEscalaTextColor = "text-purple-800";
                        pilotoEscalaDisplayValue = "Pivot";
                      } else if (pilotoEscalaStatus.includes("backlog")) {
                        pilotoEscalaPillBg = "bg-orange-100 border-orange-300";
                        pilotoEscalaTextColor = "text-orange-800";
                        pilotoEscalaDisplayValue = "Backlog";
                      } else {
                        pilotoEscalaPillBg = "bg-gray-100 border-gray-300";
                        pilotoEscalaTextColor = "text-gray-700";
                        pilotoEscalaDisplayValue =
                          typeof value === "string" && value !== ""
                            ? value
                            : "Não iniciado";
                      }
                      cellContent = (
                        <span
                          className={`font-bold text-sm ${pilotoEscalaPillBg} ${pilotoEscalaTextColor} border rounded-full px-4 py-1 shadow-sm transition-all duration-300`}
                          style={{
                            fontFamily: "Segoe UI, Arial, sans-serif",
                            minWidth: 140,
                            justifyContent: "center",
                            display: "inline-flex",
                          }}
                        >
                          {pilotoEscalaDisplayValue}
                        </span>
                      );
                      // Remove duplicated misplaced style and pill rendering block
                    } else {
                      cellContent =
                        typeof value === "string" || typeof value === "number"
                          ? value
                          : "";
                    }
                    return <TableCell key={col}>{cellContent}</TableCell>;
                  })}
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
