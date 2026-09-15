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
      <div className="bg-card text-card-foreground rounded-xl shadow-elevated p-6 w-full max-w-lg relative border">
        <button
          className="absolute top-4 right-4 text-muted-foreground hover:text-foreground"
          onClick={onClose}
        >
          &times;
        </button>
        <h2 className="text-2xl font-bold text-foreground mb-2">{dev.nome}</h2>
        <div className="mb-4">
          <CapacityPieChart percent={percentExp} />
        </div>
        <div className="mb-4 p-3 rounded bg-muted border flex flex-col items-center">
          <span className="font-semibold text-foreground">
            Capacity disponível este mês:
          </span>
          <span className="text-2xl font-bold text-lab-success">
            {capacityDisponivel}h
          </span>
          <span className="text-xs text-muted-foreground">
            ({((capacityDisponivel / totalHoras) * 100).toFixed(1)}% livre)
          </span>
        </div>
        <div className="mb-2">
          <span className="font-semibold">Experimentos Alocados:</span>
          <ul className="list-disc ml-6 mt-1">
            {dev.experiments.map((exp, i) => (
              <li key={i} className="flex flex-col text-sm mb-1">
                <span className="font-semibold text-foreground">{exp.nome}</span>
                <span className="text-xs text-muted-foreground">
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
              <li className="text-muted-foreground">Nenhuma atividade extra</li>
            )}
          </ul>
        </div>
        <div className="mt-4 text-xs text-muted-foreground">
          * Capacity calculado considerando 70% para experimentos e 30% para
          atividades gerais.
        </div>
      </div>
    </div>
  );
}
