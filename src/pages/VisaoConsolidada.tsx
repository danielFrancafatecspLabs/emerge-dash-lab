import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { useExperimentos } from "@/hooks/useExperimentos";
import { ExperimentFunnelChart } from "@/components/charts/ExperimentFunnelChart";
import { ExperimentTypeChart } from "@/components/charts/ExperimentTypeChart";
import { MonthlyExperimentsChart } from "@/components/charts/MonthlyExperimentsChart";
import { IdeasPieChart } from "@/components/charts/IdeasPieChart";
import { DollarSign, TrendingUp, Target, Lightbulb } from "lucide-react";
// import mongoose from 'mongoose';

const VisaoConsolidada = () => {
  const {
    total,
    pilotosAndamento,
    pilotosConcluidos,
    totalProspeccao,
    totalAndamento,
    totalConcluido,
    totalConcluidoGoNoGo,
    loading,
    experimentosPorEtapa,
    experimentosPorTipo,
    experimentosPorMes,
    ideiasData,
    anoColors,
    data,
    getCount,
  } = useExperimentos();

  const backlogClassificacoes = ["Backlog", "Em backlog", "Não iniciado"];
  const backlogColunas = [
    "Situação Atual e Próximos passos",
    "Ideia / Problema / Oportunidade",
    "Status",
    "Experimentação",
    "Classificação",
  ];
  let totalBacklog = 0;
  if (data && data.length > 0) {
    totalBacklog = backlogColunas.reduce((acc, col) => {
      return (
        acc +
        backlogClassificacoes.reduce((sum, classificacao) => {
          return sum + getCount(col, classificacao);
        }, 0)
      );
    }, 0);
  }

  // Calcular tempo médio para terminar um ciclo de experimento
  const today = new Date();
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
  const media =
    validExperimentos.length > 0
      ? Math.round(totalDias / validExperimentos.length)
      : 0;

  return (
    <div className="space-y-6">
      {/* Header Section */}
      <div className="mb-8">
        <h2 className="text-3xl font-bold text-foreground mb-2">
          Visão Consolidada
        </h2>
        <p className="text-muted-foreground">
          Benefícios esperados dos Experimentos
        </p>
      </div>

      {/* Economic Potential Card */}
      <Card className="bg-gradient-card shadow-elevated border-lab-primary/20">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-lab-primary">
            <DollarSign className="w-5 h-5" />
            Potencial Econômico
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-3xl font-bold text-lab-primary mb-1">
            R$ 69.850.000
          </div>
          <p className="text-sm text-muted-foreground">
            Projeção anual consolidada
          </p>
        </CardContent>
      </Card>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-7 gap-6 mb-8">
        <Card className="shadow-card">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Total de Experimentos
            </CardTitle>
            <Target className="h-4 w-4 text-lab-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-lab-primary">
              {total !== null ? total : "Carregando..."}
            </div>
            <p className="text-xs text-muted-foreground">
              +15% em relação ao período anterior
            </p>
          </CardContent>
        </Card>
        <Card className="shadow-card">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Backlog</CardTitle>
            <TrendingUp className="h-4 w-4 text-yellow-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-500">
              {loading && (!data || data.length === 0)
                ? "Carregando..."
                : !loading && data && data.length === 0
                ? "Nenhum experimento encontrado"
                : totalBacklog}
            </div>
            <p className="text-xs text-muted-foreground">
              Experimentos no backlog
            </p>
          </CardContent>
        </Card>
        <Card className="shadow-card">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Em Prospecção</CardTitle>
            <TrendingUp className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">
              {totalProspeccao !== null ? totalProspeccao : "Carregando..."}
            </div>
            <p className="text-xs text-muted-foreground">
              Experimentos em prospecção
            </p>
          </CardContent>
        </Card>

        <Card className="shadow-card">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Em Andamento</CardTitle>
            <TrendingUp className="h-4 w-4 text-lab-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-lab-primary">
              {totalAndamento !== null ? totalAndamento : "Carregando..."}
            </div>
            <p className="text-xs text-muted-foreground">Experimentos ativos</p>
          </CardContent>
        </Card>

        <Card className="shadow-card">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Concluídos</CardTitle>
            <TrendingUp className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {totalConcluido !== null ? totalConcluido : "Carregando..."}
            </div>
            <p className="text-xs text-muted-foreground">
              Experimentos concluídos
            </p>
          </CardContent>
        </Card>

        <Card className="shadow-card">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Concluídos aguardando Go/No Go
            </CardTitle>
            <TrendingUp className="h-4 w-4 text-yellow-500" />
          </CardHeader>
          <CardContent className="flex flex-col justify-start min-h-[80px]">
            <div className="text-2xl font-bold text-yellow-500 min-h-[32px] flex items-start">
              {totalConcluidoGoNoGo !== null
                ? totalConcluidoGoNoGo
                : "Carregando..."}
            </div>
            <p className="text-xs text-muted-foreground">Aguardando decisão</p>
          </CardContent>
        </Card>

        <Card className="shadow-card">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Pilotos em Andamento
            </CardTitle>
            <TrendingUp className="h-4 w-4 text-indigo-600" />
          </CardHeader>
          <CardContent className="flex flex-col justify-start min-h-[80px]">
            <div className="text-2xl font-bold text-indigo-600 min-h-[32px] flex items-start">
              {pilotosAndamento !== null ? pilotosAndamento : "Carregando..."}
            </div>
            <p className="text-xs text-muted-foreground">Pilotos ativos</p>
          </CardContent>
        </Card>

        <Card className="shadow-card">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Pilotos Concluídos
            </CardTitle>
            <TrendingUp className="h-4 w-4 text-green-700" />
          </CardHeader>
          <CardContent className="flex flex-col justify-start min-h-[80px]">
            <div className="text-2xl font-bold text-green-700 min-h-[32px] flex items-start">
              {pilotosConcluidos !== null ? pilotosConcluidos : "Carregando..."}
            </div>
            <p className="text-xs text-muted-foreground">Pilotos concluídos</p>
          </CardContent>
        </Card>

        <Card className="shadow-card">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Taxa de Conversão
            </CardTitle>
            <Lightbulb className="h-4 w-4 text-lab-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-lab-primary">7.3%</div>
            <p className="text-xs text-muted-foreground">Ideias → Piloto</p>
          </CardContent>
        </Card>

        {/* Card tempo médio ciclo experimento */}
        <Card className="shadow-card">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Tempo médio para terminar um ciclo de experimento
            </CardTitle>
            <TrendingUp className="h-4 w-4 text-lab-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-lab-primary">
              {media} dias
            </div>
            <p className="text-xs text-muted-foreground">
              Base: experimentos com data de início
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Charts Section */}
      <div>
        <h3 className="text-2xl font-bold text-foreground mb-6">
          Resultado de Experimentos
        </h3>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Experimentos por Etapa */}
          <Card className="shadow-card">
            <CardHeader>
              <CardTitle className="text-lg">Experimentos por Etapa</CardTitle>
              <CardDescription>
                Distribuição por fase do processo
              </CardDescription>
            </CardHeader>
            <CardContent>
              {/* Funil de conversão por etapa */}
              <ExperimentFunnelChart
                stages={[
                  {
                    name: "Ideias geradas",
                    value: data.length,
                    color: "#f43f5e",
                  },
                  {
                    name: "Aprovados no critério de seleção",
                    value: data.filter(item => typeof item["Experimentação"] === "string" && item["Experimentação"].toLowerCase().includes("em andamento")).length,
                    color: "#fbbf24",
                  },
                  {
                    name: "Experimentos Concluídos",
                    value: data.filter(item => typeof item["Experimentação"] === "string" && item["Experimentação"].toLowerCase().includes("concluido")).length,
                    color: "#fde68a",
                  },
                  {
                    name: "Piloto Concluídos",
                    value: data.filter(item => typeof item["Piloto"] === "string" && ["concluido", "em andamento"].some(s => (item["Piloto"] as string).toLowerCase().includes(s))).length,
                    color: "#4ade80",
                  },
                  {
                    name: "Projeto / Produto",
                    value: data.filter(item => typeof item["Escala"] === "string" && item["Escala"].toLowerCase().includes("produtização")).length,
                    color: "#2563eb",
                  },
                ]}
              />
            </CardContent>
          </Card>

          {/* Piloto/Projeto por Tipo */}
          <Card className="shadow-card">
            <CardHeader>
              <CardTitle className="text-lg">
                Piloto/Projeto por Tipo de experimento
              </CardTitle>
              <CardDescription>Categorização por tecnologia</CardDescription>
            </CardHeader>
            <CardContent>
              <ExperimentTypeChart data={experimentosPorTipo} />
            </CardContent>
          </Card>

          {/* Experimentos por Mês */}
          <Card className="shadow-card">
            <CardHeader>
              <CardTitle className="text-lg">
                QTD DE EXPERIMENTOS REALIZADOS POR MÊS
              </CardTitle>
              <CardDescription>
                Evolução temporal dos experimentos
              </CardDescription>
            </CardHeader>
            <CardContent>
              <MonthlyExperimentsChart
                data={experimentosPorMes}
                anoColors={anoColors}
              />
            </CardContent>
          </Card>

          {/* Ideias que não evoluíram */}
          <Card className="shadow-card">
            <CardHeader>
              <CardTitle className="text-lg">
                Ideias que não evoluíram para piloto
              </CardTitle>
              <CardDescription>
                Análise de ideias não convertidas
              </CardDescription>
            </CardHeader>
            <CardContent>
              <IdeasPieChart data={ideiasData} />
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default VisaoConsolidada;
