import React from "react";
import { BlinkingDot } from "./BlinkingDot";

interface ExperimentDetailCardProps {
  experiment: any;
  onClose: () => void;
}

export const ExperimentDetailCard: React.FC<ExperimentDetailCardProps> = ({
  experiment,
  onClose,
}) => {
  const relatorOptions = ["Selecionar..", "Daniel França", "Daniel Frauches"];
  const responsavelOptions = [
    "Selecionar..",
    "Bruno",
    "Daniel França",
    "Daniel Frauches",
    "Guilherme Magalhães",
    "Guilherme Raiol",
    "Hugo",
    "Luis",
    "Pedro",
    "Rogério",
  ];
  const [relator, setRelator] = React.useState(
    experiment.Relator || "Selecionar.."
  );
  const [responsavel, setResponsavel] = React.useState(
    experiment.Responsavel || "Selecionar.."
  );
  const [feedback, setFeedback] = React.useState<string>("");

  // Função para salvar todas alterações
  const handleSave = async () => {
    setFeedback("");
    try {
      const res = await fetch(
        `http://localhost:4000/experimentos/${experiment._id}`,
        {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            ...experiment,
            Relator: relator,
            Responsavel: responsavel,
          }),
        }
      );
      if (res.ok) {
        setFeedback("Alterações salvas com sucesso!");
      } else {
        setFeedback("Erro ao salvar alterações.");
      }
    } catch {
      setFeedback("Erro ao salvar alterações.");
    }
  };

  // Função para deletar experimento
  const handleDelete = async () => {
    setFeedback("");
    try {
      const res = await fetch(
        `http://localhost:4000/experimentos/${experiment._id}`,
        {
          method: "DELETE",
        }
      );
      if (res.ok) {
        setFeedback("Experimento deletado com sucesso!");
        setTimeout(() => onClose(), 1200);
      } else {
        setFeedback("Erro ao deletar experimento.");
      }
    } catch {
      setFeedback("Erro ao deletar experimento.");
    }
  };

  return (
    <div className="fixed inset-0 flex items-center justify-center z-50 bg-black bg-opacity-30">
      <div className="bg-white rounded-xl shadow-2xl p-8 max-w-3xl w-full relative flex flex-col gap-6">
        <button
          className="absolute top-4 right-4 text-gray-500 hover:text-red-600 text-xl"
          onClick={onClose}
        >
          &times;
        </button>
        <div className="flex items-center gap-4 mb-2">
          <div className="w-2 h-8 bg-blue-600 rounded-full" />
          <h2 className="text-2xl font-bold text-gray-900">
            Experimento:{" "}
            {experiment?.Iniciativa ||
              experiment?.nome ||
              experiment?.titulo ||
              "Experimento"}
          </h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div className="flex flex-col gap-2">
            <span className="text-xs text-gray-500">Situação Atual</span>
            <span className="font-semibold text-gray-800">
              {experiment["Situação Atual"] ||
                experiment["Situação Atual e Próximos passos"] ||
                "-"}
            </span>
            <span className="text-xs text-gray-500 mt-2">Status</span>
            <span className="font-semibold text-blue-600 flex items-center gap-2">
              {(() => {
                const status = experiment.Status || experiment.Sinal;
                let cor = "#d1d5db";
                if (status === "1.0" || status === 1.0) cor = "#ef4444";
                else if (status === "2.0" || status === 2.0) cor = "#eab308";
                else if (status === "3.0" || status === 3.0) cor = "#22c55e";
                else if (status) cor = "#a3a3a3";
                return <BlinkingDot color={cor} />;
              })()}
            </span>
            <span className="text-xs text-gray-500 mt-2">Descrição</span>
            <span className="font-semibold text-gray-800">
              {experiment.Descricao || experiment.Descrição || "-"}
            </span>
            <span className="text-xs text-gray-500 mt-2">BO/Sponsor</span>
            <span className="font-semibold text-gray-800">
              {experiment["Sponsor/BO"] ||
                experiment["BO/Sponsor"] ||
                experiment["Sponsor"] ||
                "-"}
            </span>
            <span className="text-xs text-gray-500 mt-2">Área</span>
            <span className="font-semibold text-gray-800">
              {experiment["Área"] || experiment["Area"] || "-"}
            </span>
            <span className="text-xs text-gray-500 mt-2">Ganhos</span>
            <span className="font-semibold text-gray-800">
              {experiment["Ganhos"] || experiment["Ganho"] || "-"}
            </span>
          </div>
          <div className="flex flex-col gap-2">
            <span className="text-xs text-gray-500">Responsável</span>
            <select
              className="font-semibold text-gray-800 border rounded px-2 py-1"
              value={responsavel}
              onChange={(e) => setResponsavel(e.target.value)}
            >
              {responsavelOptions.map((opt) => (
                <option key={opt} value={opt}>
                  {opt}
                </option>
              ))}
            </select>
            <span className="text-xs text-gray-500 mt-2">Relator</span>
            <select
              className="font-semibold text-gray-800 border rounded px-2 py-1"
              value={relator}
              onChange={(e) => setRelator(e.target.value)}
            >
              {relatorOptions.map((opt) => (
                <option key={opt} value={opt}>
                  {opt}
                </option>
              ))}
            </select>
            <span className="text-xs text-gray-500 mt-2">Times</span>
            <span className="font-semibold text-gray-800">
              {experiment["Times"] || experiment["Time"] || "-"}
            </span>
            <span className="text-xs text-gray-500 mt-2">
              Previsão de Término
            </span>
            <span className="font-semibold text-gray-800">
              {experiment["Previsão de Término"] ||
                experiment["Data Limite"] ||
                "-"}
            </span>
            <span className="text-xs text-gray-500 mt-2">Tecnologia</span>
            <span className="font-semibold text-gray-800">
              {experiment.Tecnologia || experiment.Categoria || "-"}
            </span>
            <span className="text-xs text-gray-500 mt-2">
              Histórico e Aprendizados
            </span>
            <span className="font-semibold text-gray-800">
              {experiment["Histórico e Aprendizados"] ||
                experiment["Historico e Aprendizados"] ||
                experiment["Aprendizados"] ||
                "-"}
            </span>
          </div>
        </div>
        {/* Feedback de operação */}
        {feedback && (
          <div className="mt-4 px-4 py-2 rounded bg-blue-100 text-blue-800 font-semibold text-center">
            {feedback}
          </div>
        )}
        {/* Ações */}
        <div className="flex gap-4 mt-6">
          <button
            className="px-4 py-2 bg-blue-600 text-white rounded font-semibold"
            onClick={handleSave}
          >
            Salvar alterações
          </button>
          <button
            className="px-4 py-2 bg-red-600 text-white rounded font-semibold"
            onClick={handleDelete}
          >
            Deletar
          </button>
        </div>
      </div>
    </div>
  );
};
