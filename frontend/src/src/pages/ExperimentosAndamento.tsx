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
import { ExperimentDetailCard } from "@/components/experimentos/ExperimentDetailCard";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  ResponsiveContainer,
  LabelList,
} from "recharts";
import { Upload, Download, Filter, Search } from "lucide-react";
import { toast } from "sonner";

const statusLabels = [
  {
    key: "Em planejamento",
    label: "Em Planejamento",
    color: "border-indigo-600 text-indigo-700 bg-indigo-100",
  },
  {
    key: "Em refinamento",
    label: "Em Refinamento",
    color: "border-purple-600 text-purple-700 bg-purple-100",
  },
  {
    key: "Em andamento",
    label: "Em Andamento",
    color: "border-lab-primary text-lab-primary bg-lab-primary/10",
  },
  {
    key: "Em Testes",
    label: "Em Testes",
    color: "border-pink-600 text-pink-700 bg-pink-100",
  },
  {
    key: "Em validação",
    label: "Em Validação",
    color: "border-orange-600 text-orange-700 bg-orange-100",
  },
  {
    key: "Concluido",
    label: "Concluídos",
    color: "border-green-600 text-green-700 bg-green-100",
  },
  {
    key: "Concluido com Pivot",
    label: "Concluídos com Pivot",
    color: "border-blue-600 text-blue-700 bg-blue-100",
  },
  {
    key: "Concluido - Aguardando Go/No para Piloto",
    label: "Concluídos Aguardando Go/No para Piloto",
    color: "border-yellow-500 text-yellow-700 bg-yellow-100",
  },
  {
    key: "Arquivado",
    label: "Arquivado",
    color: "border-gray-400 text-gray-600 bg-gray-100",
  },
];

function normalizeStatus(status: string) {
  if (!status) return "";
  return status
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .toLowerCase();
}

const initiativeData = [
  { name: "WEB 3", value: 5, color: "hsl(var(--lab-primary))" },
  { name: "Experimentos IA", value: 8, color: "hsl(var(--lab-primary-dark))" },
  { name: "Future network", value: 2, color: "hsl(var(--lab-secondary))" },
  { name: "Outras Tecnologias", value: 2, color: "hsl(var(--lab-accent))" },
];

const areaData = [
  { name: "Digital", value: 4 },
  { name: "RH", value: 1 },
  { name: "Canais Remotos", value: 1 },
  { name: "TI", value: 1 },
  { name: "Canais Críticos", value: 1 },
  { name: "Novos Negócios MVNO", value: 1 },
];

const highlights = [
  {
    area: "Canais Remotos",
    experiment: 'Acesso "Home do Time" no Live e no Maquina TI',
    responsible: "SeCiTi Labs",
    status: "Pedido de mais Barbas IoT",
  },
  {
    area: "Experiência",
    experiment: 'Acesso "Código do Produto de Acesso Mega GB TI"',
    responsible: "SeCiTi Labs",
    status: "Passo de obtenção esperimentado do cabo da tela",
  },
  {
    area: "Operações Técnicas",
    experiment:
      "Configure Navegação Tela ampliada que trouxeram Descrição de download de vídeo",
    responsible: "SeCiTi Labs",
    status: "TI-Time&s Call Center",
  },
];

import type { Experiment as TableExperiment, ExperimentHistory } from "@/components/experimentos/ExperimentTable";

const ExperimentosAndamento = () => {
  const [editIdx, setEditIdx] = useState<number | null>(null);
  const [editValue, setEditValue] = useState<string>("");
  // Estado para modal de histórico de situação
  const [historyModalOpen, setHistoryModalOpen] = useState(false);

  type Experiment = {
    _id: string;
    "Área"?: string;
    "Iniciativa"?: string;
    "Sponsor/BO"?: string;
    "Experimentação"?: string;
    "Situação Atual e Próximos passos"?: string;
    "Situacao Atual e Proximos passos"?: string;
    "Situacao Atual"?: string;
    "Comentários/Pendências/Ações"?: ExperimentHistory[] | string;
    [key: string]: string | number | boolean | ExperimentHistory[];
  };

  const [historyModalData, setHistoryModalData] = useState<Experiment | null>(null);

  // Função para salvar edição do campo, movendo texto atual para o histórico
  const handleSaveEdit = async (idx: number) => {
    const item = andamento[idx];
    const id = item._id;
    if (id) {
      const updated = [...data];
      const indexInData = data.findIndex((d) => d._id === id);
      if (indexInData !== -1) {
        // Atualiza apenas o campo Situação Atual e Próximos passos e o histórico
        const prevText =
          updated[indexInData]["Situação Atual e Próximos passos"] ||
          updated[indexInData]["Situacao Atual e Proximos passos"] ||
          updated[indexInData]["Situacao Atual"];
        let historico = [];
        if (
          Array.isArray(updated[indexInData]["Comentários/Pendências/Ações"])
        ) {
          historico = [...updated[indexInData]["Comentários/Pendências/Ações"]];
        } else if (
          typeof updated[indexInData]["Comentários/Pendências/Ações"] ===
            "string" &&
          updated[indexInData]["Comentários/Pendências/Ações"].trim()
        ) {
          historico.push({
            texto: updated[indexInData]["Comentários/Pendências/Ações"],
            data: new Date().toISOString(),
          });
        }
        if (typeof prevText === "string" && prevText.trim()) {
          historico.push({ texto: prevText, data: new Date().toISOString() });
        }
        // Cria novo objeto apenas com os campos necessários
        const novoObj = {
          _id: updated[indexInData]._id,
          "Situação Atual e Próximos passos": editValue,
          "Comentários/Pendências/Ações": historico,
        };
        // Atualiza apenas os campos necessários localmente
        updated[indexInData]["Situação Atual e Próximos passos"] = editValue;
        updated[indexInData]["Comentários/Pendências/Ações"] = historico;
        setData(updated);
        setEditIdx(null);
        setEditValue("");
        await fetch(`http://localhost:3001/api/experimentos/${id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(novoObj),
        });
      }
    }
  };

  const [searchTerm, setSearchTerm] = useState("");
  const { data, loading, setData, experimentosPorTipo } = useExperimentos();

  // Gerar dados de área a partir da lista de experimentos
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

  // Função para determinar prioridade do sinal
  function getSignalPriority(item: Experiment) {
    // Exemplo: status crítico (vermelho), atenção (amarelo), ok (verde)
    const status = (
      typeof item["Situação Atual e Próximos passos"] === "string"
        ? item["Situação Atual e Próximos passos"]
        : typeof item["Situacao Atual e Proximos passos"] === "string"
        ? item["Situacao Atual e Proximos passos"]
        : typeof item["Situacao Atual"] === "string"
        ? item["Situacao Atual"]
        : ""
    ).toLowerCase();
    // Ajuste conforme regras reais de negócio
    if (
      status.includes("atencao") ||
      status.includes("pendente") ||
      status.includes("problema") ||
      status.includes("em atraso")
    )
      return 1; // vermelho
    if (
      status.includes("em andamento") ||
      status.includes("em testes") ||
      status.includes("validacao") ||
      status.includes("aguardando")
    )
      return 2; // amarelo
    return 3; // verde
  }

  // Filtra experimentos em andamento e ordena por prioridade do sinal
  const andamento = data
    .filter(
      (item) =>
        typeof item["Experimentação"] === "string" &&
        item["Experimentação"].trim().toLowerCase() === "em andamento"
    )
    .sort((a, b) => getSignalPriority(a) - getSignalPriority(b));

  // Função para atualizar comentário e salvar no backend
  const handleComentarioChange = async (idx: number, value: string) => {
    const updated = [...data];
    const indexInData = data.findIndex(
      (item) => item["Iniciativa"] === andamento[idx]["Iniciativa"]
    );
    if (indexInData !== -1) {
      updated[indexInData]["Comentários/Pendências/Ações"] = value;
      setData(updated);
      // Salvar no backend
      const id = updated[indexInData]._id;
      if (id) {
        try {
          await fetch(`http://localhost:3001/api/experimentos/${id}`, {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(updated[indexInData]),
          });
        } catch (err) {
          toast.error("Erro ao salvar comentário!");
        }
      }
    }
  };

  // Modal para descrição
  const [modalOpen, setModalOpen] = useState(false);
  const [modalExperiment, setModalExperiment] = useState<Experiment | null>(null);
  const handleOpenModal = (item: Experiment) => {
    setModalExperiment(item);
    setModalOpen(true);
  };
  // Modal para histórico de situação
  const handleOpenHistoryModal = (item: Experiment) => {
    setHistoryModalData(item);
    setHistoryModalOpen(true);
  };

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file && file.type === "text/csv") {
      toast.success(`Arquivo ${file.name} carregado com sucesso!`);
      // Here you would process the CSV file
    } else {
      toast.error("Por favor, selecione um arquivo CSV válido");
    }
  };

  // Calcular statusCounts dinamicamente a partir dos dados, usando 'Experimentação'
  // Função para normalizar status (remove acentos, minúsculas, trim)
  const normalize = (str: string) =>
    (str || "")
      .normalize("NFD")
      .replace(/\p{Diacritic}/gu, "")
      .trim()
      .toLowerCase();

  // Calcular statusCounts para cada statusLabel
  const statusCounts: { [key: string]: number } = {};
  statusLabels.forEach((label) => {
    const normKey = normalize(label.key);
    statusCounts[label.key] = data.filter(
      (item) =>
        typeof item["Experimentação"] === "string" &&
        normalize(item["Experimentação"]) === normKey
    ).length;
  });

  // Hook para controlar card selecionado e experimentos filtrados
  const [selectedStatus, setSelectedStatus] = useState<string | null>(null);
  const [statusModalOpen, setStatusModalOpen] = useState(false);
  // Modal: filtrar experimentos pelo campo correto, normalizando
  const experimentsForStatus = selectedStatus
    ? data.filter(
        (item) =>
          typeof item["Experimentação"] === "string" &&
          normalize(item["Experimentação"]) === normalize(selectedStatus)
      )
    : [];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center mb-8">
        <div>
          <h2 className="text-3xl font-bold text-foreground mb-2">
            Experimentos em Andamento
          </h2>
          <p className="text-muted-foreground">
            Acompanhamento detalhado dos processos ativos
          </p>
        </div>

        <div className="flex gap-3">
          <div className="relative">
            <Input
              type="file"
              accept=".csv"
              onChange={handleFileUpload}
              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
            />
            <Button className="bg-lab-primary hover:bg-lab-primary-dark text-white">
              <Upload className="w-4 h-4 mr-2" />
              Carregar CSV
            </Button>
          </div>

          <Button variant="outline">
            <Download className="w-4 h-4 mr-2" />
            Exportar
          </Button>
        </div>
      </div>

      {/* Process Pipeline */}
      <Card className="shadow-elevated">
        <CardHeader>
          <CardTitle>Pipeline de Processos</CardTitle>
          <CardDescription>
            Visão geral do fluxo de experimentos
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap items-center gap-4 p-4">
            {statusLabels.map((step, index) => (
              <div key={step.key} className="flex items-center">
                <button
                  className={`relative flex flex-col items-center p-4 rounded-lg border-2 min-w-[140px] cursor-pointer transition hover:scale-105 ${step.color}`}
                  onClick={() => {
                    setSelectedStatus(step.key);
                    setStatusModalOpen(true);
                  }}
                  aria-label={`Ver experimentos com status ${step.label}`}
                >
                  <div
                    className={`text-2xl font-bold mb-1 ${
                      step.color.split(" ")[1]
                    }`}
                  >
                    {statusCounts[step.key] || 0}
                  </div>
                  <div className="text-xs text-center font-medium text-foreground">
                    {step.label}
                  </div>
                </button>
                {index < statusLabels.length - 1 && (
                  <div className="w-8 h-px bg-border mx-2" />
                )}
              </div>
            ))}
          </div>

          {/* Modal para mostrar experimentos do status selecionado */}
          <Dialog open={statusModalOpen} onOpenChange={setStatusModalOpen}>
            <DialogContent className="max-w-lg">
              <DialogHeader>
                <DialogTitle>
                  Experimentos com status: {selectedStatus}
                </DialogTitle>
                <DialogDescription>
                  {experimentsForStatus.length === 0
                    ? "Nenhum experimento encontrado."
                    : `Total: ${experimentsForStatus.length}`}
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-2 max-h-96 overflow-y-auto">
                {experimentsForStatus.map((exp, idx) => (
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
                      {typeof exp["Descrição"] === "string"
                        ? exp["Descrição"]
                        : ""}
                    </div>
                  </div>
                ))}
              </div>
            </DialogContent>
          </Dialog>
        </CardContent>
      </Card>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Qtde por Tipo de Iniciativa */}
        <Card className="shadow-card">
          <CardHeader>
            <CardTitle>Qtde por Tipo de Iniciativa</CardTitle>
            <CardDescription>
              Distribuição por categoria de tecnologia
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={experimentosPorTipo}
                  margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                  <XAxis dataKey="name" stroke="#64748b" fontSize={12} />
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

      {/* Include Vision Note */}
      <Card className="bg-lab-warning/10 border-lab-warning shadow-card">
        <CardContent className="p-4">
          <div className="flex items-center gap-2">
            <Badge
              variant="outline"
              className="border-lab-warning text-lab-warning"
            >
              Nota
            </Badge>
            <span className="font-medium text-foreground">
              Incluir visão de Experimentos com mais de 1 ciclo
            </span>
          </div>
        </CardContent>
      </Card>

      {/* Lista de Experimentos em Andamento */}
      <Card className="shadow-card">
        <CardHeader>
          <CardTitle>Experimentos em Andamento</CardTitle>
          <CardDescription>
            Lista dos experimentos ativos, editáveis
          </CardDescription>
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
                    Experimento
                  </th>
                  <th className="text-left p-3 font-medium text-muted-foreground">
                    Responsável
                  </th>
                  <th className="text-left p-3 font-medium text-muted-foreground">
                    Status
                  </th>
                  <th className="text-left p-3 font-medium text-muted-foreground">
                    Sinal
                  </th>
                  <th className="text-left p-3 font-medium text-muted-foreground">
                    Situação Atual e Próximos passos
                  </th>
                </tr>
              </thead>
              <tbody>
                {andamento.map((item, idx) => {
                  // Determina cor da bolinha
                  const priority = getSignalPriority(item);
                  let signalColor = "";
                  let signalLabel = "";
                  if (priority === 1) {
                    signalColor = "#ef4444";
                    signalLabel = "Precisa atenção";
                  } else if (priority === 2) {
                    signalColor = "#eab308";
                    signalLabel = "Atenção";
                  } else {
                    signalColor = "#22c55e";
                    signalLabel = "OK";
                  }
                  return (
                    <tr
                      key={
                        typeof item["Iniciativa"] === "string"
                          ? item["Iniciativa"]
                          : idx
                      }
                      className="border-b hover:bg-muted/50 cursor-pointer"
                      onClick={() => handleOpenModal(item)}
                    >
                      <td className="p-3">
                        <Badge variant="secondary">
                          {typeof item["Área"] === "string" ? item["Área"] : ""}
                        </Badge>
                      </td>
                      <td className="p-3 font-medium">
                        <span
                          className="underline cursor-pointer text-lab-primary hover:text-lab-primary-dark"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleOpenModal(item);
                          }}
                        >
                          {typeof item["Iniciativa"] === "string"
                            ? item["Iniciativa"]
                            : ""}
                        </span>
                      </td>
                      <td className="p-3">
                        {typeof item["Sponsor/BO"] === "string"
                          ? item["Sponsor/BO"]
                          : ""}
                      </td>
                      <td className="p-3">
                        <Badge className="bg-lab-success/10 text-lab-success border-lab-success">
                          {typeof item["Experimentação"] === "string"
                            ? item["Experimentação"]
                            : ""}
                        </Badge>
                      </td>
                      <td className="p-3">
                        <BlinkingDot color={signalColor} />
                      </td>
                      <td className="p-3 text-sm text-muted-foreground">
                        <div
                          className="mb-1 text-sm font-semibold text-gray-800 flex items-center gap-2 cursor-pointer"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleOpenHistoryModal(item);
                          }}
                        >
                          {editIdx === idx ? (
                            <>
                              <input
                                type="text"
                                className="border rounded px-2 py-1 w-full"
                                value={editValue}
                                onChange={(e) => setEditValue(e.target.value)}
                                autoFocus
                              />
                              <button
                                className="ml-2 px-2 py-1 bg-blue-600 text-white rounded text-xs"
                                onClick={() => handleSaveEdit(idx)}
                              >
                                Salvar
                              </button>
                              <button
                                className="ml-2 px-2 py-1 bg-gray-300 text-gray-800 rounded text-xs"
                                onClick={() => {
                                  setEditIdx(null);
                                  setEditValue("");
                                }}
                              >
                                Cancelar
                              </button>
                            </>
                          ) : (
                            <>
                              {typeof item[
                                "Situação Atual e Próximos passos"
                              ] === "string" ? (
                                <span>
                                  {item["Situação Atual e Próximos passos"]}
                                </span>
                              ) : typeof item[
                                  "Situacao Atual e Proximos passos"
                                ] === "string" ? (
                                <span>
                                  {item["Situacao Atual e Proximos passos"]}
                                </span>
                              ) : typeof item["Situacao Atual"] === "string" ? (
                                <span>{item["Situacao Atual"]}</span>
                              ) : Array.isArray(
                                  item["Comentários/Pendências/Ações"]
                                ) &&
                                item["Comentários/Pendências/Ações"].length >
                                  0 ? (
                                (() => {
                                  const last =
                                    item["Comentários/Pendências/Ações"][
                                      item["Comentários/Pendências/Ações"]
                                        .length - 1
                                    ];
                                  return typeof last === "object" &&
                                    "texto" in last ? (
                                    <span>{last.texto}</span>
                                  ) : null;
                                })()
                              ) : null}
                              <button
                                className="p-1 hover:bg-blue-100 rounded"
                                title="Editar situação atual"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setEditIdx(idx);
                                  setEditValue(
                                    typeof item[
                                      "Situação Atual e Próximos passos"
                                    ] === "string"
                                      ? item["Situação Atual e Próximos passos"]
                                      : typeof item[
                                          "Situacao Atual e Proximos passos"
                                        ] === "string"
                                      ? item["Situacao Atual e Proximos passos"]
                                      : typeof item["Situacao Atual"] ===
                                        "string"
                                      ? item["Situacao Atual"]
                                      : ""
                                  );
                                }}
                              >
                                <Pencil
                                  className="w-4 h-4 text-blue-600"
                                  strokeWidth={2.2}
                                />
                              </button>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
                {/* Modal de detalhes do experimento */}
                <Dialog open={modalOpen} onOpenChange={setModalOpen}>
                  <DialogContent className="max-w-3xl w-full">
                    {modalExperiment && (
                      <div className="w-full">
                        <ExperimentDetailCard
                          experiment={modalExperiment}
                          onClose={() => setModalOpen(false)}
                        />
                      </div>
                    )}
                  </DialogContent>
                </Dialog>
                {/* Modal de histórico de situação atual e próximos passos */}
                <Dialog
                  open={historyModalOpen}
                  onOpenChange={setHistoryModalOpen}
                >
                  <DialogContent className="max-w-lg">
                    <DialogHeader>
                      <DialogTitle>
                        Histórico de Situação Atual e Próximos Passos
                      </DialogTitle>
                      <DialogDescription>
                        {historyModalData &&
                        Array.isArray(
                          historyModalData["Comentários/Pendências/Ações"]
                        ) &&
                        historyModalData["Comentários/Pendências/Ações"]
                          .length > 0
                          ? `Total: ${historyModalData["Comentários/Pendências/Ações"].length}`
                          : "Nenhum histórico disponível."}
                      </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-2 max-h-96 overflow-y-auto">
                      {historyModalData &&
                      Array.isArray(
                        historyModalData["Comentários/Pendências/Ações"]
                      ) &&
                      historyModalData["Comentários/Pendências/Ações"].length >
                        0 ? (
                        historyModalData["Comentários/Pendências/Ações"]
                          .sort(
                            (a, b) =>
                              new Date(b.data).getTime() -
                              new Date(a.data).getTime()
                          )
                          .map((coment, idx) => (
                            <div
                              key={idx}
                              className="mb-3 p-3 border rounded bg-muted"
                            >
                              <div className="text-xs text-gray-500 mb-1">
                                {coment.data
                                  ? new Date(coment.data).toLocaleString()
                                  : "Sem data"}
                              </div>
                              <div className="font-semibold">
                                {coment.texto || "Sem texto"}
                              </div>
                            </div>
                          ))
                      ) : (
                        <div className="text-gray-400">
                          Nenhum histórico disponível.
                        </div>
                      )}
                    </div>
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

export default ExperimentosAndamento;
