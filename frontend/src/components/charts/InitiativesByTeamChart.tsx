import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  LabelList,
} from "recharts";

interface InitiativesByTeamChartProps {
  data: { name: string; value: number; color?: string }[];
}

export function InitiativesByTeamChart({ data }: InitiativesByTeamChartProps) {
  return (
    <div className="h-56">
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
            fill="hsl(var(--lab-primary))"
            radius={[4, 4, 0, 0]}
          >
            <LabelList dataKey="value" position="top" fontSize={13} />
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
