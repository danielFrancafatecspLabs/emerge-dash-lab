import { SignalFeatureCollection, SignalFeature } from '../types/signal';
import { GraphData } from '../types/graph';
import { DATA_BASE } from './paths';

export type FeedSourceType = 'url' | 'local-file' | 'local-folder' | 'manual';
export type SyncMode = 'replace' | 'merge';

export interface FeedSyncConfig {
  sourceType: FeedSourceType;
  url: string;
  intervalSeconds: number; // 0 = manual
  mode: SyncMode;
  autoSyncEnabled: boolean;
}

export interface SyncStatus {
  state: 'idle' | 'syncing' | 'success' | 'error';
  lastSyncTime: Date | null;
  lastSource: string;
  itemCount: number;
  errorMessage: string | null;
  hasChanged: boolean;
}

// In-memory file handle storage for File System Access API
let activeFileHandle: FileSystemFileHandle | null = null;
let activeDirectoryHandle: FileSystemDirectoryHandle | null = null;
let lastKnownFileTimestamp: number = 0;
let lastContentFingerprint: string = '';

// Quick string hash for change detection
export function computeFingerprint(data: any): string {
  try {
    const str = typeof data === 'string' ? data : JSON.stringify(data);
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      hash = (hash << 5) - hash + str.charCodeAt(i);
      hash |= 0;
    }
    return `${hash}_${str.length}`;
  } catch {
    return `${Date.now()}`;
  }
}

export function setContentFingerprint(data: any): void {
  lastContentFingerprint = computeFingerprint(data);
}

// Fetch GeoJSON from an HTTP endpoint / public directory
export async function fetchGeoJsonFromUrl(url: string): Promise<{ data: SignalFeatureCollection; changed: boolean }> {
  // Add cache buster timestamp to ensure fresh reads from server
  const cacheBuster = `_t=${Date.now()}`;
  const fetchUrl = url.includes('?') ? `${url}&${cacheBuster}` : `${url}?${cacheBuster}`;

  const response = await fetch(fetchUrl, {
    headers: {
      Accept: 'application/geo+json, application/json',
    },
    cache: 'no-store',
  });

  if (!response.ok) {
    throw new Error(`HTTP ${response.status}: ${response.statusText}`);
  }

  const raw = await response.json();
  if (!raw || raw.type !== 'FeatureCollection' || !Array.isArray(raw.features)) {
    throw new Error('Invalid GeoJSON: Expected a FeatureCollection with a features array.');
  }

  const fingerprint = computeFingerprint(raw);
  const changed = fingerprint !== lastContentFingerprint;
  lastContentFingerprint = fingerprint;

  return { data: raw as SignalFeatureCollection, changed };
}

let lastGraphFingerprint: string = '';

// Fetch Graph JSON from an HTTP endpoint / public directory
export async function fetchGraphFromUrl(url: string = `${DATA_BASE}/graph.json`): Promise<{ data: GraphData; changed: boolean }> {
  const cacheBuster = `_t=${Date.now()}`;
  const fetchUrl = url.includes('?') ? `${url}&${cacheBuster}` : `${url}?${cacheBuster}`;

  const response = await fetch(fetchUrl, {
    headers: {
      Accept: 'application/json',
    },
    cache: 'no-store',
  });

  if (!response.ok) {
    throw new Error(`HTTP ${response.status}: ${response.statusText}`);
  }

  const raw = await response.json();
  if (!raw || !Array.isArray(raw.nodes) || !Array.isArray(raw.edges)) {
    throw new Error('Invalid Graph JSON: Expected an object with nodes and edges arrays.');
  }

  const fingerprint = computeFingerprint(raw);
  const changed = fingerprint !== lastGraphFingerprint;
  lastGraphFingerprint = fingerprint;

  return { data: raw as GraphData, changed };
}

// Check if modern File System Access API is supported
export function isFileSystemAccessSupported(): boolean {
  return typeof window !== 'undefined' && 'showOpenFilePicker' in window;
}

// Pick a local GeoJSON file using the File System Access API
export async function pickLocalGeoJsonFile(): Promise<{ fileName: string; data: SignalFeatureCollection }> {
  if (!isFileSystemAccessSupported()) {
    throw new Error('The File System Access API is not supported in this browser. Please use the URL sync option or upload manually.');
  }

  const [handle] = await (window as any).showOpenFilePicker({
    types: [
      {
        description: 'GeoJSON & JSON Feeds',
        accept: {
          'application/geo+json': ['.geojson'],
          'application/json': ['.json'],
        },
      },
    ],
    multiple: false,
  });

  activeFileHandle = handle;
  const file = await handle.getFile();
  lastKnownFileTimestamp = file.lastModified;

  const text = await file.text();
  const json = JSON.parse(text);

  if (!json || json.type !== 'FeatureCollection' || !Array.isArray(json.features)) {
    throw new Error('Selected file does not appear to be a valid GeoJSON FeatureCollection.');
  }

  lastContentFingerprint = computeFingerprint(json);
  return { fileName: file.name, data: json as SignalFeatureCollection };
}

// Poll currently attached local file handle
export async function pollLocalFileHandle(): Promise<{ data: SignalFeatureCollection; changed: boolean } | null> {
  if (!activeFileHandle) return null;

  try {
    const file = await activeFileHandle.getFile();
    // Fast path: if file modification timestamp hasn't changed, skip parsing
    if (file.lastModified === lastKnownFileTimestamp) {
      return { data: null as any, changed: false };
    }

    lastKnownFileTimestamp = file.lastModified;
    const text = await file.text();
    const json = JSON.parse(text);

    const fingerprint = computeFingerprint(json);
    const changed = fingerprint !== lastContentFingerprint;
    lastContentFingerprint = fingerprint;

    return { data: json as SignalFeatureCollection, changed };
  } catch (err: any) {
    throw new Error(`Failed to read local file handle: ${err?.message || err}`);
  }
}

// Pick a local shared folder and discover GeoJSON files
export async function pickLocalFolder(): Promise<{ folderName: string; fileName: string; data: SignalFeatureCollection }> {
  if (typeof window === 'undefined' || !('showDirectoryPicker' in window)) {
    throw new Error('Directory access is not supported in this browser. Please use the URL or File picker.');
  }

  const dirHandle = await (window as any).showDirectoryPicker({
    mode: 'read',
  });
  activeDirectoryHandle = dirHandle;

  // Find the first or newest .geojson or signals.json file
  let candidateFileHandle: FileSystemFileHandle | null = null;
  let candidateName = '';

  for await (const entry of (dirHandle as any).values()) {
    if (entry.kind === 'file') {
      const name = entry.name.toLowerCase();
      if (name.endsWith('.geojson') || name === 'signals.json') {
        candidateFileHandle = entry;
        candidateName = entry.name;
        break;
      }
    }
  }

  if (!candidateFileHandle) {
    throw new Error(`No .geojson files found in folder "${dirHandle.name}". Please ensure your periodic process writes .geojson files here.`);
  }

  activeFileHandle = candidateFileHandle;
  const file = await candidateFileHandle.getFile();
  lastKnownFileTimestamp = file.lastModified;
  const text = await file.text();
  const json = JSON.parse(text);

  return {
    folderName: dirHandle.name,
    fileName: candidateName,
    data: json as SignalFeatureCollection,
  };
}

// Generate simulated incoming intelligence signals (for testing periodic ingest)
export function generateSimulatedFeedBatch(currentCount: number): SignalFeatureCollection {
  const timestamp = new Date().toISOString().split('T')[0];
  const timeStr = new Date().toLocaleTimeString();
  const idNum = currentCount + 1;
  const sampleModules = ['haps-uav-connectivity', 'leo', 'direct-to-device', 'quantum-optics'];
  const assignedModule = sampleModules[Math.floor(Math.random() * sampleModules.length)];
  const fullId = `${assignedModule}:${timestamp}:S${idNum}`;

  const mockNewFeatures: SignalFeature[] = [
    {
      type: 'Feature',
      id: fullId,
      geometry: {
        type: 'Point',
        coordinates: [
          Number((Math.random() * 260 - 130).toFixed(4)),
          Number((Math.random() * 120 - 60).toFixed(4)),
        ],
      },
      properties: {
        id: fullId,
        title: `Automated Telemetry Drop #${idNum} (Ingested ${timeStr})`,
        date: timestamp,
        module: assignedModule,
        subtheme: 'Periodic Ingest Stream',
        domain: ['Technological', 'Economic', 'Regulatory', 'Political'][Math.floor(Math.random() * 4)] as any,
        location: 'Tactical Remote Teleport Station',
        location_type: 'Ground Gateway',
        stakeholder_relevance: ['High', 'Medium', 'Low'][Math.floor(Math.random() * 3)] as any,
        horizon: ['Now', '12 months', '2-3 years', 'Long-term'][Math.floor(Math.random() * 4)] as any,
        confidence: 'High',
        source_url: 'https://aegis.internal/telemetry',
        status: 'signal',
        geom_kind: 'exact',
        iso3: 'USA',
        notes: `Live signal ingested automatically from shared directory batch drop at ${timeStr}. Frequency lock achieved with 99.98% SNR reliability.`,
      },
    },
  ];

  return {
    type: 'FeatureCollection',
    features: mockNewFeatures,
  };
}
