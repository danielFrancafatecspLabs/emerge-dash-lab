import React from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { useExperimentos } from "@/hooks/useExperimentos";
// import { ExperimentFunnelChart } from "@/components/charts/ExperimentFunnelChart";
import ExperimentFunnelCard from "../components/charts/ExperimentFunnelCard";
import { ExperimentTypeChart } from "@/components/charts/ExperimentTypeChart";
import { InitiativesByTeamChart } from "@/components/charts/InitiativesByTeamChart";
import { MonthlyExperimentsChart } from "@/components/charts/MonthlyExperimentsChart";
import { IdeasPieChart } from "@/components/charts/IdeasPieChart";
import { DollarSign, TrendingUp, Target, Lightbulb } from "lucide-react";
// import { filtrarPorAno } from "@/lib/experimentosUtils";

interface ExperimentoPorMes {
  month: string;
  ano: number;
  [key: string]: string | number;
}

const VisaoConsolidada = () => {
  // Filtro de ano para gráfico de experimentos por mês
  const [anoSelecionado, setAnoSelecionado] = React.useState<
    "Todos" | 2023 | 2024 | 2025
  >("Todos");
  // Filtrar dados conforme ano selecionado
  const anosDisponiveis = [2023, 2024, 2025];
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
  const experimentosPorMesFiltrado = filtrarPorAno(
    experimentosPorMes,
    anoSelecionado
  );

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

  // Calcular tempo médio para terminar um ciclo de experimento usando o percentil 85%
  const today = new Date();
  const validExperimentos = data.filter(
    (row) =>
      typeof row["Início "] === "string" &&
      row["Início "] &&
      !isNaN(new Date(row["Início "]).getTime())
  );
  // Calcular dias para cada experimento
  const diasArray = validExperimentos.map((row) => {
    const startDate =
      typeof row["Início "] === "string" ? new Date(row["Início "]) : today;
    return Math.max(
      0,
      Math.floor(
        (today.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)
      )
    );
  });
  // Ordenar dias
  const diasOrdenados = diasArray.sort((a, b) => a - b);
  // Calcular índice do percentil 85%
  const percentil = 0.85;
  const n = Math.floor(diasOrdenados.length * percentil);
  const diasParaMedia = diasOrdenados.slice(0, n > 0 ? n : 1);
  // Calcular média dos dias até o percentil 85%
  const media =
    diasParaMedia.length > 0
      ? Math.round(
          diasParaMedia.reduce((acc, val) => acc + val, 0) /
            diasParaMedia.length
        )
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

      {/* Indicadores Section */}
      <div className="mb-8">
        <h3 className="text-xl font-semibold text-foreground mb-4">
          Indicadores
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          {/* Potencial Econômico */}
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
          {/* Taxa de Conversão */}
          <Card className="shadow-card">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-sm font-medium">
                <Lightbulb className="h-4 w-4 text-lab-primary" />
                Taxa de Conversão
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-lab-primary">7.3%</div>
              <p className="text-xs text-muted-foreground">Ideias → Piloto</p>
            </CardContent>
          </Card>
          {/* Tempo médio ciclo */}
          <Card className="shadow-card">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-sm font-medium">
                <TrendingUp className="h-4 w-4 text-lab-primary" />
                Tempo médio para terminar um ciclo de experimento
              </CardTitle>
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
      </div>

      {/* Contagens Section */}
      <div className="mb-8">
        <h3 className="text-xl font-semibold text-foreground mb-4">
          Contagens
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-4 lg:grid-cols-7 gap-6">
          {/* Total de Experimentos */}
          <Card className="shadow-card">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-sm font-medium">
                <Target className="h-4 w-4 text-lab-primary" />
                Total de Experimentos
              </CardTitle>
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
          {/* Backlog */}
          <Card className="shadow-card">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-sm font-medium">
                <TrendingUp className="h-4 w-4 text-yellow-500" />
                Backlog
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-yellow-500">
                {loading && (!data || data.length === 0)
                  ? "Carregando..."
                  : totalBacklog}
              </div>
            </CardContent>
          </Card>
          {/* Em Andamento (Experimentação) */}
          <Card className="shadow-card">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-sm font-medium">
                <TrendingUp className="h-4 w-4 text-blue-500" />
                Em Andamento
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-blue-500">
                {data
                  ? data.filter(
                      (item) =>
                        typeof item["Experimentação"] === "string" &&
                        item["Experimentação"]
                          .toLowerCase()
                          .includes("em andamento")
                    ).length
                  : "Carregando..."}
              </div>
              <p className="text-xs text-muted-foreground">
                Experimentação em andamento
              </p>
            </CardContent>
          </Card>
          {/* Concluídos */}
          <Card className="shadow-card">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-sm font-medium">
                <TrendingUp className="h-4 w-4 text-green-600" />
                Concluídos
              </CardTitle>
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
          {/* Concluídos aguardando Go/No Go */}
          <Card className="shadow-card">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-sm font-medium">
                <TrendingUp className="h-4 w-4 text-yellow-500" />
                Concluídos aguardando Go/No Go
              </CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col justify-start min-h-[80px]">
              <div className="text-2xl font-bold text-yellow-500 min-h-[32px] flex items-start">
                {totalConcluidoGoNoGo !== null
                  ? totalConcluidoGoNoGo
                  : "Carregando..."}
              </div>
              <p className="text-xs text-muted-foreground">
                Aguardando decisão
              </p>
            </CardContent>
          </Card>
          {/* Pilotos em Andamento */}
          <Card className="shadow-card">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-sm font-medium">
                <TrendingUp className="h-4 w-4 text-indigo-600" />
                Pilotos em Andamento
              </CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col justify-start min-h-[80px]">
              <div className="text-2xl font-bold text-indigo-600 min-h-[32px] flex items-start">
                {pilotosAndamento !== null ? pilotosAndamento : "Carregando..."}
              </div>
              <p className="text-xs text-muted-foreground">Pilotos ativos</p>
            </CardContent>
          </Card>
          {/* Pilotos Concluídos */}
          <Card className="shadow-card">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-sm font-medium">
                <TrendingUp className="h-4 w-4 text-green-700" />
                Pilotos Concluídos
              </CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col justify-start min-h-[80px]">
              <div className="text-2xl font-bold text-green-700 min-h-[32px] flex items-start">
                {pilotosConcluidos !== null
                  ? pilotosConcluidos
                  : "Carregando..."}
              </div>
              <p className="text-xs text-muted-foreground">
                Pilotos concluídos
              </p>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Charts Section */}
      <div>
        <h3 className="text-2xl font-bold text-foreground mb-6">
          Resultado de Experimentos
        </h3>
        {/* Filtro de ano para gráfico de experimentos por mês */}

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-stretch">
          {/* Experimentos por Etapa */}
          <Card className="shadow-card">
            <CardHeader>
              <CardTitle className="text-lg">Experimentos por Etapa</CardTitle>
              <CardDescription>
                Distribuição por fase do processo
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ExperimentFunnelCard />
            </CardContent>
          </Card>

          {/* Piloto/Projeto por Tipo + Quantidade de Iniciativas por Time */}
          <div className="flex flex-col gap-0 h-full justify-between" style={{height: '100%'}}>
            <Card
              className="shadow-card flex-1"
              style={{ minHeight: "370px", height: "370px" }}
            >
              <CardHeader>
                <CardTitle className="text-lg">
                  Piloto/Projeto por Tipo de experimento
                </CardTitle>
                <CardDescription>Categorização por tecnologia</CardDescription>
              </CardHeader>
              <CardContent className="h-80 pt-8">
                <ExperimentTypeChart data={experimentosPorTipo} />
              </CardContent>
            </Card>
            <Card
              className="shadow-card flex-1 mt-4"
              style={{ minHeight: "370px", height: "370px" }}
            >
              <CardHeader>
                <CardTitle className="text-lg">
                  Quantidade de Iniciativas por Time
                </CardTitle>
                <CardDescription>Distribuição por time</CardDescription>
              </CardHeader>
              <CardContent className="h-80 pt-8">
                {/* Scroll horizontal igual EficienciaOperacional */}
                {(() => {
                  if (!data) return null;
                  // Agrupa por time, contando iniciativas únicas
                  const teamCount: Record<string, number> = {};
                  data.forEach((item) => {
                    const team =
                      typeof item["Times"] === "string"
                        ? item["Times"]
                        : "Outro";
                    const idea =
                      typeof item["Ideia / Problema / Oportunidade"] === "string"
                        ? item["Ideia / Problema / Oportunidade"]
                        : "";
                    if (team && idea) {
                      teamCount[team] = (teamCount[team] || 0) + 1;
                    }
                  });
                  const chartData = Object.entries(teamCount).map(([name, value]) => ({
                    name,
                    value,
                  }));
                  // minWidth dinâmico: 120px por time, mínimo 600px
                  const minWidth = Math.max(600, chartData.length * 120);
                  return (
                    <div style={{ width: "100%", overflowX: "auto" }}>
                      <div style={{ minWidth }}>
                        <InitiativesByTeamChart data={chartData} />
                      </div>
                    </div>
                  );
                })()}
              </CardContent>
            </Card>
          </div>

          {/* Experimentos por Mês */}
          <Card className="shadow-card">
            <CardHeader>
              <CardTitle className="text-lg">
                QTD DE EXPERIMENTOS REALIZADOS POR MÊS
              </CardTitle>
              <div className="mb-4 flex items-center gap-2">
                <label htmlFor="ano-select" className="text-sm font-medium">
                  Filtrar por ano:
                </label>
                <select
                  id="ano-select"
                  className="border rounded px-2 py-1 text-sm"
                  value={anoSelecionado}
                  onChange={(e) =>
                    setAnoSelecionado(
                      e.target.value === "Todos"
                        ? "Todos"
                        : (Number(e.target.value) as 2023 | 2024 | 2025)
                    )
                  }
                >
                  <option value="Todos">Todos</option>
                  {anosDisponiveis.map((ano) => (
                    <option key={ano} value={ano}>
                      {ano}
                    </option>
                  ))}
                </select>
              </div>
            </CardHeader>
            <CardContent>
              <MonthlyExperimentsChart
                data={(() => {
                  if (anoSelecionado === "Todos") {
                    // Todas as linhas (todos os anos)
                    return experimentosPorMesFiltrado.map((item) => {
                      const { month, ...rest } = item;
                      const filteredRest: {
                        [ano: string]: string | number | string[];
                      } = {};
                      Object.entries(rest).forEach(([key, value]) => {
                        if (
                          typeof value === "string" ||
                          typeof value === "number" ||
                          Array.isArray(value)
                        ) {
                          filteredRest[key] = value;
                        }
                      });
                      return { month, ...filteredRest };
                    });
                  } else {
                    // Só a linha do ano selecionado, com iniciativas
                    return experimentosPorMesFiltrado.map((item) => {
                      const { month } = item;
                      const value = item[anoSelecionado] || 0;
                      const iniciativas =
                        item[`${anoSelecionado}_iniciativas`] || [];
                      return {
                        month,
                        [anoSelecionado]: value,
                        [`${anoSelecionado}_iniciativas`]: iniciativas,
                      };
                    });
                  }
                })()}
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

function filtrarPorAno(
  experimentosPorMes: {
    [ano: string]: string | number | string[];
    month: string;
  }[],
  anoSelecionado: "Todos" | 2023 | 2024 | 2025
) {
  if (anoSelecionado === "Todos") {
    return experimentosPorMes;
  }
  return experimentosPorMes.filter((item) => {
    // Some items may have an 'ano' property, otherwise check if the year key exists
    if (typeof item.ano === "number") {
      return item.ano === anoSelecionado;
    }
    // If not, check if the year key exists and is not zero/empty
    return item[anoSelecionado] !== undefined && item[anoSelecionado] !== 0;
  });
}
export default VisaoConsolidada;
