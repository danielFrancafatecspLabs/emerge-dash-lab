/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useMemo } from 'react';
import {
  SignalFeature,
  SignalFeatureCollection,
  ViewTab,
  FilterState,
  extractSignalModule,
  getSignalPlotCoordinates,
  getSignalTruthCoordinates,
} from './types/signal';
import { INITIAL_SIGNALS_GEOJSON } from './data/defaultSignals';
import { Header } from './components/Header';
import { FeedSyncToolbar } from './components/FeedSyncToolbar';
import { MetricsBar } from './components/MetricsBar';
import { FilterToolbar } from './components/FilterToolbar';
import { TacticalMap } from './components/TacticalMap';
import { SignalList } from './components/SignalList';
import { SignalDossier } from './components/SignalDossier';
import { ImpactMatrix } from './components/ImpactMatrix';
import { BriefingGenerator } from './components/BriefingGenerator';
import { SignalRegistryTable } from './components/SignalRegistryTable';
import { DataIngestModal } from './components/DataIngestModal';
import { AwaitingGeolocationModal } from './components/AwaitingGeolocationModal';
import { MapErrorBoundary } from './components/MapErrorBoundary';
import { KnowledgeGraphView } from './components/KnowledgeGraphView';
import { GraphData, deriveGraphFromSignals } from './types/graph';
import { SyncMode, setContentFingerprint, fetchGraphFromUrl } from './utils/feedSyncService';
import { API_BASE, DATA_BASE } from './utils/paths';

export default function App() {
  const [geoJson, setGeoJson] = useState<SignalFeatureCollection>(() => {
    try {
      const stored = localStorage.getItem('aegis_user_signals_v1');
      if (stored) {
        const parsed = JSON.parse(stored);
        if (parsed && parsed.type === 'FeatureCollection' && Array.isArray(parsed.features) && parsed.features.length > 0) {
          return parsed;
        }
      }
    } catch {}
    return INITIAL_SIGNALS_GEOJSON;
  });

  const [activeDatasetSource, setActiveDatasetSource] = useState<string>(() => {
    return localStorage.getItem('aegis_dataset_source') || 'Default Feed';
  });

  const [isManualUploadActive, setIsManualUploadActive] = useState<boolean>(() => {
    return !!localStorage.getItem('aegis_user_signals_v1');
  });

  const [selectedSignalId, setSelectedSignalId] = useState<string | null>(() => {
    try {
      const stored = localStorage.getItem('aegis_user_signals_v1');
      if (stored) {
        const parsed = JSON.parse(stored);
        if (parsed && parsed.features?.[0]?.id) {
          return parsed.features[0].id;
        }
      }
    } catch {}
    return INITIAL_SIGNALS_GEOJSON.features[0]?.id || null;
  });
  const [currentTab, setCurrentTab] = useState<ViewTab>('map');
  const [isDossierOpen, setIsDossierOpen] = useState<boolean>(true);

  // Master toggle for AI features (synced with build env & /api/health)
  const [isAiEnabled, setIsAiEnabled] = useState<boolean>(() => {
    return import.meta.env.VITE_AI_ENABLED === 'true';
  });

  // Query server /api/health to confirm live AI status
  React.useEffect(() => {
    fetch(`${API_BASE}/health`)
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (data && typeof data.aiEnabled === 'boolean') {
          setIsAiEnabled(data.aiEnabled);
        }
      })
      .catch(() => {});
  }, []);

  // Redirect away from disabled tabs (Knowledge Graph or briefing when AI is disabled)
  React.useEffect(() => {
    if (currentTab === 'graph' || (!isAiEnabled && currentTab === 'briefing')) {
      setCurrentTab('map');
    }
  }, [isAiEnabled, currentTab]);

  // Modals state
  const [isDataModalOpen, setIsDataModalOpen] = useState<boolean>(false);
  const [isAwaitingModalOpen, setIsAwaitingModalOpen] = useState<boolean>(false);

  // Filters state
  const [filters, setFilters] = useState<FilterState>({
    searchQuery: '',
    modules: [],
    domains: [],
    horizons: [],
    relevanceLevels: [],
    confidenceLevels: [],
    locationTypes: [],
    geoStatus: 'all',
    startDate: '',
    endDate: '',
  });

  // Auto-load /data/signals.geojson on startup ONLY if user hasn't uploaded a custom dataset
  React.useEffect(() => {
    if (!localStorage.getItem('aegis_user_signals_v1')) {
      fetch(`${DATA_BASE}/signals.geojson`)
        .then((res) => (res.ok ? res.json() : null))
        .then((loaded) => {
          if (loaded && loaded.type === 'FeatureCollection' && Array.isArray(loaded.features) && loaded.features.length > 0) {
            setGeoJson(loaded);
            setSelectedSignalId(loaded.features[0].id);
            setContentFingerprint(loaded);
          }
        })
        .catch(() => {
          // Fallback silently to default in-memory GeoJSON
        });
    }
  }, []);

  // Knowledge Graph Data State
  const [graphData, setGraphData] = useState<GraphData>(() => {
    try {
      const stored = localStorage.getItem('aegis_user_graph_v1');
      if (stored) {
        const parsed = JSON.parse(stored);
        if (parsed && Array.isArray(parsed.nodes) && Array.isArray(parsed.edges) && parsed.nodes.length > 0) {
          return parsed;
        }
      }
    } catch {}
    return deriveGraphFromSignals(INITIAL_SIGNALS_GEOJSON.features);
  });

  // Auto-load /data/graph.json on startup
  React.useEffect(() => {
    fetchGraphFromUrl(`${DATA_BASE}/graph.json`)
      .then(({ data }) => {
        if (data && Array.isArray(data.nodes) && data.nodes.length > 0) {
          setGraphData(data);
          try {
            localStorage.setItem('aegis_user_graph_v1', JSON.stringify(data));
          } catch {}
        }
      })
      .catch(() => {
        // Fallback: derive graph from currently loaded signals
        setGraphData(deriveGraphFromSignals(geoJson.features));
      });
  }, []);

  // Derive unique module names from the GeoJSON signal IDs (first part before ':')
  const availableModules = useMemo(() => {
    const modulesSet = new Set<string>();
    geoJson.features.forEach((feature) => {
      const mod = extractSignalModule(feature);
      if (mod) modulesSet.add(mod);
    });
    return Array.from(modulesSet).sort();
  }, [geoJson]);

  const availableDomains = useMemo(() => {
    return Array.from(
      new Set(
        geoJson.features
          .map((f) => f.properties.domain?.trim())
          .filter((d): d is string => Boolean(d))
      )
    ).sort();
  }, [geoJson]);

  const availableHorizons = useMemo(() => {
    return Array.from(new Set(geoJson.features.map((f) => f.properties.horizon).filter(Boolean)));
  }, [geoJson]);

  const availableRelevance = useMemo(() => {
    return ['High', 'Medium', 'Low'];
  }, []);

  const availableLocationTypes = useMemo(() => {
    return Array.from(new Set(geoJson.features.map((f) => f.properties.location_type).filter(Boolean)));
  }, [geoJson]);

  // Compute active filter count
  const activeFilterCount = useMemo(() => {
    let count = 0;
    if (filters.searchQuery.trim()) count++;
    if (filters.modules.length > 0) count += filters.modules.length;
    if (filters.domains.length > 0) count += filters.domains.length;
    if (filters.horizons.length > 0) count += filters.horizons.length;
    if (filters.relevanceLevels.length > 0) count += filters.relevanceLevels.length;
    if (filters.locationTypes.length > 0) count += filters.locationTypes.length;
    if (filters.geoStatus !== 'all') count++;
    return count;
  }, [filters]);

  // Filter signals
  const filteredSignals = useMemo(() => {
    return geoJson.features.filter((feature) => {
      const { properties, geometry } = feature;

      // Search keyword filter
      if (filters.searchQuery.trim()) {
        const query = filters.searchQuery.toLowerCase();
        const matchesQuery =
          properties.title.toLowerCase().includes(query) ||
          properties.id.toLowerCase().includes(query) ||
          properties.location.toLowerCase().includes(query) ||
          (properties.module && properties.module.toLowerCase().includes(query)) ||
          (properties.module_slug && properties.module_slug.toLowerCase().includes(query)) ||
          (properties.subtheme && properties.subtheme.toLowerCase().includes(query)) ||
          (properties.Details && properties.Details.toLowerCase().includes(query)) ||
          (properties.details && properties.details.toLowerCase().includes(query)) ||
          (properties.Implication && properties.Implication.toLowerCase().includes(query)) ||
          (properties.implication && properties.implication.toLowerCase().includes(query)) ||
          properties.domain.toLowerCase().includes(query) ||
          properties.source_url.toLowerCase().includes(query);

        if (!matchesQuery) return false;
      }

      // Module filter (matches human-readable module, module_slug, or extracted module)
      if (filters.modules.length > 0) {
        const signalModule = extractSignalModule(feature);
        const matchesModule =
          filters.modules.includes(signalModule) ||
          (properties.module && filters.modules.includes(properties.module)) ||
          (properties.module_slug && filters.modules.includes(properties.module_slug));
        if (!matchesModule) {
          return false;
        }
      }

      // Domain filter (exact match on GeoJSON signal domain property)
      if (filters.domains.length > 0) {
        const signalDomain = properties.domain?.trim();
        if (!signalDomain || !filters.domains.includes(signalDomain)) {
          return false;
        }
      }

      // Horizon filter
      if (filters.horizons.length > 0 && !filters.horizons.includes(properties.horizon)) {
        return false;
      }

      // Relevance filter
      if (filters.relevanceLevels.length > 0 && !filters.relevanceLevels.includes(properties.stakeholder_relevance)) {
        return false;
      }

      // Location type filter
      if (filters.locationTypes.length > 0 && !filters.locationTypes.includes(properties.location_type)) {
        return false;
      }

      // Geo status filter
      const plotCoords = getSignalPlotCoordinates(feature);
      const isPlottable = plotCoords !== null && properties.geom_kind !== 'none';
      if (filters.geoStatus === 'geocoded' && !isPlottable) {
        return false;
      }
      if (filters.geoStatus === 'unmapped' && isPlottable) {
        return false;
      }
      if (filters.geoStatus === 'country-centroid' && properties.geom_kind !== 'country-centroid') {
        return false;
      }

      return true;
    });
  }, [geoJson, filters]);

  // Selected signal object
  const selectedSignal = useMemo(() => {
    if (!selectedSignalId) return null;
    return geoJson.features.find((f) => f.id === selectedSignalId) || null;
  }, [geoJson, selectedSignalId]);

  // Unmapped signals in the dataset (missing coordinates or geom_kind: "none")
  const unmappedSignals = useMemo(() => {
    return geoJson.features.filter(
      (f) => getSignalPlotCoordinates(f) === null || f.properties.geom_kind === 'none'
    );
  }, [geoJson]);

  // Handlers
  const handleSelectSignal = (id: string) => {
    setSelectedSignalId(id);
    setIsDossierOpen(true);
  };

  const handleFocusMap = (id: string) => {
    setSelectedSignalId(id);
    setCurrentTab('map');
    setIsDossierOpen(true);
  };

  const handleImportGeoJSON = (imported: SignalFeatureCollection, fileName?: string) => {
    // Complete refresh: replaces active GeoJSON entirely
    setGeoJson(imported);
    setIsManualUploadActive(true);
    const sourceLabel = fileName || 'Custom GeoJSON Upload';
    setActiveDatasetSource(sourceLabel);

    // Save to localStorage for persistence
    try {
      localStorage.setItem('aegis_user_signals_v1', JSON.stringify(imported));
      localStorage.setItem('aegis_dataset_source', sourceLabel);
    } catch {}

    // Update graph data to match imported signals
    const derivedGraph = deriveGraphFromSignals(imported.features);
    setGraphData(derivedGraph);
    try {
      localStorage.setItem('aegis_user_graph_v1', JSON.stringify(derivedGraph));
    } catch {}

    // Update fingerprint so background sync doesn't overwrite
    setContentFingerprint(imported);

    // Persist to server backend data folder
    fetch(`${API_BASE}/feed/upload`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(imported),
    }).catch(() => {});

    // Clear filters so all newly imported signals are visible in all tabs
    setFilters({
      searchQuery: '',
      modules: [],
      domains: [],
      horizons: [],
      relevanceLevels: [],
      confidenceLevels: [],
      locationTypes: [],
      geoStatus: 'all',
      startDate: '',
      endDate: '',
    });

    if (imported.features && imported.features.length > 0) {
      setSelectedSignalId(imported.features[0].id);
    } else {
      setSelectedSignalId(null);
    }
  };

  const handleResetDefault = () => {
    try {
      localStorage.removeItem('aegis_user_signals_v1');
      localStorage.removeItem('aegis_dataset_source');
      localStorage.removeItem('aegis_user_graph_v1');
    } catch {}
    setGeoJson(INITIAL_SIGNALS_GEOJSON);
    setIsManualUploadActive(false);
    setActiveDatasetSource('Default Feed');
    setContentFingerprint(INITIAL_SIGNALS_GEOJSON);
    setSelectedSignalId(INITIAL_SIGNALS_GEOJSON.features[0]?.id || null);

    fetchGraphFromUrl(`${DATA_BASE}/graph.json`)
      .then(({ data }) => setGraphData(data))
      .catch(() => setGraphData(deriveGraphFromSignals(INITIAL_SIGNALS_GEOJSON.features)));

    setFilters({
      searchQuery: '',
      modules: [],
      domains: [],
      horizons: [],
      relevanceLevels: [],
      confidenceLevels: [],
      locationTypes: [],
      geoStatus: 'all',
      startDate: '',
      endDate: '',
    });
  };

  const handleResetFilters = () => {
    setFilters({
      searchQuery: '',
      modules: [],
      domains: [],
      horizons: [],
      relevanceLevels: [],
      confidenceLevels: [],
      locationTypes: [],
      geoStatus: 'all',
      startDate: '',
      endDate: '',
    });
  };

  const handleFeedUpdated = (incoming: SignalFeatureCollection, _mode: SyncMode, sourceDesc: string) => {
    setGeoJson(incoming);
    setContentFingerprint(incoming);
    setActiveDatasetSource(sourceDesc);

    const newModules = new Set(incoming.features.map((f) => extractSignalModule(f)));
    setFilters((prev) => ({
      ...prev,
      modules: prev.modules.filter((m) => newModules.has(m)),
    }));

    if (incoming.features && incoming.features.length > 0) {
      setSelectedSignalId(incoming.features[0].id);
    } else {
      setSelectedSignalId(null);
    }
  };

  const handleExportFilteredCSV = () => {
    const headers = [
      'id',
      'title',
      'date',
      'module',
      'domain',
      'subtheme',
      'location',
      'location_type',
      'confidence',
      'stakeholder_relevance',
      'horizon',
      'details',
      'implication',
      'status',
      'geom_kind',
      'iso3',
      'truth_longitude',
      'truth_latitude',
      'display_longitude',
      'display_latitude',
      'jitter',
      'source_url',
    ];

    const rows = filteredSignals.map((s) => {
      const truth = getSignalTruthCoordinates(s);
      const plot = getSignalPlotCoordinates(s);
      return [
        `"${s.properties.id}"`,
        `"${s.properties.title.replace(/"/g, '""')}"`,
        `"${s.properties.date}"`,
        `"${s.properties.module}"`,
        `"${s.properties.domain}"`,
        `"${s.properties.subtheme || ''}"`,
        `"${s.properties.location.replace(/"/g, '""')}"`,
        `"${s.properties.location_type}"`,
        `"${s.properties.confidence}"`,
        `"${s.properties.stakeholder_relevance}"`,
        `"${s.properties.horizon}"`,
        `"${(s.properties.Details || s.properties.details || '').replace(/"/g, '""')}"`,
        `"${(s.properties.Implication || s.properties.implication || '').replace(/"/g, '""')}"`,
        `"${s.properties.status}"`,
        `"${s.properties.geom_kind}"`,
        `"${s.properties.iso3}"`,
        truth ? truth[0] : '',
        truth ? truth[1] : '',
        plot ? plot[0] : '',
        plot ? plot[1] : '',
        s.properties.jitter ? 'true' : 'false',
        `"${s.properties.source_url}"`,
      ];
    });

    const csvContent = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `signals-registry-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="flex flex-col h-screen w-screen overflow-hidden bg-slate-950 text-slate-100 font-sans">
      {/* 1. Strict Top Bar Contract Header */}
      <Header
        currentTab={currentTab}
        onTabChange={setCurrentTab}
        onOpenDataModal={() => setIsDataModalOpen(true)}
        onUploadGeoJSON={handleImportGeoJSON}
        isAiEnabled={isAiEnabled}
      />

      {/* 2. Live Shared Feed & Directory Sync Toolbar */}
      <FeedSyncToolbar
        currentSignalsCount={geoJson.features.length}
        onFeedUpdated={handleFeedUpdated}
        isManualUploadActive={isManualUploadActive}
        activeSourceLabel={activeDatasetSource}
      />

      {/* 3. Zero-Pill Tabular Metrics Bar */}
      <MetricsBar
        signals={geoJson.features}
        totalSignalsCount={geoJson.features.length}
        filteredCount={filteredSignals.length}
        onOpenUnmappedModal={() => setIsAwaitingModalOpen(true)}
      />

      {/* 4. Filter Toolbar */}
      <FilterToolbar
        filters={filters}
        onFilterChange={setFilters}
        availableModules={availableModules}
        availableDomains={availableDomains}
        availableHorizons={availableHorizons}
        availableRelevance={availableRelevance}
        availableLocationTypes={availableLocationTypes}
        activeFilterCount={activeFilterCount}
      />

      {/* 5. Main Content Viewport */}
      <main className="flex-1 flex overflow-hidden relative">
        {currentTab === 'map' && (
          <div className="flex-1 flex h-full overflow-hidden">
            {/* Left Signals Feed Panel */}
            <div className="w-80 lg:w-96 shrink-0 h-full hidden md:block">
              <SignalList
                signals={filteredSignals}
                selectedSignalId={selectedSignalId}
                onSelectSignal={handleSelectSignal}
                onFocusMap={handleFocusMap}
                selectedModule={filters.modules[0] || ''}
                onSelectModule={(mod) => setFilters((prev) => ({ ...prev, modules: mod ? [mod] : [] }))}
                availableModules={availableModules}
              />
            </div>

            {/* Center Tactical Viewport: 2D Tactical Map */}
            <div className="flex-1 h-full relative">
              <MapErrorBoundary>
                <TacticalMap
                  signals={filteredSignals}
                  availableDomains={availableDomains}
                  selectedDomains={filters.domains}
                  onToggleDomainFilter={(domain) => {
                    setFilters((prev) => ({
                      ...prev,
                      domains: prev.domains.includes(domain)
                        ? prev.domains.filter((d) => d !== domain)
                        : [...prev.domains, domain],
                    }));
                  }}
                  selectedSignalId={selectedSignalId}
                  onSelectSignal={handleSelectSignal}
                />
              </MapErrorBoundary>
            </div>

            {/* Right Signal Dossier Panel */}
            {isDossierOpen && selectedSignal && (
              <SignalDossier
                signal={selectedSignal}
                onClose={() => setIsDossierOpen(false)}
                onFocusMap={handleFocusMap}
                isAiEnabled={isAiEnabled}
              />
            )}
          </div>
        )}

        {/* Knowledge Graph disabled for now
        {currentTab === 'graph' && (
          <div className="flex-1 flex h-full overflow-hidden">
            <KnowledgeGraphView
              graphData={graphData}
              signals={filteredSignals}
              selectedSignalId={selectedSignalId}
              onSelectSignal={handleSelectSignal}
              onFocusMap={handleFocusMap}
              filters={filters}
              onResetFilters={handleResetFilters}
            />

            {isDossierOpen && selectedSignal && (
              <SignalDossier
                signal={selectedSignal}
                onClose={() => setIsDossierOpen(false)}
                onFocusMap={handleFocusMap}
                isAiEnabled={isAiEnabled}
              />
            )}
          </div>
        )}
        */}

        {currentTab === 'registry' && (
          <div className="flex-1 flex h-full overflow-hidden">
            <SignalRegistryTable
              signals={filteredSignals}
              selectedSignalId={selectedSignalId}
              onSelectSignal={handleSelectSignal}
              onFocusMap={handleFocusMap}
              onExportFilteredCSV={handleExportFilteredCSV}
              selectedModule={filters.modules[0] || ''}
              onSelectModule={(mod) => setFilters((prev) => ({ ...prev, modules: mod ? [mod] : [] }))}
              availableModules={availableModules}
            />

            {isDossierOpen && selectedSignal && (
              <SignalDossier
                signal={selectedSignal}
                onClose={() => setIsDossierOpen(false)}
                onFocusMap={handleFocusMap}
                isAiEnabled={isAiEnabled}
              />
            )}
          </div>
        )}

        {currentTab === 'matrix' && (
          <div className="flex-1 flex h-full overflow-hidden">
            <ImpactMatrix
              signals={filteredSignals}
              selectedSignalId={selectedSignalId}
              onSelectSignal={handleSelectSignal}
              onFocusMap={handleFocusMap}
            />

            {isDossierOpen && selectedSignal && (
              <SignalDossier
                signal={selectedSignal}
                onClose={() => setIsDossierOpen(false)}
                onFocusMap={handleFocusMap}
                isAiEnabled={isAiEnabled}
              />
            )}
          </div>
        )}

        {isAiEnabled && currentTab === 'briefing' && (
          <div className="flex-1 flex h-full overflow-hidden">
            <BriefingGenerator
              signals={activeFilterCount > 0 ? filteredSignals : geoJson.features}
              onSelectSignal={handleSelectSignal}
            />

            {isDossierOpen && selectedSignal && (
              <SignalDossier
                signal={selectedSignal}
                onClose={() => setIsDossierOpen(false)}
                onFocusMap={handleFocusMap}
                isAiEnabled={isAiEnabled}
              />
            )}
          </div>
        )}
      </main>

      {/* GeoJSON Ingest / Export Modal */}
      <DataIngestModal
        isOpen={isDataModalOpen}
        onClose={() => setIsDataModalOpen(false)}
        currentGeoJSON={geoJson}
        onImportGeoJSON={handleImportGeoJSON}
        onResetDefault={handleResetDefault}
      />

      {/* Problematic Signals Awaiting Geolocation Modal */}
      <AwaitingGeolocationModal
        isOpen={isAwaitingModalOpen}
        onClose={() => setIsAwaitingModalOpen(false)}
        unmappedSignals={unmappedSignals}
      />
    </div>
  );
}
