import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, ResponsiveContainer } from 'recharts'
import { Upload, Download, Filter, Search } from "lucide-react"
import { toast } from "sonner"

const processSteps = [
  { number: 15, label: "Experimentos em Andamento", status: "active" },
  { number: 4, label: "Aguardando Avaliação Inicial", status: "waiting" },
  { number: 3, label: "Aguardando Aprovação Executiva", status: "waiting" },
  { number: 1, label: "Aguardando Processo de Delivery", status: "waiting" },
  { number: 3, label: "Piloto em Validação", status: "validation" },
  { number: 4, label: "Em Avaliação de Esforço e Custo", status: "evaluation" },
]

const initiativeData = [
  { name: 'WEB 3', value: 5, color: 'hsl(var(--lab-primary))' },
  { name: 'Experimentos IA', value: 8, color: 'hsl(var(--lab-primary-dark))' },
  { name: 'Future network', value: 2, color: 'hsl(var(--lab-secondary))' },
  { name: 'Outras Tecnologias', value: 2, color: 'hsl(var(--lab-accent))' },
]

const areaData = [
  { name: 'Digital', value: 4 },
  { name: 'RH', value: 1 },
  { name: 'Canais Remotos', value: 1 },
  { name: 'TI', value: 1 },
  { name: 'Canais Críticos', value: 1 },
  { name: 'Novos Negócios MVNO', value: 1 },
]

const highlights = [
  {
    area: "Canais Remotos",
    experiment: "Acesso \"Home do Time\" no Live e no Maquina TI",
    responsible: "SeCiTi Labs",
    status: "Pedido de mais Barbas IoT"
  },
  {
    area: "Experiência",
    experiment: "Acesso \"Código do Produto de Acesso Mega GB TI\"",
    responsible: "SeCiTi Labs", 
    status: "Passo de obtenção esperimentado do cabo da tela"
  },
  {
    area: "Operações Técnicas",
    experiment: "Configure Navegação Tela ampliada que trouxeram Descrição de download de vídeo",
    responsible: "SeCiTi Labs",
    status: "TI-Time&s Call Center"
  }
]

const ExperimentosAndamento = () => {
  const [searchTerm, setSearchTerm] = useState("")

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file && file.type === 'text/csv') {
      toast.success(`Arquivo ${file.name} carregado com sucesso!`)
      // Here you would process the CSV file
    } else {
      toast.error("Por favor, selecione um arquivo CSV válido")
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center mb-8">
        <div>
          <h2 className="text-3xl font-bold text-foreground mb-2">Experimentos em Andamento</h2>
          <p className="text-muted-foreground">Acompanhamento detalhado dos processos ativos</p>
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
          <CardDescription>Visão geral do fluxo de experimentos</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap items-center gap-4 p-4">
            {processSteps.map((step, index) => (
              <div key={index} className="flex items-center">
                <div className={`
                  relative flex flex-col items-center p-4 rounded-lg border-2 min-w-[140px]
                  ${step.status === 'active' ? 'bg-lab-primary/10 border-lab-primary' : 
                    step.status === 'waiting' ? 'bg-lab-warning/10 border-lab-warning' :
                    step.status === 'validation' ? 'bg-lab-secondary/10 border-lab-secondary' :
                    'bg-lab-accent/10 border-lab-accent'}
                `}>
                  <div className={`
                    text-2xl font-bold mb-1
                    ${step.status === 'active' ? 'text-lab-primary' : 
                      step.status === 'waiting' ? 'text-lab-warning' :
                      step.status === 'validation' ? 'text-lab-secondary' :
                      'text-lab-accent'}
                  `}>
                    {step.number}
                  </div>
                  <div className="text-xs text-center font-medium text-foreground">
                    {step.label}
                  </div>
                </div>
                {index < processSteps.length - 1 && (
                  <div className="w-8 h-px bg-border mx-2" />
                )}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Qtde por Tipo de Iniciativa */}
        <Card className="shadow-card">
          <CardHeader>
            <CardTitle>Qtde por Tipo de Iniciativa</CardTitle>
            <CardDescription>Distribuição por categoria de tecnologia</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={initiativeData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                  <XAxis dataKey="name" stroke="#64748b" fontSize={12} />
                  <YAxis stroke="#64748b" fontSize={12} />
                  <Bar dataKey="value" fill="hsl(var(--lab-primary))" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Qtde Por Área */}
        <Card className="shadow-card">
          <CardHeader>
            <CardTitle>Qtde Por Área</CardTitle>
            <CardDescription>Distribuição por área organizacional</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={areaData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                  <XAxis dataKey="name" stroke="#64748b" fontSize={12} />
                  <YAxis stroke="#64748b" fontSize={12} />
                  <Bar dataKey="value" fill="hsl(var(--lab-primary))" radius={[4, 4, 0, 0]} />
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
            <Badge variant="outline" className="border-lab-warning text-lab-warning">
              Nota
            </Badge>
            <span className="font-medium text-foreground">
              Incluir visão de Experimentos com mais de 1 ciclo
            </span>
          </div>
        </CardContent>
      </Card>

      {/* Highlights Table */}
      <Card className="shadow-card">
        <CardHeader>
          <CardTitle>Destaques</CardTitle>
          <CardDescription>Experimentos em destaque no período</CardDescription>
          
          <div className="flex gap-3 mt-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
              <Input
                placeholder="Buscar experimentos..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <Button variant="outline" size="sm">
              <Filter className="w-4 h-4 mr-2" />
              Filtros
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b">
                  <th className="text-left p-3 font-medium text-muted-foreground">Área Demandante</th>
                  <th className="text-left p-3 font-medium text-muted-foreground">Experimento</th>
                  <th className="text-left p-3 font-medium text-muted-foreground">Responsável</th>
                  <th className="text-left p-3 font-medium text-muted-foreground">Status</th>
                  <th className="text-left p-3 font-medium text-muted-foreground">Comentários/Pendências/Ações</th>
                </tr>
              </thead>
              <tbody>
                {highlights
                  .filter(item => 
                    searchTerm === "" || 
                    item.area.toLowerCase().includes(searchTerm.toLowerCase()) ||
                    item.experiment.toLowerCase().includes(searchTerm.toLowerCase())
                  )
                  .map((item, index) => (
                  <tr key={index} className="border-b hover:bg-muted/50">
                    <td className="p-3">
                      <Badge variant="secondary">{item.area}</Badge>
                    </td>
                    <td className="p-3 font-medium">{item.experiment}</td>
                    <td className="p-3">{item.responsible}</td>
                    <td className="p-3">
                      <Badge className="bg-lab-success/10 text-lab-success border-lab-success">
                        SeCiTi Labs
                      </Badge>
                    </td>
                    <td className="p-3 text-sm text-muted-foreground">{item.status}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

export default ExperimentosAndamento