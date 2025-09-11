import React from 'react';

export function BlinkingDot({ color }: { color: string }) {
  return (
    <span
      className="inline-block w-4 h-4 rounded-full animate-pulse"
      style={{ backgroundColor: color, boxShadow: `0 0 8px 2px ${color}` }}
    />
  );
}
