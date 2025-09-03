import { LineChart, Line, XAxis, YAxis, CartesianGrid, ResponsiveContainer } from 'recharts'

const defaultData = [
  { month: 'Janeiro', value: 2 },
  { month: 'Fev', value: 5 },
  { month: 'Mar', value: 12 },
  { month: 'Abr', value: 15 },
  { month: 'Mai', value: 16 },
  { month: 'Jun', value: 17 },
]

interface MonthlyExperimentsChartProps {
  data?: typeof defaultData
}

export function MonthlyExperimentsChart({ data = defaultData }: MonthlyExperimentsChartProps) {
  return (
    <div className="h-80">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart
          data={data}
          margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
        >
          <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
          <XAxis dataKey="month" stroke="#64748b" fontSize={12} />
          <YAxis stroke="#64748b" fontSize={12} />
          <Line 
            type="monotone" 
            dataKey="value" 
            stroke="hsl(var(--lab-danger))" 
            strokeWidth={3}
            dot={{ fill: 'hsl(var(--lab-danger))', strokeWidth: 2, r: 4 }}
            activeDot={{ r: 6, fill: 'hsl(var(--lab-danger))' }}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  )
}