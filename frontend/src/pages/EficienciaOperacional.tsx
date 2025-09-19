import React from "react";
import ExperimentLeadtimeMonthlyChart, {
  MonthlyLeadtimeData,
} from "@/components/charts/ExperimentLeadtimeMonthlyChart";
import { BarChart3 } from "lucide-react";
import { useExperimentos } from "@/hooks/useExperimentos";

export default function EficienciaOperacional() {
  // Meta realista de leadtime (em dias)
  const metaLeadtime = 45;
  // Função para agrupar experimentos por mês e calcular tempo médio (Experimentação)
  function getMonthlyLeadtime(): MonthlyLeadtimeData[] {
    const meses = [
      "Jan",
      "Fev",
      "Mar",
      "Abr",
      "Mai",
      "Jun",
      "Jul",
      "Ago",
      "Set",
      "Out",
      "Nov",
      "Dez",
    ];
    const byMonth: { [key: string]: number[] } = {};
    data.forEach((row) => {
      if (typeof row["Início "] === "string" && row["Início "]) {
        const startDate = new Date(row["Início "]);
        if (!isNaN(startDate.getTime())) {
          const month = meses[startDate.getMonth()];
          const year = startDate.getFullYear();
          const key = `${month}/${year}`;
          const days = Math.max(
            0,
            Math.floor(
              (today.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)
            )
          );
          if (!byMonth[key]) byMonth[key] = [];
          byMonth[key].push(days);
        }
      }
    });
    return Object.entries(byMonth)
      .map(([month, arr]) => {
        const sorted = arr.sort((a, b) => a - b);
        const n = Math.floor(sorted.length * 0.85);
        const diasParaMedia = sorted.slice(0, n > 0 ? n : 1);
        const avgDays =
          diasParaMedia.length > 0
            ? Math.round(
                diasParaMedia.reduce((acc, val) => acc + val, 0) /
                  diasParaMedia.length
              )
            : 0;
        return { month, avgDays };
      })
      .sort((a, b) => {
        const [mA, yA] = a.month.split("/");
        const [mB, yB] = b.month.split("/");
        if (yA !== yB) return Number(yA) - Number(yB);
        return meses.indexOf(mA) - meses.indexOf(mB);
      });
  }

  // Função para agrupar pilotos por mês e calcular tempo médio (Piloto)
  function getMonthlyLeadtimePiloto(): MonthlyLeadtimeData[] {
    const meses = [
      "Jan",
      "Fev",
      "Mar",
      "Abr",
      "Mai",
      "Jun",
      "Jul",
      "Ago",
      "Set",
      "Out",
      "Nov",
      "Dez",
    ];
    const byMonth: { [key: string]: number[] } = {};
    data.forEach((row) => {
      const inicio =
        row["Início Piloto"] ||
        row["Inicio Piloto"] ||
        row["Início"] ||
        row["inicio"] ||
        row["Início "];
      if (typeof inicio === "string" && inicio) {
        const startDate = new Date(inicio);
        if (!isNaN(startDate.getTime())) {
          const month = meses[startDate.getMonth()];
          const year = startDate.getFullYear();
          const key = `${month}/${year}`;
          const days = Math.max(
            0,
            Math.floor(
              (today.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)
            )
          );
          if (!byMonth[key]) byMonth[key] = [];
          byMonth[key].push(days);
        }
      }
    });
    return Object.entries(byMonth)
      .map(([month, arr]) => {
        const sorted = arr.sort((a, b) => a - b);
        const n = Math.floor(sorted.length * 0.85);
        const diasParaMedia = sorted.slice(0, n > 0 ? n : 1);
        const avgDays =
          diasParaMedia.length > 0
            ? Math.round(
                diasParaMedia.reduce((acc, val) => acc + val, 0) /
                  diasParaMedia.length
              )
            : 0;
        return { month, avgDays };
      })
      .sort((a, b) => {
        const [mA, yA] = a.month.split("/");
        const [mB, yB] = b.month.split("/");
        if (yA !== yB) return Number(yA) - Number(yB);
        return meses.indexOf(mA) - meses.indexOf(mB);
      });
  }
  const { data, loading } = useExperimentos();
  const today = new Date();
  // Função para calcular tempo médio por tamanho usando percentil 85% considerando apenas experimentos em andamento
  function getMediaPorTamanhoAndamento(tamanho: "P" | "M" | "G") {
    const filtered = data.filter((row) => {
      // Tolerância para campo tamanho
      const rowTamanho = (row.tamanho || row["Tamanho do Experimento"] || "")
        .toString()
        .trim()
        .toUpperCase();
      // Tolerância para campo início
      const inicio =
        row["Início "] || row["Inicio"] || row["Início"] || row["inicio"];
      // Tolerância para status
      const status = (row["Experimentação"] || "").toString().toLowerCase();
      return (
        rowTamanho === tamanho &&
        typeof inicio === "string" &&
        inicio.trim() !== "" &&
        !isNaN(new Date(inicio).getTime()) &&
        status.includes("andamento")
      );
    });
    const diasArray = filtered.map((row) => {
      const inicio =
        row["Início "] || row["Inicio"] || row["Início"] || row["inicio"];
      const startDate = typeof inicio === "string" ? new Date(inicio) : today;
      return Math.max(
        0,
        Math.floor(
          (today.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)
        )
      );
    });
    const diasOrdenados = diasArray.sort((a, b) => a - b);
    const percentil = 0.85;
    const n = Math.floor(diasOrdenados.length * percentil);
    const diasParaMedia = diasOrdenados.slice(0, n > 0 ? n : 1);
    return diasParaMedia.length > 0
      ? Math.round(
          diasParaMedia.reduce((acc, val) => acc + val, 0) /
            diasParaMedia.length
        )
      : 0;
  }
  // Tempo médio geral usando percentil 85%
  const validExperimentos = data.filter(
    (row) =>
      typeof row["Início "] === "string" &&
      row["Início "] &&
      !isNaN(new Date(row["Início "]).getTime())
  );
  const diasArrayGeral = validExperimentos.map((row) => {
    const startDate =
      typeof row["Início "] === "string" ? new Date(row["Início "]) : today;
    return Math.max(
      0,
      Math.floor(
        (today.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)
      )
    );
  });
  const diasOrdenadosGeral = diasArrayGeral.sort((a, b) => a - b);
  const percentilGeral = 0.85;
  const nGeral = Math.floor(diasOrdenadosGeral.length * percentilGeral);
  const diasParaMediaGeral = diasOrdenadosGeral.slice(
    0,
    nGeral > 0 ? nGeral : 1
  );
  const mediaGeral =
    diasParaMediaGeral.length > 0
      ? Math.round(
          diasParaMediaGeral.reduce((acc, val) => acc + val, 0) /
            diasParaMediaGeral.length
        )
      : 0;
  // Médias considerando apenas experimentos em andamento (Experimentação)
  const mediaP = getMediaPorTamanhoAndamento("P");
  const mediaM = getMediaPorTamanhoAndamento("M");
  const mediaG = getMediaPorTamanhoAndamento("G");

  // Função para calcular tempo médio por tamanho usando percentil 85% considerando apenas pilotos em andamento
  function getMediaPorTamanhoPiloto(tamanho: "P" | "M" | "G") {
    const filtered = data.filter((row) => {
      // Tolerância para campo tamanho
      const rowTamanho = (
        row.tamanho ||
        row["Tamanho do Piloto"] ||
        row["Tamanho do Experimento"] ||
        ""
      )
        .toString()
        .trim()
        .toUpperCase();
      // Tolerância para campo início
      const inicio =
        row["Início Piloto"] ||
        row["Inicio Piloto"] ||
        row["Início"] ||
        row["inicio"] ||
        row["Início "];
      // Tolerância para status
      const status = (row["Piloto"] || "").toString().toLowerCase();
      return (
        rowTamanho === tamanho &&
        typeof inicio === "string" &&
        inicio.trim() !== "" &&
        !isNaN(new Date(inicio).getTime()) &&
        status.includes("andamento")
      );
    });
    const diasArray = filtered.map((row) => {
      const inicio =
        row["Início Piloto"] ||
        row["Inicio Piloto"] ||
        row["Início"] ||
        row["inicio"] ||
        row["Início "];
      const startDate = typeof inicio === "string" ? new Date(inicio) : today;
      return Math.max(
        0,
        Math.floor(
          (today.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)
        )
      );
    });
    const diasOrdenados = diasArray.sort((a, b) => a - b);
    const percentil = 0.85;
    const n = Math.floor(diasOrdenados.length * percentil);
    const diasParaMedia = diasOrdenados.slice(0, n > 0 ? n : 1);
    return diasParaMedia.length > 0
      ? Math.round(
          diasParaMedia.reduce((acc, val) => acc + val, 0) /
            diasParaMedia.length
        )
      : 0;
  }

  // Tempo médio geral Piloto usando percentil 85%
  const validPilotos = data.filter((row) => {
    const inicio =
      row["Início Piloto"] ||
      row["Inicio Piloto"] ||
      row["Início"] ||
      row["inicio"] ||
      row["Início "];
    return (
      typeof inicio === "string" && inicio && !isNaN(new Date(inicio).getTime())
    );
  });
  const diasArrayPilotoGeral = validPilotos.map((row) => {
    const inicio =
      row["Início Piloto"] ||
      row["Inicio Piloto"] ||
      row["Início"] ||
      row["inicio"] ||
      row["Início "];
    const startDate = typeof inicio === "string" ? new Date(inicio) : today;
    return Math.max(
      0,
      Math.floor(
        (today.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)
      )
    );
  });
  const diasOrdenadosPilotoGeral = diasArrayPilotoGeral.sort((a, b) => a - b);
  const percentilPilotoGeral = 0.85;
  const nPilotoGeral = Math.floor(
    diasOrdenadosPilotoGeral.length * percentilPilotoGeral
  );
  const diasParaMediaPilotoGeral = diasOrdenadosPilotoGeral.slice(
    0,
    nPilotoGeral > 0 ? nPilotoGeral : 1
  );
  const mediaPilotoGeral =
    diasParaMediaPilotoGeral.length > 0
      ? Math.round(
          diasParaMediaPilotoGeral.reduce((acc, val) => acc + val, 0) /
            diasParaMediaPilotoGeral.length
        )
      : 0;
  // Médias considerando apenas pilotos em andamento
  const mediaPilotoP = getMediaPorTamanhoPiloto("P");
  const mediaPilotoM = getMediaPorTamanhoPiloto("M");
  const mediaPilotoG = getMediaPorTamanhoPiloto("G");
  // Evolução do mês atual: diferença percentual entre média e meta
  const evolucaoPercentual =
    mediaGeral && metaLeadtime
      ? Math.round(((mediaGeral - metaLeadtime) / metaLeadtime) * 100)
      : 0;
  return (
    <div className="p-8 bg-gradient-to-br from-gray-50 to-white min-h-screen">
      <div className="flex items-center gap-4 mb-8">
        <div className="bg-lab-primary/10 rounded-full p-3 flex items-center justify-center">
          <BarChart3 className="w-10 h-10 text-lab-primary" />
        </div>
        <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight">
          Eficiência Operacional
        </h1>
      </div>
      {/* Cards em linhas separadas para melhor organização */}
      <div className="flex flex-col gap-8">
        {/* Nova linha: Percentual de Alocação e Capacity */}
        <div className="flex flex-col md:flex-row gap-8">
          {/* Percentual de Alocação Gauge Chart */}
          <div className="bg-gray-100 rounded-2xl shadow-lg p-6 flex-1 flex flex-col items-center justify-center min-w-[320px]">
            <h3 className="text-sm font-semibold text-gray-600 mb-2">
              Percentual de Alocação
            </h3>
            {/* Gauge chart SVG */}
            <svg width="180" height="120" viewBox="0 0 180 120">
              <path
                d="M20,100 A80,80 0 0,1 160,100"
                fill="none"
                stroke="#e11d48"
                strokeWidth="18"
              />
              <path
                d="M40,100 A60,60 0 0,1 140,100"
                fill="none"
                stroke="#facc15"
                strokeWidth="18"
              />
              <path
                d="M60,100 A40,40 0 0,1 120,100"
                fill="none"
                stroke="#22c55e"
                strokeWidth="18"
              />
              {/* Needle */}
              <line
                x1="90"
                y1="100"
                x2="90"
                y2="40"
                stroke="#222"
                strokeWidth="4"
              />
              {/* Center circle */}
              <circle
                cx="90"
                cy="100"
                r="8"
                fill="#fff"
                stroke="#ccc"
                strokeWidth="2"
              />
              {/* Texts */}
              <text
                x="90"
                y="60"
                textAnchor="middle"
                fontSize="18"
                fontWeight="bold"
                fill="#e11d48"
              >
                85%
              </text>
              <text
                x="40"
                y="80"
                fontSize="12"
                fill="#e11d48"
                textAnchor="middle"
              >
                Até 20/09/2025
              </text>
              <text
                x="90"
                y="115"
                fontSize="12"
                fill="#222"
                textAnchor="middle"
              >
                Hoje
              </text>
              <text
                x="140"
                y="80"
                fontSize="12"
                fill="#22c55e"
                textAnchor="middle"
              >
                Em 10/10/2025
              </text>
              <text
                x="90"
                y="35"
                fontSize="14"
                fill="#facc15"
                textAnchor="middle"
              >
                50%
              </text>
            </svg>
          </div>
          {/* Capacity Table */}
          <div className="bg-gray-100 rounded-2xl shadow-lg p-6 flex-1 min-w-[320px]">
            <h3 className="text-sm font-semibold text-gray-600 mb-2">
              Capacity
            </h3>
            <table className="w-full text-xs rounded-xl overflow-hidden">
              <thead>
                <tr className="bg-gray-200 text-gray-600">
                  <th className="text-left px-2 py-1">Nome</th>
                  <th className="text-left px-2 py-1">
                    Experimentos Em Andamento
                  </th>
                  <th className="text-left px-2 py-1">Previsão de Liberação</th>
                </tr>
              </thead>
              <tbody>
                {/* Exemplo de dados, pode ser substituído por dados reais */}
                {[
                  { nome: "joao", andamento: 2, previsao: "10/10/2025" },
                  { nome: "maria", andamento: 1, previsao: "12/10/2025" },
                  { nome: "alberta", andamento: 2, previsao: "01/01/2025" },
                  { nome: "americo", andamento: 0, previsao: "02/02/2024" },
                  { nome: "amelia", andamento: 0, previsao: "02/02/2024" },
                ].map((row, idx) => (
                  <tr key={row.nome} className="border-b border-gray-200">
                    <td className="px-2 py-1 font-medium text-gray-700">
                      {row.nome}
                    </td>
                    <td className="px-2 py-1">
                      <div
                        className={`w-full h-5 rounded ${
                          row.andamento > 0 ? "bg-red-200" : "bg-gray-100"
                        } flex items-center justify-center`}
                      >
                        <span
                          className={`font-bold text-red-600 ${
                            row.andamento === 0 ? "text-gray-400" : ""
                          }`}
                        >
                          {row.andamento}
                        </span>
                      </div>
                    </td>
                    <td className="px-2 py-1 text-gray-700">{row.previsao}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
        {/* Linha 1: Tempo Médio Experimento */}
        <div className="bg-white rounded-2xl shadow-xl p-6 flex flex-col md:flex-row gap-8 border border-gray-100">
          <div className="flex-1 flex flex-col justify-between">
            <div className="flex items-center gap-2 mb-4">
              <BarChart3 className="w-6 h-6 text-lab-primary" />
              <h2 className="text-lg font-bold text-gray-800">
                Tempo Médio Experimento{" "}
                <span className="text-xs text-gray-400 font-normal">
                  (Leadtime)
                </span>
              </h2>
            </div>
            <div className="bg-gray-50 rounded-xl h-56 flex items-center justify-center">
              {loading ? (
                <span className="text-gray-400">Carregando...</span>
              ) : (
                <div className="w-full">
                  <ExperimentLeadtimeMonthlyChart data={getMonthlyLeadtime()} />
                  <div className="mt-2 text-xs text-gray-500 text-center flex items-center justify-center gap-1">
                    <span className="inline-block bg-gray-200 rounded-full px-2 py-0.5 text-[10px] font-medium text-gray-700">
                      Lógica
                    </span>
                    O tempo médio é calculado pelo percentil 85% dos
                    experimentos iniciados em cada mês, excluindo os 15% mais
                    demorados para evitar distorções.
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
        {/* Linha 2: Indicador Geral + Evolução do Mês Atual */}
        <div className="flex flex-col md:flex-row gap-8">
          {/* Indicador Geral */}

          <div className="flex-1 bg-white rounded-2xl shadow-xl p-6 border border-gray-100 flex flex-col items-center justify-center">
            <div className="relative mb-4 group">
              <div
                className="bg-gradient-to-br from-red-500 via-red-400 to-red-600 text-white rounded-full shadow-2xl w-36 h-36 flex flex-col items-center justify-center text-4xl font-extrabold border-4 border-red-200 transition-all duration-300 hover:scale-105 hover:shadow-red-300 animate-fade-in"
                style={{ boxShadow: "0 8px 32px 0 rgba(225,29,72,0.18)" }}
              >
                <span className="text-lg font-semibold tracking-wide drop-shadow-sm">
                  Dias
                </span>
                <span className="mt-2 drop-shadow-lg">
                  {loading ? "..." : mediaGeral}
                </span>
                {mediaGeral <= metaLeadtime ? (
                  <span
                    className="absolute top-2 right-2 text-green-500"
                    title="Meta atingida"
                  >
                    ✔️
                  </span>
                ) : (
                  <span
                    className="absolute top-2 right-2 cursor-pointer"
                    title="Meta não atingida"
                  >
                    <svg
                      width="28"
                      height="28"
                      viewBox="0 0 28 28"
                      fill="none"
                      xmlns="http://www.w3.org/2000/svg"
                      style={{
                        display: "inline",
                        verticalAlign: "middle",
                        filter: "drop-shadow(0 2px 6px rgba(255,0,0,0.18))",
                      }}
                    >
                      <circle
                        cx="14"
                        cy="14"
                        r="13"
                        fill="#fff3f3"
                        stroke="#e11d48"
                        strokeWidth="2"
                      />
                      <path
                        d="M14 8V15"
                        stroke="#e11d48"
                        strokeWidth="2.2"
                        strokeLinecap="round"
                      />
                      <circle cx="14" cy="19" r="1.5" fill="#e11d48" />
                    </svg>
                    <span className="absolute -top-8 right-0 bg-white text-red-600 text-xs font-semibold px-2 py-1 rounded shadow-lg opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none">
                      Atenção: Meta não atingida
                    </span>
                  </span>
                )}
              </div>
            </div>
            <div className="flex gap-4 mt-4 justify-center">
              {[
                { label: "P", value: mediaP },
                { label: "M", value: mediaM },
                { label: "G", value: mediaG },
              ].map(({ label, value }, idx) => (
                <div
                  key={label}
                  className="relative bg-white/30 backdrop-blur-md text-lab-primary rounded-full w-20 h-20 flex flex-col items-center justify-center text-base font-bold border-2 border-lab-primary shadow-md transition-all duration-300 hover:scale-105 hover:shadow-lg hover:bg-white/60"
                  style={{ boxShadow: "0 4px 16px 0 rgba(225,29,72,0.10)" }}
                >
                  <span className="text-sm font-extrabold tracking-wide mb-1 drop-shadow-sm">
                    {label}
                  </span>
                  <span className="text-xs font-medium drop-shadow-lg">
                    {loading ? "..." : `${value} dias`}
                  </span>
                  <span className="absolute -bottom-6 left-1/2 -translate-x-1/2 text-xs text-gray-400 opacity-0 transition-opacity duration-200 pointer-events-none group-hover:opacity-100">
                    Média {label}
                  </span>
                </div>
              ))}
            </div>
          </div>
          {/* Evolução do Mês Atual */}
          <div className="flex-1 bg-white rounded-2xl shadow-xl p-6 border border-gray-100 flex flex-col justify-between">
            <h3 className="text-md font-bold text-gray-800 mb-2 flex items-center gap-2">
              <span
                className={
                  evolucaoPercentual <= 0
                    ? "bg-green-100 text-green-700"
                    : "bg-red-100 text-red-700"
                }
                style={{
                  borderRadius: "6px",
                  padding: "2px 8px",
                  fontWeight: 600,
                }}
              >
                {evolucaoPercentual > 0 ? "+" : ""}
                {evolucaoPercentual}%
              </span>
              Evolução do Mês Atual
            </h3>
            <div className="text-xs text-gray-500 mb-2">
              Atual = {loading ? "..." : `${mediaGeral} Dias`} | Meta ={" "}
              {metaLeadtime} Dias
            </div>
            <table className="w-full text-xs mt-2">
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
        {/* Linha 3: Tempo Médio Piloto - Novo layout igual ao de cima */}
        <div className="bg-white rounded-2xl shadow-xl p-6 flex flex-col gap-8 border border-gray-100">
          {/* Gráfico mensal Piloto */}
          <div className="flex-1 flex flex-col justify-between">
            <div className="flex items-center gap-2 mb-4">
              <BarChart3 className="w-6 h-6 text-[#ffb800]" />
              <h2 className="text-lg font-bold text-gray-800">
                Tempo Médio Piloto{" "}
                <span className="text-xs text-gray-400 font-normal">
                  (Leadtime)
                </span>
              </h2>
            </div>
            <div className="bg-gray-50 rounded-xl h-56 flex items-center justify-center">
              {loading ? (
                <span className="text-gray-400">Carregando...</span>
              ) : (
                <div className="w-full">
                  <ExperimentLeadtimeMonthlyChart
                    data={getMonthlyLeadtimePiloto()}
                  />
                  <div className="mt-2 text-xs text-gray-500 text-center flex items-center justify-center gap-1">
                    <span className="inline-block bg-gray-200 rounded-full px-2 py-0.5 text-[10px] font-medium text-gray-700">
                      Lógica
                    </span>
                    O tempo médio é calculado pelo percentil 85% dos pilotos
                    iniciados em cada mês, excluindo os 15% mais demorados para
                    evitar distorções.
                  </div>
                </div>
              )}
            </div>
          </div>
          {/* Cards lado a lado */}
          <div className="flex flex-col md:flex-row gap-8">
            {/* Indicador Geral Piloto */}
            <div className="flex-1 bg-white rounded-2xl shadow-xl p-6 border border-gray-100 flex flex-col items-center justify-center">
              <div className="relative mb-4 group">
                <div
                  className="bg-gradient-to-br from-yellow-400 via-yellow-300 to-yellow-500 text-white rounded-full shadow-2xl w-36 h-36 flex flex-col items-center justify-center text-4xl font-extrabold border-4 border-yellow-200 transition-all duration-300 hover:scale-105 hover:shadow-yellow-300 animate-fade-in"
                  style={{ boxShadow: "0 8px 32px 0 rgba(255,184,0,0.18)" }}
                >
                  <span className="text-lg font-semibold tracking-wide drop-shadow-sm">
                    Dias
                  </span>
                  <span className="mt-2 drop-shadow-lg">
                    {loading ? "..." : mediaPilotoGeral}
                  </span>
                  {mediaPilotoGeral <= 10 ? (
                    <span
                      className="absolute top-2 right-2 text-green-500"
                      title="Meta atingida"
                    >
                      ✔️
                    </span>
                  ) : (
                    <span
                      className="absolute top-2 right-2 cursor-pointer"
                      title="Meta não atingida"
                    >
                      <svg
                        width="28"
                        height="28"
                        viewBox="0 0 28 28"
                        fill="none"
                        xmlns="http://www.w3.org/2000/svg"
                        style={{
                          display: "inline",
                          verticalAlign: "middle",
                          filter: "drop-shadow(0 2px 6px rgba(255,184,0,0.18))",
                        }}
                      >
                        <circle
                          cx="14"
                          cy="14"
                          r="13"
                          fill="#fffbe5"
                          stroke="#ffb800"
                          strokeWidth="2"
                        />
                        <path
                          d="M14 8V15"
                          stroke="#ffb800"
                          strokeWidth="2.2"
                          strokeLinecap="round"
                        />
                        <circle cx="14" cy="19" r="1.5" fill="#ffb800" />
                      </svg>
                      <span className="absolute -top-8 right-0 bg-white text-yellow-600 text-xs font-semibold px-2 py-1 rounded shadow-lg opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none">
                        Atenção: Meta não atingida
                      </span>
                    </span>
                  )}
                </div>
              </div>
              <div className="flex gap-4 mt-4 justify-center">
                {[
                  { label: "P", value: mediaPilotoP },
                  { label: "M", value: mediaPilotoM },
                  { label: "G", value: mediaPilotoG },
                ].map(({ label, value }, idx) => (
                  <div
                    key={label}
                    className="relative bg-white/30 backdrop-blur-md text-[#ffb800] rounded-full w-20 h-20 flex flex-col items-center justify-center text-base font-bold border-2 border-[#ffb800] shadow-md transition-all duration-300 hover:scale-105 hover:shadow-lg hover:bg-white/60"
                    style={{ boxShadow: "0 4px 16px 0 rgba(255,184,0,0.10)" }}
                  >
                    <span className="text-sm font-extrabold tracking-wide mb-1 drop-shadow-sm">
                      {label}
                    </span>
                    <span className="text-xs font-medium drop-shadow-lg">
                      {loading ? "..." : `${value} dias`}
                    </span>
                    <span className="absolute -bottom-6 left-1/2 -translate-x-1/2 text-xs text-gray-400 opacity-0 transition-opacity duration-200 pointer-events-none group-hover:opacity-100">
                      Média {label}
                    </span>
                  </div>
                ))}
              </div>
            </div>
            {/* Evolução do Mês Atual Piloto */}
            <div className="flex-1 bg-white rounded-2xl shadow-xl p-6 border border-gray-100 flex flex-col justify-between">
              <h3 className="text-md font-bold text-gray-800 mb-2 flex items-center gap-2">
                <span
                  className={
                    mediaPilotoGeral > 10
                      ? "bg-yellow-100 text-yellow-700"
                      : "bg-green-100 text-green-700"
                  }
                  style={{
                    borderRadius: "6px",
                    padding: "2px 8px",
                    fontWeight: 600,
                  }}
                >
                  {mediaPilotoGeral > 10 ? "+" : ""}
                  {loading
                    ? "..."
                    : `${Math.round(((mediaPilotoGeral - 10) / 10) * 100)}%`}
                </span>
                Evolução do Mês Atual
              </h3>
              <div className="text-xs text-gray-500 mb-2">
                Atual = {loading ? "..." : `${mediaPilotoGeral} Dias`} | Meta =
                10 Dias
              </div>
              <table className="w-full text-xs mt-2">
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
      </div>
    </div>
  );
}
