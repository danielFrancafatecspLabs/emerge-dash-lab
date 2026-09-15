// Mapeamento de iniciativa para statusPiloto (igual PilotosEmAndamento)
const statusPilotoMap = {
  "Gen Ia Formulários  (Onboarding / Offboarding)": "2.3 GO / NOGO",
  "Análise de chamadas de Call Center ( Speech do Futuro) ( Alarme Situcional )":
    "2.2.2 HLE",
  "Busca Avançada (TV)": "2.0 - EXECUÇÃO PILOTO",
  "Ura Cognitiva": "2.5 - ROLL-OUT",
  "Copiloto de Atendimeto": "2.5 - ROLL-OUT",
  "Copiloto Atendimento": "2.5 - ROLL-OUT",
  "Copilot Atendimento": "2.5 - ROLL-OUT",
  "Copilot de Atendimento": "2.5 - ROLL-OUT",
  "URA e Call Center Cognitivo": "2.5 - ROLL-OUT",
  "Consulta de pareceres jurídicos (JurisQuery)": "2.0 - EXECUÇÃO PILOTO",
  "M365 ( CoPilot)": "2.0 - EXECUÇÃO PILOTO",
};

function getStatusPiloto(item) {
  if (
    typeof item["Iniciativa"] === "string" &&
    item["Iniciativa"].trim() === "Agente de IA para Colaboradores"
  ) {
    return "-";
  }
  let statusPiloto = "";
  if (typeof item["Iniciativa"] === "string") {
    statusPiloto = statusPilotoMap[item["Iniciativa"].trim()] || "";
    if (!statusPiloto) {
      const iniNorm = item["Iniciativa"].trim().toLowerCase();
      for (const key in statusPilotoMap) {
        if (iniNorm.includes(key.trim().toLowerCase())) {
          statusPiloto = statusPilotoMap[key];
          break;
        }
      }
    }
    if (!statusPiloto && typeof item["statusPiloto"] === "string") {
      statusPiloto = item["statusPiloto"];
    }
  }
  return statusPiloto || "-";
}
import React, { useState, useMemo } from "react";
import {
  Briefcase,
  CheckCircle2,
  Hourglass,
  XCircle,
  Lightbulb,
  Rocket,
  Users,
  AlertTriangle,
  ClipboardList,
  SlidersHorizontal,
  Search,
} from "lucide-react";
import { Input } from "../components/ui/input";
import { ExperimentTable } from "../components/experimentos/ExperimentTable";
import { ExperimentDetailCard } from "../components/experimentos/ExperimentDetailCard";
import { BlinkingDot } from "../components/experimentos/BlinkingDot";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "../components/ui/dialog";
import { ExperimentNewModal } from "../components/experimentos/ExperimentNewModal";
import { useExperimentos } from "@/hooks/useExperimentos";

// Constantes e Mapeamentos
const BOARD_ICONS = {
  Backlog: <ClipboardList className="w-6 h-6 text-gray-400" />,
  "Em prospecção": <Lightbulb className="w-6 h-6 text-blue-500" />,
  "Em planejamento": <Hourglass className="w-6 h-6 text-yellow-500" />,
  "Em refinamento": <Rocket className="w-6 h-6 text-purple-500" />,
  "Em andamento": <Briefcase className="w-6 h-6 text-green-500" />,
  "Em validação": <CheckCircle2 className="w-6 h-6 text-indigo-500" />,
  Bloqueado: <AlertTriangle className="w-6 h-6 text-orange-500" />,
  Cancelado: <XCircle className="w-6 h-6 text-red-500" />,
  "Itens concluídos": <CheckCircle2 className="w-6 h-6 text-emerald-500" />,
};

// Funções Auxiliares (movidas para fora dos componentes)
const normalize = (str) => str.normalize("NFD").replace(/[\u0300-\u036f]/g, "");

// Componente para a data e dias na coluna
const ColumnDays = ({ item }) => {
  const getDaysInColumn = (experiment) => {
    const dateFields = ["Data de início", "Início ", "Data de Início"];
    let startDateStr = "";
    for (const field of dateFields) {
      if (
        experiment[field] &&
        typeof experiment[field] === "string" &&
        experiment[field] !== ""
      ) {
        startDateStr = experiment[field];
        break;
      }
    }
    if (startDateStr) {
      const startDate = new Date(startDateStr);
      const now = new Date();
      const diffTime = Math.abs(now.getTime() - startDate.getTime());
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      return diffDays;
    }
    return 0;
  };

  const days = getDaysInColumn(item);

  return (
    <div className="flex items-center gap-1 text-xs text-gray-700">
      {days > 0 ? (
        <>
          <svg
            width="14"
            height="14"
            viewBox="0 0 24 24"
            fill="none"
            stroke="#7a0019"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="lucide lucide-calendar w-3 h-3"
          >
            <rect x="3" y="4" width="18" height="18" rx="2" />
            <line x1="16" y1="2" x2="16" y2="6" />
            <line x1="8" y1="2" x2="8" y2="6" />
            <line x1="3" y1="10" x2="21" y2="10" />
          </svg>
          <span>{days} dias na coluna</span>
        </>
      ) : (
        <span className="text-[10px] text-red-500">Sem data</span>
      )}
    </div>
  );
};

// Componente para os dots de tempo
const TimeDots = ({ item }) => {
  const getDaysInColumn = (experiment) => {
    const dateFields = ["Data de início", "Início ", "Data de Início"];
    let startDateStr = "";
    for (const field of dateFields) {
      if (
        experiment[field] &&
        typeof experiment[field] === "string" &&
        experiment[field] !== ""
      ) {
        startDateStr = experiment[field];
        break;
      }
    }
    if (startDateStr) {
      const startDate = new Date(startDateStr);
      const now = new Date();
      const diffTime = Math.abs(now.getTime() - startDate.getTime());
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      return diffDays;
    }
    return 0;
  };

  const days = getDaysInColumn(item);
  const dotColor = days > 45 ? "bg-red-500" : "bg-green-500";
  const showDots = days > 0;

  if (!showDots) return null;

  return (
    <span className="flex gap-1 items-center ml-2">
      {[...Array(3)].map((_, i) => (
        <span
          key={i}
          className={`w-3 h-3 rounded-full ${dotColor} border border-white shadow-sm inline-block`}
          style={{ boxShadow: "0 0 0 2px #eab308" }}
        />
      ))}
    </span>
  );
};

// Componente BoardDofa
const BOARD_COLUMNS = [
  { key: "Backlog", label: "Backlog", color: "bg-white" },
  { key: "Em prospecção", label: "Em prospecção", color: "bg-white" },
  { key: "Em planejamento", label: "Em planejamento", color: "bg-white" },
  { key: "Em refinamento", label: "Em refinamento", color: "bg-white" },
  { key: "Em andamento", label: "Em andamento", color: "bg-white" },
  { key: "Em validação", label: "Em validação", color: "bg-white" },
  { key: "Bloqueado", label: "Bloqueado", color: "bg-white" },
  { key: "Cancelado", label: "Cancelado", color: "bg-white" },
  { key: "Itens concluídos", label: "Itens concluídos", color: "bg-white" },
];

function BoardDofa({ onCardClick }) {
  const { data } = useExperimentos();

  const groupedData = useMemo(() => {
    if (!data) return {};
    return data.reduce((acc, item) => {
      const statusKey = item.Experimentação || "Outros";
      const normalizedKey = normalize(statusKey);
      if (!acc[normalizedKey]) {
        acc[normalizedKey] = [];
      }
      acc[normalizedKey].push(item);
      return acc;
    }, {});
  }, [data]);

  if (!data) return <div>Carregando...</div>;

  return (
    <div className="flex gap-3 overflow-x-auto p-4 min-h-screen bg-[#f7f7f7]">
      {BOARD_COLUMNS.map((col) => (
        <div
          key={col.key}
          className={`min-w-[220px] w-[220px] flex-shrink-0 ${col.color} rounded-xl border border-gray-200 transition-transform hover:scale-[1.01] animate-fade-in shadow-sm`}
        >
          <div className="flex items-center justify-between px-4 pt-4 pb-2">
            <div className="flex items-center gap-2">
              {BOARD_ICONS[col.key]}
              <span className="text-base font-semibold text-[#222]">
                {col.label}
              </span>
            </div>
          </div>
          <div className="flex flex-col gap-2 p-2">
            {(groupedData[normalize(col.key)] || []).map((item, index) => (
              <div
                key={index}
                className="p-3 bg-white rounded-lg shadow-sm cursor-pointer hover:shadow-md transition-shadow border border-gray-100"
                onClick={() => onCardClick(item)}
              >
                <div className="flex items-start justify-between">
                  <h3 className="text-sm font-semibold mb-1 text-[#222]">
                    {item.Título || item.Nome || item.Iniciativa || "Sem nome"}
                  </h3>
                  <div className="flex items-center gap-1">
                    {item["Status"] === "Concluído" && (
                      <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                    )}
                    {item["Status"] === "Bloqueado" && (
                      <AlertTriangle className="w-4 h-4 text-orange-500" />
                    )}
                    {item["Status"] === "Cancelado" && (
                      <XCircle className="w-4 h-4 text-red-500" />
                    )}
                  </div>
                </div>
                <div className="flex flex-col gap-1 mt-2">
                  <ColumnDays item={item} />
                  <TimeDots item={item} />
                </div>
              </div>
            ))}
          </div>
        </div>
      ))}
      <style>{`
        @keyframes fade-in {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-fade-in { animation: fade-in 0.8s ease; }
      `}</style>
    </div>
  );
}

// Componente Principal

import { ExperimentEditModal } from "../components/experimentos/ExperimentEditModal";

export default function ListaDeExperimentos() {
  const { data: originalData } = useExperimentos();
  const [data, setData] = useState([]);
  const [filtered, setFiltered] = useState([]);

  // Atualiza os dados quando originalData muda
  React.useEffect(() => {
    if (originalData && Array.isArray(originalData)) {
      // Mapear todos os dados para o formato de exibição
      const mappedData = originalData.map(item => mapServerDataToDisplay(item));
      setData(mappedData);
      setFiltered(mappedData);
      console.log("Dados carregados e mapeados:", mappedData);
    }
  }, [originalData]);
  const [boardView, setBoardView] = useState(false);
  const [selectedExperiment, setSelectedExperiment] = useState(null);
  const [hiddenColumns, setHiddenColumns] = useState([]);
  const [search, setSearch] = useState("");
  const [showColManager, setShowColManager] = useState(false);
  const [showNewModal, setShowNewModal] = useState(false);
  const [newExpData, setNewExpData] = useState({});
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [editData, setEditData] = useState(null);

  const columns = useMemo(() => {
    if (!data || data.length === 0) return [];
    const baseCols = Object.keys(data[0]).filter(
      (col) => col !== "_id" && col !== "id" && !hiddenColumns.includes(col)
    );
    // Garante que 'Tamanho do Experimento' sempre aparece
    if (!baseCols.includes("Tamanho do Experimento")) {
      baseCols.push("Tamanho do Experimento");
    }
    // Garante que 'Desenvolvedor Resp.' sempre aparece
    if (!baseCols.includes("Desenvolvedor Resp.")) {
      baseCols.push("Desenvolvedor Resp.");
    }
    // Adiciona a coluna statusPiloto se houver algum experimento em piloto
    const hasPiloto = data.some(
      (item) =>
        typeof item["Piloto"] === "string" && item["Piloto"].trim() !== ""
    );
    if (hasPiloto && !baseCols.includes("statusPiloto")) {
      baseCols.push("statusPiloto");
    }
    return baseCols;
  }, [data, hiddenColumns]);

  const filteredData = useMemo(() => {
    if (!search || !data)
      return filtered
        ? filtered.map((item) => ({ ...item, Sinal: item.Sinal || item["#"] }))
        : [];
    const q = search.toLowerCase();
    return filtered
      .map((item) => ({ ...item, Sinal: item.Sinal || item["#"] }))
      .filter((item) =>
        Object.values(item).some((v) =>
          typeof v === "string" ? v.toLowerCase().includes(q) : false
        )
      );
  }, [filtered, search, data]);

  const handleCardClick = (item) => {
    setSelectedExperiment(item);
  };

  const toggleColumn = (col) => {
    setHiddenColumns((prev) =>
      prev.includes(col) ? prev.filter((c) => c !== col) : [...prev, col]
    );
  };

  // Função chamada ao clicar no lápis
  const handleEdit = (row) => {
    const escalaAllowed = ["Não iniciado", "Em andamento", "Concluido"];
    let escalaValor = row["Escala"] || row.escala || "";
    escalaValor = escalaAllowed.includes(escalaValor) ? escalaValor : "Não iniciado";
    const updated = { ...row };
    delete updated.escala; // mantemos somente 'Escala' durante a edição
    updated["Desenvolvedor Resp."] = row["Desenvolvedor Resp."] || row.desenvolvedorResp || "";
    updated["Escala"] = escalaValor;
    setEditData(updated);
    setEditModalOpen(true);
  };

  // Função para salvar edição (exemplo, pode ser ajustada conforme backend)
  // Função utilitária para converter para camelCase
  function toCamelCase(str) {
    if (!str || typeof str !== 'string') return '';
    
    // Tratamento especial para 'Desenvolvedor Resp.'
    if (/^desenvolvedor resp\.?$/i.test(str.trim())) return "desenvolvedorResp";
    // Tratamento especial para 'Área' - manter o nome original
    if (/^área$/i.test(str.trim())) return "Área";
    
    const result = str
      // Normaliza caracteres acentuados
      .normalize("NFD").replace(/[\u0300-\u036f]/g, "")
      // Remove caracteres especiais do início e fim
      .replace(/^[^a-zA-Z0-9]+|[^a-zA-Z0-9]+$/g, "")
      // Adiciona espaço antes de maiúsculas
      .replace(/([A-Z])/g, " $1")
      // Converte espaços, hífens, underscores para camelCase
      .replace(/[-_\s.]+(.)?/g, (_, c) => (c ? c.toUpperCase() : ""))
      // Primeira letra minúscula
      .replace(/^(.)/, (m) => m.toLowerCase())
      .trim();
    
    console.log(`toCamelCase: "${str}" -> "${result}"`);
    return result;
  }

  // Função para mapear campos do servidor de volta para o formato de exibição
  function mapServerDataToDisplay(serverData) {
    if (!serverData) return serverData;
    
    const mapped = { ...serverData };
    
    // Para o campo Área, não precisamos mapear pois agora mantemos o nome original
    // Mapear apenas desenvolvedorResp de volta para o formato original
    if (mapped.desenvolvedorResp !== undefined) {
      mapped["Desenvolvedor Resp."] = mapped.desenvolvedorResp;
    }
    // Sincronizar e normalizar campo Escala
    const escalaAllowed = ["Não iniciado", "Em andamento", "Concluido"];
    if (mapped.escala !== undefined && (mapped["Escala"] === undefined || mapped["Escala"] === "")) {
      mapped["Escala"] = mapped.escala;
    } else if (mapped["Escala"] !== undefined && (mapped.escala === undefined || mapped.escala === "")) {
      mapped.escala = mapped["Escala"];
    } else if (mapped.escala !== undefined && mapped["Escala"] !== undefined && mapped.escala !== mapped["Escala"]) {
      // Caso ambos existam e estejam diferentes, prioriza valor camelCase mais novo
      mapped["Escala"] = mapped.escala;
    }
    if (mapped["Escala"]) {
      const v = (mapped["Escala"] + "").trim();
      if (!escalaAllowed.includes(v)) {
        mapped["Escala"] = "Não iniciado";
        mapped.escala = "Não iniciado";
      }
    }
    
    return mapped;
  }

  const handleEditSave = () => {
    if (editData && editData._id) {
      // Monta o payload apenas com campos válidos (camelCase)
      const dataCamel = {};
      Object.keys(editData).forEach((key) => {
        if (key === '_id' || key === '__v') return;
        // Campo especial para desenvolvedorResp
        if (/^desenvolvedor resp\.?$/i.test(key.trim())) {
          dataCamel['desenvolvedorResp'] = editData[key] || "";
          return;
        }
        // Campo especial Escala: garantir atualização tanto em 'escala' (camel) quanto no original 'Escala'
    if (/^escala$/i.test(key.trim())) {
      const escalaAllowed = ["Não iniciado", "Em andamento", "Concluido"];
      const val = escalaAllowed.includes(editData[key]) ? editData[key] : "Não iniciado";
      dataCamel['escala'] = val; // backend (camel)
      dataCamel['Escala'] = val; // mantém documento consistente caso exista com E maiúsculo
      return;
    }
        // Ignora campos com espaço, acento ou caracteres especiais
        if (/[^a-zA-Z0-9]/.test(key) && !/^área$/i.test(key.trim())) return;
        const camelKey = toCamelCase(key);
        if (camelKey && camelKey.trim()) {
          dataCamel[camelKey] = editData[key];
        }
      });
      // Força sincronização final de escala caso campo só exista em 'Escala'
      if (editData['Escala']) {
        const escalaAllowed = ["Não iniciado", "Em andamento", "Concluido"];
        const val = escalaAllowed.includes(editData['Escala']) ? editData['Escala'] : "Não iniciado";
        dataCamel['escala'] = val;
        dataCamel['Escala'] = val;
      }
      console.log('=== PAYLOAD PUT (experimento) ===');
      console.log(dataCamel);
      fetch(`http://localhost:3002/api/experimentos/${editData._id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(dataCamel),
      }).then(async (res) => {
        if (res.ok) {
          const atualizado = await res.json();
          console.log("=== RESPOSTA DO SERVIDOR ===");
          console.log("Documento atualizado:", atualizado);
          // Mapear os dados do servidor de volta para o formato de exibição
          const atualizadoMapeado = mapServerDataToDisplay(atualizado);
          console.log("Documento mapeado:", atualizadoMapeado);
          const updated = data.map((item) =>
            item._id === atualizadoMapeado._id ? atualizadoMapeado : item
          );
          console.log("Lista atualizada:", updated.find(item => item._id === atualizadoMapeado._id));
          setData(updated);
          setFiltered(updated);
          setEditModalOpen(false);
          setEditData(null);
        } else {
          const errorData = await res.json();
          console.error("Erro do servidor:", errorData);
          alert(`Erro ao atualizar: ${errorData.details || errorData.error}`);
        }
      }).catch(error => {
        console.error("Erro na requisição:", error);
        alert("Erro de conexão com o servidor");
      });
    }
  };

  const handleEditCancel = () => {
    setEditModalOpen(false);
    setEditData(null);
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-white to-rose-50 p-3 md:p-4">
      <div className="h-full w-full flex flex-col gap-3">
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-extrabold text-[#7a0019] mr-2">
              Lista de Experimentos
            </h1>
            <span className="text-sm text-gray-600 mr-2">
              {search
                ? `${filteredData.length} de ${data?.length || 0}`
                : `${data?.length || 0}`}
              itens
            </span>
            <button
              className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-[#7a0019] text-white hover:bg-[#5a0011] shadow text-base font-semibold"
              onClick={() => setShowNewModal(true)}
            >
              <svg
                width="18"
                height="18"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="lucide lucide-plus"
              >
                <line x1="12" y1="5" x2="12" y2="19" />
                <line x1="5" y1="12" x2="19" y2="12" />
              </svg>
              Adicionar Experimento
            </button>
            <button
              className="inline-flex items-center gap-2 px-3 py-2 rounded-lg bg-[#7a0019] text-white hover:bg-[#5a0011] shadow text-sm font-medium"
              onClick={() => setBoardView((prev) => !prev)}
            >
              Mudar Visão
            </button>
            <button
              className="inline-flex items-center gap-2 px-3 py-2 rounded-lg bg-white border-2 border-[#7a0019]/30 text-[#7a0019] hover:bg-rose-50 text-sm font-medium"
              onClick={() => setShowColManager(true)}
            >
              <SlidersHorizontal className="w-4 h-4" /> Gerenciar colunas
            </button>
          </div>
        </div>
        <div className="relative mt-2 mb-2 w-full max-w-2xl">
          <Input
            placeholder="Buscar por título, squad, status..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full text-gray-900 bg-white border-2 border-[#7a0019]/30 rounded-xl pl-10 py-3 text-lg shadow-sm focus:ring-2 focus:ring-[#7a0019]"
          />
          <Search className="absolute left-3 top-3 w-6 h-6 text-[#7a0019]/70" />
        </div>
        <div className="flex items-center gap-4 text-sm text-gray-700 mb-6">
          <div className="flex items-center gap-2">
            <BlinkingDot color="#22c55e" />
            <span>Dentro do prazo</span>
          </div>
          <div className="flex items-center gap-2">
            <BlinkingDot color="#ef4444" />
            <span>Fora do prazo</span>
          </div>
          <div className="flex items-center gap-2">
            <BlinkingDot color="#eab308" />
            <span>Pendência</span>
          </div>
        </div>
      </div>
      <div className="flex-1">
        {boardView ? (
          <>
            <BoardDofa onCardClick={handleCardClick} />
            <Dialog
              open={!!selectedExperiment}
              onOpenChange={() => setSelectedExperiment(null)}
            >
              <DialogContent className="max-w-2xl">
                <DialogHeader>
                  <DialogTitle className="text-[#7a0019]">
                    Detalhes do Experimento
                  </DialogTitle>
                </DialogHeader>
                {selectedExperiment && (
                  <ExperimentDetailCard
                    experiment={selectedExperiment}
                    onClose={() => setSelectedExperiment(null)}
                  />
                )}
              </DialogContent>
            </Dialog>
          </>
        ) : (
          <>
            <ExperimentTable
              columns={columns}
              data={filteredData.map((item) => {
                // Adiciona o campo statusPiloto igual PilotosEmAndamento
                if (
                  typeof item["Piloto"] === "string" &&
                  item["Piloto"].trim() !== ""
                ) {
                  return {
                    ...item,
                    statusPiloto: getStatusPiloto(item),
                  };
                }
                return item;
              })}
              filtered={filteredData}
              hiddenColumns={hiddenColumns}
              toggleColumn={toggleColumn}
              selectedIdx={0}
              setSelectedIdx={() => {}}
              handleEdit={handleEdit}
              optionsMap={{}}
              setData={() => {}}
              setFiltered={() => {}}
            />
            {/* Modal de edição */}
            {editModalOpen && (
              <Dialog open={editModalOpen} onOpenChange={handleEditCancel}>
                <DialogContent className="w-[90vw] max-w-[1400px] h-[85vh] flex flex-col overflow-hidden">
                  <DialogHeader className="shrink-0">
                    <DialogTitle className="text-[#7a0019] text-2xl font-extrabold">Editar Experimento</DialogTitle>
                    <DialogDescription className="text-sm">
                      Ajuste os campos necessários. Role para ver todos os campos.
                    </DialogDescription>
                  </DialogHeader>
                  <div className="flex-1 min-h-0">
                    <ExperimentEditModal
                      open={editModalOpen}
                      columns={columns}
                      editData={editData}
                      onChange={(key, value) =>
                        setEditData((prev) => ({ ...prev, [key]: value }))
                      }
                      onCancel={handleEditCancel}
                      onSave={handleEditSave}
                      onDelete={handleEditCancel}
                      optionsMap={{}}
                    />
                  </div>
                </DialogContent>
              </Dialog>
            )}
          </>
        )}
        {/* Modal para novo experimento */}
        {showNewModal && (
          <ExperimentNewModal
            open={showNewModal}
            columns={columns}
            newExpData={newExpData}
            onChange={(key, value) =>
              setNewExpData((prev) => ({ ...prev, [key]: value }))
            }
            onCancel={() => setShowNewModal(false)}
            onSave={() => {
              /* lógica de salvar experimento */ setShowNewModal(false);
              setNewExpData({});
            }}
            optionsMap={{}}
          />
        )}
      </div>
      <Dialog open={showColManager} onOpenChange={setShowColManager}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="text-[#7a0019]">
              Gerenciar colunas
            </DialogTitle>
          </DialogHeader>
          <div className="grid grid-cols-2 gap-3 mt-2">
            {Object.keys(data?.[0] || {})
              .filter((col) => col !== "_id" && col !== "id")
              .map((col) => (
                <label key={col} className="flex items-center gap-2 text-sm">
                  <input
                    type="checkbox"
                    className="accent-[#7a0019]"
                    checked={!hiddenColumns.includes(col)}
                    onChange={() => toggleColumn(col)}
                  />
                  <span className="truncate" title={col}>
                    {col}
                  </span>
                </label>
              ))}
          </div>
          <div className="flex justify-end mt-4">
            <button
              className="px-3 py-2 rounded bg-[#7a0019] text-white hover:bg-[#5a0011]"
              onClick={() => setShowColManager(false)}
            >
              Fechar
            </button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
