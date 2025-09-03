import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { ExperimentStageChart } from "@/components/charts/ExperimentStageChart"
import { ExperimentTypeChart } from "@/components/charts/ExperimentTypeChart"
import { MonthlyExperimentsChart } from "@/components/charts/MonthlyExperimentsChart"
import { IdeasPieChart } from "@/components/charts/IdeasPieChart"
import { DollarSign, TrendingUp, Target, Lightbulb } from "lucide-react"

const VisaoConsolidada = () => {
  return (
    <div className="space-y-6">
      {/* Header Section */}
      <div className="mb-8">
        <h2 className="text-3xl font-bold text-foreground mb-2">Visão Consolidada</h2>
        <p className="text-muted-foreground">Benefícios esperados dos Experimentos</p>
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
          <div className="text-3xl font-bold text-lab-primary mb-1">R$ 2.850.000</div>
          <p className="text-sm text-muted-foreground">Projeção anual consolidada</p>
        </CardContent>
      </Card>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <Card className="shadow-card">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total de Experimentos</CardTitle>
            <Target className="h-4 w-4 text-lab-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-lab-primary">109</div>
            <p className="text-xs text-muted-foreground">+15% em relação ao período anterior</p>
          </CardContent>
        </Card>

        <Card className="shadow-card">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Em Andamento</CardTitle>
            <TrendingUp className="h-4 w-4 text-lab-secondary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-lab-secondary">30</div>
            <p className="text-xs text-muted-foreground">Experimentos ativos</p>
          </CardContent>
        </Card>

        <Card className="shadow-card">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Taxa de Conversão</CardTitle>
            <Lightbulb className="h-4 w-4 text-lab-warning" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-lab-warning">7.3%</div>
            <p className="text-xs text-muted-foreground">Ideias → Piloto</p>
          </CardContent>
        </Card>
      </div>

      {/* Charts Section */}
      <div>
        <h3 className="text-2xl font-bold text-foreground mb-6">Resultado de Experimentos</h3>
        
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Experimentos por Etapa */}
          <Card className="shadow-card">
            <CardHeader>
              <CardTitle className="text-lg">Experimentos por Etapa</CardTitle>
              <CardDescription>Distribuição por fase do processo</CardDescription>
            </CardHeader>
            <CardContent>
              <ExperimentStageChart />
            </CardContent>
          </Card>

          {/* Piloto/Projeto por Tipo */}
          <Card className="shadow-card">
            <CardHeader>
              <CardTitle className="text-lg">Piloto/Projeto por Tipo de experimento</CardTitle>
              <CardDescription>Categorização por tecnologia</CardDescription>
            </CardHeader>
            <CardContent>
              <ExperimentTypeChart />
            </CardContent>
          </Card>

          {/* Experimentos por Mês */}
          <Card className="shadow-card">
            <CardHeader>
              <CardTitle className="text-lg">QTD DE EXPERIMENTOS REALIZADOS POR MÊS</CardTitle>
              <CardDescription>Evolução temporal dos experimentos</CardDescription>
            </CardHeader>
            <CardContent>
              <MonthlyExperimentsChart />
            </CardContent>
          </Card>

          {/* Ideias que não evoluíram */}
          <Card className="shadow-card">
            <CardHeader>
              <CardTitle className="text-lg">Ideias que não evoluíram para piloto</CardTitle>
              <CardDescription>Análise de ideias não convertidas</CardDescription>
            </CardHeader>
            <CardContent>
              <IdeasPieChart />
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}

export default VisaoConsolidada