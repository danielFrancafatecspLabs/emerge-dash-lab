import React from "react";

export function CapacityDevHistory({
  history,
}: {
  history: Array<{ mes: string; percent: number }>;
}) {
  return (
    <div className="bg-white rounded-xl shadow p-4 mt-4">
      <h3 className="text-lg font-bold text-[#7a0019] mb-2">
        Histórico de Capacity
      </h3>
      <div className="flex gap-4">
        {history.map((h, i) => (
          <div key={i} className="flex flex-col items-center">
            <span className="text-sm text-gray-500 mb-1">{h.mes}</span>
            <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center">
              <span className="text-[#7a0019] font-bold text-lg">
                {h.percent}%
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
