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
import { ExternalLink, Compass, ArrowUpDown, MapPin, Download } from 'lucide-react';

interface SignalRegistryTableProps {
  signals: SignalFeature[];
  selectedSignalId: string | null;
  onSelectSignal: (id: string) => void;
  onFocusMap: (id: string) => void;
  onExportFilteredCSV: () => void;
  selectedModule?: string;
  onSelectModule?: (mod: string) => void;
  availableModules?: string[];
}

export const SignalRegistryTable: React.FC<SignalRegistryTableProps> = ({
  signals,
  selectedSignalId,
  onSelectSignal,
  onFocusMap,
  onExportFilteredCSV,
  selectedModule,
  onSelectModule,
  availableModules,
}) => {
  const [sortCol, setSortCol] = useState<'id' | 'date' | 'module' | 'domain' | 'relevance' | 'horizon'>('date');
  const [sortAsc, setSortAsc] = useState<boolean>(false);
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [pageSize, setPageSize] = useState<number>(50);

  const handleSort = (col: typeof sortCol) => {
    if (sortCol === col) {
      setSortAsc(!sortAsc);
    } else {
      setSortCol(col);
      setSortAsc(true);
    }
  };

  const sortedSignals = [...signals].sort((a, b) => {
    let comparison = 0;
    if (sortCol === 'date') {
      comparison = new Date(a.properties.date).getTime() - new Date(b.properties.date).getTime();
    } else if (sortCol === 'id') {
      comparison = a.properties.id.localeCompare(b.properties.id);
    } else if (sortCol === 'module') {
      comparison = extractSignalModule(a).localeCompare(extractSignalModule(b));
    } else if (sortCol === 'domain') {
      comparison = (a.properties.domain || '').localeCompare(b.properties.domain || '');
    } else if (sortCol === 'horizon') {
      comparison = (a.properties.horizon || '').localeCompare(b.properties.horizon || '');
    } else if (sortCol === 'relevance') {
      const order: Record<string, number> = { High: 3, Medium: 2, Low: 1 };
      comparison = (order[a.properties.stakeholder_relevance] || 0) - (order[b.properties.stakeholder_relevance] || 0);
    }
    return sortAsc ? comparison : -comparison;
  });

  const totalPages = Math.max(1, Math.ceil(sortedSignals.length / pageSize));
  const validPage = Math.min(currentPage, totalPages);
  const paginatedSignals = sortedSignals.slice((validPage - 1) * pageSize, validPage * pageSize);

  return (
    <div className="flex-1 h-full bg-slate-950 p-6 overflow-y-auto select-none flex flex-col">
      {/* Registry Title and Actions */}
      <div className="mb-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-800/80">
        <div>
          <h2 className="text-lg font-bold text-slate-100 tracking-tight">Signals Intelligence Master Registry</h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Structured high-density OSINT tabular catalog ({signals.length} records matching current criteria).
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2 self-start sm:self-auto">
          {availableModules && availableModules.length > 0 && onSelectModule && (
            <div className="flex items-center gap-1.5 bg-slate-900 border border-cyan-800/80 rounded-md px-2.5 py-1 text-xs font-mono">
              <span className="text-slate-400">Filter Module:</span>
              <select
                value={selectedModule || ''}
                onChange={(e) => onSelectModule(e.target.value)}
                aria-label="Filter registry table by module"
                className="bg-transparent text-cyan-300 font-mono text-xs focus:outline-none cursor-pointer"
              >
                <option value="" className="bg-slate-900 text-slate-300">All Modules</option>
                {availableModules.map((m) => (
                  <option key={m} value={m} className="bg-slate-900 text-cyan-300">
                    {m.toUpperCase()}
                  </option>
                ))}
              </select>
            </div>
          )}

          <button
            onClick={onExportFilteredCSV}
            className="px-3 py-1.5 bg-slate-900 hover:bg-slate-800 border border-slate-700 rounded-md text-xs font-mono text-slate-200 flex items-center gap-1.5 transition-colors"
          >
            <Download className="w-3.5 h-3.5 text-cyan-400" />
            <span>Export CSV</span>
          </button>
        </div>
      </div>

      {/* Table Container */}
      <div className="flex-1 bg-slate-900/50 border border-slate-800/80 rounded-xl overflow-hidden shadow-lg flex flex-col">
        <div className="overflow-x-auto flex-1">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-900 border-b border-slate-800 text-[11px] font-mono text-slate-400 select-none">
                <th
                  onClick={() => handleSort('id')}
                  className="py-3 px-4 cursor-pointer hover:text-slate-200 transition-colors whitespace-nowrap"
                >
                  <div className="flex items-center gap-1">
                    <span>ID</span>
                    <ArrowUpDown className="w-3 h-3 text-slate-600" />
                  </div>
                </th>
                <th
                  onClick={() => handleSort('date')}
                  className="py-3 px-3 cursor-pointer hover:text-slate-200 transition-colors whitespace-nowrap"
                >
                  <div className="flex items-center gap-1">
                    <span>Date</span>
                    <ArrowUpDown className="w-3 h-3 text-slate-600" />
                  </div>
                </th>
                <th
                  onClick={() => handleSort('module')}
                  className="py-3 px-3 cursor-pointer hover:text-slate-200 transition-colors whitespace-nowrap"
                >
                  <div className="flex items-center gap-1">
                    <span>Module</span>
                    <ArrowUpDown className="w-3 h-3 text-slate-600" />
                  </div>
                </th>
                <th className="py-3 px-4 min-w-[280px]">Signal Headline & Subtheme</th>
                <th
                  onClick={() => handleSort('domain')}
                  className="py-3 px-3 cursor-pointer hover:text-slate-200 transition-colors whitespace-nowrap"
                >
                  <div className="flex items-center gap-1">
                    <span>Domain</span>
                    <ArrowUpDown className="w-3 h-3 text-slate-600" />
                  </div>
                </th>
                <th className="py-3 px-3 whitespace-nowrap">Location & Coordinates</th>
                <th
                  onClick={() => handleSort('relevance')}
                  className="py-3 px-3 cursor-pointer hover:text-slate-200 transition-colors whitespace-nowrap"
                >
                  <div className="flex items-center gap-1">
                    <span>Relevance</span>
                    <ArrowUpDown className="w-3 h-3 text-slate-600" />
                  </div>
                </th>
                <th
                  onClick={() => handleSort('horizon')}
                  className="py-3 px-3 cursor-pointer hover:text-slate-200 transition-colors whitespace-nowrap"
                >
                  <div className="flex items-center gap-1">
                    <span>Horizon</span>
                    <ArrowUpDown className="w-3 h-3 text-slate-600" />
                  </div>
                </th>
                <th className="py-3 px-4 text-right whitespace-nowrap">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 font-sans">
              {sortedSignals.length === 0 ? (
                <tr>
                  <td colSpan={9} className="py-8 text-center text-slate-500 font-mono text-xs">
                    No signals found. Clear filter criteria to view dataset.
                  </td>
                </tr>
              ) : (
                paginatedSignals.map((signal) => {
                  const isSelected = signal.id === selectedSignalId;
                  const truthCoords = getSignalTruthCoordinates(signal);
                  const plotCoords = getSignalPlotCoordinates(signal);
                  const hasCoords = plotCoords !== null && signal.properties.geom_kind !== 'none';
                  const domainStyle = getDomainColor(signal.properties.domain);

                  return (
                    <tr
                      key={signal.id}
                      onClick={() => onSelectSignal(signal.id)}
                      className={`cursor-pointer transition-colors group ${
                        isSelected
                          ? 'bg-slate-800/80 text-slate-100'
                          : 'hover:bg-slate-900/80 text-slate-300'
                      }`}
                    >
                      <td className="py-2.5 px-4 font-mono text-[11px] text-cyan-400 font-medium whitespace-nowrap">
                        {signal.properties.id}
                      </td>
                      <td className="py-2.5 px-3 font-mono text-[11px] text-slate-400 tabular-nums whitespace-nowrap">
                        {signal.properties.date}
                      </td>
                      <td className="py-2.5 px-3 font-mono text-[11px] whitespace-nowrap">
                        <span className="px-2 py-0.5 rounded bg-cyan-950/80 border border-cyan-800/80 text-cyan-300 font-semibold uppercase">
                          {extractSignalModule(signal)}
                        </span>
                      </td>
                      <td className="py-2.5 px-4">
                        <div className="font-medium text-slate-200 group-hover:text-cyan-300 transition-colors line-clamp-1">
                          {signal.properties.title}
                        </div>
                        {(signal.properties.Implication || signal.properties.implication) && (
                          <div className="text-[11px] text-amber-300/80 mt-0.5 line-clamp-1 italic font-sans">
                            {signal.properties.Implication || signal.properties.implication}
                          </div>
                        )}
                        <div className="text-[11px] font-mono text-slate-500 mt-0.5">
                          {signal.properties.subtheme} · {signal.properties.location_type}
                        </div>
                      </td>
                      <td className="py-2.5 px-3 font-mono text-[11px] whitespace-nowrap">
                        <span className={domainStyle.text}>{signal.properties.domain}</span>
                      </td>
                      <td className="py-2.5 px-3 font-mono text-[11px]">
                        <div className="text-slate-300 truncate max-w-[180px]">{signal.properties.location}</div>
                        <div className="text-[10px] text-slate-500 tabular-nums flex items-center gap-1 mt-0.5">
                          {hasCoords && truthCoords ? (
                            <>
                              <span>[{truthCoords[0].toFixed(2)}, {truthCoords[1].toFixed(2)}]</span>
                              <span className="px-1 py-0.2 rounded bg-slate-800 text-[9px] text-slate-400 border border-slate-700/60">
                                {signal.properties.geom_kind || 'locality'}
                              </span>
                              {signal.properties.jitter && (
                                <span className="text-[9px] text-cyan-400" title="Marker is offset from country or city centre to avoid stacking">
                                  offset
                                </span>
                              )}
                            </>
                          ) : (
                            <span className="text-amber-400/80">No marker ({signal.properties.geom_kind || 'none'})</span>
                          )}
                        </div>
                      </td>
                      <td className="py-2.5 px-3 font-mono text-[11px] whitespace-nowrap">
                        <span className={RELEVANCE_COLORS[signal.properties.stakeholder_relevance]}>
                          {signal.properties.stakeholder_relevance}
                        </span>
                      </td>
                      <td className="py-2.5 px-3 font-mono text-[11px] text-cyan-300 whitespace-nowrap">
                        {signal.properties.horizon}
                      </td>
                      <td className="py-2.5 px-4 text-right whitespace-nowrap" onClick={(e) => e.stopPropagation()}>
                        <div className="flex items-center justify-end gap-1.5">
                          {hasCoords && (
                            <button
                              onClick={() => onFocusMap(signal.id)}
                              className="p-1 text-slate-400 hover:text-cyan-300 rounded transition-colors"
                              title="Center on Tactical Map"
                            >
                              <Compass className="w-3.5 h-3.5" />
                            </button>
                          )}
                          <a
                            href={signal.properties.source_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="p-1 text-slate-400 hover:text-cyan-300 rounded transition-colors"
                            title="Open Primary Source"
                          >
                            <ExternalLink className="w-3.5 h-3.5" />
                          </a>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Master Registry Pagination Controls */}
        <div className="p-3 bg-slate-900/60 border-t border-slate-800 flex flex-wrap items-center justify-between gap-3 text-xs font-mono text-slate-400">
          <div className="flex items-center gap-2">
            <span>
              Showing {sortedSignals.length > 0 ? (validPage - 1) * pageSize + 1 : 0} to{' '}
              {Math.min(validPage * pageSize, sortedSignals.length)} of {sortedSignals.length} entries
            </span>
            <span className="text-slate-700">|</span>
            <div className="flex items-center gap-1">
              <span>Rows:</span>
              <select
                value={pageSize}
                onChange={(e) => {
                  setPageSize(Number(e.target.value));
                  setCurrentPage(1);
                }}
                className="bg-slate-950 border border-slate-800 rounded px-1.5 py-0.5 text-slate-200 text-xs focus:outline-none"
              >
                <option value={25}>25</option>
                <option value={50}>50</option>
                <option value={100}>100</option>
                <option value={200}>200</option>
              </select>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              disabled={validPage <= 1}
              className="px-2.5 py-1 bg-slate-950 border border-slate-800 hover:bg-slate-800 rounded text-slate-300 disabled:opacity-40 transition-colors"
            >
              Previous
            </button>
            <span className="text-slate-300">
              Page {validPage} of {totalPages}
            </span>
            <button
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              disabled={validPage >= totalPages}
              className="px-2.5 py-1 bg-slate-950 border border-slate-800 hover:bg-slate-800 rounded text-slate-300 disabled:opacity-40 transition-colors"
            >
              Next
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
