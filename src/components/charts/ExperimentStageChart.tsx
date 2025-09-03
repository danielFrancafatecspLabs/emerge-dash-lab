import { BarChart, Bar, XAxis, YAxis, CartesianGrid, ResponsiveContainer } from 'recharts'

const defaultData = [
  { name: 'Ideias Geradas', value: 109, percentage: 100 },
  { name: 'Aprovado Critério de seleção', value: 76, percentage: 70 },
  { name: 'Priorizadas', value: 60, percentage: 55 },
  { name: 'Em Andamento', value: 30, percentage: 28 },
  { name: 'Piloto', value: 15, percentage: 14 },
  { name: 'Projeto/Produto', value: 8, percentage: 7 },
]

interface ExperimentStageChartProps {
  data?: typeof defaultData
}

export function ExperimentStageChart({ data = defaultData }: ExperimentStageChartProps) {
  return (
    <div className="h-80">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart
          data={data}
          layout="vertical"
          margin={{ top: 20, right: 30, left: 100, bottom: 5 }}
        >
          <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
          <XAxis type="number" stroke="#64748b" fontSize={12} />
          <YAxis 
            type="category" 
            dataKey="name" 
            stroke="#64748b" 
            fontSize={12}
            width={90}
          />
          <Bar 
            dataKey="value" 
            fill="hsl(var(--lab-accent))"
            radius={[0, 4, 4, 0]}
          />
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}