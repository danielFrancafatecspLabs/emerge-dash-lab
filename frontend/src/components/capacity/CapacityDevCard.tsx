import React from "react";

interface Experiment {
  nome: string;
  previsaoTermino: string;
  horas: number;
  status: string;
}

interface CapacityDevCardProps {
  nome: string;
  avatar: string;
  experiments: Experiment[];
  atividadesExtras: string[];
  totalHoras?: number;
}

export function CapacityDevCard({
  nome,
  avatar,
  experiments,
  atividadesExtras,
  totalHoras = 160,
}: CapacityDevCardProps) {
  // Cálculo de capacity
  const maxExp = totalHoras * 0.7;
  const maxExtras = totalHoras * 0.3;
  const horasExp = experiments.reduce((acc, e) => acc + e.horas, 0);
  const horasExtras = atividadesExtras.length * (totalHoras * 0.15); // 15% para cada tipo
  const percentExp = Math.min((horasExp / maxExp) * 100, 100);
  const percentExtras = Math.min((horasExtras / maxExtras) * 100, 100);
  // Data estimada de entrega: simulação simples
  const diasEntrega = Math.ceil(horasExp / (maxExp / 5));
  const dataEntrega = (() => {
    const hoje = new Date();
    hoje.setDate(hoje.getDate() + diasEntrega);
    return hoje.toLocaleDateString();
  })();

  return (
    <div className="bg-white rounded-xl shadow-lg p-6 flex flex-col gap-4 w-full max-w-md min-w-[320px]">
      <div className="flex items-center gap-4 mb-2">
        <img
          src={avatar}
          alt={nome}
          className="w-12 h-12 rounded-full border"
        />
        <h2 className="text-2xl font-bold text-[#7a0019]">{nome}</h2>
      </div>
      <div>
        <span className="font-semibold">Experimentos Alocados:</span>
        <ul className="list-disc ml-6 mt-1">
          {experiments.length === 0 ? (
            <li className="text-gray-400">Nenhum experimento alocado</li>
          ) : (
            experiments.map((exp, i) => (
              <li key={i} className="flex flex-col text-sm mb-1">
                <span className="font-bold text-[#7a0019]">{exp.nome}</span>
                <span className="text-xs text-gray-500">
                  Previsão: {exp.previsaoTermino} | {exp.status} | {exp.horas}h
                </span>
              </li>
            ))
          )}
        </ul>
      </div>
      <div>
        <span className="font-semibold">Atividades Extras:</span>
        <ul className="list-disc ml-6 mt-1">
          {atividadesExtras.length === 0 ? (
            <li className="text-gray-400">Nenhuma atividade extra</li>
          ) : (
            atividadesExtras.map((atv, i) => (
              <li key={i} className="text-sm">
                {atv}
              </li>
            ))
          )}
        </ul>
      </div>
      <div className="flex flex-col gap-2 mt-2">
        <div className="flex gap-2 items-center">
          <span className="font-semibold">% Alocação Experimentos:</span>
          <div className="relative w-32 h-3 bg-gray-200 rounded-full overflow-hidden">
            <div
              className="absolute left-0 top-0 h-full bg-[#7a0019] rounded-full transition-all duration-500"
              style={{ width: `${percentExp}%` }}
            />
          </div>
          <span className="text-xs font-bold text-[#7a0019]">
            {percentExp.toFixed(1)}%
          </span>
        </div>
        <div className="flex gap-2 items-center">
          <span className="font-semibold">% Alocação Extras:</span>
          <div className="relative w-32 h-3 bg-yellow-200 rounded-full overflow-hidden">
            <div
              className="absolute left-0 top-0 h-full bg-yellow-500 rounded-full transition-all duration-500"
              style={{ width: `${percentExtras}%` }}
            />
          </div>
          <span className="text-xs font-bold text-yellow-700">
            {percentExtras.toFixed(1)}%
          </span>
        </div>
      </div>
      <div className="mt-2">
        <span className="font-semibold">Data estimada para entrega:</span>
        <span className="ml-2 text-[#7a0019] font-bold">{dataEntrega}</span>
      </div>
    </div>
  );
}
