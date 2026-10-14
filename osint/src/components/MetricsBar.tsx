import React from 'react';
import { SignalFeature, getSignalPlotCoordinates } from '../types/signal';

interface MetricsBarProps {
  signals: SignalFeature[];
  totalSignalsCount: number;
  filteredCount: number;
  onOpenUnmappedModal?: () => void;
}

export const MetricsBar: React.FC<MetricsBarProps> = ({
  signals,
  totalSignalsCount,
  filteredCount,
  onOpenUnmappedModal,
}) => {
  const geocodedCount = signals.filter((s) => getSignalPlotCoordinates(s) !== null).length;
  const unmappedCount = signals.filter((s) => getSignalPlotCoordinates(s) === null).length;
  const highRelevanceCount = signals.filter((s) => s.properties.stakeholder_relevance === 'High').length;
  const immediateHorizonCount = signals.filter((s) => s.properties.horizon === 'Now').length;

  // Calculate dominant domain
  const domainCounts = signals.reduce<Record<string, number>>((acc, s) => {
    const d = s.properties.domain || 'Unknown';
    acc[d] = (acc[d] || 0) + 1;
    return acc;
  }, {});

  let dominantDomain = 'N/A';
  let maxCount = 0;
  Object.entries(domainCounts).forEach(([domain, count]) => {
    if (count > maxCount) {
      dominantDomain = domain;
      maxCount = count;
    }
  });

  return (
    <div className="h-9 bg-slate-900/60 border-b border-slate-800/60 px-6 flex items-center justify-between text-xs text-slate-400 select-none">
      {/* Metrics indicators with unboxed text and typographic separators (Anti-Slop Zero-Pill) */}
      <div className="flex items-center gap-2 overflow-x-auto py-1">
        <span className="text-slate-300 font-medium">Signals Plotted:</span>
        <span className="font-mono tabular-nums text-slate-100 font-semibold">{geocodedCount}</span>
        <span aria-hidden="true" className="text-slate-600">·</span>

        <span className="text-slate-400">High Stakeholder Relevance:</span>
        <span className="font-mono tabular-nums text-rose-400 font-semibold">{highRelevanceCount}</span>
        <span aria-hidden="true" className="text-slate-600">·</span>

        <span className="text-slate-400">Active Horizon (Now):</span>
        <span className="font-mono tabular-nums text-cyan-400 font-semibold">{immediateHorizonCount}</span>
        <span aria-hidden="true" className="text-slate-600">·</span>

        <span className="text-slate-400">Primary Domain:</span>
        <span className="text-slate-200 font-medium">{dominantDomain}</span>
        <span aria-hidden="true" className="text-slate-600">·</span>

        <span className="text-slate-400">Awaiting geolocation:</span>
        <button
          onClick={onOpenUnmappedModal}
          disabled={unmappedCount === 0}
          className={`font-mono tabular-nums font-semibold px-1 rounded transition-colors ${
            unmappedCount > 0
              ? 'text-amber-400 hover:text-amber-300 hover:bg-amber-950/60 underline cursor-pointer'
              : 'text-slate-500 cursor-default'
          }`}
          title={
            unmappedCount > 0
              ? 'Click to inspect problematic signal IDs and copy to clipboard'
              : 'All signals geocoded'
          }
        >
          {unmappedCount}
        </button>
      </div>

      <div className="hidden lg:flex items-center gap-2 text-[11px] font-mono text-slate-500">
        <span>Active Feed: {filteredCount} of {totalSignalsCount}</span>
      </div>
    </div>
  );
};
