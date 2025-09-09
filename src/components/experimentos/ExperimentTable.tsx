import React from "react";
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from "../ui/table";
import { Pencil } from "lucide-react";
import { InlineDropdown } from "./InlineDropdown";
import { BlinkingDot } from "./BlinkingDot";

interface ExperimentTableProps {
  columns: string[];
  data: any[];
  filtered: any[];
  hiddenColumns: string[];
  selectedIdx: number | null;
  setSelectedIdx: (idx: number | null) => void;
  handleEdit: (idx: number) => void;
  toggleColumn: (col: string) => void;
  optionsMap: Record<string, string[]>;
  setData: (data: any[]) => void;
  setFiltered: (data: any[]) => void;
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
  const [historyModal, setHistoryModal] = React.useState<{
    row: any;
    col: string;
  } | null>(null);

  // Função para editar situação atual e salvar histórico
  const [comentarioDraft, setComentarioDraft] = React.useState<{
    [id: string]: string;
  }>({});
  const [showPopup, setShowPopup] = React.useState(false);

  async function handleSalvarComentario(row: any) {
    const novoValor = comentarioDraft[row._id];
    if (!novoValor || !novoValor.trim()) return;
    const historico = Array.isArray(row["Comentários/Pendências e Ações"])
      ? [...row["Comentários/Pendências e Ações"]]
      : [];
    historico.push({ texto: novoValor, data: new Date().toISOString() });
    const atualizado = { ...row, "Comentários/Pendências e Ações": historico };
    const res = await fetch(`http://localhost:4000/experimentos/${row._id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(atualizado),
    });
    if (res.ok) {
      setData(data.map((item) => (item._id === row._id ? atualizado : item)));
      setFiltered(
        filtered.map((item) => (item._id === row._id ? atualizado : item))
      );
      setComentarioDraft((prev) => ({ ...prev, [row._id]: "" }));
      setShowPopup(true);
      setTimeout(() => setShowPopup(false), 2000);
    }
  }

  return (
    <>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="sticky top-0 bg-white z-10">#</TableHead>
            <TableHead className="sticky top-0 bg-white z-10"></TableHead>
            {columns.map((col) => (
              <TableHead
                key={col}
                className="sticky top-0 bg-white z-10 relative group"
              >
                <span>{col === "Sinal" ? "Sinal" : col}</span>
                <button
                  className="absolute right-1 top-1 p-1 text-gray-500 hover:text-blue-600"
                  onClick={() => toggleColumn(col)}
                  title={
                    hiddenColumns.includes(col)
                      ? "Exibir coluna"
                      : "Ocultar coluna"
                  }
                >
                  {/* ... ícones ... */}
                </button>
              </TableHead>
            ))}
          </TableRow>
        </TableHeader>
        <TableBody>
          {filtered.map((row, idx) => (
            <TableRow
              key={idx}
              className={
                selectedIdx === idx
                  ? "border-2 border-blue-500 rounded-lg shadow-lg bg-blue-50 transition-all duration-200"
                  : "hover:border-blue-300 hover:bg-blue-100 cursor-pointer transition-all duration-200"
              }
              onClick={() => setSelectedIdx(idx)}
            >
              <TableCell>{idx + 1}</TableCell>
              <TableCell>
                <button
                  onClick={() => handleEdit(idx)}
                  className="p-1 hover:bg-gray-100 rounded"
                >
                  <Pencil className="w-4 h-4 text-blue-600" />
                </button>
              </TableCell>
              {columns.map((col) => (
                <TableCell key={col}>
                  {col === "Comentários/Pendências e Ações" ? (
                    <div>
                      {row["Situação Atual e Próximos passos"] ||
                      row["Situacao Atual e Proximos passos"] ||
                      row["Situacao Atual"] ? (
                        <div className="mb-1 text-sm font-semibold text-gray-800">
                          Situação atual:{" "}
                          {row["Situação Atual e Próximos passos"] ||
                            row["Situacao Atual e Proximos passos"] ||
                            row["Situacao Atual"]}
                        </div>
                      ) : (
                        Array.isArray(row[col]) &&
                        row[col].length > 0 && (
                          <div className="mb-1 text-sm font-semibold text-gray-800">
                            Situação atual:{" "}
                            {row[col][row[col].length - 1].texto}
                          </div>
                        )
                      )}
                      <input
                        type="text"
                        className="border rounded px-2 py-1 w-full"
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
                            className="ml-2 px-2 py-1 bg-blue-600 text-white rounded text-xs"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleSalvarComentario(row);
                            }}
                          >
                            Salvar
                          </button>
                        )}
                      <button
                        className="text-xs text-blue-600 underline mt-1 ml-2"
                        onClick={(e) => {
                          e.stopPropagation();
                          setHistoryModal({ row, col });
                        }}
                      >
                        Ver histórico
                      </button>
                    </div>
                  ) : optionsMap[col] ? (
                    <InlineDropdown
                      value={row[col] || ""}
                      options={optionsMap[col]}
                      onChange={async (novoValor) => {
                        const atualizado = { ...row, [col]: novoValor };
                        const res = await fetch(
                          `http://localhost:4000/experimentos/${row._id}`,
                          {
                            method: "PUT",
                            headers: { "Content-Type": "application/json" },
                            body: JSON.stringify(atualizado),
                          }
                        );
                        if (res.ok) {
                          setData(
                            data.map((item) =>
                              item._id === row._id ? atualizado : item
                            )
                          );
                          setFiltered(
                            filtered.map((item) =>
                              item._id === row._id ? atualizado : item
                            )
                          );
                          window.alert(
                            `Campo "${col}" atualizado com sucesso!`
                          );
                        }
                      }}
                    />
                  ) : col === "Iniciativa" ? (
                    <div className="flex flex-col gap-1">
                      <span>
                        {typeof row[col] === "object" && row[col] !== null
                          ? row[col].texto ?? JSON.stringify(row[col])
                          : row[col]}
                      </span>
                      {/* ...círculos de tempo em andamento... */}
                    </div>
                  ) : col === "Sinal" ? (
                    (() => {
                      const status = row["#"] || row["Sinal"] || row["Status"];
                      if (status === "1.0")
                        return <BlinkingDot color="#ef4444" />;
                      if (status === "2.0")
                        return <BlinkingDot color="#eab308" />;
                      if (status === "3.0")
                        return <BlinkingDot color="#22c55e" />;
                      if (status) return <BlinkingDot color="#a3a3a3" />;
                      return <BlinkingDot color="#d1d5db" />; // cinza claro para vazio
                    })()
                  ) : col.toLowerCase().includes("previsão de término") &&
                    row[col] ? (
                    row[col].split(" ")[0]
                  ) : typeof row[col] === "object" && row[col] !== null ? (
                    row[col].texto ?? JSON.stringify(row[col])
                  ) : (
                    String(row[col])
                  )}
                </TableCell>
              ))}
            </TableRow>
          ))}
        </TableBody>
      </Table>
      {/* Modal de histórico */}
      {showPopup && (
        <div className="fixed top-4 right-4 bg-green-600 text-white px-4 py-2 rounded shadow-lg z-50">
          Comentário salvo
        </div>
      )}
      {historyModal && (
        <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-lg p-6 max-w-lg w-full relative">
            <button
              className="absolute top-2 right-2 text-gray-500 hover:text-red-600"
              onClick={() => setHistoryModal(null)}
            >
              Fechar
            </button>
            <h2 className="text-xl font-bold mb-4">
              Histórico de Situação Atual
            </h2>
            {Array.isArray(historyModal.row[historyModal.col]) ? (
              historyModal.row[historyModal.col]
                .sort(
                  (a, b) =>
                    new Date(b.data).getTime() - new Date(a.data).getTime()
                )
                .map((coment, idx) => (
                  <div key={idx} className="mb-3 p-3 border rounded">
                    <div className="text-xs text-gray-500 mb-1">
                      {coment.data
                        ? new Date(coment.data).toLocaleString()
                        : "Sem data"}
                    </div>
                    <div className="font-semibold">
                      {coment.texto ||
                        coment.comentario ||
                        coment.acao ||
                        "Sem texto"}
                    </div>
                  </div>
                ))
            ) : (
              <div className="text-gray-400">Nenhum histórico disponível.</div>
            )}
          </div>
        </div>
      )}
    </>
  );
}
