import React from 'react';
import { SignalFeature, DOMAIN_COLORS, getDomainColor, RELEVANCE_COLORS, getSignalPlotCoordinates } from '../types/signal';
import { Compass, ExternalLink, ShieldAlert, Sparkles, MapPin } from 'lucide-react';

interface ImpactMatrixProps {
  signals: SignalFeature[];
  selectedSignalId: string | null;
  onSelectSignal: (id: string) => void;
  onFocusMap: (id: string) => void;
}

export const ImpactMatrix: React.FC<ImpactMatrixProps> = ({
  signals,
  selectedSignalId,
  onSelectSignal,
  onFocusMap,
}) => {
  const horizons = ['Now', '12 months', '2-3 years'];
  const relevanceLevels = ['High', 'Medium', 'Low'];

  // Bucket signals into 2D grid
  const getSignalsInCell = (horizon: string, relevance: string) => {
    return signals.filter(
      (s) => s.properties.horizon === horizon && s.properties.stakeholder_relevance === relevance
    );
  };

  return (
    <div className="flex-1 h-full bg-slate-950 p-6 overflow-y-auto select-none flex flex-col">
      <div className="mb-6 flex flex-col md:flex-row md:items-center justify-between gap-3 pb-4 border-b border-slate-800/80">
        <div>
          <h2 className="text-lg font-bold text-slate-100 tracking-tight">
            Strategic Horizon & Relevance Impact Matrix
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            2D foresight distribution plotting signals across operational urgency and stakeholder consequence.
          </p>
        </div>

        <div className="flex items-center gap-4 text-xs font-mono text-slate-400">
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-sm bg-rose-950 border border-rose-600"></span>
            <span>Critical Priority</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-sm bg-amber-950 border border-amber-600"></span>
            <span>Near-Term Strategic</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-sm bg-slate-900 border border-slate-700"></span>
            <span>Monitoring Routine</span>
          </div>
        </div>
      </div>

      {/* Matrix Grid */}
      <div className="flex-1 grid grid-cols-1 md:grid-cols-3 gap-4 min-h-[520px]">
        {horizons.map((horizon) => (
          <div
            key={horizon}
            className="flex flex-col bg-slate-900/30 border border-slate-800/80 rounded-xl overflow-hidden"
          >
            {/* Horizon Column Header */}
            <div className="p-3 bg-slate-900/80 border-b border-slate-800 flex items-center justify-between">
              <span className="text-xs font-mono font-semibold text-cyan-300 uppercase tracking-wider">
                Horizon: {horizon}
              </span>
              <span className="text-[11px] font-mono text-slate-400">
                {signals.filter((s) => s.properties.horizon === horizon).length} Signals
              </span>
            </div>

            {/* Relevance sub-rows */}
            <div className="flex-1 p-3 space-y-4 overflow-y-auto">
              {relevanceLevels.map((relevance) => {
                const cellSignals = getSignalsInCell(horizon, relevance);
                const isCriticalCell = horizon === 'Now' && relevance === 'High';
                const isStrategicNearCell = horizon === '12 months' && relevance === 'High';

                return (
                  <div
                    key={relevance}
                    className={`p-3 rounded-lg border transition-all ${
                      isCriticalCell
                        ? 'bg-rose-950/20 border-rose-900/40'
                        : isStrategicNearCell
                        ? 'bg-amber-950/20 border-amber-900/40'
                        : 'bg-slate-900/40 border-slate-800/60'
                    }`}
                  >
                    <div className="flex items-center justify-between text-xs font-mono mb-2">
                      <span
                        className={
                          relevance === 'High'
                            ? 'text-rose-400 font-semibold'
                            : relevance === 'Medium'
                            ? 'text-amber-400 font-medium'
                            : 'text-slate-400'
                        }
                      >
                        Relevance: {relevance}
                      </span>
                      <span className="text-[11px] text-slate-500 tabular-nums">
                        ({cellSignals.length})
                      </span>
                    </div>

                    {cellSignals.length === 0 ? (
                      <div className="py-3 text-center text-[11px] font-mono text-slate-600 italic">
                        No signals in this quadrant
                      </div>
                    ) : (
                      <div className="space-y-2">
                        {cellSignals.map((signal) => {
                          const isSelected = signal.id === selectedSignalId;
                          const domainStyle = getDomainColor(signal.properties.domain);

                          return (
                            <div
                              key={signal.id}
                              onClick={() => onSelectSignal(signal.id)}
                              className={`p-2.5 rounded-md border text-xs cursor-pointer transition-all ${
                                isSelected
                                  ? 'bg-slate-800 border-cyan-400 shadow-md ring-1 ring-cyan-500/30'
                                  : 'bg-slate-950/80 hover:bg-slate-900 border-slate-800 hover:border-slate-700'
                              }`}
                            >
                              <div className="flex items-center justify-between text-[11px] font-mono text-slate-500 mb-1">
                                <span className="text-cyan-400">{signal.properties.id}</span>
                                <span className={domainStyle.text}>{signal.properties.domain}</span>
                              </div>

                              <div className="font-medium text-slate-200 line-clamp-2 leading-tight">
                                {signal.properties.title}
                              </div>

                              <div className="mt-2 flex items-center justify-between text-[11px] text-slate-400 pt-1.5 border-t border-slate-800/80">
                                <span className="truncate max-w-[140px] font-mono">
                                  {signal.properties.location}
                                </span>

                                <div className="flex items-center gap-1.5" onClick={(e) => e.stopPropagation()}>
                                  {getSignalPlotCoordinates(signal) !== null && (
                                    <button
                                      onClick={() => onFocusMap(signal.id)}
                                      className="text-slate-400 hover:text-cyan-300 transition-colors cursor-pointer"
                                      title="View on Map"
                                    >
                                      <Compass className="w-3.5 h-3.5" />
                                    </button>
                                  )}
                                  <a
                                    href={signal.properties.source_url}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="text-slate-400 hover:text-cyan-300 transition-colors"
                                    title="Open Source"
                                  >
                                    <ExternalLink className="w-3.5 h-3.5" />
                                  </a>
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
