import React, { useState } from 'react';
import {
  SignalFeature,
  DOMAIN_COLORS,
  getDomainColor,
  RELEVANCE_COLORS,
  CONFIDENCE_COLORS,
  extractSignalModule,
  getSignalTruthCoordinates,
  getSignalPlotCoordinates,
} from '../types/signal';
import { MapPin, ExternalLink, ArrowUpDown, ChevronRight, AlertCircle, Compass } from 'lucide-react';

interface SignalListProps {
  signals: SignalFeature[];
  selectedSignalId: string | null;
  onSelectSignal: (id: string) => void;
  onFocusMap: (id: string) => void;
  selectedModule?: string;
  onSelectModule?: (mod: string) => void;
  availableModules?: string[];
}

export const SignalList: React.FC<SignalListProps> = ({
  signals,
  selectedSignalId,
  onSelectSignal,
  onFocusMap,
  selectedModule,
  onSelectModule,
  availableModules,
}) => {
  const [sortBy, setSortBy] = useState<'date-desc' | 'date-asc' | 'relevance' | 'domain'>('date-desc');
  const [visibleLimit, setVisibleLimit] = useState<number>(50);

  const sortedSignals = [...signals].sort((a, b) => {
    if (sortBy === 'date-desc') {
      return new Date(b.properties.date).getTime() - new Date(a.properties.date).getTime();
    }
    if (sortBy === 'date-asc') {
      return new Date(a.properties.date).getTime() - new Date(b.properties.date).getTime();
    }
    if (sortBy === 'relevance') {
      const order: Record<string, number> = { High: 3, Medium: 2, Low: 1 };
      return (order[b.properties.stakeholder_relevance] || 0) - (order[a.properties.stakeholder_relevance] || 0);
    }
    if (sortBy === 'domain') {
      return (a.properties.domain || '').localeCompare(b.properties.domain || '');
    }
    return 0;
  });

  const displayedSignals = sortedSignals.slice(0, visibleLimit);

  return (
    <div className="flex flex-col h-full bg-slate-950 border-r border-slate-800/80 overflow-hidden">
      {/* Feed Header */}
      <div className="p-3.5 border-b border-slate-800/80 flex flex-wrap items-center justify-between gap-2 bg-slate-900/40">
        <div>
          <h2 className="text-sm font-semibold text-slate-100 tracking-wide">Signals Feed</h2>
          <div className="text-xs text-slate-400 mt-0.5">
            <span>{signals.length} active intelligence items</span>
          </div>
        </div>

        {/* Filter & Sort Controls */}
        <div className="flex items-center gap-1.5">
          {availableModules && availableModules.length > 0 && onSelectModule && (
            <select
              value={selectedModule || ''}
              onChange={(e) => onSelectModule(e.target.value)}
              aria-label="Filter signals feed by module"
              className="bg-slate-900 border border-cyan-800/80 rounded px-2 py-1 text-xs text-cyan-300 font-mono focus:outline-none focus:border-cyan-500"
            >
              <option value="">All Modules</option>
              {availableModules.map((m) => (
                <option key={m} value={m}>
                  {m.toUpperCase()}
                </option>
              ))}
            </select>
          )}

          <div className="flex items-center gap-1">
            <ArrowUpDown className="w-3.5 h-3.5 text-slate-500" />
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              aria-label="Sort signals feed"
              className="bg-slate-900 border border-slate-700/80 rounded px-2 py-1 text-xs text-slate-300 font-mono focus:outline-none focus:border-cyan-500"
            >
              <option value="date-desc">Newest First</option>
              <option value="date-asc">Oldest First</option>
              <option value="relevance">Stakeholder Relevance</option>
              <option value="domain">Domain Alphabetical</option>
            </select>
          </div>
        </div>
      </div>

      {/* Signals Feed List */}
      <div className="flex-1 overflow-y-auto divide-y divide-slate-800/60 p-2 space-y-1.5">
        {sortedSignals.length === 0 ? (
          <div className="p-8 text-center text-slate-500 text-xs">
            <AlertCircle className="w-6 h-6 mx-auto mb-2 text-slate-600" />
            <p>No intelligence signals match the active filters.</p>
            <p className="mt-1 text-slate-600">Adjust keywords, domains, or reset filters.</p>
          </div>
        ) : (
          <>
            {displayedSignals.map((signal) => {
              const isSelected = signal.id === selectedSignalId;
              const truthCoords = getSignalTruthCoordinates(signal);
              const plotCoords = getSignalPlotCoordinates(signal);
              const hasCoords = plotCoords !== null && signal.properties.geom_kind !== 'none';
              const domainStyle = getDomainColor(signal.properties.domain);
              const relevanceColor = RELEVANCE_COLORS[signal.properties.stakeholder_relevance] || 'text-slate-400';

              return (
                <div
                  key={signal.id}
                  onClick={() => onSelectSignal(signal.id)}
                  className={`p-3.5 rounded-lg border transition-all cursor-pointer group ${
                    isSelected
                      ? 'bg-slate-900 border-cyan-500/80 shadow-md ring-1 ring-cyan-500/30'
                      : 'bg-slate-900/40 hover:bg-slate-900/80 border-slate-800/80 hover:border-slate-700'
                  }`}
                >
                  {/* Top line metadata */}
                  <div className="flex items-center justify-between text-xs text-slate-500 font-mono mb-1.5">
                    <div className="flex items-center gap-1.5 truncate">
                      <span className="px-1.5 py-0.5 rounded bg-cyan-950/90 border border-cyan-800/80 text-[10px] text-cyan-300 font-semibold uppercase">
                        {extractSignalModule(signal)}
                      </span>
                      <span className="text-slate-400">{signal.properties.id}</span>
                      <span aria-hidden="true">·</span>
                      <span className="text-slate-400">{signal.properties.date}</span>
                      <span aria-hidden="true">·</span>
                      <span className={domainStyle.text}>{signal.properties.domain}</span>
                    </div>

                    <div className="flex items-center gap-1.5 shrink-0 ml-2">
                      <span className={`text-[11px] ${relevanceColor}`}>
                        Rel: {signal.properties.stakeholder_relevance}
                      </span>
                    </div>
                  </div>

                  {/* Signal Title */}
                  <h3 className="text-xs sm:text-sm font-medium text-slate-200 group-hover:text-cyan-300 transition-colors leading-snug line-clamp-2">
                    {signal.properties.title}
                  </h3>

                  {/* Subtitle / Subtheme and Location */}
                  <div className="mt-2 flex items-center justify-between text-xs text-slate-400">
                    <div className="flex items-center gap-1.5 truncate">
                      <MapPin className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                      <span className="truncate">{signal.properties.location}</span>
                    </div>

                    <span className="shrink-0 font-mono text-[11px] text-slate-500 ml-2">
                      {signal.properties.horizon}
                    </span>
                  </div>

                  {/* Actions & Geo status indicator */}
                  <div className="mt-2.5 pt-2 border-t border-slate-800/80 flex items-center justify-between text-[11px] font-mono">
                    <div className="flex items-center gap-2">
                      {hasCoords && truthCoords ? (
                        <span className="text-emerald-400 flex items-center gap-1">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
                          <span>{truthCoords[1].toFixed(2)}°, {truthCoords[0].toFixed(2)}°</span>
                          {signal.properties.jitter && (
                            <span className="text-[9px] text-cyan-400 font-mono ml-0.5" title="Marker is offset from country or city centre to avoid stacking">(offset)</span>
                          )}
                        </span>
                      ) : (
                        <span className="text-amber-400 flex items-center gap-1">
                          <span className="w-1.5 h-1.5 rounded-full bg-amber-400"></span>
                          <span>No marker ({signal.properties.geom_kind || 'none'})</span>
                        </span>
                      )}
                    </div>

                    <div className="flex items-center gap-1.5" onClick={(e) => e.stopPropagation()}>
                      {hasCoords && (
                        <button
                          onClick={() => onFocusMap(signal.id)}
                          className="p-1 text-slate-400 hover:text-cyan-300 transition-colors"
                          title="Center on tactical map"
                        >
                          <Compass className="w-3.5 h-3.5" />
                        </button>
                      )}

                      <a
                        href={signal.properties.source_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="p-1 text-slate-400 hover:text-cyan-300 transition-colors"
                        title="Open verified source in new tab"
                      >
                        <ExternalLink className="w-3.5 h-3.5" />
                      </a>
                    </div>
                  </div>
                </div>
              );
            })}

            {sortedSignals.length > visibleLimit && (
              <div className="p-3 text-center">
                <button
                  onClick={() => setVisibleLimit((prev) => prev + 50)}
                  className="w-full py-2 bg-slate-900 hover:bg-slate-800 border border-slate-700/80 rounded text-xs font-mono text-cyan-400 hover:text-cyan-300 transition-colors"
                >
                  Load More Signals (+50) · Showing {visibleLimit} of {sortedSignals.length}
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};
