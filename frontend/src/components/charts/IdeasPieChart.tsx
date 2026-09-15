import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from 'recharts'

const defaultData = [
  { name: 'Ideias Reprovadas no critério de seleção', value: 30, color: 'hsl(var(--lab-primary))' },
  { name: 'Ideias Despriorizadas (em backlog)', value: 22, color: 'hsl(var(--lab-primary-dark))' },
  { name: 'Experimentos que não atingiram o critério para piloto', value: 44, color: 'hsl(var(--lab-secondary))' },
  { name: 'Experimentos sem engajamento do BU/Sponsor', value: 4, color: 'hsl(var(--lab-accent))' },
]

interface IdeasPieChartProps {
  data?: typeof defaultData
}

export function IdeasPieChart({ data = defaultData }: IdeasPieChartProps) {
  return (
    <div className="h-80">
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie
            data={data}
            cx="50%"
            cy="50%"
            innerRadius={40}
            outerRadius={100}
            paddingAngle={2}
            dataKey="value"
          >
            {data.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={entry.color} />
            ))}
          </Pie>
          <Tooltip formatter={(value, name, props) => [`${value}`, props.payload.name]} />
          <Legend 
            verticalAlign="bottom" 
            height={36}
            wrapperStyle={{ fontSize: '12px' }}
          />
        </PieChart>
      </ResponsiveContainer>
    </div>
  )
}