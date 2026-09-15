import React from "react";

const funnelData = [
  {
    label: "Ideias geradas",
    value: 166,
    color: "bg-red-600",
    conversion: 47,
    nextLabel: "Aprovados no critério de seleção",
  },
  {
    label: "Aprovados no critério de seleção",
    value: 78,
    color: "bg-yellow-500",
    conversion: 49,
    nextLabel: "Experimentos Concluídos",
  },
  {
    label: "Experimentos Concluídos",
    value: 38,
    color: "bg-orange-500",
    conversion: 21,
    nextLabel: "Piloto Concluídos",
  },
  {
    label: "Piloto Concluídos",
    value: 8,
    color: "bg-green-600",
    conversion: 13,
    nextLabel: "Projeto / Produto",
  },
  {
    label: "Projeto / Produto",
    value: 1,
    color: "bg-blue-700",
    conversion: null,
    nextLabel: null,
  },
];

export default function ExperimentFunnelCard() {
  // Calcular largura máxima e mínima para efeito funil
  const maxValue = Math.max(...funnelData.map((s) => s.value));
  const minWidth = 180; // px
  const maxWidth = 420; // px

  return (
    <div className="w-full flex flex-col items-center gap-0">
      {funnelData.map((step, idx) => {
        // Largura proporcional ao valor
        const width =
          minWidth + (step.value / maxValue) * (maxWidth - minWidth);
        return (
          <React.Fragment key={step.label}>
            <div
              style={{ width: `${width}px`, transition: "width 0.3s" }}
              className={`py-4 mb-2 rounded-lg shadow flex flex-col items-center justify-center ${step.color}`}
            >
              <span className="text-3xl font-bold text-white drop-shadow">
                {step.value}
              </span>
              <span className="text-base font-semibold text-white drop-shadow">
                {step.label}
              </span>
            </div>
            {step.conversion !== null && (
              <div className="flex flex-col items-center mb-2">
                <div className="flex items-center gap-2">
                  <span className="text-lg font-bold text-gray-700">↓</span>
                  <span className="text-lg font-bold text-orange-500">
                    {step.conversion}%
                  </span>
                  <span className="text-xs text-gray-500">
                    convertidos para
                  </span>
                  <span className="text-xs font-semibold text-gray-700">
                    {step.nextLabel}
                  </span>
                </div>
                <div className="w-1 h-6 bg-gray-300 rounded-full" />
              </div>
            )}
          </React.Fragment>
        );
      })}
    </div>
  );
}
