import { BarChart, Bar, XAxis, YAxis, CartesianGrid, ResponsiveContainer } from 'recharts'

const defaultData = [
  { name: 'WEB 3', value: 6, color: 'hsl(var(--lab-danger))' },
  { name: 'Experimentos IA', value: 5, color: 'hsl(var(--lab-accent))' },
  { name: 'Future network', value: 2, color: 'hsl(var(--lab-secondary))' },
  { name: 'Outras Tecnologias', value: 2, color: 'hsl(var(--lab-warning))' },
]

interface ExperimentTypeChartProps {
  data?: typeof defaultData
}

export function ExperimentTypeChart({ data = defaultData }: ExperimentTypeChartProps) {
  return (
    <div className="h-80">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart
          data={data}
          margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
        >
          <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
          <XAxis dataKey="name" stroke="#64748b" fontSize={12} />
          <YAxis stroke="#64748b" fontSize={12} />
          <Bar 
            dataKey="value" 
            fill="hsl(var(--lab-accent))"
            radius={[4, 4, 0, 0]}
          />
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}