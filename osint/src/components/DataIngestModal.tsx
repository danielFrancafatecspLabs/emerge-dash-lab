import React, { useState } from 'react';
import { SignalFeatureCollection } from '../types/signal';
import { X, Upload, Download, Check, AlertCircle, FileCode, RefreshCw } from 'lucide-react';

interface DataIngestModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentGeoJSON: SignalFeatureCollection;
  onImportGeoJSON: (collection: SignalFeatureCollection, fileName?: string) => void;
  onResetDefault: () => void;
}

export const DataIngestModal: React.FC<DataIngestModalProps> = ({
  isOpen,
  onClose,
  currentGeoJSON,
  onImportGeoJSON,
  onResetDefault,
}) => {
  const [jsonText, setJsonText] = useState(JSON.stringify(currentGeoJSON, null, 2));
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  const handleApplyImport = () => {
    try {
      setErrorMessage(null);
      const parsed = JSON.parse(jsonText);
      if (!parsed || parsed.type !== 'FeatureCollection' || !Array.isArray(parsed.features)) {
        throw new Error('Invalid GeoJSON: Root must be a FeatureCollection with a "features" array.');
      }
      // Completely replaces active GeoJSON (no incremental concatenation)
      onImportGeoJSON(parsed as SignalFeatureCollection, 'Pasted GeoJSON');
      onClose();
    } catch (err: any) {
      setErrorMessage(err.message || 'JSON Parse error. Please check formatting.');
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const content = event.target?.result as string;
        setJsonText(content);
        setErrorMessage(null);
        const parsed = JSON.parse(content);
        if (!parsed || parsed.type !== 'FeatureCollection' || !Array.isArray(parsed.features)) {
          throw new Error('Invalid GeoJSON: Root must be a FeatureCollection with a "features" array.');
        }
        // Immediately replaces active GeoJSON (no incremental concatenation)
        onImportGeoJSON(parsed as SignalFeatureCollection, file.name);
        onClose();
      } catch (err: any) {
        setErrorMessage(err.message || 'Error parsing uploaded GeoJSON file.');
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  const handleDownloadGeoJSON = () => {
    const blob = new Blob([JSON.stringify(currentGeoJSON, null, 2)], {
      type: 'application/geo+json',
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `signals-collection-${new Date().toISOString().split('T')[0]}.geojson`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(jsonText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4 select-none">
      <div className="bg-slate-900 border border-slate-800 rounded-xl w-full max-w-3xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden">
        {/* Modal Header */}
        <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between bg-slate-950/60">
          <div className="flex items-center gap-2">
            <FileCode className="w-5 h-5 text-cyan-400" />
            <h2 className="text-sm font-semibold text-slate-100 uppercase tracking-wider font-mono">
              GeoJSON Signals I/O & Ingestion
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-1 text-slate-400 hover:text-slate-200 hover:bg-slate-800 rounded transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 flex-1 overflow-y-auto space-y-4 text-xs">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-slate-400">
            <div>
              <p>
                Paste custom GeoJSON or upload a <code className="text-cyan-300">.geojson</code> file.
              </p>
              <p className="text-[11px] text-cyan-400 font-mono mt-0.5">
                ● Complete Refresh: Uploading or applying GeoJSON completely replaces previous signals (no concatenation).
              </p>
            </div>
            <label className="cursor-pointer px-3 py-1.5 bg-cyan-950/80 hover:bg-cyan-900 border border-cyan-700/80 text-cyan-200 rounded-md font-mono flex items-center gap-1.5 transition-colors self-start sm:self-auto shrink-0">
              <Upload className="w-3.5 h-3.5 text-cyan-400" />
              <span>Upload & Replace All</span>
              <input type="file" accept=".json,.geojson" onChange={handleFileUpload} className="hidden" />
            </label>
          </div>

          {errorMessage && (
            <div className="p-3 bg-rose-950/40 border border-rose-800/80 rounded-lg text-rose-300 flex items-center gap-2 font-mono">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}

          {/* GeoJSON Editor Box */}
          <div className="relative">
            <textarea
              value={jsonText}
              onChange={(e) => setJsonText(e.target.value)}
              rows={16}
              className="w-full bg-slate-950 border border-slate-800 rounded-lg p-3 text-[11px] font-mono text-emerald-400 focus:outline-none focus:border-cyan-500 selection:bg-slate-800"
              spellCheck={false}
            />
          </div>
        </div>

        {/* Modal Footer */}
        <div className="px-6 py-3.5 border-t border-slate-800 flex flex-wrap items-center justify-between gap-3 bg-slate-950/60 text-xs">
          <div className="flex items-center gap-2">
            <button
              onClick={handleCopy}
              className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded font-mono flex items-center gap-1.5 transition-colors"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : null}
              <span>{copied ? 'Copied' : 'Copy JSON'}</span>
            </button>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleDownloadGeoJSON}
              className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded font-mono flex items-center gap-1.5 transition-colors"
            >
              <Download className="w-3.5 h-3.5 text-cyan-400" />
              <span>Export GeoJSON</span>
            </button>
            <button
              onClick={handleApplyImport}
              className="px-4 py-1.5 bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-medium rounded transition-colors font-mono"
            >
              Replace Active Signals
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
