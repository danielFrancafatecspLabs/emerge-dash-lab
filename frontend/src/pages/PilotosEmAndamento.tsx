import { useState } from "react";
import { BlinkingDot } from "@/components/experimentos/BlinkingDot";
import { Pencil } from "lucide-react";
import { useExperimentos } from "@/hooks/useExperimentos";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  ResponsiveContainer,
  LabelList,
} from "recharts";
import { Upload, Download } from "lucide-react";
import { toast } from "sonner";


// Mapeamento de iniciativa para statusPiloto (deve vir antes de qualquer uso)
const statusPilotoMap: Record<string, string> = {
  "Gen Ia Formulários  (Onboarding / Offboarding)": "2.3 GO / NOGO",
  "Análise de chamadas de Call Center ( Speech do Futuro) ( Alarme Situcional )": "2.2.2 HLE",
  "Busca Avançada (TV)": "2.0 - EXECUÇÃO PILOTO",
  "Copilot Atendimento": "2.5 - ROLL-OUT",
  "Copilot de Atendimento": "2.5 - ROLL-OUT",
  "URA e Call Center Cognitivo": "2.5 - ROLL-OUT",
  "Consulta de pareceres jurídicos (JurisQuery)": "2.0 - EXECUÇÃO PILOTO",
  "M365 ( CoPilot)": "2.0 - EXECUÇÃO PILOTO",
  "Compartilhamento Claro Box": "2.0 - EXECUÇÃO PILOTO",
};

const pilotoStages = [
  { key: "2.0 - EXECUÇÃO PILOTO", color: "border-lab-primary text-lab-primary bg-lab-primary/10" },
  { key: "2.1 - APURAÇÃO DE RESULTADOS", color: "border-orange-600 text-orange-700 bg-orange-100" },
  { key: "2.2 - DEFINIÇÃO DE CUSTOS", color: "border-indigo-600 text-indigo-700 bg-indigo-100" },
  { key: "2.2.2 - HLE", color: "border-purple-600 text-purple-700 bg-purple-100" },
  { key: "2.2.3 APROVAÇÃO HLE TI", color: "border-blue-600 text-blue-700 bg-blue-100" },
  { key: "2.2.4 APROVAÇÃO HLE NEGOCIOS", color: "border-yellow-500 text-yellow-700 bg-yellow-100" },
  { key: "2.3 - GO NOGO", color: "border-green-600 text-green-700 bg-green-100" },
  { key: "2.4 - APROVAÇÃO COMITE DE INVESTIMENTO", color: "border-gray-400 text-gray-600 bg-gray-100" },
  { key: "2.5 - ROLL-OUT", color: "border-pink-600 text-pink-700 bg-pink-100" },
  { key: "2.6 - CANCELADO", color: "border-red-600 text-red-700 bg-red-100" },
];

const statusLabels = [
  {
    key: "Não iniciado",
    label: "Não Iniciado",
    color: "border-gray-400 text-gray-600 bg-gray-100",
  },
  {
    key: "Em andamento",
    label: "Em Andamento",
    color: "border-lab-primary text-lab-primary bg-lab-primary/10",
  },
  {
    key: "Concluído",
    label: "Concluído",
    color: "border-green-600 text-green-700 bg-green-100",
  },
];

// Função utilitária para obter statusPiloto igual em ListaDeExperimentos
function getStatusPiloto(item) {
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
  return statusPiloto;
}

function normalizeStatus(status: string) {
  if (!status) return "";
  return status
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .toLowerCase();
}

const PilotosEmAndamento = () => {
  const { data, loading, setData } = useExperimentos();
  const [selectedStatus, setSelectedStatus] = useState<string | null>(null);
  const [statusModalOpen, setStatusModalOpen] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [modalDescricao, setModalDescricao] = useState("");
  const [modalTitulo, setModalTitulo] = useState("");

  // Filtrar pilotos ativos: "Em andamento", "Não iniciado" e "Concluído"
  const statusAtivos = ["em andamento", "nao iniciado", "concluido"];
  const andamento = data.filter(
    (item) =>
      typeof item["Piloto"] === "string" &&
      statusAtivos.includes(normalizeStatus(item["Piloto"]))
  );

  // Calcular statusCounts para cada statusLabel
  const statusCounts: { [key: string]: number } = {};
  statusLabels.forEach((label) => {
    const normKey = normalizeStatus(label.key);
    statusCounts[label.key] = data.filter(
      (item) =>
        typeof item["Piloto"] === "string" &&
        normalizeStatus(item["Piloto"]) === normKey
    ).length;
  });

  // Modal: filtrar pilotos pelo statusPiloto (usando função utilitária)
        const pilotosForStatus = selectedStatus
          ? data.filter((item) => {
              const statusPiloto = getStatusPiloto(item);
              if (
                selectedStatus.trim().toLowerCase() === "2.0 - execução piloto" &&
                (item["Iniciativa"] === "Consulta de pareceres jurídicos (JurisQuery)" || item["Iniciativa"] === "M365 ( CoPilot)")
              ) {
                return false;
              }
              return statusPiloto && statusPiloto.trim().toLowerCase() === selectedStatus.trim().toLowerCase();
            })
          : [];

  // Gerar dados de área a partir da lista de pilotos
  const areaCounts: { [key: string]: number } = {};
  data.forEach((item) => {
    const area =
      typeof item["Área"] === "string" ? item["Área"].trim() : undefined;
    if (area) {
      areaCounts[area] = (areaCounts[area] || 0) + 1;
    }
  });
  const areaData = Object.entries(areaCounts).map(([name, value]) => ({
    name,
    value,
  }));


  // Mapeamento de iniciativa para statusPiloto
  const statusPilotoMap: Record<string, string> = {
    "Gen Ia Formulários  (Onboarding / Offboarding)": "2.3 GO / NOGO",
    "Análise de chamadas de Call Center ( Speech do Futuro) ( Alarme Situcional )": "2.2.2 HLE",
    "Busca Avançada (TV)": "2.0 - EXECUÇÃO PILOTO",
    "Copilot Atendimento": "2.5 - ROLL-OUT",
    "Copilot de Atendimento": "2.5 - ROLL-OUT",
    "URA e Call Center Cognitivo": "2.5 - ROLL-OUT",
    "Consulta de pareceres jurídicos (JurisQuery)": "2.0 - EXECUÇÃO PILOTO",
    "M365 ( CoPilot)": "2.0 - EXECUÇÃO PILOTO",
    "Compartilhamento Claro Box": "2.0 - EXECUÇÃO PILOTO",
  };

  // Função para atualizar statusPiloto no backend se necessário
  const updateStatusPilotoIfNeeded = async (item: any, statusPiloto: string) => {
    if (!item._id) return;
    if (item["statusPiloto"] !== statusPiloto) {
      try {
        await fetch(`/api/experimentos/${item._id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ statusPiloto }),
        });
        item["statusPiloto"] = statusPiloto;
        setData([...data]);
      } catch (e) {
        // erro silencioso
      }
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center mb-8">
        <div>
          <h2 className="text-3xl font-bold text-foreground mb-2">
            Pilotos em Andamento
          </h2>
          <p className="text-muted-foreground">
            Acompanhamento detalhado dos pilotos ativos
          </p>
        </div>
        <div className="flex gap-3">
          <Button variant="outline">
            <Download className="w-4 h-4 mr-2" />
            Exportar
          </Button>
        </div>
      </div>

      {/* Pipeline dos Pilotos */}
      <Card className="shadow-elevated">
        <CardHeader>
          <CardTitle>Pipeline de Pilotos</CardTitle>
          <CardDescription>Visão geral do fluxo de pilotos</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap items-center gap-4 p-4">
            {pilotoStages.map((stage, index) => {
              // Conta quantos pilotos estão em cada etapa do statusPiloto
              const count = data.filter((item) => {
                const statusPiloto = getStatusPiloto(item);
                if (
                  stage.key.trim().toLowerCase() === "2.0 - execução piloto" &&
                  (item["Iniciativa"] === "Consulta de pareceres jurídicos (JurisQuery)" || item["Iniciativa"] === "M365 ( CoPilot)")
                ) {
                  return false;
                }
                return statusPiloto && statusPiloto.trim().toLowerCase() === stage.key.trim().toLowerCase();
              }).length;
              return (
                <div key={stage.key} className="flex items-center">
                  <button
                    className={`relative flex flex-col items-center p-4 rounded-lg border-2 min-w-[140px] cursor-pointer transition hover:scale-105 ${stage.color}`}
                    onClick={() => {
                      setSelectedStatus(stage.key);
                      setStatusModalOpen(true);
                    }}
                    aria-label={`Ver pilotos com status ${stage.key}`}
                  >
                    <div className="text-2xl font-bold mb-1">
                      {count}
                    </div>
                    <div className="text-xs text-center font-medium text-foreground">
                      {stage.key}
                    </div>
                  </button>
                  {index < pilotoStages.length - 1 && (
                    <div className="w-8 h-px bg-border mx-2" />
                  )}
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

  {/* ...cards de status removidos conforme solicitado... */}

      {/* Modal para mostrar pilotos do status selecionado */}
      <Dialog open={statusModalOpen} onOpenChange={setStatusModalOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Pilotos com status: {selectedStatus}</DialogTitle>
            <DialogDescription>
              {pilotosForStatus.length === 0
                ? "Nenhum piloto encontrado."
                : `Total: ${pilotosForStatus.length}`}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-2 max-h-96 overflow-y-auto">
            {pilotosForStatus.map((exp, idx) => (
              <div
                key={
                  typeof exp["Iniciativa"] === "string"
                    ? exp["Iniciativa"]
                    : idx
                }
                className="p-2 rounded border bg-muted"
              >
                <div className="font-semibold">
                  {typeof exp["Iniciativa"] === "string"
                    ? exp["Iniciativa"]
                    : ""}
                </div>
                <div className="text-xs text-muted-foreground">
                  {typeof exp["Descrição"] === "string" ? exp["Descrição"] : ""}
                </div>
              </div>
            ))}
          </div>
        </DialogContent>
      </Dialog>

      {/* Gráficos */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Qtde Por Área */}
        <Card className="shadow-card">
          <CardHeader>
            <CardTitle>Qtde Por Área</CardTitle>
            <CardDescription>
              Distribuição por área organizacional
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-80 overflow-x-auto">
              <ResponsiveContainer
                width={Math.max(600, areaData.length * 80)}
                height="100%"
              >
                <BarChart
                  data={areaData}
                  margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                  <XAxis
                    dataKey="name"
                    stroke="#64748b"
                    fontSize={12}
                    interval={0}
                    angle={-45}
                    textAnchor="end"
                    height={60}
                  />
                  <YAxis stroke="#64748b" fontSize={12} />
                  <Bar
                    dataKey="value"
                    fill="hsl(var(--lab-primary))"
                    radius={[4, 4, 0, 0]}
                  >
                    <LabelList dataKey="value" position="top" fontSize={13} />
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Lista de Pilotos em Andamento */}
      <Card className="shadow-card">
        <CardHeader>
          <CardTitle>Pilotos em Andamento</CardTitle>
          <CardDescription>Lista dos pilotos ativos</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b">
                  <th className="text-left p-3 font-medium text-muted-foreground">
                    Área Demandante
                  </th>
                  <th className="text-left p-3 font-medium text-muted-foreground">
                    Piloto
                  </th>
                  <th className="text-left p-3 font-medium text-muted-foreground">
                    Responsável
                  </th>
                  <th className="text-left p-3 font-medium text-muted-foreground">
                    Status
                  </th>
                  <th className="text-left p-3 font-medium text-muted-foreground">
                    statusPiloto
                  </th>
                  <th className="text-left p-3 font-medium text-muted-foreground">
                    Situação Atual e Próximos passos
                  </th>
                </tr>
              </thead>
              <tbody>
                {andamento.map((item, idx) => {
                  // statusPiloto: definido automaticamente conforme a iniciativa
                  let statusPiloto = "";
                  if (typeof item["Iniciativa"] === "string") {
                    // Força statusPiloto para os pilotos especificados
                    if (
                      item["Iniciativa"].trim() === "Otimização de Baterias - Ciclo 2" ||
                      item["Iniciativa"].trim() === "Otimização de Baterias - Ciclo 1"
                    ) {
                      statusPiloto = "2.0 - EXECUÇÃO PILOTO";
                    } else {
                      // Busca exata
                      statusPiloto = statusPilotoMap[item["Iniciativa"].trim()] || "";
                      // Fallback: busca por includes (case-insensitive)
                      if (!statusPiloto) {
                        const iniNorm = item["Iniciativa"].trim().toLowerCase();
                        for (const key in statusPilotoMap) {
                          if (iniNorm.includes(key.trim().toLowerCase())) {
                            statusPiloto = statusPilotoMap[key];
                            break;
                          }
                        }
                      }
                      // Se ainda não achou, mostra o valor real do campo
                      if (!statusPiloto && typeof item["statusPiloto"] === "string") {
                        statusPiloto = item["statusPiloto"];
                      }
                      
                      // Se o statusPiloto ainda estiver vazio e o piloto estiver ativo, define como "2.0 - EXECUÇÃO PILOTO"
                      if (!statusPiloto && 
                          typeof item["Piloto"] === "string" && 
                          statusAtivos.includes(normalizeStatus(item["Piloto"]))) {
                        statusPiloto = "2.0 - EXECUÇÃO PILOTO";
                      }
                    }
                    // Atualiza backend se necessário
                    if (statusPiloto && item["statusPiloto"] !== statusPiloto) {
                      updateStatusPilotoIfNeeded(item, statusPiloto);
                    }
                  }
                  return (
                    <tr
                      key={
                        typeof item["Iniciativa"] === "string"
                          ? item["Iniciativa"]
                          : idx
                      }
                      className="border-b hover:bg-muted/50 cursor-pointer"
                      onClick={() => {
                        setModalTitulo(typeof item["Iniciativa"] === "string" ? item["Iniciativa"] : "");
                        setModalDescricao(typeof item["Descrição"] === "string" ? item["Descrição"] : "Sem descrição disponível.");
                        setModalOpen(true);
                      }}
                    >
                      <td className="p-3">
                        <Badge variant="secondary">
                          {typeof item["Área"] === "string" ? item["Área"] : ""}
                        </Badge>
                      </td>
                      <td className="p-3 font-medium">
                        {typeof item["Iniciativa"] === "string"
                          ? item["Iniciativa"]
                          : ""}
                      </td>
                      <td className="p-3">
                        {typeof item["Sponsor/BO"] === "string"
                          ? item["Sponsor/BO"]
                          : ""}
                      </td>
                      <td className="p-3">
                        <Badge className="bg-lab-success/10 text-lab-success border-lab-success">
                          {typeof item["Piloto"] === "string"
                            ? item["Piloto"]
                            : ""}
                        </Badge>
                      </td>
                      <td className="p-3 min-w-[220px] max-w-xs">
                        <Badge className="bg-gray-100 text-gray-700 border-gray-300 whitespace-pre-line break-words px-3 py-2 text-sm w-full justify-start text-left" style={{width: '100%', display: 'block'}}>
                          {statusPiloto}
                        </Badge>
                      </td>
                      <td className="p-3 text-sm text-muted-foreground">
                        {typeof item["Situação Atual e Próximos passos"] ===
                        "string" ? (
                          <span>{item["Situação Atual e Próximos passos"]}</span>
                        ) : typeof item["Situacao Atual e Proximos passos"] ===
                          "string" ? (
                          <span>{item["Situacao Atual e Proximos passos"]}</span>
                        ) : typeof item["Situacao Atual"] === "string" ? (
                          <span>{item["Situacao Atual"]}</span>
                        ) : null}
                      </td>
                    </tr>
                  );
                })}
                {/* Modal de descrição do piloto */}
                <Dialog open={modalOpen} onOpenChange={setModalOpen}>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>{modalTitulo}</DialogTitle>
                      <DialogDescription>{modalDescricao}</DialogDescription>
                    </DialogHeader>
                  </DialogContent>
                </Dialog>
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default PilotosEmAndamento;
