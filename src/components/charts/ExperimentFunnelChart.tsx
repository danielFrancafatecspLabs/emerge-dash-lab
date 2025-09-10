import React from "react";

interface FunnelStage {
  name: string;
  value: number;
  color: string;
  conversion?: number;
}

interface ExperimentFunnelChartProps {
  stages: FunnelStage[];
}

export const ExperimentFunnelChart: React.FC<ExperimentFunnelChartProps> = ({ stages }) => {
  // Calcula conversão entre etapas
  const stagesWithConversion = stages.map((stage, idx) => {
    if (idx === 0) return { ...stage, conversion: 100 };
    const prev = stages[idx - 1].value;
    const conv = prev > 0 ? Math.round((stage.value / prev) * 100) : 0;
    return { ...stage, conversion: conv };
  });

  return (
  <div className="flex flex-col items-center w-full py-8">
      <h2 className="text-2xl font-extrabold mb-6 text-gray-800 tracking-tight">Resultado do Quarter</h2>
      <div className="flex flex-col md:flex-row gap-8 md:gap-12 items-center w-full justify-center">
        {/* Funil */}
        <div className="flex flex-col gap-4 items-center w-full max-w-[420px] relative px-2">
          {stagesWithConversion.map((stage, idx) => (
            <div
              key={stage.name}
              className="w-full flex justify-center"
              style={{ marginBottom: idx < stagesWithConversion.length - 1 ? 0 : 0 }}
            >
              <div
                className="transition-all duration-300 shadow-2xl text-white font-extrabold flex flex-col items-center justify-center border-2 border-white"
                style={{
                  background: stage.color,
                  width: `calc(100% - ${idx * 13}%)`,
                  minWidth: '140px',
                  maxWidth: '100%',
                  height: 84,
                  borderRadius: idx === 0 ? "24px 24px 12px 12px" : idx === stagesWithConversion.length - 1 ? "12px 12px 24px 24px" : "12px",
                  fontSize: 'clamp(1rem, 2vw, 1.25rem)',
                  boxShadow: `0 4px 24px 0 ${stage.color}55`,
                  zIndex: stagesWithConversion.length - idx,
                  letterSpacing: "-0.5px",
                  textShadow: "0 2px 8px #0002",
                  padding: '8px 16px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  textAlign: 'center',
                  wordBreak: 'break-word',
                  margin: '0 auto',
                }}
              >
                <span
                  className="w-full flex flex-col items-center justify-center"
                  style={{
                    fontWeight: 900,
                    color: '#fff',
                    textShadow: '0 2px 8px #0008',
                    lineHeight: 1.1,
                    wordBreak: 'break-word',
                  }}
                >
                  <span style={{fontSize: '2.3rem', fontWeight: 900, letterSpacing: '-1px', marginBottom: 2}}>{stage.value}</span>
                  <span style={{fontSize: '1rem', fontWeight: 600, marginTop: 0, maxWidth: '90%', whiteSpace: 'normal', wordBreak: 'break-word'}}>{stage.name}</span>
                </span>
              </div>
            </div>
          ))}
        </div>
        {/* Conversão lateral */}
        <div className="flex flex-col gap-4 w-full max-w-[400px] px-2">
          {stagesWithConversion.slice(1).map((stage, idx) => (
            <div key={stage.name} className="bg-orange-50 rounded-xl px-4 py-3 shadow-lg text-gray-800 text-base font-semibold flex flex-col gap-1 border border-orange-200">
              <span>
                <b className="text-orange-600 text-lg">{stage.conversion}%</b> convertidos para <span className="font-bold">{stage.name}</span>
              </span>
              <span className="text-xs text-gray-500">Meta:</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
