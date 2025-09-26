import React from "react";
import { DEVELOPERS, WEEKS, WORKLOAD } from "./mockCapacityData";

export function CapacityTeamTable() {
  return (
    <div className="overflow-x-auto rounded-xl shadow bg-white">
      <table className="min-w-full text-center">
        <thead>
          <tr className="bg-gray-100">
            <th className="py-3 px-4 text-left">Dev</th>
            {WEEKS.map((week) => (
              <th key={week.label} className="py-3 px-4 text-center">
                <div className="font-bold text-sm">{week.label}</div>
                <div className="text-xs text-gray-500">{week.range}</div>
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {DEVELOPERS.map((dev, i) => (
            <tr key={dev.nome} className="border-b">
              <td className="py-2 px-4 flex items-center gap-2">
                <img
                  src={dev.avatar}
                  alt={dev.nome}
                  className="w-8 h-8 rounded-full border"
                />
                <span className="font-semibold text-gray-700">{dev.nome}</span>
              </td>
              {WORKLOAD[i].map((work, j) => (
                <td key={j} className="py-2 px-4">
                  <div
                    className={`inline-block w-8 h-8 rounded-full flex items-center justify-center text-white font-bold text-lg ${
                      work > 10
                        ? "bg-rose-500"
                        : work > 0
                        ? "bg-blue-500"
                        : "bg-gray-200 text-gray-400"
                    }`}
                  >
                    {work > 0 ? work : ""}
                  </div>
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
