import React from "react";
import { DOMAIN_OVERVIEW } from "./mockCapacityData";

export function CapacityDomainPie() {
  const total = DOMAIN_OVERVIEW.reduce((acc, d) => acc + d.value, 0);
  let acc = 0;
  const pieSlices = DOMAIN_OVERVIEW.map((d, i) => {
    const startAngle = (acc / total) * 2 * Math.PI;
    acc += d.value;
    const endAngle = (acc / total) * 2 * Math.PI;
    const largeArc = endAngle - startAngle > Math.PI ? 1 : 0;
    const x1 = 50 + 40 * Math.cos(startAngle);
    const y1 = 50 + 40 * Math.sin(startAngle);
    const x2 = 50 + 40 * Math.cos(endAngle);
    const y2 = 50 + 40 * Math.sin(endAngle);
    return (
      <path
        key={d.label}
        d={`M50,50 L${x1},${y1} A40,40 0 ${largeArc},1 ${x2},${y2} Z`}
        fill={d.color}
        stroke="#fff"
        strokeWidth={2}
      />
    );
  });
  return (
    <div className="flex flex-col items-center gap-2 p-4 bg-white rounded-xl shadow w-64">
      <svg width={100} height={100} viewBox="0 0 100 100">
        {pieSlices}
      </svg>
      <div className="flex flex-col gap-1 w-full">
        {DOMAIN_OVERVIEW.map((d) => (
          <div key={d.label} className="flex items-center gap-2 text-sm">
            <span
              className="inline-block w-3 h-3 rounded-full"
              style={{ background: d.color }}
            />
            <span className="font-semibold text-gray-700">{d.label}</span>
            <span className="ml-auto text-gray-500">{d.value}%</span>
          </div>
        ))}
      </div>
    </div>
  );
}
