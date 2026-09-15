import React from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  LabelList,
} from "recharts";

export interface MonthlyLeadtimeData {
  month: string;
  avgDays: number;
}

interface Props {
  data: MonthlyLeadtimeData[];
}

export default function ExperimentLeadtimeMonthlyChart({ data }: Props) {
  return (
    <ResponsiveContainer width="100%" height={220}>
      <BarChart
        data={data}
        margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
      >
        <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
        <XAxis dataKey="month" stroke="#64748b" fontSize={12} />
        <YAxis stroke="#64748b" fontSize={12} />
        <Tooltip formatter={(value) => `${value} dias`} />
        <Bar
          dataKey="avgDays"
          fill="hsl(var(--lab-primary))"
          radius={[4, 4, 0, 0]}
        >
          <LabelList dataKey="avgDays" position="top" fontSize={13} />
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}
