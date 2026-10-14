import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  SignalFeatureCollection,
  SignalFeature
} from '../types/signal';
import {
  FeedSourceType,
  SyncMode,
  SyncStatus,
  fetchGeoJsonFromUrl,
  pickLocalGeoJsonFile,
  pickLocalFolder,
  pollLocalFileHandle,
  isFileSystemAccessSupported,
  generateSimulatedFeedBatch
} from '../utils/feedSyncService';
import {
  RefreshCw,
  FolderOpen,
  Globe,
  Radio,
  Clock,
  Settings2,
  CheckCircle2,
  AlertTriangle,
  Play,
  Pause,
  DownloadCloud,
  FileCode,
  Zap,
  X
} from 'lucide-react';
import { DATA_BASE } from '../utils/paths';

interface FeedSyncToolbarProps {
  currentSignalsCount: number;
  onFeedUpdated: (collection: SignalFeatureCollection, mode: SyncMode, sourceDescription: string) => void;
  isManualUploadActive?: boolean;
  activeSourceLabel?: string;
}

export const FeedSyncToolbar: React.FC<FeedSyncToolbarProps> = ({
  currentSignalsCount,
  onFeedUpdated,
  isManualUploadActive = false,
  activeSourceLabel = '',
}) => {
  // Sync Configuration
  const [sourceType, setSourceType] = useState<FeedSourceType>('url');
  const [url, setUrl] = useState<string>(`${DATA_BASE}/signals.geojson`);
  const [localSourceLabel, setLocalSourceLabel] = useState<string>('');
  const [intervalSeconds, setIntervalSeconds] = useState<number>(30);
  const [autoSyncEnabled, setAutoSyncEnabled] = useState<boolean>(!isManualUploadActive);
  const syncMode: SyncMode = 'replace';

  // Status tracking
  const [status, setStatus] = useState<SyncStatus>({
    state: isManualUploadActive ? 'success' : 'idle',
    lastSyncTime: isManualUploadActive ? new Date() : null,
    lastSource: isManualUploadActive ? (activeSourceLabel || 'Manual Upload') : `${DATA_BASE}/signals.geojson`,
    itemCount: currentSignalsCount,
    errorMessage: null,
    hasChanged: false,
  });

  const [lastNotification, setLastNotification] = useState<string | null>(null);
  const [isConfigOpen, setIsConfigOpen] = useState<boolean>(false);
  const timerRef = useRef<number | null>(null);

  // When a manual upload occurs, pause background polling so the uploaded dataset isn't overwritten
  useEffect(() => {
    if (isManualUploadActive) {
      setAutoSyncEnabled(false);
      setSourceType('manual');
      setStatus((prev) => ({
        ...prev,
        state: 'success',
        lastSyncTime: new Date(),
        lastSource: activeSourceLabel || 'User Uploaded File',
        itemCount: currentSignalsCount,
        hasChanged: false,
      }));
    }
  }, [isManualUploadActive, activeSourceLabel, currentSignalsCount]);

  // Execute a single sync cycle
  const performSync = useCallback(async (isManual: boolean = false) => {
    setStatus((prev) => ({ ...prev, state: 'syncing', errorMessage: null }));

    try {
      let data: SignalFeatureCollection | null = null;
      let changed = false;
      let desc = '';

      if (sourceType === 'url') {
        const result = await fetchGeoJsonFromUrl(url);
        data = result.data;
        changed = result.changed;
        desc = `URL: ${url}`;
      } else if (sourceType === 'local-file' || sourceType === 'local-folder') {
        const result = await pollLocalFileHandle();
        if (result) {
          data = result.data;
          changed = result.changed;
          desc = `Local File: ${localSourceLabel || 'shared.geojson'}`;
        } else {
          // No file handle attached yet
          if (isManual) {
            // Trigger file picker
            const picked = await pickLocalGeoJsonFile();
            data = picked.data;
            changed = true;
            setLocalSourceLabel(picked.fileName);
            desc = `Local File: ${picked.fileName}`;
          }
        }
      }

      if (data && data.features) {
        if (changed || isManual) {
          onFeedUpdated(data, syncMode, desc);
          setLastNotification(
            `Synchronized ${data.features.length} signals (${new Date().toLocaleTimeString()})`
          );
          setTimeout(() => setLastNotification(null), 4000);
        }

        setStatus({
          state: 'success',
          lastSyncTime: new Date(),
          lastSource: desc,
          itemCount: data.features.length,
          errorMessage: null,
          hasChanged: changed,
        });
      } else {
        setStatus((prev) => ({
          ...prev,
          state: 'idle',
          lastSyncTime: new Date(),
        }));
      }
    } catch (err: any) {
      console.warn('Feed Sync Notice:', err);
      setStatus((prev) => ({
        ...prev,
        state: 'error',
        errorMessage: err?.message || 'Sync failed',
      }));
    }
  }, [sourceType, url, localSourceLabel, syncMode, onFeedUpdated]);

  // Setup periodic polling interval
  useEffect(() => {
    if (timerRef.current) {
      window.clearInterval(timerRef.current);
      timerRef.current = null;
    }

    if (autoSyncEnabled && intervalSeconds > 0) {
      timerRef.current = window.setInterval(() => {
        performSync(false);
      }, intervalSeconds * 1000);
    }

    return () => {
      if (timerRef.current) {
        window.clearInterval(timerRef.current);
      }
    };
  }, [autoSyncEnabled, intervalSeconds, performSync]);

  // Pick local file handler
  const handleSelectLocalFile = async () => {
    try {
      const picked = await pickLocalGeoJsonFile();
      setSourceType('local-file');
      setLocalSourceLabel(picked.fileName);
      onFeedUpdated(picked.data, syncMode, `Local: ${picked.fileName}`);
      setStatus({
        state: 'success',
        lastSyncTime: new Date(),
        lastSource: `Local: ${picked.fileName}`,
        itemCount: picked.data.features.length,
        errorMessage: null,
        hasChanged: true,
      });
      setIsConfigOpen(false);
    } catch (err: any) {
      if (err.name !== 'AbortError') {
        setStatus((prev) => ({ ...prev, state: 'error', errorMessage: err.message }));
      }
    }
  };

  // Pick local shared folder handler
  const handleSelectLocalFolder = async () => {
    try {
      const picked = await pickLocalFolder();
      setSourceType('local-folder');
      setLocalSourceLabel(`${picked.folderName}/${picked.fileName}`);
      onFeedUpdated(picked.data, syncMode, `Folder: ${picked.fileName}`);
      setStatus({
        state: 'success',
        lastSyncTime: new Date(),
        lastSource: `Folder: ${picked.fileName}`,
        itemCount: picked.data.features.length,
        errorMessage: null,
        hasChanged: true,
      });
      setIsConfigOpen(false);
    } catch (err: any) {
      if (err.name !== 'AbortError') {
        setStatus((prev) => ({ ...prev, state: 'error', errorMessage: err.message }));
      }
    }
  };

  // Trigger simulated drop
  const handleSimulateDrop = () => {
    const simulated = generateSimulatedFeedBatch(currentSignalsCount);
    onFeedUpdated(simulated, 'merge', 'Simulated External Cron Drop');
    setLastNotification(`Simulated feed drop ingested (+${simulated.features.length} signal)`);
    setTimeout(() => setLastNotification(null), 4000);
    setStatus({
      state: 'success',
      lastSyncTime: new Date(),
      lastSource: 'Simulated Cron Batch',
      itemCount: currentSignalsCount + simulated.features.length,
      errorMessage: null,
      hasChanged: true,
    });
  };

  return (
    <div className="bg-slate-900/90 border-b border-slate-800/80 px-4 py-2 flex flex-wrap items-center justify-between gap-3 text-xs font-mono select-none">
      {/* Left: Feed Status & Source indicator */}
      <div className="flex items-center gap-3">
        {/* Status Pulse */}
        <div className="flex items-center gap-2">
          {status.state === 'syncing' ? (
            <span className="flex items-center gap-1.5 text-cyan-400">
              <RefreshCw className="w-3.5 h-3.5 animate-spin" />
              <span className="font-semibold uppercase tracking-wider text-[11px]">Polling Feed...</span>
            </span>
          ) : status.state === 'error' ? (
            <span className="flex items-center gap-1.5 text-rose-400" title={status.errorMessage || 'Error'}>
              <AlertTriangle className="w-3.5 h-3.5" />
              <span className="font-semibold uppercase tracking-wider text-[11px]">Sync Alert</span>
            </span>
          ) : autoSyncEnabled ? (
            <span className="flex items-center gap-1.5 text-emerald-400">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
              <span className="font-semibold uppercase tracking-wider text-[11px]">Live Sync Active</span>
            </span>
          ) : (
            <span className="flex items-center gap-1.5 text-slate-400">
              <span className="w-2 h-2 rounded-full bg-slate-500"></span>
              <span className="font-semibold uppercase tracking-wider text-[11px]">Sync Paused</span>
            </span>
          )}
        </div>

        <span className="text-slate-700">|</span>

        {/* Source Badge */}
        <div className="flex items-center gap-1.5 text-slate-300 bg-slate-950/70 border border-slate-800 px-2.5 py-1 rounded">
          {sourceType === 'url' ? (
            <Globe className="w-3.5 h-3.5 text-cyan-400" />
          ) : (
            <FolderOpen className="w-3.5 h-3.5 text-amber-400" />
          )}
          <span className="text-slate-400 text-[11px]">Source:</span>
          <span className="text-cyan-300 font-medium max-w-[200px] truncate" title={localSourceLabel || url}>
            {localSourceLabel || url}
          </span>
        </div>

        {/* Timestamp */}
        {status.lastSyncTime && (
          <div className="hidden md:flex items-center gap-1 text-[11px] text-slate-400">
            <Clock className="w-3 h-3 text-slate-500" />
            <span>Last checked: {status.lastSyncTime.toLocaleTimeString()}</span>
          </div>
        )}
      </div>

      {/* Center: Live Notification Toast (if active) */}
      {lastNotification && (
        <div className="flex items-center gap-1.5 px-3 py-1 bg-cyan-950/90 border border-cyan-700/80 rounded text-cyan-300 text-[11px] animate-in fade-in">
          <CheckCircle2 className="w-3.5 h-3.5 text-cyan-400" />
          <span>{lastNotification}</span>
        </div>
      )}

      {/* Right Controls: Auto-Sync toggle, Sync Now, Source Settings, Simulate Drop */}
      <div className="flex items-center gap-2">
        {/* Interval Selector */}
        <div className="flex items-center gap-1 bg-slate-950/80 border border-slate-800 rounded px-2 py-0.5">
          <span className="text-slate-400 text-[10px] uppercase tracking-wider">Interval:</span>
          <select
            value={autoSyncEnabled ? intervalSeconds : 0}
            onChange={(e) => {
              const val = Number(e.target.value);
              if (val === 0) {
                setAutoSyncEnabled(false);
              } else {
                setAutoSyncEnabled(true);
                setIntervalSeconds(val);
              }
            }}
            aria-label="Feed auto-sync interval"
            className="bg-transparent text-slate-200 text-xs font-mono focus:outline-none cursor-pointer"
          >
            <option value={0}>Manual Only</option>
            <option value={10}>Every 10s</option>
            <option value={30}>Every 30s</option>
            <option value={60}>Every 1m</option>
            <option value={300}>Every 5m</option>
          </select>
        </div>

        {/* Sync Now Button */}
        <button
          onClick={() => performSync(true)}
          disabled={status.state === 'syncing'}
          className="px-2.5 py-1 bg-cyan-950 hover:bg-cyan-900 border border-cyan-800 text-cyan-300 rounded flex items-center gap-1.5 text-xs transition-colors disabled:opacity-50"
          title="Force immediate check of shared folder or URL"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${status.state === 'syncing' ? 'animate-spin' : ''}`} />
          <span>Sync Now</span>
        </button>

        {/* Simulate Drop Button */}
        <button
          onClick={handleSimulateDrop}
          className="px-2.5 py-1 bg-amber-950/60 hover:bg-amber-900/80 border border-amber-800/80 text-amber-300 rounded flex items-center gap-1.5 text-xs transition-colors"
          title="Simulate an external cron process dropping new intelligence into the folder"
        >
          <Zap className="w-3.5 h-3.5 text-amber-400" />
          <span>+ Simulate Drop</span>
        </button>

        {/* Configure Source Modal Trigger */}
        <button
          onClick={() => setIsConfigOpen(!isConfigOpen)}
          className={`p-1.5 rounded border transition-colors ${
            isConfigOpen
              ? 'bg-slate-700 text-slate-100 border-slate-600'
              : 'bg-slate-950/80 text-slate-400 hover:text-slate-200 border-slate-800 hover:bg-slate-800'
          }`}
          title="Configure Shared Feed Source & Options"
        >
          <Settings2 className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Source Configuration Modal Popover */}
      {isConfigOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
          <div className="w-full max-w-lg bg-slate-900 border border-slate-700 rounded-xl shadow-2xl p-5 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <FolderOpen className="w-5 h-5 text-cyan-400" />
                <h3 className="text-sm font-semibold text-slate-100">
                  Configure Shared Feed & Directory Sync
                </h3>
              </div>
              <button
                onClick={() => setIsConfigOpen(false)}
                className="text-slate-400 hover:text-slate-200 p-1 rounded hover:bg-slate-800"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-4 text-xs font-sans text-slate-300">
              {/* Option 1: URL / Public Web Directory */}
              <div className="p-3 bg-slate-950 border border-slate-800 rounded-lg space-y-2">
                <div className="flex items-center justify-between font-mono font-medium text-slate-200">
                  <div className="flex items-center gap-2">
                    <Globe className="w-4 h-4 text-cyan-400" />
                    <span>Option A: HTTP / Static Web Directory</span>
                  </div>
                  <input
                    type="radio"
                    name="sourceType"
                    checked={sourceType === 'url'}
                    onChange={() => setSourceType('url')}
                    className="accent-cyan-500 cursor-pointer"
                  />
                </div>
                <p className="text-[11px] text-slate-400 font-sans">
                  The frontend automatically polls a public endpoint or CDN where your periodic process drops the GeoJSON file.
                </p>
                <div className="flex items-center gap-2 pt-1 font-mono">
                  <input
                    type="text"
                    value={url}
                    onChange={(e) => {
                      setUrl(e.target.value);
                      setSourceType('url');
                    }}
                    placeholder={`${DATA_BASE}/signals.geojson`}
                    className="flex-1 bg-slate-900 border border-slate-700 rounded px-2.5 py-1.5 text-xs text-cyan-300 font-mono focus:outline-none focus:border-cyan-500"
                  />
                  <button
                    onClick={() => {
                      setSourceType('url');
                      performSync(true);
                      setIsConfigOpen(false);
                    }}
                    className="px-3 py-1.5 bg-cyan-600 hover:bg-cyan-500 text-slate-950 font-semibold font-mono rounded text-xs"
                  >
                    Apply URL
                  </button>
                </div>
                <div className="text-[10px] text-slate-500 font-mono">
                  Default: <code className="text-cyan-400">/data/signals.geojson</code> (Ready & tested)
                </div>
              </div>

              {/* Option 2: Local Shared File or Folder */}
              <div className="p-3 bg-slate-950 border border-slate-800 rounded-lg space-y-2">
                <div className="flex items-center justify-between font-mono font-medium text-slate-200">
                  <div className="flex items-center gap-2">
                    <FolderOpen className="w-4 h-4 text-amber-400" />
                    <span>Option B: Local Machine Shared Folder / File</span>
                  </div>
                  <input
                    type="radio"
                    name="sourceType"
                    checked={sourceType === 'local-file' || sourceType === 'local-folder'}
                    onChange={() => setSourceType('local-file')}
                    className="accent-amber-500 cursor-pointer"
                  />
                </div>
                <p className="text-[11px] text-slate-400 font-sans">
                  Uses the HTML5 File System Access API. Select a folder on your workstation where an automated cron daemon drops files.
                </p>

                {isFileSystemAccessSupported() ? (
                  <div className="flex flex-wrap items-center gap-2 pt-1 font-mono">
                    <button
                      onClick={handleSelectLocalFile}
                      className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 border border-slate-600 text-slate-200 rounded text-xs flex items-center gap-1.5"
                    >
                      <FileCode className="w-3.5 h-3.5 text-amber-400" />
                      <span>Select Shared .geojson File</span>
                    </button>

                    <button
                      onClick={handleSelectLocalFolder}
                      className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 border border-slate-600 text-slate-200 rounded text-xs flex items-center gap-1.5"
                    >
                      <FolderOpen className="w-3.5 h-3.5 text-amber-400" />
                      <span>Select Shared Folder</span>
                    </button>
                  </div>
                ) : (
                  <div className="p-2 bg-amber-950/40 border border-amber-800/60 rounded text-amber-300 text-[11px]">
                    Direct local folder access is not supported in this browser. Please use Option A (HTTP/Static URL) or upload files manually.
                  </div>
                )}

                {localSourceLabel && (
                  <div className="text-[11px] font-mono text-emerald-400 flex items-center gap-1">
                    <CheckCircle2 className="w-3 h-3" />
                    <span>Connected to: {localSourceLabel}</span>
                  </div>
                )}
              </div>

              {/* Ingestion Strategy */}
              <div className="pt-2 border-t border-slate-800 flex items-center justify-between">
                <div>
                  <span className="font-semibold text-slate-200 text-xs">Ingestion Mode:</span>
                  <p className="text-[11px] text-slate-400">
                    Complete Refresh: Replaces all contents of previous GeoJSON (no concatenation).
                  </p>
                </div>
                <span className="px-2.5 py-1 text-[11px] font-mono bg-cyan-950/90 border border-cyan-700/80 text-cyan-300 font-semibold rounded uppercase">
                  Full Replace
                </span>
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-slate-800 font-mono text-xs">
              <button
                onClick={() => setIsConfigOpen(false)}
                className="px-4 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
