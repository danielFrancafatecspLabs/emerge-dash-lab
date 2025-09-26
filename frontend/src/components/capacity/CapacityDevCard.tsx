import React, { useState } from "react";
import { CapacityDevChart } from "./CapacityDevChart";

interface Experiment {
  nome: string;
  tamanho: string;
  dataInicio: string;
  previsaoTermino: string;
  horas: number;
}

interface CapacityExperiment {
  nome: string;
  horas: number;
  percent: number;
}

interface CapacityData {
  totalUsed: number;
  monthCapacity: number;
  percentUsed: number;
  experimentsCapacity: CapacityExperiment[];
  capacidadeTotalMes: number; // Added missing property
}

interface Dev {
  nome: string;
  experiments: Experiment[];
}

interface Props {
  dev: Dev;
  cap: CapacityData;
  currentMonthName: string;
  onDetails: () => void;
  onChart: () => void;
}

function formatDate(dateStr: string) {
  if (!dateStr) return "-";
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return dateStr;
  const day = String(d.getDate()).padStart(2, "0");
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const year = String(d.getFullYear()).slice(-2);
  return `${day}/${month}/${year}`;
}

function getExperimentStatus(exp) {
  // Simulação: se previsão < hoje, atrasado; se começa hoje, novo; senão, no prazo
  const hoje = new Date();
  const prev = new Date(exp.previsaoTermino);
  const ini = new Date(exp.dataInicio);
  if (prev < hoje)
    return {
      label: "Atrasado",
      color: "bg-red-100 text-red-700",
    };
  if (ini.toDateString() === hoje.toDateString())
    return {
      label: "Novo",
      color: "bg-blue-100 text-blue-700",
    };
  return {
    label: "No prazo",
    color: "bg-green-100 text-green-700",
  };
}
function getCapacityFlag(percent) {
  if (percent >= 90)
    return {
      label: "Capacidade crítica!",
      color: "bg-red-100 text-red-700",
      icon: "⚠️",
    };
  if (percent >= 80)
    return {
      label: "Capacidade alta",
      color: "bg-yellow-100 text-yellow-700",
      icon: "🔔",
    };
  return null;
}
function getRecommendations(percent) {
  if (percent >= 90)
    return "Recomenda redistribuir tarefas ou adiar experimentos.";
  if (percent >= 80) return "Acompanhe de perto para evitar sobrecarga.";
  return "Capacidade dentro do ideal.";
}
export const CapacityDevCard: React.FC<Props> = ({
  dev,
  cap,
  currentMonthName,
  onDetails,
  onChart,
}) => {
  const [showChart, setShowChart] = useState(false);
  const flag = getCapacityFlag(cap.percentUsed);
  const recommendation = getRecommendations(cap.percentUsed);

  // Map experiment names to their estimated delivery days
  const experimentEstimativas: Record<string, number> = {};
  dev.experiments.forEach((exp) => {
    const ini = new Date(exp.dataInicio);
    const prev = new Date(exp.previsaoTermino);
    const dias = Math.ceil(
      (prev.getTime() - ini.getTime()) / (1000 * 60 * 60 * 24)
    );
    experimentEstimativas[exp.nome] = dias;
  });

  return (
    <div className="rounded-xl shadow border border-gray-200 bg-white p-6 flex flex-col gap-4 transition-all duration-200 hover:shadow-xl hover:border-[#7a0019] relative">
      {/* Título principal */}
      <div className="mb-2 pb-2 border-b border-gray-100 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[#e5e7eb] to-[#fff] flex items-center justify-center border shadow-sm">
            <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
              <circle cx="9" cy="9" r="7" fill="#7a0019" opacity="0.12" />
              <text
                x="9"
                y="13"
                textAnchor="middle"
                fontSize="10"
                fill="#7a0019"
              >
                {dev.nome[0]}
              </text>
            </svg>
          </div>
          <div>
            <div className="font-bold text-lg text-[#7a0019]">{dev.nome}</div>
            <div className="text-xs text-gray-500">Resumo do desenvolvedor</div>
          </div>
        </div>
        <span className="ml-2 px-2 py-1 rounded bg-green-100 text-green-700 text-xs font-bold">
          Em andamento
        </span>
      </div>
      {/* Flags/Avisos de capacidade */}
      {flag && (
        <div
          className={`flex items-center gap-2 px-3 py-2 rounded font-bold ${flag.color} mb-2`}
        >
          <span>{flag.icon}</span> <span>{flag.label}</span>
        </div>
      )}
      <div className="flex flex-col gap-4">
        {/* Recomendações */}
        <div className="mb-2">
          <span className="font-semibold text-[#7a0019] text-base">
            Recomendações
          </span>
          <div className="text-gray-700 text-sm mt-1">
            Capacidade dentro do ideal.
          </div>
        </div>

        {/* Experimentos - cada um em um card */}
        <div className="flex gap-4 mb-2">
          {cap.experimentsCapacity.map((exp, idx) => (
            <div
              key={exp.nome}
              className="flex-1 bg-white border border-gray-200 rounded-xl shadow-lg p-4 transition-transform duration-200 hover:scale-[1.03] hover:shadow-2xl"
              style={{ boxShadow: "0 4px 16px 0 rgba(122,0,25,0.08)" }}
            >
              <div className="flex items-center justify-between mb-1">
                <span className="font-bold text-[#7a0019] text-sm flex items-center gap-1">
                  <svg width="18" height="18" fill="none" viewBox="0 0 18 18">
                    <circle cx="9" cy="9" r="7" fill="#7a0019" opacity="0.10" />
                    <text
                      x="9"
                      y="13"
                      textAnchor="middle"
                      fontSize="9"
                      fill="#7a0019"
                    >
                      {exp.nome[0]}
                    </text>
                  </svg>
                  {exp.nome}
                </span>
                <span className="px-2 py-0.5 rounded bg-green-100 text-green-700 text-xs font-semibold">
                  No prazo
                </span>
              </div>
              <div className="text-xs text-gray-600 mb-1">
                Horas: <b>{exp.horas}h</b>
              </div>
              <div className="mt-2">
                <span className="text-[13px] text-gray-700">
                  Estimativa de entrega:
                </span>
                <span className="ml-1 font-bold text-blue-700 text-lg">
                  {experimentEstimativas[exp.nome] !== undefined
                    ? `${experimentEstimativas[exp.nome]} dias`
                    : "-"}
                </span>
              </div>
            </div>
          ))}
        </div>

        {/* Estimativas de entrega resumidas - layout destacado */}
        <div className="mb-2 flex items-center gap-2">
          <span className="font-semibold text-[#7a0019] text-base mr-2">
            Estimativas de entrega
          </span>
          {cap.experimentsCapacity.map((exp, idx) => (
            <span
              key={exp.nome}
              className="inline-block px-3 py-1 rounded bg-[#f3f4f6] text-[#7a0019] font-bold text-sm shadow"
            >
              {exp.nome}:{" "}
              <span className="text-blue-700">
                {experimentEstimativas[exp.nome] !== undefined
                  ? `${experimentEstimativas[exp.nome]} dias`
                  : "-"}
              </span>
            </span>
          ))}
        </div>

        {/* Capacidade Mensal explicativa */}
        <div className="mb-2">
          <span className="font-semibold text-[#7a0019] text-base">
            Capacidade Mensal
          </span>
          <div className="flex items-center gap-3 mt-2">
            <div className="relative group">
              <div className="w-40 h-4 bg-blue-100 rounded-full overflow-hidden">
                <div
                  className={`h-4 rounded-full transition-all duration-300 ${
                    cap.percentUsed < 80
                      ? "bg-green-500"
                      : cap.percentUsed < 100
                      ? "bg-yellow-400"
                      : "bg-red-500"
                  }`}
                  style={{ width: `${cap.percentUsed}%` }}
                ></div>
              </div>
              <div className="absolute left-0 top-6 z-10 hidden group-hover:block bg-white border border-gray-200 rounded shadow px-3 py-2 text-xs text-gray-700">
                Capacidade utilizada este mês:{" "}
                <b>{cap.totalUsed.toFixed(1)}h</b> de{" "}
                <b>{Math.round(cap.capacidadeTotalMes)}h</b> disponíveis.
                <br />
                Ideal manter abaixo de 80% para evitar sobrecarga.
              </div>
            </div>
            <span className="font-bold text-blue-700 text-lg">
              {cap.totalUsed.toFixed(1)}h
            </span>
            <span className="text-gray-500 text-xs">
              / {Math.round(cap.capacidadeTotalMes)}h
            </span>
            <span
              className={`px-2 py-1 rounded text-xs font-bold ${
                cap.percentUsed < 80
                  ? "bg-green-100 text-green-700"
                  : cap.percentUsed < 100
                  ? "bg-yellow-100 text-yellow-700"
                  : "bg-red-100 text-red-700"
              }`}
            >
              {cap.percentUsed.toFixed(1)}%
            </span>
          </div>
          <div className="text-xs text-gray-600 mt-2">
            <span className="font-medium text-gray-700">Como interpretar:</span>{" "}
            Você está usando <b>{cap.totalUsed.toFixed(1)}h</b> de{" "}
            <b>{Math.round(cap.capacidadeTotalMes)}h</b> totais disponíveis
            neste mês (
            <span className="text-blue-700 font-bold">
              {cap.percentUsed.toFixed(1)}%
            </span>{" "}
            do total).{" "}
            <span
              className={
                cap.percentUsed < 80
                  ? "text-green-700"
                  : cap.percentUsed < 100
                  ? "text-yellow-700"
                  : "text-red-700"
              }
            >
              {cap.percentUsed < 80
                ? "Capacidade saudável."
                : cap.percentUsed < 100
                ? "Atenção: capacidade alta."
                : "Alerta: capacidade crítica!"}
            </span>
          </div>
        </div>

        {/* Capacidade por Experimento */}
        <div className="mb-2">
          <span className="font-semibold text-[#7a0019] text-base">
            Capacidade por Experimento
          </span>
          <div className="flex flex-col gap-1 mt-1">
            {cap.experimentsCapacity.map((exp, idx) => (
              <div key={exp.nome} className="flex items-center gap-2">
                <span className="inline-block px-2 py-1 rounded bg-[#e5e7eb] text-gray-700 font-medium text-xs min-w-[80px] text-center">
                  {exp.nome}
                </span>
                <span className="inline-block px-2 py-1 rounded bg-blue-100 text-blue-700 font-bold text-xs min-w-[50px] text-center">
                  {exp.horas.toFixed(1)}h
                </span>
                <span className="inline-block px-2 py-1 rounded bg-blue-50 text-blue-700 font-bold text-xs min-w-[50px] text-center">
                  {exp.percent.toFixed(1)}%
                </span>
              </div>
            ))}
          </div>
          <div className="text-xs text-gray-600 mt-1">
            <span className="font-medium text-gray-700">Dica:</span>{" "}
            Experimentos com mais de 40% da capacidade merecem atenção especial.
          </div>
        </div>

        {/* Interpretação e ações */}
        <div className="mt-4">
          <div className="text-xs text-gray-500 mb-2">
            <b>Como interpretar este card?</b> Cada bloco mostra dados dos
            experimentos, status, estimativas, flags de capacidade,
            recomendações e uso da capacidade mensal. Passe o mouse sobre os
            ícones para explicações rápidas. O botão "Ver detalhes" mostra
            informações completas e o botão "Ver gráfico" exibe a evolução da
            capacidade.
          </div>
          <div className="flex gap-2">
            <button
              className="bg-[#7a0019] text-white px-4 py-2 rounded font-bold hover:bg-[#a3002c] transition"
              onClick={onDetails}
            >
              Ver detalhes
            </button>
            <button
              className="bg-blue-600 text-white px-4 py-2 rounded font-bold hover:bg-blue-700 transition"
              onClick={() => setShowChart(true)}
            >
              Ver gráfico
            </button>
          </div>
        </div>
        {showChart && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40">
            <div className="bg-white rounded-xl shadow-xl p-6 relative">
              <button
                className="absolute top-2 right-2 text-gray-500 hover:text-[#7a0019] font-bold text-lg"
                onClick={() => setShowChart(false)}
              >
                &times;
              </button>
              <CapacityDevChart month={currentMonthName} year={2025} />
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

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

export function CapacityDevCardSimple({
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
