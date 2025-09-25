import React from "react";

export function CapacityHeader() {
  return (
    <header className="max-w-4xl mx-auto mb-8 text-center">
      <h1 className="text-4xl font-extrabold text-[#7a0019] mb-2">
        Capacity dos Desenvolvedores
      </h1>
      <p className="text-lg text-gray-700 mb-2">
        Acompanhe a alocação de horas, previsão de entrega e atividades extras
        de cada desenvolvedor. Capacity é o limite de horas mensais (160h),
        sendo 70% para experimentos e 30% para atividades gerais.
      </p>
      <div className="flex flex-wrap gap-4 justify-center items-center mt-4">
        <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#7a0019]/10 text-[#7a0019] font-bold text-sm">
          Experimentos: até 112h
        </span>
        <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-yellow-200 text-yellow-700 font-bold text-sm">
          Atividades Gerais: até 48h
        </span>
        <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-gray-200 text-gray-700 font-bold text-sm">
          Total: 160h/mês
        </span>
      </div>
    </header>
  );
}
