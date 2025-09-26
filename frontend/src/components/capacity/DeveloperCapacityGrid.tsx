import React from "react";
import { DeveloperCapacityCard } from "./DeveloperCapacityCard";

interface Experiment {
  nome: string;
  previsaoTermino: string;
}

interface DeveloperCapacityGridProps {
  developers: string[];
  experiments: Record<string, Experiment[]>;
  atividadesExtras: Record<string, string[]>;
  calcularAlocacao: (dev: string) => {
    percentExp: number;
    percentExtras: number;
    horasExp: number;
    horasExtras: number;
  };
  estimarEntrega: (dev: string) => string;
}

export function DeveloperCapacityGrid({
  developers,
  experiments,
  atividadesExtras,
  calcularAlocacao,
  estimarEntrega,
}: DeveloperCapacityGridProps) {
  return (
    <div className="flex flex-wrap gap-8 justify-center items-stretch p-8">
      {developers.map((dev) => {
        const { percentExp, percentExtras, horasExp, horasExtras } =
          calcularAlocacao(dev);
        return (
          <div key={dev} className="w-full max-w-md min-w-[320px]">
            <DeveloperCapacityCard
              nome={dev}
              experiments={experiments[dev] || []}
              atividadesExtras={atividadesExtras[dev] || []}
              percentExp={percentExp}
              percentExtras={percentExtras}
              dataEntrega={estimarEntrega(dev)}
            />
          </div>
        );
      })}
    </div>
  );
}
