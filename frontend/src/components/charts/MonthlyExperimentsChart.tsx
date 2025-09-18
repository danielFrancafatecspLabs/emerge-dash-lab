import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  Legend,
} from "recharts";
import type { TooltipProps } from "recharts";

function CustomTooltip({
  active,
  payload,
  label,
}: TooltipProps<"line", string>) {
  if (active && payload && payload.length) {
    return (
      <div
        style={{
          background: "#fff",
          border: "1px solid #e2e8f0",
          borderRadius: 8,
          padding: 12,
          boxShadow: "0 2px 8px #0001",
          minWidth: 220,
        }}
      >
        <div style={{ fontWeight: 600, marginBottom: 4 }}>Mês: {label}</div>
        {payload.map((entry) => {
          // entry type inferred from recharts TooltipProps
          const iniciativas =
            entry.payload?.[`${entry.dataKey}_iniciativas`] || [];
          return (
            <div
              key={entry.dataKey}
              style={{ color: entry.stroke, marginBottom: 8 }}
            >
              Ano: <b>{entry.dataKey}</b> — Qtd: <b>{entry.value}</b>
              {iniciativas.length > 0 && (
                <div style={{ fontSize: 13, marginTop: 2 }}>
                  <span style={{ fontWeight: 500 }}>Iniciativas:</span>
                  <ul style={{ margin: 0, paddingLeft: 16 }}>
                    {iniciativas.map((nome: string, idx: number) => (
                      <li key={idx}>{nome}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          );
        })}
      </div>
    );
  }
  return null;
}

interface MonthlyExperimentsChartProps {
  // Para mostrar os experimentos no tooltip, cada mês/ano deve conter também o array de iniciativas:
  // Exemplo de item: { month: 'Jan', '2023': 2, '2023_iniciativas': ['Exp 1', 'Exp 2'], ... }
  data: Array<
    {
      month: string;
    } & {
      [ano: string]: number | string;
    } & {
      [ano_iniciativas: `${string}_iniciativas`]: string[];
    }
  >;
  anoColors?: { [key: string]: string };
}

export function MonthlyExperimentsChart({
  data,
  anoColors,
}: MonthlyExperimentsChartProps) {
  // Descobre os anos presentes nos dados (ignora campos _iniciativas)
  const anos = Object.keys(data?.[0] || {}).filter(
    (key) => key !== "month" && !key.endsWith("_iniciativas")
  );
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
          <Tooltip content={<CustomTooltip />} />
          <Legend />
          {anos.map((ano) =>
            anoColors && anoColors[ano] ? (
              <Line
                key={ano}
                type="monotone"
                dataKey={ano}
                stroke={anoColors[ano]}
                strokeWidth={3}
                dot={{ fill: anoColors[ano], strokeWidth: 2, r: 4 }}
                activeDot={{ r: 6, fill: anoColors[ano] }}
                name={ano}
                legendType="line"
              />
            ) : null
          )}
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
