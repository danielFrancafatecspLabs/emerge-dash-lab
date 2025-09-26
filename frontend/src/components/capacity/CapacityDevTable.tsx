import React from "react";
import { DEVELOPERS } from "./mockCapacityData";

export function CapacityDevTable() {
  function formatDate(dateStr: string) {
    if (!dateStr) return "-";
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return dateStr;
    const day = String(d.getDate()).padStart(2, "0");
    const month = String(d.getMonth() + 1).padStart(2, "0");
    const year = String(d.getFullYear()).slice(-2);
    return `${day}/${month}/${year}`;
  }
  return (
    <div className="overflow-x-auto rounded-xl shadow bg-white">
      <table className="min-w-full text-center">
        <thead>
          <tr className="bg-gray-100">
            <th className="py-3 px-4 text-left">Dev</th>
            <th className="py-3 px-4">Experimentos Alocados</th>
            <th className="py-3 px-4">Tamanho</th>
            <th className="py-3 px-4">Data de Início</th>
            <th className="py-3 px-4">Previsão de Término</th>
            <th className="py-3 px-4">Horas Estimadas</th>
            <th className="py-3 px-4">% Capacity Alocado</th>
          </tr>
        </thead>
        <tbody>
          {DEVELOPERS.map((dev) => {
            const totalHoras = 160;
            const maxExp = totalHoras * 0.7;
            const horasExp = dev.experiments.reduce(
              (acc, e) => acc + e.horas,
              0
            );
            const percentExp = Math.min((horasExp / maxExp) * 100, 100);
            return (
              <tr key={dev.nome} className="border-b">
                <td className="py-2 px-4 flex items-center gap-2">
                  <div className="w-8 h-8 rounded-full bg-gray-300 flex items-center justify-center border">
                    <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                      <circle cx="10" cy="7" r="4" fill="#bbb" />
                      <rect
                        x="4"
                        y="13"
                        width="12"
                        height="5"
                        rx="2.5"
                        fill="#bbb"
                      />
                    </svg>
                  </div>
                  <span className="font-semibold text-gray-700">
                    {dev.nome}
                  </span>
                </td>
                <td className="py-2 px-4">
                  {dev.experiments.length === 0 ? (
                    <span className="text-gray-400">Nenhum</span>
                  ) : (
                    <ul className="list-disc ml-4 text-left">
                      {dev.experiments.map((exp, i) => (
                        <li
                          key={i}
                          className="text-sm font-bold text-[#7a0019]"
                        >
                          {exp.nome}
                        </li>
                      ))}
                    </ul>
                  )}
                </td>
                <td className="py-2 px-4">
                  {dev.experiments.length === 0 ? (
                    <span className="text-gray-400">-</span>
                  ) : (
                    <ul className="ml-4 text-left">
                      {dev.experiments.map((exp, i) => (
                        <li key={i} className="text-sm text-gray-700">
                          {exp.tamanho}
                        </li>
                      ))}
                    </ul>
                  )}
                </td>
                <td className="py-2 px-4">
                  {dev.experiments.length === 0 ? (
                    <span className="text-gray-400">-</span>
                  ) : (
                    <ul className="ml-4 text-left">
                      {dev.experiments.map((exp, i) => (
                        <li key={i} className="text-sm text-gray-700">
                          {formatDate(exp.dataInicio)}
                        </li>
                      ))}
                    </ul>
                  )}
                </td>
                <td className="py-2 px-4">
                  {dev.experiments.length === 0 ? (
                    <span className="text-gray-400">-</span>
                  ) : (
                    <ul className="ml-4 text-left">
                      {dev.experiments.map((exp, i) => (
                        <li key={i} className="text-sm text-gray-700">
                          {formatDate(exp.previsaoTermino)}
                        </li>
                      ))}
                    </ul>
                  )}
                </td>
                <td className="py-2 px-4">
                  {dev.experiments.length === 0 ? (
                    <span className="text-gray-400">-</span>
                  ) : (
                    <ul className="ml-4 text-left">
                      {dev.experiments.map((exp, i) => (
                        <li key={i} className="text-sm text-gray-700">
                          {exp.horas}h
                        </li>
                      ))}
                    </ul>
                  )}
                </td>
                <td className="py-2 px-4">
                  <div className="flex items-center gap-2 justify-center">
                    <div className="relative w-24 h-3 bg-gray-200 rounded-full overflow-hidden">
                      <div
                        className="absolute left-0 top-0 h-full bg-[#7a0019] rounded-full transition-all duration-500"
                        style={{ width: `${percentExp}%` }}
                      />
                    </div>
                    <span className="text-xs font-bold text-[#7a0019]">
                      {percentExp.toFixed(1)}%
                    </span>
                  </div>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
