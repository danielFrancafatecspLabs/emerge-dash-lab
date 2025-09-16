import React from "react";
import { BarChart3 } from "lucide-react";
import { useExperimentos } from "@/hooks/useExperimentos";

export default function EficienciaOperacional() {
  const { data, loading } = useExperimentos();
  const today = new Date();
  // Função para calcular tempo médio por tamanho
  function getMediaPorTamanho(tamanho: "P" | "M" | "G") {
    const filtered = data.filter(
      (row) =>
        row.tamanho === tamanho &&
        typeof row["Início "] === "string" &&
        row["Início "] &&
        !isNaN(new Date(row["Início "]).getTime())
    );
    const totalDias = filtered.reduce((acc, row) => {
      const startDate =
        typeof row["Início "] === "string" ? new Date(row["Início "]) : today;
      const diffDays = Math.max(
        0,
        Math.floor(
          (today.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)
        )
      );
      return acc + diffDays;
    }, 0);
    return filtered.length > 0 ? Math.round(totalDias / filtered.length) : 0;
  }
  // Tempo médio geral
  const validExperimentos = data.filter(
    (row) =>
      typeof row["Início "] === "string" &&
      row["Início "] &&
      !isNaN(new Date(row["Início "]).getTime())
  );
  const totalDias = validExperimentos.reduce((acc, row) => {
    const startDate =
      typeof row["Início "] === "string" ? new Date(row["Início "]) : today;
    const diffDays = Math.max(
      0,
      Math.floor(
        (today.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)
      )
    );
    return acc + diffDays;
  }, 0);
  const mediaGeral =
    validExperimentos.length > 0
      ? Math.round(totalDias / validExperimentos.length)
      : 0;
  const mediaP = getMediaPorTamanho("P");
  const mediaM = getMediaPorTamanho("M");
  const mediaG = getMediaPorTamanho("G");
  return (
    <div className="p-8">
      <div className="flex items-center gap-3 mb-6">
        <BarChart3 className="w-8 h-8 text-[#d90429]" />
        <h1 className="text-2xl font-bold text-gray-800">
          Eficiência Operacional
        </h1>
      </div>
      {/* Card: Tempo Médio Experimento */}
      <div className="bg-white rounded-2xl shadow-lg p-6 mb-8 flex flex-col md:flex-row gap-8">
        <div className="flex-1">
          <h2 className="text-lg font-semibold text-gray-700 mb-2">
            Tempo Médio Experimento{" "}
            <span className="text-xs text-gray-400">(Leadtime)</span>
          </h2>
          {/* Placeholder para gráfico */}
          <div className="bg-gray-100 rounded-xl h-48 flex items-center justify-center text-gray-400">
            Gráfico Evolução Mensal
          </div>
        </div>
        <div className="flex flex-col items-center justify-center gap-4">
          <div className="bg-[#d90429] text-white rounded-full shadow-lg w-32 h-32 flex flex-col items-center justify-center text-2xl font-bold border-4 border-[#ffbaba]">
            Dias
            <br />
            {loading ? "..." : mediaGeral}
          </div>
          <div className="flex gap-2">
            <div className="bg-[#ffbaba] text-[#d90429] rounded-full w-16 h-16 flex flex-col items-center justify-center text-sm font-bold border-2 border-[#d90429]">
              P<br />
              {loading ? "..." : `${mediaP} dias`}
            </div>
            <div className="bg-[#ffbaba] text-[#d90429] rounded-full w-16 h-16 flex flex-col items-center justify-center text-sm font-bold border-2 border-[#d90429]">
              M<br />
              {loading ? "..." : `${mediaM} dias`}
            </div>
            <div className="bg-[#ffbaba] text-[#d90429] rounded-full w-16 h-16 flex flex-col items-center justify-center text-sm font-bold border-2 border-[#d90429]">
              G<br />
              {loading ? "..." : `${mediaG} dias`}
            </div>
          </div>
        </div>
        <div className="flex-1">
          <h3 className="text-md font-semibold text-gray-700 mb-2">
            Acompanhamento Meta de Leadtime
          </h3>
          <div className="bg-gray-100 rounded-xl p-4 mb-2">
            <span className="text-green-600 font-bold">-8%</span>{" "}
            <span className="text-xs text-gray-500">Evolução do Mês Atual</span>
            <br />
            <span className="text-xs text-gray-500">
              Atual = 25 Dias | Meta = 10 Dias
            </span>
          </div>
          <table className="w-full text-xs">
            <thead>
              <tr className="text-gray-500">
                <th className="text-left">Ranking</th>
                <th className="text-left">Ofensor</th>
                <th className="text-left">Dias</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>1º</td>
                <td>Aguardando Ambiente</td>
                <td>20</td>
              </tr>
              <tr>
                <td>2º</td>
                <td>Aguardando Financeiro</td>
                <td>20</td>
              </tr>
              <tr>
                <td>3º</td>
                <td>Ambiente</td>
                <td>20</td>
              </tr>
              <tr>
                <td>4º</td>
                <td>Financeiro</td>
                <td>20</td>
              </tr>
              <tr>
                <td>5º</td>
                <td>Aguardando qualquer Coisa</td>
                <td>10</td>
              </tr>
              <tr>
                <td>6º</td>
                <td>qualquer Coisa</td>
                <td>10</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
      {/* Card: Tempo Médio Piloto */}
      <div className="bg-white rounded-2xl shadow-lg p-6 flex flex-col md:flex-row gap-8">
        <div className="flex-1">
          <h2 className="text-lg font-semibold text-gray-700 mb-2">
            Tempo Médio Piloto{" "}
            <span className="text-xs text-gray-400">(Leadtime)</span>
          </h2>
          {/* Placeholder para gráfico */}
          <div className="bg-gray-100 rounded-xl h-48 flex items-center justify-center text-gray-400">
            Gráfico Evolução Mensal
          </div>
        </div>
        <div className="flex flex-col items-center justify-center gap-4">
          <div className="bg-[#ffb800] text-white rounded-full shadow-lg w-32 h-32 flex flex-col items-center justify-center text-2xl font-bold border-4 border-[#ffe7a3]">
            25
            <br />
            Dias
          </div>
          <div className="flex gap-2">
            <div className="bg-[#ffe7a3] text-[#ffb800] rounded-full w-16 h-16 flex flex-col items-center justify-center text-sm font-bold border-2 border-[#ffb800]">
              P<br />
              10 dias
            </div>
            <div className="bg-[#ffe7a3] text-[#ffb800] rounded-full w-16 h-16 flex flex-col items-center justify-center text-sm font-bold border-2 border-[#ffb800]">
              M<br />
              20 dias
            </div>
            <div className="bg-[#ffe7a3] text-[#ffb800] rounded-full w-16 h-16 flex flex-col items-center justify-center text-sm font-bold border-2 border-[#ffb800]">
              G<br />
              25 dias
            </div>
          </div>
        </div>
        <div className="flex-1">
          <h3 className="text-md font-semibold text-gray-700 mb-2">
            Acompanhamento Meta de Leadtime
          </h3>
          <div className="bg-gray-100 rounded-xl p-4 mb-2">
            <span className="text-red-600 font-bold">+12%</span>{" "}
            <span className="text-xs text-gray-500">Evolução do Mês Atual</span>
            <br />
            <span className="text-xs text-gray-500">
              Atual = 25 Dias | Meta = 10 Dias
            </span>
          </div>
          <table className="w-full text-xs">
            <thead>
              <tr className="text-gray-500">
                <th className="text-left">Ranking</th>
                <th className="text-left">Ofensor</th>
                <th className="text-left">Dias</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>1º</td>
                <td>Aguardando Ambiente</td>
                <td>20</td>
              </tr>
              <tr>
                <td>2º</td>
                <td>Aguardando Financeiro</td>
                <td>20</td>
              </tr>
              <tr>
                <td>3º</td>
                <td>Ambiente</td>
                <td>20</td>
              </tr>
              <tr>
                <td>4º</td>
                <td>Financeiro</td>
                <td>20</td>
              </tr>
              <tr>
                <td>5º</td>
                <td>Aguardando qualquer Coisa</td>
                <td>10</td>
              </tr>
              <tr>
                <td>6º</td>
                <td>qualquer Coisa</td>
                <td>10</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
