import React from "react";
import { useState } from "react";
import { DEVELOPERS } from "@/components/capacity/mockCapacityData";
import { calculateMonthlyCapacity } from "@/lib/capacityUtils";
import { CapacityHeader } from "@/components/capacity/CapacityHeader";
import { CapacityFilterBar } from "@/components/capacity/CapacityFilterBar";
import { CapacityDevModal } from "@/components/capacity/CapacityDevModal";
import { CapacityDevHistory } from "@/components/capacity/CapacityDevHistory";

// Mock data for demonstration
const experiments = {
  "Daniel França": [{ nome: "Exp IA", previsaoTermino: "2025-10-10" }],
  // ...add for other devs
};
const atividadesExtras = {
  "Daniel França": ["Pesquisa de IA", "Review Experimento X"],
  // ...add for other devs
};

function calcularAlocacao(dev) {
  const totalHoras = 160;
  const maxExp = totalHoras * 0.7;
  const maxExtras = totalHoras * 0.3;
  // Simulação: 1 experimento = 40h, cada extra = 12h
  const horasExp = (experiments[dev]?.length || 0) * 40;
  const horasExtras = (atividadesExtras[dev]?.length || 0) * 12;
  const percentExp = Math.min((horasExp / maxExp) * 100, 100);
  const percentExtras = Math.min((horasExtras / maxExtras) * 100, 100);
  return { percentExp, percentExtras, horasExp, horasExtras };
}

function estimarEntrega(dev) {
  // Simulação: entrega = hoje + (horasExp / (maxExp / 5 dias))
  const { horasExp } = calcularAlocacao(dev);
  const dias = Math.ceil(horasExp / ((160 * 0.7) / 5));
  const hoje = new Date();
  hoje.setDate(hoje.getDate() + dias);
  return hoje.toLocaleDateString();
}

export default function Capacity() {
  // Nome do mês atual
  const monthNames = [
    "Janeiro",
    "Fevereiro",
    "Março",
    "Abril",
    "Maio",
    "Junho",
    "Julho",
    "Agosto",
    "Setembro",
    "Outubro",
    "Novembro",
    "Dezembro",
  ];
  const now = new Date();
  const [selectedMonth, setSelectedMonth] = useState(now.getMonth());
  const [selectedYear, setSelectedYear] = useState(now.getFullYear());
  const currentMonthName = monthNames[selectedMonth];
  // Função para verificar se experimento está no mês atual
  function isExperimentInCurrentMonth(exp) {
    const now = new Date();
    const month = now.getMonth();
    const year = now.getFullYear();
    const start = new Date(exp.dataInicio);
    const end = new Date(exp.previsaoTermino);
    // Se o experimento começa ou termina no mês atual
    return (
      (start.getMonth() === month && start.getFullYear() === year) ||
      (end.getMonth() === month && end.getFullYear() === year)
    );
  }

  const [filterDev, setFilterDev] = useState("");
  const [modalDev, setModalDev] = useState(null);
  // Exemplo de histórico fake
  const history = [
    { mes: "Jul/25", percent: 80 },
    { mes: "Ago/25", percent: 65 },
    { mes: "Set/25", percent: 72 },
  ];

  const filteredDevs = filterDev
    ? DEVELOPERS.filter((d) => d.nome === filterDev)
    : DEVELOPERS;

  return (
    <main className="w-full min-h-screen bg-gradient-to-br from-gray-50 to-gray-200">
      <section className="max-w-7xl mx-auto py-10">
        <CapacityHeader />
        <CapacityFilterBar onFilter={setFilterDev} />
        <div className="flex gap-4 items-center mb-6">
          <label className="font-bold text-[#7a0019]">Mês:</label>
          <select
            value={selectedMonth}
            onChange={(e) => setSelectedMonth(Number(e.target.value))}
            className="border rounded px-2 py-1"
          >
            {monthNames.map((name, idx) => (
              <option key={name} value={idx}>
                {name}
              </option>
            ))}
          </select>
          <label className="font-bold text-[#7a0019]">Ano:</label>
          <input
            type="number"
            value={selectedYear}
            onChange={(e) => setSelectedYear(Number(e.target.value))}
            className="border rounded px-2 py-1 w-20"
            min="2020"
            max="2100"
          />
        </div>
        <div className="mt-8">
          <div className="overflow-x-auto rounded-xl shadow border border-gray-200 bg-white">
            <table className="min-w-full text-center">
              <thead>
                <tr className="bg-gradient-to-r from-[#f3f4f6] to-[#e5e7eb]">
                  <th className="py-4 px-6 text-left font-bold text-[#7a0019] border-b">
                    Dev
                  </th>
                  <th className="py-4 px-6 font-bold text-[#7a0019] border-b">
                    Experimentos
                  </th>
                  <th className="py-4 px-6 font-bold text-[#7a0019] border-b">
                    Tamanho
                  </th>
                  <th className="py-4 px-6 font-bold text-[#7a0019] border-b">
                    Início
                  </th>
                  <th className="py-4 px-6 font-bold text-[#7a0019] border-b">
                    Previsão
                  </th>
                  <th className="py-4 px-6 font-bold text-[#7a0019] border-b">
                    Horas
                  </th>
                  <th className="py-4 px-6 font-bold text-[#7a0019] border-b">
                    Capacity Total
                    <br />
                    <span className="text-xs text-gray-500">
                      ({currentMonthName})
                    </span>
                  </th>
                  <th className="py-4 px-6 font-bold text-[#7a0019] border-b">
                    Capacity por Experimento
                  </th>
                  <th className="py-4 px-6 font-bold text-[#7a0019] border-b">
                    Detalhes
                  </th>
                </tr>
              </thead>
              <tbody>
                {filteredDevs.map((dev) => {
                  const cap = calculateMonthlyCapacity(
                    dev,
                    selectedYear,
                    selectedMonth
                  );
                  function formatDate(dateStr) {
                    if (!dateStr) return "-";
                    const d = new Date(dateStr);
                    if (isNaN(d.getTime())) return dateStr;
                    const day = String(d.getDate()).padStart(2, "0");
                    const month = String(d.getMonth() + 1).padStart(2, "0");
                    const year = String(d.getFullYear()).slice(-2);
                    return `${day}/${month}/${year}`;
                  }
                  return (
                    <tr key={dev.nome} className="border-b">
                      <td className="py-1 px-4 flex items-center gap-2">
                        <div className="w-7 h-7 rounded-full bg-gray-300 flex items-center justify-center border">
                          <svg
                            width="20"
                            height="20"
                            viewBox="0 0 20 20"
                            fill="none"
                          >
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
                        <span className="font-semibold text-xs">
                          {dev.nome}
                        </span>
                      </td>
                      <td className="py-1 px-4">
                        {dev.experiments.length === 0 ? (
                          <span className="text-gray-400">Nenhum</span>
                        ) : (
                          <div className="flex flex-col gap-1 text-left">
                            {dev.experiments.map((exp, i) => (
                              <span
                                key={i}
                                className="text-xs font-bold text-[#7a0019] bg-[#f6f6fa] rounded px-2 py-1"
                              >
                                {exp.nome}
                              </span>
                            ))}
                          </div>
                        )}
                      </td>
                      <td className="py-1 px-4">
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
                      <td className="py-1 px-4">
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
                      <td className="py-1 px-4">
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
                      <td className="py-1 px-4">
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
                      <td className="py-1 px-4 align-top">
                        <div className="flex items-center gap-2 w-full mb-1">
                          <div className="relative w-32 h-3 bg-gray-100 rounded-full overflow-hidden">
                            <div
                              className="absolute left-0 top-0 h-full bg-blue-500 rounded-full transition-all duration-500"
                              style={{ width: `${cap.percentUsed}%` }}
                            />
                          </div>
                          <span className="ml-2 text-xs font-bold text-[#7a0019]">
                            {cap.totalUsed.toFixed(1)}h /{" "}
                            {Math.round(cap.monthCapacity)}h
                          </span>
                          <span className="text-xs text-gray-500">
                            ({cap.percentUsed.toFixed(1)}%)
                          </span>
                        </div>
                      </td>
                      <td className="py-1 px-4 align-top">
                        {cap.experimentsCapacity.length > 0 ? (
                          <div className="flex flex-col gap-1">
                            {cap.experimentsCapacity.map((b) => (
                              <span
                                key={b.nome}
                                className="text-xs text-gray-700"
                              >
                                <span className="font-bold text-[#7a0019]">
                                  {b.nome}
                                </span>{" "}
                                — {b.horas.toFixed(1)}h ({b.percent.toFixed(1)}
                                %)
                              </span>
                            ))}
                          </div>
                        ) : (
                          <span className="text-gray-400 text-xs">-</span>
                        )}
                      </td>
                      <td className="py-1 px-4">
                        <button
                          className="px-3 py-1 rounded bg-[#7a0019] text-white text-xs font-bold hover:bg-[#5a0011] transition"
                          onClick={() => setModalDev(dev)}
                        >
                          Ver detalhes
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
        {modalDev && (
          <CapacityDevModal dev={modalDev} onClose={() => setModalDev(null)} />
        )}
        <CapacityDevHistory history={history} />
      </section>
    </main>
  );
}
