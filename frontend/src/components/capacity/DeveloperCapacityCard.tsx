import React from "react";
import { Card, CardHeader, CardContent } from "@/components/ui/card";

interface Experiment {
  nome: string;
  previsaoTermino: string;
}

interface DeveloperCapacityCardProps {
  nome: string;
  experiments: Experiment[];
  atividadesExtras: string[];
  percentExp: number;
  percentExtras: number;
  dataEntrega: string;
}

export function DeveloperCapacityCard({
  nome,
  experiments,
  atividadesExtras,
  percentExp,
  percentExtras,
  dataEntrega,
}: DeveloperCapacityCardProps) {
  return (
    <Card className="shadow-lg hover:scale-[1.02] transition-transform duration-200">
      <CardHeader>
        <h2 className="text-xl font-bold text-[#7a0019] flex items-center gap-2">
          <span className="inline-block w-3 h-3 rounded-full bg-green-500 animate-pulse" />
          {nome}
        </h2>
      </CardHeader>
      <CardContent>
        <div className="mb-2">
          <span className="font-semibold">Experimentos Alocados:</span>
          <ul className="list-disc ml-6">
            {experiments.length === 0 ? (
              <li className="text-gray-400">Nenhum experimento alocado</li>
            ) : (
              experiments.map((exp, i) => (
                <li key={i}>
                  <span className="font-bold text-[#7a0019]">{exp.nome}</span>
                  <span className="ml-2 text-xs text-gray-500">(Previsão: {exp.previsaoTermino})</span>
                </li>
              ))
            )}
          </ul>
        </div>
        <div className="mb-2">
          <span className="font-semibold">Atividades Extras:</span>
          <ul className="list-disc ml-6">
            {atividadesExtras.length === 0 ? (
              <li className="text-gray-400">Nenhuma atividade extra</li>
            ) : (
              atividadesExtras.map((atv, i) => <li key={i}>{atv}</li>)
            )}
          </ul>
        </div>
        <div className="mb-2 flex gap-2 items-center">
          <span className="font-semibold">% Alocação Experimentos:</span>
          <div className="relative w-32 h-3 bg-gray-200 rounded-full overflow-hidden">
            <div
              className="absolute left-0 top-0 h-full bg-[#7a0019] rounded-full transition-all duration-500"
              style={{ width: `${percentExp}%` }}
            />
          </div>
          <span className="text-xs font-bold text-[#7a0019]">{percentExp.toFixed(1)}%</span>
        </div>
        <div className="mb-2 flex gap-2 items-center">
          <span className="font-semibold">% Alocação Extras:</span>
          <div className="relative w-32 h-3 bg-yellow-200 rounded-full overflow-hidden">
            <div
              className="absolute left-0 top-0 h-full bg-yellow-500 rounded-full transition-all duration-500"
              style={{ width: `${percentExtras}%` }}
            />
          </div>
          <span className="text-xs font-bold text-yellow-700">{percentExtras.toFixed(1)}%</span>
        </div>
        <div className="mb-2">
          <span className="font-semibold">Data estimada para entrega:</span>
          <span className="ml-2 text-[#7a0019] font-bold">{dataEntrega}</span>
        </div>
      </CardContent>
    </Card>
  );
}
