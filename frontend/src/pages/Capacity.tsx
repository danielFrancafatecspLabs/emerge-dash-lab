import React from "react";
import { useState } from "react";
import { DEVELOPERS } from "@/components/capacity/mockCapacityData";
import { calculateMonthlyCapacity } from "@/lib/capacityUtils";
import { CapacityHeader } from "@/components/capacity/CapacityHeader";
import { CapacityFilterBar } from "@/components/capacity/CapacityFilterBar";
import { CapacityDevModal } from "@/components/capacity/CapacityDevModal";
import { CapacityDevHistory } from "@/components/capacity/CapacityDevHistory";
import { CapacityDevCard } from "@/components/capacity/CapacityDevCard";

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
          <div className="grid grid-cols-1 gap-6">
            {filteredDevs.map((dev, idx) => {
              const cap = calculateMonthlyCapacity(
                dev,
                selectedYear,
                selectedMonth
              );
              return (
                <CapacityDevCard
                  key={dev.nome}
                  dev={dev}
                  cap={cap}
                  currentMonthName={currentMonthName}
                  onDetails={() => setModalDev(dev)}
                  onChart={() => alert("Em breve: gráfico de capacidade!")}
                />
              );
            })}
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
