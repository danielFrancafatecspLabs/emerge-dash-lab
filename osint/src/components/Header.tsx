import React from 'react';
import { ViewTab, SignalFeatureCollection } from '../types/signal';
import { Download, Upload, RefreshCw } from 'lucide-react';

interface HeaderProps {
  currentTab: ViewTab;
  onTabChange: (tab: ViewTab) => void;
  onOpenDataModal: () => void;
  onUploadGeoJSON?: (collection: SignalFeatureCollection, fileName?: string) => void;
  isAiEnabled?: boolean;
}

export const Header: React.FC<HeaderProps> = ({
  currentTab,
  onTabChange,
  onOpenDataModal,
  onUploadGeoJSON,
  isAiEnabled = false,
}) => {
  const handleDirectFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !onUploadGeoJSON) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const text = event.target?.result as string;
        const parsed = JSON.parse(text);
        if (parsed && parsed.type === 'FeatureCollection' && Array.isArray(parsed.features)) {
          onUploadGeoJSON(parsed as SignalFeatureCollection, file.name);
        } else {
          alert('Invalid GeoJSON: File must be a FeatureCollection with a "features" array.');
        }
      } catch (err: any) {
        console.error('Failed to parse uploaded GeoJSON:', err);
      }
    };
    reader.readAsText(file);
    // Reset input so same file can be reloaded if needed
    e.target.value = '';
  };
  return (
    <header className="h-14 bg-slate-950 border-b border-slate-800/80 px-6 flex items-center justify-between z-30 select-none">
      {/* Zone 1: Single text element wordmark (Display face) */}
      <div className="flex items-center gap-3">
        <a
          href="#"
          onClick={(e) => {
            e.preventDefault();
            onTabChange('map');
          }}
          className="text-base font-bold tracking-wider text-slate-100 uppercase hover:text-cyan-400 transition-colors whitespace-nowrap"
        >
          Signal Strategic Dashboard
        </a>
      </div>

      {/* Zone 2: 4 clean text navigation links / view switcher */}
      <nav className="flex items-center gap-1 sm:gap-2">
        <button
          onClick={() => onTabChange('map')}
          className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors whitespace-nowrap ${
            currentTab === 'map'
              ? 'bg-slate-800 text-cyan-300 shadow-sm border border-slate-700/60'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/60'
          }`}
        >
          Tactical View
        </button>
        {/* Knowledge Graph disabled for now
        <button
          onClick={() => onTabChange('graph')}
          className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors whitespace-nowrap ${
            currentTab === 'graph'
              ? 'bg-slate-800 text-cyan-300 shadow-sm border border-slate-700/60'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/60'
          }`}
        >
          Knowledge Graph
        </button>
        */}
        <button
          onClick={() => onTabChange('registry')}
          className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors whitespace-nowrap ${
            currentTab === 'registry'
              ? 'bg-slate-800 text-cyan-300 shadow-sm border border-slate-700/60'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/60'
          }`}
        >
          Signals Registry
        </button>
        <button
          onClick={() => onTabChange('matrix')}
          className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors whitespace-nowrap ${
            currentTab === 'matrix'
              ? 'bg-slate-800 text-cyan-300 shadow-sm border border-slate-700/60'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/60'
          }`}
        >
          Impact Matrix
        </button>
        {isAiEnabled && (
          <button
            onClick={() => onTabChange('briefing')}
            className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors whitespace-nowrap ${
              currentTab === 'briefing'
                ? 'bg-slate-800 text-cyan-300 shadow-sm border border-slate-700/60'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/60'
            }`}
          >
            OSINT Briefing
          </button>
        )}
      </nav>

      {/* Zone 3: Primary Actions */}
      <div className="flex items-center gap-2">
        <label
          className="px-3 py-1.5 text-xs font-mono text-cyan-300 bg-cyan-950/60 hover:bg-cyan-900/60 border border-cyan-800/80 rounded-md transition-colors flex items-center gap-1.5 whitespace-nowrap cursor-pointer"
          title="Upload a new GeoJSON file to completely refresh and replace the active signals"
        >
          <Upload className="w-3.5 h-3.5 text-cyan-400" />
          <span>Upload GeoJSON</span>
          <input
            type="file"
            accept=".json,.geojson,application/geo+json,application/json"
            onChange={handleDirectFileSelect}
            className="hidden"
          />
        </label>

        <button
          onClick={onOpenDataModal}
          className="px-3 py-1.5 text-xs font-mono text-slate-300 bg-slate-900 hover:bg-slate-800 border border-slate-800 rounded-md transition-colors flex items-center gap-1.5 whitespace-nowrap"
          title="Import or Export GeoJSON FeatureCollection"
        >
          <Download className="w-3.5 h-3.5 text-slate-400" />
          <span>GeoJSON I/O</span>
        </button>
      </div>
    </header>
  );
};
