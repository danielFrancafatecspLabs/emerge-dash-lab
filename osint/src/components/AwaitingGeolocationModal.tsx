import React, { useState } from 'react';
import { SignalFeature, extractSignalModule } from '../types/signal';
import { X, Copy, Check, AlertTriangle, MapPinOff, Layers } from 'lucide-react';

interface AwaitingGeolocationModalProps {
  isOpen: boolean;
  onClose: () => void;
  unmappedSignals: SignalFeature[];
}

export const AwaitingGeolocationModal: React.FC<AwaitingGeolocationModalProps> = ({
  isOpen,
  onClose,
  unmappedSignals,
}) => {
  const [copiedAll, setCopiedAll] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  if (!isOpen) return null;

  const allIdsText = unmappedSignals.map((s) => s.properties?.id || s.id).join('\n');

  const handleCopyAll = () => {
    navigator.clipboard.writeText(allIdsText);
    setCopiedAll(true);
    setTimeout(() => setCopiedAll(false), 2000);
  };

  const handleCopySingle = (id: string) => {
    navigator.clipboard.writeText(id);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 1500);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm p-4 select-none">
      <div className="bg-slate-900 border border-slate-800 rounded-xl w-full max-w-2xl max-h-[85vh] flex flex-col shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between bg-slate-950/80">
          <div className="flex items-center gap-2.5">
            <div className="p-1.5 bg-amber-950/60 border border-amber-800/80 rounded-lg text-amber-400">
              <MapPinOff className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-sm font-semibold text-slate-100 font-mono">
                  Signals Awaiting Geolocation
                </h2>
                <span className="px-2 py-0.5 text-[11px] font-mono font-semibold rounded bg-amber-950 border border-amber-700/80 text-amber-300">
                  {unmappedSignals.length} Problematic
                </span>
              </div>
              <p className="text-[11px] text-slate-400 mt-0.5">
                Features lacking map coordinates or marked with <code className="text-amber-300 font-mono">geom_kind: &quot;none&quot;</code> (Worldwide / unresolved country).
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-200 hover:bg-slate-800 rounded transition-colors"
            title="Close dialog"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 flex-1 overflow-y-auto space-y-4 text-xs">
          {unmappedSignals.length === 0 ? (
            <div className="p-8 text-center text-slate-400 font-mono space-y-2">
              <div className="inline-flex p-3 rounded-full bg-emerald-950/50 border border-emerald-800/60 text-emerald-400">
                <Check className="w-6 h-6" />
              </div>
              <p className="text-slate-200 font-medium">All signals are successfully geocoded.</p>
              <p className="text-[11px] text-slate-500">Every feature in the GeoJSON dataset contains valid point coordinates.</p>
            </div>
          ) : (
            <>
              {/* Quick Action Top Bar */}
              <div className="flex items-center justify-between p-3 bg-slate-950 border border-slate-800 rounded-lg font-mono">
                <div className="text-slate-400">
                  <span className="text-slate-200 font-semibold">{unmappedSignals.length}</span> signal IDs ready to copy:
                </div>
                <button
                  onClick={handleCopyAll}
                  className="px-3 py-1.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold rounded flex items-center gap-1.5 transition-colors text-xs"
                >
                  {copiedAll ? <Check className="w-3.5 h-3.5 text-slate-950" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copiedAll ? 'All IDs Copied!' : 'Copy All IDs'}</span>
                </button>
              </div>

              {/* Signals List */}
              <div className="border border-slate-800 rounded-lg overflow-hidden divide-y divide-slate-800 bg-slate-950/50">
                {unmappedSignals.map((signal) => {
                  const id = signal.properties?.id || signal.id;
                  const mod = extractSignalModule(signal);
                  const isCopied = copiedId === id;

                  return (
                    <div
                      key={id}
                      className="p-3.5 hover:bg-slate-900/60 transition-colors flex items-start justify-between gap-3"
                    >
                      <div className="space-y-1 min-w-0 flex-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-mono text-xs font-bold text-amber-400 tracking-wider">
                            {id}
                          </span>
                          <span className="px-1.5 py-0.5 rounded bg-cyan-950/80 border border-cyan-800/80 text-[10px] text-cyan-300 font-mono font-semibold uppercase">
                            {mod}
                          </span>
                          <span className="text-[11px] font-mono text-slate-400">
                            {signal.properties?.date}
                          </span>
                        </div>
                        <div className="text-slate-200 font-medium text-xs leading-snug">
                          {signal.properties?.title}
                        </div>
                        <div className="text-[11px] font-mono text-slate-400 flex items-center gap-2">
                          <span className="text-slate-300">Location: {signal.properties?.location || 'Unknown'}</span>
                          <span aria-hidden="true" className="text-slate-600">·</span>
                          <span className="text-slate-400">Type: {signal.properties?.location_type}</span>
                          <span aria-hidden="true" className="text-slate-600">·</span>
                          <span className="text-amber-400 font-semibold">{signal.properties?.geom_kind || 'none'}</span>
                        </div>
                      </div>

                      <button
                        onClick={() => handleCopySingle(id)}
                        className="px-2.5 py-1 text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded font-mono text-[11px] flex items-center gap-1 shrink-0 transition-colors"
                        title="Copy this signal ID"
                      >
                        {isCopied ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                        <span>{isCopied ? 'Copied' : 'Copy'}</span>
                      </button>
                    </div>
                  );
                })}
              </div>

              {/* Raw ID Box for Quick Selection */}
              <div>
                <div className="text-[11px] font-mono text-slate-400 mb-1">Raw IDs list (newline separated):</div>
                <textarea
                  readOnly
                  value={allIdsText}
                  rows={Math.min(unmappedSignals.length + 1, 6)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-[11px] font-mono text-amber-300 focus:outline-none focus:border-amber-500 selection:bg-amber-950"
                />
              </div>
            </>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-3 border-t border-slate-800 flex items-center justify-between bg-slate-950/80 text-xs font-mono">
          <span className="text-slate-500">
            Authoritative GeoJSON mode active.
          </span>
          <div className="flex items-center gap-2">
            {unmappedSignals.length > 0 && (
              <button
                onClick={handleCopyAll}
                className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded transition-colors flex items-center gap-1.5"
              >
                {copiedAll ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copiedAll ? 'Copied' : 'Copy All'}</span>
              </button>
            )}
            <button
              onClick={onClose}
              className="px-4 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded transition-colors"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
