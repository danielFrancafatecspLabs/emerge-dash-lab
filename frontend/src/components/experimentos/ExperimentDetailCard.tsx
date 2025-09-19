import React, { useState, useMemo, useEffect } from "react";
import { BlinkingDot } from "./BlinkingDot";
import type { Experiment } from "./ExperimentTable";

interface ExperimentDetailCardProps {
  experiment: Experiment;
  columns?: string[];
  optionsMap?: Record<string, string[]>;
  onClose: () => void;
  onSaved?: (updated: Experiment) => void;
  onDeleted?: (id: string) => void;
}

export const ExperimentDetailCard: React.FC<ExperimentDetailCardProps> = ({
  experiment,
  columns,
  optionsMap,
  onClose,
  onSaved,
  onDeleted,
}) => {
  // Utilitário para texto
  const toText = (val: unknown): string => {
    if (val === null || val === undefined) return "";
    if (typeof val === "string") return val;
    if (typeof val === "number" || typeof val === "boolean") return String(val);
    if (Array.isArray(val)) return JSON.stringify(val);
    if (typeof val === "object") {
      const maybe = val as { texto?: unknown };
      if (typeof maybe.texto === "string") return maybe.texto;
      try {
        return JSON.stringify(val);
      } catch {
        return String(val);
      }
    }
    return String(val);
  };

  // Colunas dinâmicas
  const cols = useMemo(() => {
    const base =
      columns && columns.length > 0
        ? [...columns]
        : Object.keys(experiment || {});
    return base.filter(
      (c) =>
        c !== "_id" &&
        c !== "id" &&
        !c.toLowerCase().includes("unnamed") &&
        !c.toLowerCase().includes("datas perdidas")
    );
  }, [columns, experiment]);

  // Estado do formulário
  const [form, setForm] = useState<Record<string, unknown>>(() => {
    const init: Record<string, unknown> = {};
    cols.forEach((c) => (init[c] = experiment[c as keyof Experiment]));
    return init;
  });
  useEffect(() => {
    const next: Record<string, unknown> = {};
    cols.forEach((c) => (next[c] = experiment[c as keyof Experiment]));
    setForm(next);
  }, [experiment, cols]);

  // Comentários
  const [newComment, setNewComment] = useState("");
  const [feedback, setFeedback] = useState("");
  const [saving, setSaving] = useState(false);

  // Handler de campo
  const setField = (key: string, value: unknown) =>
    setForm((p) => ({ ...p, [key]: value }));

  // Salvar
  const handleSave = async () => {
    setFeedback("");
    setSaving(true);
    try {
      const body: Record<string, unknown> = { ...experiment };
      for (const k of Object.keys(form)) {
        body[k] = form[k];
      }
      // Adiciona novo comentário
      if (newComment.trim()) {
        const histKey = "Comentários/Pendências e Ações";
        const hist = Array.isArray(body[histKey]) ? [...body[histKey]] : [];
        hist.push({ texto: newComment.trim(), data: new Date().toISOString() });
        body[histKey] = hist;
      }
      const res = await fetch(`/api/experimentos/${experiment._id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      if (res.ok) {
        const updated = await res.json();
        setFeedback("Alterações salvas com sucesso!");
        setNewComment("");
        onSaved?.(updated);
      } else {
        setFeedback("Erro ao salvar alterações.");
      }
    } catch {
      setFeedback("Erro ao salvar alterações.");
    } finally {
      setSaving(false);
    }
  };

  // Deletar
  const handleDelete = async () => {
    setFeedback("");
    try {
      const res = await fetch(`/api/experimentos/${experiment._id}`, {
        method: "DELETE",
      });
      if (res.ok) {
        setFeedback("Experimento deletado com sucesso!");
        onDeleted?.(experiment._id);
        setTimeout(() => onClose(), 1200);
      } else {
        setFeedback("Erro ao deletar experimento.");
      }
    } catch {
      setFeedback("Erro ao deletar experimento.");
    }
  };

  // Render
  return (
    <div className="fixed inset-0 flex items-center justify-center z-50 bg-black/50">
      <div className="bg-white rounded-3xl shadow-2xl p-6 md:p-8 max-w-4xl w-full relative flex flex-col gap-5 border border-[#7a0019]/25">
        <button
          className="absolute top-4 right-4 text-gray-500 hover:text-[#7a0019] text-xl"
          onClick={onClose}
          aria-label="Fechar"
        >
          &times;
        </button>
        {/* Cabeçalho */}
        <div className="flex items-center gap-3">
          <div className="w-2 h-8 bg-[#7a0019] rounded-full" />
          <h2 className="text-2xl font-extrabold text-[#42000c] tracking-tight">
            {toText(
              form["Iniciativa"] ||
                form["nome"] ||
                form["titulo"] ||
                "Sem título"
            )}
          </h2>
          <div className="ml-auto">
            <BlinkingDot color="#22c55e" />
          </div>
        </div>
        {/* Campos principais */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          <div className="flex flex-col gap-3 bg-rose-50/40 p-3 rounded-xl border border-rose-100">
            <label className="text-xs text-gray-600">Responsável</label>
            <input
              className="border rounded px-3 py-2"
              value={toText(form["Responsavel"])}
              onChange={(e) => setField("Responsavel", e.target.value)}
            />
          </div>
          <div className="flex flex-col gap-3 bg-rose-50/40 p-3 rounded-xl border border-rose-100">
            <label className="text-xs text-gray-600">Relator</label>
            <input
              className="border rounded px-3 py-2"
              value={toText(form["Relator"])}
              onChange={(e) => setField("Relator", e.target.value)}
            />
          </div>
          <div className="flex flex-col gap-3 bg-rose-50/40 p-3 rounded-xl border border-rose-100">
            <label className="text-xs text-gray-600">
              Tamanho do Experimento
            </label>
            <select
              className="border rounded px-3 py-2 bg-white"
              value={toText(form["Tamanho do Experimento"])}
              onChange={(e) =>
                setField("Tamanho do Experimento", e.target.value)
              }
            >
              <option value="">Não Estimado</option>
              <option value="P">P</option>
              <option value="M">M</option>
              <option value="G">G</option>
            </select>
          </div>
        </div>
        {/* Editor dinâmico de colunas */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-h-[60vh] overflow-auto pr-1">
          {cols
            .filter((c) => c !== "Relator" && c !== "Responsavel")
            .map((col) => (
              <div
                key={col}
                className="flex flex-col gap-1 border rounded-xl p-3 bg-white/90"
              >
                <label className="text-[11px] font-semibold text-[#7a0019] uppercase tracking-wide">
                  {col}
                </label>
                {col === "Tamanho do Experimento" ? (
                  <select
                    className="border rounded px-3 py-2 bg-white"
                    value={toText(form[col])}
                    onChange={(e) => setField(col, e.target.value)}
                  >
                    <option value="">Não Estimado</option>
                    <option value="P">P</option>
                    <option value="M">M</option>
                    <option value="G">G</option>
                  </select>
                ) : col === "Comentários/Pendências e Ações" ? (
                  <div className="space-y-2">
                    <div className="max-h-40 overflow-auto space-y-2">
                      {Array.isArray(form[col]) && form[col].length > 0 ? (
                        [...(form[col] as { texto?: string; data?: string }[])]
                          .reverse()
                          .map((h, idx: number) => (
                            <div
                              key={idx}
                              className="p-2 rounded border bg-white"
                            >
                              <div className="text-[10px] text-gray-500">
                                {h.data
                                  ? new Date(h.data).toLocaleString()
                                  : ""}
                              </div>
                              <div className="text-sm font-medium">
                                {h.texto ?? toText(h)}
                              </div>
                            </div>
                          ))
                      ) : (
                        <div className="text-xs text-gray-500">
                          Sem histórico
                        </div>
                      )}
                    </div>
                    <div className="flex gap-2">
                      <input
                        className="flex-1 border rounded px-2 py-1"
                        placeholder="Adicionar comentário"
                        value={newComment}
                        onChange={(e) => setNewComment(e.target.value)}
                      />
                      <button
                        className="px-3 py-1 rounded bg-[#7a0019] text-white disabled:opacity-50"
                        disabled={!newComment.trim()}
                        onClick={() => setNewComment(newComment)}
                        title="Será adicionado ao salvar"
                      >
                        Adicionar
                      </button>
                    </div>
                  </div>
                ) : optionsMap && optionsMap[col] ? (
                  <select
                    className="border rounded px-3 py-2 bg-white"
                    value={toText(form[col])}
                    onChange={(e) => setField(col, e.target.value)}
                  >
                    {optionsMap[col]
                      .filter((o) => o.toLowerCase() !== "selecionar tudo")
                      .map((opt) => (
                        <option key={opt} value={opt}>
                          {opt}
                        </option>
                      ))}
                  </select>
                ) : (
                  <input
                    className="border rounded px-3 py-2 bg-white"
                    value={toText(form[col])}
                    onChange={(e) => setField(col, e.target.value)}
                  />
                )}
              </div>
            ))}
        </div>
        {/* Feedback */}
        {feedback && (
          <div className="mt-2 px-4 py-2 rounded bg-emerald-100 text-emerald-800 font-semibold text-center">
            {feedback}
          </div>
        )}
        {/* Ações */}
        <div className="flex gap-3 justify-end pt-2">
          <button
            className="px-4 py-2 bg-white border-2 border-[#7a0019]/30 text-[#7a0019] rounded-lg font-semibold hover:bg-rose-50"
            onClick={onClose}
          >
            Fechar
          </button>
          <button
            className="px-4 py-2 bg-red-600 text-white rounded-lg font-semibold"
            onClick={handleDelete}
          >
            Deletar
          </button>
          <button
            className="px-4 py-2 bg-[#7a0019] text-white rounded-lg font-semibold disabled:opacity-50"
            disabled={saving}
            onClick={handleSave}
          >
            {saving ? "Salvando..." : "Salvar alterações"}
          </button>
        </div>
      </div>
    </div>
  );
};
