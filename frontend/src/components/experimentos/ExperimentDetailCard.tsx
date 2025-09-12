import React from "react";
import { BlinkingDot } from "./BlinkingDot";
import type { Experiment } from "./ExperimentTable";

interface ExperimentDetailCardProps {
  experiment: Experiment;
  columns?: string[]; // colunas a exibir/editar; se omitido, usa as chaves do objeto
  optionsMap?: Record<string, string[]>; // opções para selects
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

  const cols = React.useMemo(() => {
    const base =
      columns && columns.length > 0
        ? [...columns]
        : Object.keys(experiment || {});
    return base
      .filter((c) => c !== "_id" && c !== "id")
      .filter((c) => !c.toLowerCase().includes("unnamed"))
      .filter((c) => !c.toLowerCase().includes("datas perdidas"));
  }, [columns, experiment]);

  type FormRecord = Record<string, unknown>;
  const [form, setForm] = React.useState<FormRecord>(() => {
    const init: FormRecord = {};
    cols.forEach(
      (c) => (init[c] = experiment[c as keyof Experiment] as unknown)
    );
    return init;
  });
  React.useEffect(() => {
    const next: FormRecord = {};
    cols.forEach(
      (c) => (next[c] = experiment[c as keyof Experiment] as unknown)
    );
    setForm(next);
  }, [experiment, cols]);

  const [feedback, setFeedback] = React.useState<string>("");
  const [saving, setSaving] = React.useState<boolean>(false);
  const [newComment, setNewComment] = React.useState<string>("");

  const isDateField = (name: string) =>
    /data|início|inicio|término|termino/i.test(name);

  const toDateInput = (val: unknown): string => {
    if (!val) return "";
    const s = String(val);
    // try parse DD/MM/YYYY or YYYY-MM-DD
    const m = s.match(/^(\d{2})\/(\d{2})\/(\d{4})$/);
    if (m) return `${m[3]}-${m[2]}-${m[1]}`;
    const d = new Date(s);
    if (!isNaN(d.getTime())) {
      const yyyy = d.getFullYear();
      const mm = String(d.getMonth() + 1).padStart(2, "0");
      const dd = String(d.getDate()).padStart(2, "0");
      return `${yyyy}-${mm}-${dd}`;
    }
    return "";
  };

  const fromDateInput = (s: string): string => {
    if (!s) return "";
    const d = new Date(s);
    if (!isNaN(d.getTime())) {
      const dd = String(d.getDate()).padStart(2, "0");
      const mm = String(d.getMonth() + 1).padStart(2, "0");
      const yyyy = d.getFullYear();
      return `${dd}/${mm}/${yyyy}`; // padrão humano
    }
    return s;
  };

  const setField = (key: string, value: unknown) =>
    setForm((p) => ({ ...p, [key]: value }));

  const handleSave = async () => {
    setFeedback("");
    setSaving(true);
    try {
      const body: Record<string, unknown> = { ...experiment };
      for (const k of Object.keys(form)) {
        let v = form[k];
        // tenta reconstituir JSON quando originalmente era objeto/array ou quando o usuário digitou JSON
        const orig = experiment[k as keyof Experiment] as unknown;
        const looksJson =
          typeof v === "string" &&
          (v.trim().startsWith("{") || v.trim().startsWith("["));
        if (
          (typeof orig === "object" && orig !== null) ||
          Array.isArray(orig) ||
          looksJson
        ) {
          try {
            v = typeof v === "string" ? JSON.parse(v) : v;
          } catch {
            // mantém como string se não parsear
          }
        }
        body[k] = v;
      }
      // anexar novo comentário ao histórico, se houver
      if (newComment.trim()) {
        const histKey = "Comentários/Pendências e Ações";
        const hist = Array.isArray(body[histKey]) ? [...body[histKey]] : [];
        hist.push({ texto: newComment.trim(), data: new Date().toISOString() });
        body[histKey] = hist;
      }

      const res = await fetch(
        `http://localhost:3001/api/experimentos/${experiment._id}`,
        {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body),
        }
      );
      if (res.ok) {
        const updated = await res.json();
        setFeedback("Alterações salvas com sucesso!");
        setNewComment("");
        onSaved?.(updated);
      } else {
        setFeedback("Erro ao salvar alterações.");
      }
    } catch (e) {
      setFeedback("Erro ao salvar alterações.");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    setFeedback("");
    try {
      const res = await fetch(
        `http://localhost:3001/api/experimentos/${experiment._id}`,
        {
          method: "DELETE",
        }
      );
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

  return (
    <div className="fixed inset-0 flex items-center justify-center z-50 bg-black/50">
      <div className="bg-white rounded-3xl shadow-2xl p-6 md:p-8 max-w-6xl w-full relative flex flex-col gap-5 border border-[#7a0019]/25">
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
            {(() => {
              const status = form["Status"] ?? form["Sinal"];
              let cor = "#d1d5db";
              if (status === "1.0" || status === 1.0) cor = "#ef4444";
              else if (status === "2.0" || status === 2.0) cor = "#eab308";
              else if (status === "3.0" || status === 3.0) cor = "#22c55e";
              else if (status) cor = "#a3a3a3";
              return <BlinkingDot color={cor} />;
            })()}
          </div>
        </div>

        {/* Campos chave rápidos */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          <div className="flex flex-col gap-3 bg-rose-50/40 p-3 rounded-xl border border-rose-100">
            <label className="text-xs text-gray-600">Responsável</label>
            <input
              list="responsavel-list"
              className="border rounded px-3 py-2"
              value={toText(form["Responsavel"])}
              onChange={(e) => setField("Responsavel", e.target.value)}
            />
            <datalist id="responsavel-list">
              {[
                "Bruno",
                "Daniel França",
                "Daniel Frauches",
                "Guilherme Magalhães",
                "Guilherme Raiol",
                "Hugo",
                "Luis",
                "Pedro",
                "Rogério",
              ].map((opt) => (
                <option key={opt} value={opt} />
              ))}
            </datalist>
          </div>
          <div className="flex flex-col gap-3 bg-rose-50/40 p-3 rounded-xl border border-rose-100">
            <label className="text-xs text-gray-600">Relator</label>
            <input
              list="relator-list"
              className="border rounded px-3 py-2"
              value={toText(form["Relator"])}
              onChange={(e) => setField("Relator", e.target.value)}
            />
            <datalist id="relator-list">
              {["Daniel França", "Daniel Frauches"].map((opt) => (
                <option key={opt} value={opt} />
              ))}
            </datalist>
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
                {col === "Comentários/Pendências e Ações" ? (
                  <div className="space-y-2">
                    <div className="max-h-40 overflow-auto space-y-2">
                      {Array.isArray(form[col]) && form[col].length > 0 ? (
                        [...(form[col] as { texto?: string; data?: string }[])]
                          .reverse()
                          .map((h, idx) => (
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
                ) : col === "Sinal" ? (
                  <select
                    className="border rounded px-3 py-2 bg-white"
                    value={toText(form[col])}
                    onChange={(e) => setField(col, e.target.value)}
                  >
                    {["", "1.0", "2.0", "3.0"].map((opt) => (
                      <option key={opt} value={opt}>
                        {opt || "—"}
                      </option>
                    ))}
                  </select>
                ) : isDateField(col) ? (
                  <input
                    type="date"
                    className="border rounded px-3 py-2 bg-white"
                    value={toDateInput(form[col])}
                    onChange={(e) =>
                      setField(col, fromDateInput(e.target.value))
                    }
                  />
                ) : typeof form[col] === "object" && form[col] !== null ? (
                  <textarea
                    className="border rounded px-3 py-2 min-h-[80px] bg-white"
                    value={(() => {
                      try {
                        return typeof form[col] === "string"
                          ? (form[col] as string)
                          : JSON.stringify(form[col], null, 2);
                      } catch {
                        return toText(form[col]);
                      }
                    })()}
                    onChange={(e) => setField(col, e.target.value)}
                  />
                ) : toText(form[col]).length > 60 ? (
                  <textarea
                    className="border rounded px-3 py-2 min-h-[80px] bg-white"
                    value={toText(form[col])}
                    onChange={(e) => setField(col, e.target.value)}
                  />
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
