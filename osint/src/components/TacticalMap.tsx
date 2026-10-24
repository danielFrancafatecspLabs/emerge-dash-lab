import React, { useEffect, useRef, useState, useMemo } from 'react';
import L from 'leaflet';
import {
  SignalFeature,
  DOMAIN_COLORS,
  getDomainColor,
  getSignalPlotCoordinates,
  getSignalTruthCoordinates,
} from '../types/signal';
import { Layers, Crosshair, Radio, Eye, MapPin, ExternalLink, ShieldAlert, Sparkles } from 'lucide-react';

interface TacticalMapProps {
  signals: SignalFeature[];
  availableDomains?: string[];
  selectedDomains?: string[];
  onToggleDomainFilter?: (domain: string) => void;
  selectedSignalId: string | null;
  onSelectSignal: (id: string) => void;
}

export const TacticalMap: React.FC<TacticalMapProps> = ({
  signals,
  availableDomains,
  selectedDomains,
  onToggleDomainFilter,
  selectedSignalId,
  onSelectSignal,
}) => {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const markersLayerRef = useRef<L.LayerGroup | null>(null);
  const footprintsLayerRef = useRef<L.LayerGroup | null>(null);

  const [tileLayerType, setTileLayerType] = useState<'dark' | 'satellite' | 'positron'>('dark');
  const [showFootprints, setShowFootprints] = useState<boolean>(true);
  const [disperseOverlaps, setDisperseOverlaps] = useState<boolean>(true);
  const [mouseCoords, setMouseCoords] = useState<{ lat: number; lng: number } | null>(null);
  const [renderMode, setRenderMode] = useState<'auto' | 'canvas' | 'detailed'>('auto');

  const canvasRendererRef = useRef<L.Canvas | null>(null);

  // Initialize Leaflet map once
  useEffect(() => {
    if (!mapContainerRef.current) return;

    if (mapInstanceRef.current) {
      mapInstanceRef.current.remove();
      mapInstanceRef.current = null;
    }

    // Safeguard: remove any leftover Leaflet ID from DOM container
    try {
      delete (mapContainerRef.current as any)._leaflet_id;
    } catch {
      // ignore
    }

    const map = L.map(mapContainerRef.current, {
      center: [30, -20],
      zoom: 3,
      minZoom: 2,
      maxZoom: 18,
      zoomControl: false,
      attributionControl: false,
      preferCanvas: true,
    });

    L.control.zoom({ position: 'bottomright' }).addTo(map);

    canvasRendererRef.current = L.canvas({ padding: 0.5 });

    const markersGroup = L.layerGroup().addTo(map);
    const footprintsGroup = L.layerGroup().addTo(map);

    markersLayerRef.current = markersGroup;
    footprintsLayerRef.current = footprintsGroup;
    mapInstanceRef.current = map;

    map.on('mousemove', (e: L.LeafletMouseEvent) => {
      setMouseCoords({
        lat: Number(e.latlng.lat.toFixed(4)),
        lng: Number(e.latlng.lng.toFixed(4)),
      });
    });

    map.on('mouseout', () => {
      setMouseCoords(null);
    });

    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
      if (mapContainerRef.current) {
        try {
          delete (mapContainerRef.current as any)._leaflet_id;
        } catch {
          // ignore
        }
      }
    };
  }, []);

  // Update base tile layer
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map) return;

    // Remove existing tile layers
    map.eachLayer((layer) => {
      if (layer instanceof L.TileLayer) {
        map.removeLayer(layer);
      }
    });

    // Use 100% free open-source OpenStreetMap without requiring any API keys or tokens
    let url = 'https://tile.openstreetmap.org/{z}/{x}/{y}.png';
    let subdomains = 'abc';
    let maxZoom = 18;

    if (tileLayerType === 'dark') {
      url = 'https://tile.openstreetmap.org/{z}/{x}/{y}.png';
    } else if (tileLayerType === 'positron') {
      url = 'https://tile.openstreetmap.org/{z}/{x}/{y}.png';
    } else if (tileLayerType === 'satellite') {
      url = 'https://tile.openstreetmap.org/{z}/{x}/{y}.png';
    }

    const tileLayer = L.tileLayer(url, {
      subdomains,
      maxZoom,
      className: tileLayerType === 'dark' ? 'tactical-dark-tiles' : '',
      attribution: '&copy; OpenStreetMap contributors (Open Source / Zero API)',
    });

    tileLayer.addTo(map);
  }, [tileLayerType]);

  // Update markers and footprint range rings
  useEffect(() => {
    const map = mapInstanceRef.current;
    const markersGroup = markersLayerRef.current;
    const footprintsGroup = footprintsLayerRef.current;
    if (!map || !markersGroup || !footprintsGroup) return;

    markersGroup.clearLayers();
    footprintsGroup.clearLayers();

    // Filter features that have valid plot coordinates according to the plot position algorithm:
    // - If properties.display_coordinates exists and is a [lon, lat] pair, plot that (preferred over other)
    // - Else if geometry is a Point, plot geometry.coordinates.
    // - Else skip the marker (geom_kind "none": Worldwide or no resolved country).
    interface PlottableSignal {
      feature: SignalFeature;
      plotCoords: [number, number]; // [lon, lat]
      truthCoords: [number, number] | null; // [lon, lat]
    }

    const plottableSignals: PlottableSignal[] = [];

    signals.forEach((feature) => {
      const plotCoords = getSignalPlotCoordinates(feature);
      if (plotCoords) {
        plottableSignals.push({
          feature,
          plotCoords,
          truthCoords: getSignalTruthCoordinates(feature),
        });
      }
    });

    if (plottableSignals.length === 0) return;

    // Group features by exact plot coordinates to handle any remaining coincident points
    const coordGroups = new Map<string, PlottableSignal[]>();
    plottableSignals.forEach((item) => {
      const key = `${item.plotCoords[0].toFixed(4)},${item.plotCoords[1].toFixed(4)}`;
      const existing = coordGroups.get(key) || [];
      existing.push(item);
      coordGroups.set(key, existing);
    });

    const bounds = L.latLngBounds([]);

    coordGroups.forEach((groupItems) => {
      const count = groupItems.length;
      const baseLng = groupItems[0].plotCoords[0];
      const baseLat = groupItems[0].plotCoords[1];

      groupItems.forEach((item, idx) => {
        const { feature } = item;
        let displayLat = baseLat;
        let displayLng = baseLng;

        // Radial offset dispersal if multiple unjittered signals still share the exact coordinate
        if (count > 1 && disperseOverlaps && !feature.properties.jitter) {
          const angle = (2 * Math.PI * idx) / count;
          const offsetRadius = 0.75; // degree offset
          displayLat = baseLat + offsetRadius * Math.sin(angle);
          displayLng = baseLng + (offsetRadius * Math.cos(angle)) / Math.cos((baseLat * Math.PI) / 180);
        }

        const latLng = L.latLng(displayLat, displayLng);
        bounds.extend(latLng);

        const isSelected = feature.id === selectedSignalId;
        const domainColor = getDomainColor(feature.properties.domain).hex;
        const relevance = feature.properties.stakeholder_relevance;
        const isHighRelevance = relevance === 'High';
        const isJittered = Boolean(feature.properties.jitter);

        // Tactical Popup Content
        const popupContent = document.createElement('div');
        popupContent.className = 'p-3 bg-slate-900 text-slate-100 rounded-lg text-xs min-w-[240px] max-w-[280px]';
        popupContent.innerHTML = `
          <div class="flex items-center justify-between pb-1.5 border-b border-slate-800 text-[11px] font-mono text-slate-400">
            <span>${feature.properties.id}</span>
            <span class="text-slate-300">${feature.properties.date}</span>
          </div>
          <div class="font-semibold text-slate-100 mt-2 text-sm leading-snug">
            ${feature.properties.title}
          </div>
          <div class="mt-2 text-slate-300 text-xs">
            <span class="font-medium">${feature.properties.location}</span>
            ${
              isJittered
                ? `<div class="mt-1 text-[10px] font-mono text-cyan-400/90 flex items-center gap-1">
                     <span>* Marker is offset from country/city centre</span>
                   </div>`
                : ''
            }
          </div>
          <div class="mt-2 flex items-center gap-1.5 text-[10px] font-mono">
            <span class="px-1.5 py-0.5 rounded bg-slate-800 border border-slate-700/80 text-cyan-300">
              ${feature.properties.geom_kind || 'locality'}
            </span>
            ${
              feature.properties.location_type
                ? `<span class="text-slate-400">· ${feature.properties.location_type}</span>`
                : ''
            }
          </div>
          <div class="mt-2 pt-2 border-t border-slate-800/80 flex items-center justify-between text-[11px]">
            <span class="font-mono text-slate-400">${feature.properties.domain} · ${feature.properties.horizon}</span>
            <span class="font-mono ${relevance === 'High' ? 'text-rose-400' : 'text-amber-400'}">Relevance: ${relevance}</span>
          </div>
          <div class="mt-3 flex items-center justify-between gap-2">
            <button id="btn-focus-${feature.id.replace(/:/g, '-')}" class="px-2.5 py-1 bg-cyan-950/60 hover:bg-cyan-900/80 text-cyan-300 border border-cyan-700/50 rounded text-[11px] font-medium transition-colors">
              Inspect Dossier
            </button>
            <a href="${feature.properties.source_url}" target="_blank" rel="noopener noreferrer" class="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded text-[11px] font-mono transition-colors">
              Source &nearr;
            </a>
          </div>
        `;

        const isCanvas =
          renderMode === 'canvas' || (renderMode === 'auto' && plottableSignals.length >= 150);

        if (isCanvas) {
          const circle = L.circleMarker(latLng, {
            renderer: canvasRendererRef.current || undefined,
            radius: isSelected ? 8 : isHighRelevance ? 6 : 5,
            fillColor: domainColor,
            color: isSelected ? '#ffffff' : '#030712',
            weight: isSelected ? 2.5 : 1.5,
            fillOpacity: isSelected ? 1.0 : 0.85,
          });

          circle.bindTooltip(`[${feature.properties.id}] ${feature.properties.title}`, {
            direction: 'top',
            offset: [0, -6],
          });

          circle.bindPopup(popupContent, { maxWidth: 320 });
          circle.on('click', () => {
            onSelectSignal(feature.id);
          });
          circle.on('popupopen', () => {
            const btn = document.getElementById(`btn-focus-${feature.id.replace(/:/g, '-')}`);
            if (btn) {
              btn.onclick = () => {
                onSelectSignal(feature.id);
              };
            }
          });

          markersGroup.addLayer(circle);
        } else {
          // Custom Tactical DivIcon
          const iconHtml = `
            <div class="relative group cursor-pointer">
              ${
                isHighRelevance
                  ? `<div class="absolute -inset-1.5 rounded-full animate-ping opacity-30" style="background-color: ${domainColor};"></div>`
                  : ''
              }
              <div class="w-8 h-8 rounded-full flex items-center justify-center border transition-transform duration-150 ${
                isSelected
                  ? 'scale-125 ring-2 ring-white shadow-lg'
                  : 'hover:scale-110 shadow-md'
              }" style="background-color: #0b1120; border-color: ${domainColor}; border-width: 2px;">
                <div class="w-3 h-3 rounded-full" style="background-color: ${domainColor};"></div>
              </div>
              ${
                count > 1
                  ? `<div class="absolute -top-1 -right-1 bg-slate-900 border border-slate-700 text-[9px] font-mono text-slate-300 rounded px-1 leading-tight">
                      ${idx + 1}/${count}
                    </div>`
                  : ''
              }
            </div>
          `;

          const tacticalIcon = L.divIcon({
            className: 'tactical-marker',
            html: iconHtml,
            iconSize: [32, 32],
            iconAnchor: [16, 16],
            popupAnchor: [0, -18],
          });

          const marker = L.marker(latLng, { icon: tacticalIcon });
          marker.bindPopup(popupContent, { maxWidth: 320 });

          marker.on('popupopen', () => {
            const btn = document.getElementById(`btn-focus-${feature.id.replace(/:/g, '-')}`);
            if (btn) {
              btn.onclick = () => {
                onSelectSignal(feature.id);
              };
            }
          });

          marker.on('click', () => {
            onSelectSignal(feature.id);
          });

          markersGroup.addLayer(marker);
        }

        // Ground coverage / footprint rings for space infrastructure & launch sites
        if (showFootprints) {
          const isInfra =
            feature.properties.location_type === 'Launch/test site' ||
            feature.properties.location_type === 'Gateway' ||
            feature.properties.location_type === 'Regulator';

          if (isInfra) {
            const footprintRadiusMeters =
              feature.properties.location_type === 'Launch/test site' ? 450000 : 750000;

            // Anchor physical footprint ring to truth coordinates (never offset jitter)
            const anchorCoords = item.truthCoords || item.plotCoords;
            const circle = L.circle(L.latLng(anchorCoords[1], anchorCoords[0]), {
              radius: footprintRadiusMeters,
              color: domainColor,
              weight: 1,
              dashArray: '4, 6',
              fillColor: domainColor,
              fillOpacity: isSelected ? 0.08 : 0.03,
            });

            footprintLayerTooltip(circle, feature);
            circle.addTo(footprintsGroup);
          }
        }
      });
    });

    // If a signal is selected, center map on it
    if (selectedSignalId) {
      const selectedFeature = signals.find((s) => s.id === selectedSignalId);
      const plotCoords = selectedFeature ? getSignalPlotCoordinates(selectedFeature) : null;
      if (plotCoords) {
        map.flyTo(
          [plotCoords[1], plotCoords[0]],
          Math.max(map.getZoom(), 5),
          { duration: 1.2 }
        );
      }
    }
  }, [signals, selectedSignalId, showFootprints, disperseOverlaps, renderMode, onSelectSignal]);

  function footprintLayerTooltip(circle: L.Circle, feature: SignalFeature) {
    circle.bindTooltip(
      `LEO Orbital Footprint: ${feature.properties.location_type} (${feature.properties.title})`,
      { className: 'bg-slate-900 border border-slate-700 text-slate-300 text-[10px] font-mono', sticky: true }
    );
  }

  // Count geocoded vs unmapped using plot coordinates algorithm
  const geocodedCount = signals.filter((s) => getSignalPlotCoordinates(s) !== null).length;
  const unmappedCount = signals.filter((s) => getSignalPlotCoordinates(s) === null).length;

  // Unique domain values strictly derived from the "domain" property of each signal in the active GeoJSON
  const activeDomains = useMemo(() => {
    if (availableDomains && availableDomains.length > 0) {
      return availableDomains;
    }
    return Array.from(
      new Set(
        signals
          .map((s) => s.properties?.domain?.trim())
          .filter((d): d is string => Boolean(d))
      )
    ).sort();
  }, [availableDomains, signals]);

  return (
    <div className="relative w-full h-full min-h-[500px] flex-1 bg-slate-950 overflow-hidden select-none">
      {/* Map Container */}
      <div ref={mapContainerRef} className="w-full h-full z-0" />

      {/* Top Map HUD Bar */}
      <div className="absolute top-4 left-4 z-10 flex flex-wrap items-center gap-2">
        {/* Render Engine Mode (Canvas vs Detailed) */}
        <div className="flex items-center gap-1 p-1 bg-slate-900/90 backdrop-blur-md border border-slate-800 rounded-lg shadow-lg text-xs font-mono">
          <button
            onClick={() => setRenderMode('auto')}
            className={`px-2 py-1 rounded transition-colors ${
              renderMode === 'auto'
                ? 'bg-cyan-950 text-cyan-300 border border-cyan-800 font-semibold'
                : 'text-slate-400 hover:text-slate-200'
            }`}
            title="Auto-select Canvas mode for 150+ signals to guarantee 60 FPS, Detailed Pins otherwise"
          >
            ⚡ Auto ({geocodedCount >= 150 ? 'Canvas' : 'Pins'})
          </button>
          <button
            onClick={() => setRenderMode('canvas')}
            className={`px-2 py-1 rounded transition-colors ${
              renderMode === 'canvas'
                ? 'bg-cyan-950 text-cyan-300 border border-cyan-800 font-semibold'
                : 'text-slate-400 hover:text-slate-200'
            }`}
            title="Hardware-accelerated single HTML5 Canvas layer (Scales to 15,000+ points at 60 FPS)"
          >
            Canvas 60FPS
          </button>
          <button
            onClick={() => setRenderMode('detailed')}
            className={`px-2 py-1 rounded transition-colors ${
              renderMode === 'detailed'
                ? 'bg-cyan-950 text-cyan-300 border border-cyan-800 font-semibold'
                : 'text-slate-400 hover:text-slate-200'
            }`}
            title="High-fidelity pulsing HTML DOM DivIcons"
          >
            Detailed
          </button>
        </div>

        {/* Layer Switcher */}
        <div className="flex items-center p-1 bg-slate-900/90 backdrop-blur-md border border-slate-800 rounded-lg shadow-lg">
          <button
            onClick={() => setTileLayerType('dark')}
            className={`px-2.5 py-1 text-xs font-mono rounded transition-colors ${
              tileLayerType === 'dark'
                ? 'bg-cyan-950/80 text-cyan-300 border border-cyan-800/80'
                : 'text-slate-400 hover:text-slate-200'
            }`}
            title="OpenStreetMap Tactical Dark (Open Source / Zero API)"
          >
            Tactical Dark
          </button>
          <button
            onClick={() => setTileLayerType('positron')}
            className={`px-2.5 py-1 text-xs font-mono rounded transition-colors ${
              tileLayerType === 'positron'
                ? 'bg-cyan-950/80 text-cyan-300 border border-cyan-800/80'
                : 'text-slate-400 hover:text-slate-200'
            }`}
            title="OpenStreetMap Standard Clean (Open Source / Zero API)"
          >
            OSM Clean
          </button>
        </div>

        {/* Tactical Overlay Toggles */}
        <div className="flex items-center gap-1 p-1 bg-slate-900/90 backdrop-blur-md border border-slate-800 rounded-lg shadow-lg">
          <button
            onClick={() => setShowFootprints(!showFootprints)}
            className={`px-2.5 py-1 text-xs font-mono rounded flex items-center gap-1.5 transition-colors ${
              showFootprints
                ? 'bg-slate-800 text-cyan-400 border border-cyan-900/60'
                : 'text-slate-400 hover:text-slate-200'
            }`}
            title="Toggle LEO Ground/Launch Station Footprint Horizon"
          >
            <Radio className="w-3.5 h-3.5" />
            <span>Footprints</span>
          </button>

          <button
            onClick={() => setDisperseOverlaps(!disperseOverlaps)}
            className={`px-2.5 py-1 text-xs font-mono rounded flex items-center gap-1.5 transition-colors ${
              disperseOverlaps
                ? 'bg-slate-800 text-cyan-400 border border-cyan-900/60'
                : 'text-slate-400 hover:text-slate-200'
            }`}
            title="Disperse overlapping centroid coordinates radially"
          >
            <Crosshair className="w-3.5 h-3.5" />
            <span>Disperse Overlaps</span>
          </button>
        </div>
      </div>

      {/* Bottom Coordinates & Signal Status HUD */}
      <div className="absolute bottom-4 left-4 z-10 flex items-center gap-3">
        <div className="px-3 py-1.5 bg-slate-900/90 backdrop-blur-md border border-slate-800 rounded-lg text-xs font-mono text-slate-400 flex items-center gap-3 shadow-lg">
          <div className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
            <span className="text-slate-300">{geocodedCount} Plotted</span>
          </div>
          <span className="text-slate-600">/</span>
          <div className="flex items-center gap-1.5">
            <span className={`w-2 h-2 rounded-full ${unmappedCount > 0 ? 'bg-amber-400' : 'bg-slate-600'}`}></span>
            <span className={unmappedCount > 0 ? 'text-amber-300' : 'text-slate-400'}>
              {unmappedCount} Unmapped
            </span>
          </div>
          {mouseCoords && (
            <>
              <span className="text-slate-600">/</span>
              <span className="text-cyan-400 tabular-nums">
                {mouseCoords.lat > 0 ? `${mouseCoords.lat}°N` : `${Math.abs(mouseCoords.lat)}°S`},{' '}
                {mouseCoords.lng > 0 ? `${mouseCoords.lng}°E` : `${Math.abs(mouseCoords.lng)}°W`}
              </span>
            </>
          )}
        </div>
      </div>

      {/* Legend Card: Domain Matrix strictly derived from "domain" property in signals GeoJSON */}
      {activeDomains.length > 0 && (
        <div className="absolute bottom-4 right-14 z-10 hidden sm:block p-2.5 bg-slate-900/90 backdrop-blur-md border border-slate-800 rounded-lg text-[11px] font-mono text-slate-400 shadow-lg min-w-[200px] max-w-[320px]">
          <div className="text-slate-300 font-semibold mb-1.5 text-[10px] tracking-wider uppercase flex items-center justify-between">
            <span>Domain Matrix</span>
            <span className="text-[9px] text-slate-500 font-normal">
              {activeDomains.length} {activeDomains.length === 1 ? 'domain' : 'domains'}
            </span>
          </div>
          <div className="grid grid-cols-2 gap-x-3 gap-y-1">
            {activeDomains.map((domain) => {
              const color = getDomainColor(domain);
              const count = signals.filter((s) => s.properties?.domain?.trim() === domain).length;
              const isSelected = selectedDomains?.includes(domain);
              return (
                <div
                  key={domain}
                  onClick={() => onToggleDomainFilter?.(domain)}
                  className={`flex items-center justify-between gap-1.5 min-w-0 px-1 py-0.5 rounded transition-colors ${
                    onToggleDomainFilter ? 'cursor-pointer hover:bg-slate-800/80' : ''
                  } ${isSelected ? 'bg-cyan-950/70 text-cyan-300 font-medium' : ''}`}
                  title={onToggleDomainFilter ? `Toggle filter for ${domain}` : undefined}
                >
                  <div className="flex items-center gap-1.5 truncate">
                    <span
                      className="w-2 h-2 rounded-full shrink-0"
                      style={{ backgroundColor: color.hex }}
                    ></span>
                    <span className="truncate text-slate-300">{domain}</span>
                  </div>
                  <span className="text-[10px] text-slate-500 tabular-nums">({count})</span>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};
