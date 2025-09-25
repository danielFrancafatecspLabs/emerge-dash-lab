import React from "react";
import { CapacityPieChart } from "./CapacityPieChart";

interface Experiment {
  nome: string;
  tamanho: string;
  dataInicio: string;
  previsaoTermino: string;
  status?: string;
  horas: number;
}

interface Developer {
  nome: string;
  experiments: Experiment[];
  atividadesExtras?: string[];
}

interface CapacityDevModalProps {
  dev: Developer;
  onClose: () => void;
}

export function CapacityDevModal({ dev, onClose }: CapacityDevModalProps) {
  if (!dev) return null;
  const totalHoras = 160;
  const maxExp = totalHoras * 0.7;
  const horasExp = dev.experiments.reduce((acc, e) => acc + e.horas, 0);
  const percentExp = Math.min((horasExp / maxExp) * 100, 100);

  // Capacity disponível por mês (simples: 160h - horas de experimentos)
  const capacityDisponivel = totalHoras - horasExp;

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl shadow-lg p-8 w-full max-w-lg relative">
        <button
          className="absolute top-4 right-4 text-gray-500 hover:text-[#7a0019]"
          onClick={onClose}
        >
          &times;
        </button>
        <h2 className="text-2xl font-bold text-[#7a0019] mb-2">{dev.nome}</h2>
        <div className="mb-4">
          <CapacityPieChart percent={percentExp} />
        </div>
        <div className="mb-4 p-3 rounded bg-gray-50 border border-gray-200 flex flex-col items-center">
          <span className="font-semibold text-[#7a0019]">
            Capacity disponível este mês:
          </span>
          <span className="text-2xl font-bold text-green-600">
            {capacityDisponivel}h
          </span>
          <span className="text-xs text-gray-500">
            ({((capacityDisponivel / totalHoras) * 100).toFixed(1)}% livre)
          </span>
        </div>
        <div className="mb-2">
          <span className="font-semibold">Experimentos Alocados:</span>
          <ul className="list-disc ml-6 mt-1">
            {dev.experiments.map((exp, i) => (
              <li key={i} className="flex flex-col text-sm mb-1">
                <span className="font-bold text-[#7a0019]">{exp.nome}</span>
                <span className="text-xs text-gray-500">
                  Tamanho: {exp.tamanho} | Início: {exp.dataInicio} | Previsão:{" "}
                  {exp.previsaoTermino} | {exp.horas}h
                </span>
              </li>
            ))}
          </ul>
        </div>
        <div className="mb-2">
          <span className="font-semibold">Atividades Extras:</span>
          <ul className="list-disc ml-6 mt-1">
            {dev.atividadesExtras && dev.atividadesExtras.length > 0 ? (
              dev.atividadesExtras.map((atv, i) => (
                <li key={i} className="text-sm">
                  {atv}
                </li>
              ))
            ) : (
              <li className="text-gray-400">Nenhuma atividade extra</li>
            )}
          </ul>
        </div>
        <div className="mt-4 text-xs text-gray-500">
          * Capacity calculado considerando 70% para experimentos e 30% para
          atividades gerais.
        </div>
      </div>
    </div>
  );
}
