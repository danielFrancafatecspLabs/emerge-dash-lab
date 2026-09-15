import React from "react";

export function CapacityPieChart({ percent }: { percent: number }) {
  const used = percent;
  const unused = 100 - percent;
  const r = 40;
  const cx = 50;
  const cy = 50;
  const usedAngle = (used / 100) * 2 * Math.PI;
  const x = cx + r * Math.cos(usedAngle - Math.PI / 2);
  const y = cy + r * Math.sin(usedAngle - Math.PI / 2);
  const largeArc = used > 50 ? 1 : 0;
  return (
    <svg width={100} height={100} viewBox="0 0 100 100">
      <circle cx={cx} cy={cy} r={r} fill="#f3f4f6" />
      <path
        d={`M${cx},${cy - r} A${r},${r} 0 ${largeArc},1 ${x},${y}`}
        fill="none"
        stroke="#7a0019"
        strokeWidth={10}
      />
      <text
        x={cx}
        y={cy}
        textAnchor="middle"
        dy=".3em"
        fontSize={22}
        fill="#7a0019"
        fontWeight="bold"
      >
        {percent.toFixed(0)}%
      </text>
    </svg>
  );
}
