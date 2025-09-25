import React from "react";

export function CapacityTooltip({
  percent,
  horas,
  max,
}: {
  percent: number;
  horas: number;
  max: number;
}) {
  return (
    <div className="p-2 text-sm text-gray-700">
      <div>
        <strong>Capacidade utilizada:</strong> {percent.toFixed(1)}%
      </div>
      <div>
        <strong>Horas alocadas:</strong> {horas}h de {max}h
      </div>
      <div className="mt-1 text-xs text-gray-500">
        O cálculo considera o total de horas do mês e o limite de 70% para
        experimentos.
      </div>
    </div>
  );
}
