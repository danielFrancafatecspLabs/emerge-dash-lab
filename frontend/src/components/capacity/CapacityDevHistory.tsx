import React from "react";

export function CapacityDevHistory({
  history,
}: {
  history: Array<{ mes: string; percent: number }>;
}) {
  return (
    <div className="bg-card text-card-foreground rounded-xl border shadow-card p-4">
      <h3 className="text-lg font-semibold text-foreground mb-2">
        Histórico de Capacity
      </h3>
      <div className="flex gap-4">
        {history.map((h, i) => (
          <div key={i} className="flex flex-col items-center">
            <span className="text-sm text-muted-foreground mb-1">{h.mes}</span>
            <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center">
              <span className="text-lab-primary font-semibold text-lg">
                {h.percent}%
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
