import React, { useState } from "react";
import { Info } from "lucide-react";
import { useExperimentos } from "@/hooks/useExperimentos";
import { BlinkingDot } from "@/components/experimentos/BlinkingDot";

const STATUS_COLUNAS = [
  "Backlog",
  "Prospecção",
  "Em andamento",
  "Concluído",
  "Piloto",
  "Escala",
];

const STATUS_COLORS: Record<string, string> = {
  Backlog: "#a3a3a3",
  Prospecção: "#eab308",
  "Em andamento": "#22c55e",
  Concluído: "#16a34a",
  Piloto: "#8b5cf6",
  Escala: "#0ea5e9",
};

const EsteiraDeDemandas = () => {
  const { data, loading } = useExperimentos();
  // Extrai todas as áreas únicas do backend
  const areas = Array.from(
    new Set(
      (data || [])
        .map((item) =>
          typeof item["Área"] === "string" ? item["Área"].trim() : null
        )
        .filter(Boolean)
    )
  );
  const [selectedArea, setSelectedArea] = useState<string | null>(null);

  // Agrupa iniciativas por status
  const iniciativasPorStatus: Record<string, any[]> = {};
  STATUS_COLUNAS.forEach((status) => {
    iniciativasPorStatus[status] = [];
  });
  // Filtra experimentos pela área selecionada
  const filteredData = selectedArea
    ? data.filter((item) => item["Área"] === selectedArea)
    : data;
  if (filteredData && Array.isArray(filteredData)) {
    filteredData.forEach((item) => {
      let statusRaw =
        item["Experimentação"] ||
        item["Piloto"] ||
        item["Status"] ||
        item["Classificação"] ||
        "Backlog";
      let status = typeof statusRaw === "string" ? statusRaw : "Backlog";
      // Se o campo 'Ideia / Problema / Oportunidade' contém 'prospecção', agrupa como 'Prospecção'
      if (
        typeof item["Ideia / Problema / Oportunidade"] === "string" &&
        item["Ideia / Problema / Oportunidade"]
          .toLowerCase()
          .includes("prospecção")
      ) {
        status = "Prospecção";
      } else if (
        typeof item["Experimentação"] === "string" &&
        [
          "concluido",
          "concluído",
          "concluido go/no go",
          "concluído go/no go",
          "concluido com pivot",
          "concluído com pivot",
        ].some((s) =>
          (item["Experimentação"] as string).toLowerCase().includes(s)
        )
      ) {
        status = "Concluído";
      } else if (
        typeof item["Piloto"] === "string" &&
        item["Piloto"].trim() !== ""
      ) {
        status = "Piloto";
      } else {
        // Normaliza para corresponder aos nomes das colunas
        status =
          STATUS_COLUNAS.find((col) =>
            status.toLowerCase().includes(col.toLowerCase())
          ) || "Backlog";
      }
      iniciativasPorStatus[status].push(item);
    });
  }

  return (
    <div className="flex h-screen">
      {/* Sidebar */}
      <aside className="w-64 bg-gradient-to-b from-red-700 to-red-900 text-white flex flex-col py-8 px-4 gap-2 shadow-xl rounded-r-2xl">
        <h2 className="text-2xl font-bold mb-6 tracking-tight">Áreas</h2>
        <div className="flex flex-col gap-2">
          <div
            className={`py-2 px-3 rounded-lg cursor-pointer text-base font-semibold flex items-center gap-2 transition-all duration-150 ${
              selectedArea === null ? "bg-red-800 shadow" : "hover:bg-red-800"
            }`}
            onClick={() => setSelectedArea(null)}
          >
            <Info className="w-4 h-4 opacity-70" /> Todas as áreas
            <span className="ml-auto bg-white/20 px-2 py-0.5 rounded text-xs">
              {data.length}
            </span>
          </div>
          {areas.map((area) => (
            <div
              key={area}
              className={`py-2 px-3 rounded-lg cursor-pointer text-base font-semibold flex items-center gap-2 transition-all duration-150 ${
                selectedArea === area ? "bg-red-800 shadow" : "hover:bg-red-800"
              }`}
              onClick={() => setSelectedArea(area)}
            >
              <span className="inline-block w-2 h-2 rounded-full bg-white/80 mr-2" />
              {area}
              <span className="ml-auto bg-white/20 px-2 py-0.5 rounded text-xs">
                {data.filter((item) => item["Área"] === area).length}
              </span>
            </div>
          ))}
        </div>
      </aside>
      {/* Esteira de Demandas */}
      <main className="flex-1 overflow-auto bg-gradient-to-b from-white to-gray-100 p-10">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-4xl font-extrabold text-red-700 tracking-tight mb-1">
              Esteira de Iniciativas
            </h1>
            <p className="text-lg text-gray-600 font-medium">
              Visão executiva das iniciativas por área e status
            </p>
          </div>
          <button className="bg-red-700 text-white px-5 py-2 rounded-lg font-bold shadow hover:bg-red-800 transition">
            Exportar Relatório
          </button>
        </div>
        <div className="flex gap-0">
          {STATUS_COLUNAS.map((status, idx) => (
            <React.Fragment key={status}>
              <div
                className="flex-1 min-w-[320px] bg-white rounded-2xl shadow-lg p-6 flex flex-col items-center justify-start"
                style={{ minHeight: "600px" }}
              >
                <div className="flex items-center gap-2 mb-4">
                  <span
                    className="inline-block w-3 h-3 rounded-full"
                    style={{ background: STATUS_COLORS[status] }}
                  />
                  <span className="font-bold text-xl text-red-700 tracking-tight">
                    {status}
                  </span>
                </div>
                <div className="grid grid-cols-3 gap-5 w-full">
                  {iniciativasPorStatus[status].length === 0 && (
                    <span className="text-xs text-gray-400 col-span-3 text-center py-8">
                      Nenhuma iniciativa
                    </span>
                  )}
                  {iniciativasPorStatus[status].map((item, idx) => (
                    <div
                      key={item._id || idx}
                      className="bg-gray-50 rounded-xl shadow hover:shadow-lg transition flex flex-col items-center py-4 px-2 group relative cursor-pointer border border-gray-200 hover:border-red-400"
                    >
                      <BlinkingDot color={STATUS_COLORS[status] || "#a3a3a3"} />
                      <span className="text-xs font-semibold text-gray-700 mt-2 text-center break-words max-w-[180px]">
                        {item["Iniciativa"] ||
                          item["Ideia / Problema / Oportunidade"] ||
                          "Sem nome"}
                      </span>
                      {/* Tooltip com detalhes rápidos */}
                      <div className="absolute left-1/2 -translate-x-1/2 bottom-2 z-10 hidden group-hover:flex flex-col items-start bg-white border border-gray-300 rounded-lg shadow-lg px-4 py-2 text-xs text-gray-700 min-w-[180px]">
                        <div>
                          <b>Área:</b> {item["Área"] || "-"}
                        </div>
                        <div>
                          <b>Status:</b> {status}
                        </div>
                        <div>
                          <b>Tempo na coluna:</b> {/* tempo calculado */}
                          {(() => {
                            const startDateRaw =
                              item["Início "] ||
                              item["Início"] ||
                              item["Data de Início"];
                            if (!startDateRaw) return "-";
                            const startDate = new Date(startDateRaw);
                            if (isNaN(startDate.getTime())) return "-";
                            const today = new Date();
                            const diffDays = Math.max(
                              0,
                              Math.floor(
                                (today.getTime() - startDate.getTime()) /
                                  (1000 * 60 * 60 * 24)
                              )
                            );
                            return `${diffDays} dias`;
                          })()}
                        </div>
                        {item["Prioridade"] && (
                          <div>
                            <b>Prioridade:</b> {item["Prioridade"]}
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
              {idx < STATUS_COLUNAS.length - 1 && (
                <div
                  className="border-r border-dotted mx-0 my-2"
                  style={{
                    height: "100%",
                    borderColor: "#e11d48",
                    borderWidth: "3px",
                  }}
                />
              )}
            </React.Fragment>
          ))}
        </div>
      </main>
    </div>
  );
};

export default EsteiraDeDemandas;
