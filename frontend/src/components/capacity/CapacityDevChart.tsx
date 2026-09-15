import React from "react";

// Dados fake para simulação de ocupação por dia do mês
const fakeCalendarData = [
  { day: 1, ocupado: true },
  { day: 2, ocupado: true },
  { day: 3, ocupado: false },
  { day: 4, ocupado: true },
  { day: 5, ocupado: false },
  { day: 6, ocupado: false },
  { day: 7, ocupado: true },
  { day: 8, ocupado: true },
  { day: 9, ocupado: true },
  { day: 10, ocupado: false },
  { day: 11, ocupado: true },
  { day: 12, ocupado: true },
  { day: 13, ocupado: false },
  { day: 14, ocupado: true },
  { day: 15, ocupado: true },
  { day: 16, ocupado: false },
  { day: 17, ocupado: true },
  { day: 18, ocupado: true },
  { day: 19, ocupado: false },
  { day: 20, ocupado: true },
  { day: 21, ocupado: true },
  { day: 22, ocupado: false },
  { day: 23, ocupado: true },
  { day: 24, ocupado: true },
  { day: 25, ocupado: false },
  { day: 26, ocupado: true },
  { day: 27, ocupado: true },
  { day: 28, ocupado: false },
  { day: 29, ocupado: true },
  { day: 30, ocupado: true },
];

export const CapacityDevChart = ({ month = "Setembro", year = 2025 }) => {
  return (
    <div className="p-6 bg-white rounded-xl shadow-xl max-w-lg mx-auto">
      <h2 className="text-xl font-bold text-[#7a0019] mb-4">
        Visão de Ocupação no Calendário
      </h2>
      <div className="mb-2 text-gray-700 font-medium">
        {month} / {year}
      </div>
      <div className="grid grid-cols-7 gap-2">
        {Array.from({ length: 30 }, (_, i) => {
          const dayData = fakeCalendarData[i];
          return (
            <div
              key={i}
              className={`flex flex-col items-center justify-center h-12 w-12 rounded-lg border text-sm font-bold shadow-sm transition-all duration-150 ${
                dayData.ocupado
                  ? "bg-[#7a0019] text-white"
                  : "bg-gray-100 text-gray-500"
              }`}
            >
              {i + 1}
              {dayData.ocupado && (
                <span className="text-xs mt-1 font-normal">Ocupado</span>
              )}
            </div>
          );
        })}
      </div>
      <div className="mt-4 text-xs text-gray-600">
        <b>Como interpretar:</b> Dias marcados em vermelho indicam ocupação do
        capacity do desenvolvedor. Os demais dias estão livres ou parcialmente
        ocupados.
      </div>
    </div>
  );
};
