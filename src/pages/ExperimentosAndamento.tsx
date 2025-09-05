import { useState } from "react"
import { useExperimentos } from '@/hooks/useExperimentos';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, ResponsiveContainer, LabelList } from 'recharts'
import { Upload, Download, Filter, Search } from "lucide-react"
import { toast } from "sonner"

const statusLabels = [
  { key: 'Em planejamento', label: 'Em Planejamento', color: 'border-indigo-600 text-indigo-700 bg-indigo-100' },
  { key: 'Em refinamento', label: 'Em Refinamento', color: 'border-purple-600 text-purple-700 bg-purple-100' },
  { key: 'Em andamento', label: 'Em Andamento', color: 'border-lab-primary text-lab-primary bg-lab-primary/10' },
  { key: 'Em Testes', label: 'Em Testes', color: 'border-pink-600 text-pink-700 bg-pink-100' },
  { key: 'Em validação', label: 'Em Validação', color: 'border-orange-600 text-orange-700 bg-orange-100' },
  { key: 'Concluido', label: 'Concluídos', color: 'border-green-600 text-green-700 bg-green-100' },
  { key: 'Concluido com Pivot', label: 'Concluídos com Pivot', color: 'border-blue-600 text-blue-700 bg-blue-100' },
  { key: 'Concluido - Aguardando Go/No para Piloto', label: 'Concluídos Aguardando Go/No para Piloto', color: 'border-yellow-500 text-yellow-700 bg-yellow-100' },
  { key: 'Arquivado', label: 'Arquivado', color: 'border-gray-400 text-gray-600 bg-gray-100' },
];

function normalizeStatus(status: string) {
  if (!status) return '';
  return status.normalize('NFD').replace(/\p{Diacritic}/gu, '').toLowerCase();
}



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

  const [searchTerm, setSearchTerm] = useState("");
  const { data, loading, setData, experimentosPorTipo } = useExperimentos();

  // Gerar dados de área a partir da lista de experimentos
  const areaCounts: { [key: string]: number } = {};
  data.forEach(item => {
    const area = item['Área']?.trim();
    if (area) {
      areaCounts[area] = (areaCounts[area] || 0) + 1;
    }
  });
  const areaData = Object.entries(areaCounts).map(([name, value]) => ({ name, value }));

  // Filtra experimentos em andamento
  const andamento = data.filter(item => (item['Experimentação'] || '').trim().toLowerCase() === 'em andamento');

  // Função para atualizar comentário
  const handleComentarioChange = (idx: number, value: string) => {
    const updated = [...data];
    const indexInData = data.findIndex(item => item['Iniciativa'] === andamento[idx]['Iniciativa']);
    if (indexInData !== -1) {
      updated[indexInData]['Comentários/Pendências/Ações'] = value;
      setData(updated);
    }
  };

  // Modal para descrição
  const [modalOpen, setModalOpen] = useState(false);
  const [modalDescricao, setModalDescricao] = useState("");
  const [modalTitulo, setModalTitulo] = useState("");
  const handleOpenModal = (item: any) => {
    setModalTitulo(item['Iniciativa']);
    setModalDescricao(item['Descrição'] || "Sem descrição disponível.");
    setModalOpen(true);
  };

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file && file.type === 'text/csv') {
      toast.success(`Arquivo ${file.name} carregado com sucesso!`);
      // Here you would process the CSV file
    } else {
      toast.error("Por favor, selecione um arquivo CSV válido");
    }
  };

  // Calcular statusCounts dinamicamente a partir dos dados, usando 'Experimentação'
  // Função para normalizar status (remove acentos, minúsculas, trim)
  const normalize = (str: string) => (str || '').normalize('NFD').replace(/\p{Diacritic}/gu, '').trim().toLowerCase();

  // Calcular statusCounts para cada statusLabel
  const statusCounts: { [key: string]: number } = {};
  statusLabels.forEach(label => {
    const normKey = normalize(label.key);
    statusCounts[label.key] = data.filter(item => normalize(item['Experimentação']) === normKey).length;
  });

  // Hook para controlar card selecionado e experimentos filtrados
  const [selectedStatus, setSelectedStatus] = useState<string | null>(null);
  const [statusModalOpen, setStatusModalOpen] = useState(false);
  // Modal: filtrar experimentos pelo campo correto, normalizando
  const experimentsForStatus = selectedStatus
    ? data.filter(item => normalize(item['Experimentação']) === normalize(selectedStatus))
    : [];

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
                  <div className={`text-2xl font-bold mb-1 ${step.color.split(' ')[1]}`}>
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
                <DialogTitle>Experimentos com status: {selectedStatus}</DialogTitle>
                <DialogDescription>
                  {experimentsForStatus.length === 0
                    ? "Nenhum experimento encontrado."
                    : `Total: ${experimentsForStatus.length}`}
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-2 max-h-96 overflow-y-auto">
                {experimentsForStatus.map((exp, idx) => (
                  <div key={exp['Iniciativa'] || idx} className="p-2 rounded border bg-muted">
                    <div className="font-semibold">{exp['Iniciativa']}</div>
                    <div className="text-xs text-muted-foreground">{exp['Descrição']}</div>
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
            <CardDescription>Distribuição por categoria de tecnologia</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={experimentosPorTipo} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                  <XAxis dataKey="name" stroke="#64748b" fontSize={12} />
                  <YAxis stroke="#64748b" fontSize={12} />
                  <Bar dataKey="value" fill="hsl(var(--lab-primary))" radius={[4, 4, 0, 0]}>
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
            <CardDescription>Distribuição por área organizacional</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-80 overflow-x-auto">
              <ResponsiveContainer width={Math.max(600, areaData.length * 80)} height="100%">
                <BarChart data={areaData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                  <XAxis dataKey="name" stroke="#64748b" fontSize={12} interval={0} angle={-45} textAnchor="end" height={60} />
                  <YAxis stroke="#64748b" fontSize={12} />
                  <Bar dataKey="value" fill="hsl(var(--lab-primary))" radius={[4, 4, 0, 0]}>
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
            <Badge variant="outline" className="border-lab-warning text-lab-warning">
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
          <CardDescription>Lista dos experimentos ativos, editáveis</CardDescription>
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
                {andamento.map((item, idx) => (
                  <tr key={item['Iniciativa']} className="border-b hover:bg-muted/50 cursor-pointer" onClick={() => handleOpenModal(item)}>
                    <td className="p-3">
                      <Badge variant="secondary">{item['Área']}</Badge>
                    </td>
                    <td className="p-3 font-medium">{item['Iniciativa']}</td>
                    <td className="p-3">{item['Sponsor/BO']}</td>
                    <td className="p-3">
                      <Badge className="bg-lab-success/10 text-lab-success border-lab-success">
                        {item['Experimentação']}
                      </Badge>
                    </td>
                    <td className="p-3 text-sm text-muted-foreground" onClick={e => e.stopPropagation()}>
                      <Input
                        value={item['Comentários/Pendências/Ações'] || ''}
                        onChange={e => handleComentarioChange(idx, e.target.value)}
                        placeholder="Adicionar comentário, pendência ou ação..."
                        className="w-full"
                      />
                    </td>
                  </tr>
                ))}
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
  )
}

export default ExperimentosAndamento