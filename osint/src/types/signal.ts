/**
 * Signal Strategic Dashboard OSINT Types & Constants
 */

export interface SignalProperties {
  id: string;
  title: string;
  date: string;
  module: string;
  module_slug?: string;
  subtheme: string;
  domain: string;
  location_type: string;
  location: string;
  confidence: 'High' | 'Medium' | 'Low' | string;
  stakeholder_relevance: 'High' | 'Medium' | 'Low' | string;
  horizon: 'Now' | '12 months' | '2-3 years' | 'Long-term' | string;
  source_url: string;
  status: 'signal' | 'validated' | 'escalated' | 'archived' | string;
  geom_kind: 'locality' | 'country-centroid' | 'none' | 'exact' | 'region' | string;
  coord_source?: string;
  iso3: string;
  truth_coordinates?: [number, number] | null;
  display_coordinates?: [number, number] | null;
  jitter?: boolean;
  Details?: string;
  Implication?: string;
  details?: string;
  implication?: string;
  notes?: string;
  tags?: string[];
}

export interface SignalGeometry {
  type: 'Point';
  coordinates: [number, number]; // [longitude, latitude]
}

export interface SignalFeature {
  type: 'Feature';
  id: string;
  geometry: SignalGeometry | null;
  properties: SignalProperties;
}

export interface SignalFeatureCollection {
  type: 'FeatureCollection';
  features: SignalFeature[];
}

/**
 * Calculates the map plot position [lon, lat] for a signal according to the official algorithm:
 * - If properties.display_coordinates exists and is a [lon, lat] pair, plot that (preferred over other)
 * - Else if geometry is a Point, plot geometry.coordinates.
 * - Else skip the marker (geom_kind "none": Worldwide or no resolved country).
 *
 * Note: GeoJSON ordering is [longitude, latitude].
 */
export function getSignalPlotCoordinates(
  signal: SignalFeature | { geometry?: SignalGeometry | null; properties?: Partial<SignalProperties> }
): [number, number] | null {
  const props = signal.properties;
  if (props?.geom_kind === 'none') {
    return null;
  }
  if (
    props?.display_coordinates &&
    Array.isArray(props.display_coordinates) &&
    props.display_coordinates.length >= 2 &&
    typeof props.display_coordinates[0] === 'number' &&
    typeof props.display_coordinates[1] === 'number' &&
    !isNaN(props.display_coordinates[0]) &&
    !isNaN(props.display_coordinates[1])
  ) {
    return [props.display_coordinates[0], props.display_coordinates[1]];
  }
  if (
    signal.geometry &&
    signal.geometry.type === 'Point' &&
    Array.isArray(signal.geometry.coordinates) &&
    signal.geometry.coordinates.length >= 2 &&
    typeof signal.geometry.coordinates[0] === 'number' &&
    typeof signal.geometry.coordinates[1] === 'number' &&
    !isNaN(signal.geometry.coordinates[0]) &&
    !isNaN(signal.geometry.coordinates[1])
  ) {
    return [signal.geometry.coordinates[0], signal.geometry.coordinates[1]];
  }
  return null;
}

/**
 * Returns the ground truth coordinates [lon, lat].
 * geometry.coordinates and properties.truth_coordinates are the same truth point.
 * Never plot both. display_coordinates may differ if jitter is true.
 */
export function getSignalTruthCoordinates(
  signal: SignalFeature | { geometry?: SignalGeometry | null; properties?: Partial<SignalProperties> }
): [number, number] | null {
  const props = signal.properties;
  if (
    props?.truth_coordinates &&
    Array.isArray(props.truth_coordinates) &&
    props.truth_coordinates.length >= 2 &&
    typeof props.truth_coordinates[0] === 'number' &&
    typeof props.truth_coordinates[1] === 'number'
  ) {
    return [props.truth_coordinates[0], props.truth_coordinates[1]];
  }
  if (
    signal.geometry &&
    signal.geometry.type === 'Point' &&
    Array.isArray(signal.geometry.coordinates) &&
    signal.geometry.coordinates.length >= 2 &&
    typeof signal.geometry.coordinates[0] === 'number' &&
    typeof signal.geometry.coordinates[1] === 'number'
  ) {
    return [signal.geometry.coordinates[0], signal.geometry.coordinates[1]];
  }
  return null;
}

/**
 * Human-readable description of the marker meaning based on geom_kind:
 * - locality: city or site from the offline gazetteer
 * - country-centroid: country centre, because the locality was missing or not in the gazetteer
 * - none: no marker
 */
export function getGeomKindLabel(geomKind?: string): string {
  switch (geomKind) {
    case 'locality':
      return 'Locality (city or site from gazetteer)';
    case 'country-centroid':
      return 'Country Centre (locality missing or not in gazetteer)';
    case 'none':
      return 'No marker (worldwide or unmapped)';
    default:
      return geomKind || 'Unknown';
  }
}

/**
 * Derives the module name from the signal's module property,
 * falling back to the first part before ':' in the ID property if omitted.
 */
export function extractSignalModule(
  signal: SignalFeature | { id?: string; properties?: { id?: string; module?: string; module_slug?: string } }
): string {
  if (signal.properties?.module) {
    return signal.properties.module.trim();
  }
  const fullId = signal.id || signal.properties?.id || '';
  if (fullId && fullId.includes(':')) {
    return fullId.split(':')[0].trim();
  }
  return 'general';
}

export type ViewTab = 'map' | 'graph' | 'registry' | 'matrix' | 'briefing';

export interface FilterState {
  searchQuery: string;
  modules: string[];
  domains: string[];
  horizons: string[];
  relevanceLevels: string[];
  confidenceLevels: string[];
  locationTypes: string[];
  geoStatus: 'all' | 'geocoded' | 'unmapped' | 'country-centroid';
  startDate: string;
  endDate: string;
}

export const DOMAIN_COLORS: Record<string, { bg: string; text: string; border: string; hex: string }> = {
  Technological: { bg: 'bg-cyan-950/40', text: 'text-cyan-400', border: 'border-cyan-800/60', hex: '#06b6d4' },
  Economic: { bg: 'bg-emerald-950/40', text: 'text-emerald-400', border: 'border-emerald-800/60', hex: '#10b981' },
  Political: { bg: 'bg-amber-950/40', text: 'text-amber-400', border: 'border-amber-800/60', hex: '#f59e0b' },
  Social: { bg: 'bg-fuchsia-950/40', text: 'text-fuchsia-400', border: 'border-fuchsia-800/60', hex: '#d946ef' },
  Regulatory: { bg: 'bg-indigo-950/40', text: 'text-indigo-400', border: 'border-indigo-800/60', hex: '#6366f1' },
  Military: { bg: 'bg-rose-950/40', text: 'text-rose-400', border: 'border-rose-800/60', hex: '#f43f5e' },
  Infrastructure: { bg: 'bg-violet-950/40', text: 'text-violet-400', border: 'border-violet-800/60', hex: '#8b5cf6' },
  Environmental: { bg: 'bg-teal-950/40', text: 'text-teal-400', border: 'border-teal-800/60', hex: '#14b8a6' },
};

/**
 * Returns matching domain styling for any domain value contained in the GeoJSON signal properties.
 * If an unexpected or custom domain is encountered, falls back to a deterministic color from the palette.
 */
export function getDomainColor(domain: string): { bg: string; text: string; border: string; hex: string } {
  const trimmed = (domain || '').trim();
  if (DOMAIN_COLORS[trimmed]) {
    return DOMAIN_COLORS[trimmed];
  }
  const dynamicPalette = [
    { bg: 'bg-cyan-950/40', text: 'text-cyan-400', border: 'border-cyan-800/60', hex: '#06b6d4' },
    { bg: 'bg-emerald-950/40', text: 'text-emerald-400', border: 'border-emerald-800/60', hex: '#10b981' },
    { bg: 'bg-amber-950/40', text: 'text-amber-400', border: 'border-amber-800/60', hex: '#f59e0b' },
    { bg: 'bg-fuchsia-950/40', text: 'text-fuchsia-400', border: 'border-fuchsia-800/60', hex: '#d946ef' },
    { bg: 'bg-indigo-950/40', text: 'text-indigo-400', border: 'border-indigo-800/60', hex: '#6366f1' },
    { bg: 'bg-teal-950/40', text: 'text-teal-400', border: 'border-teal-800/60', hex: '#14b8a6' },
    { bg: 'bg-rose-950/40', text: 'text-rose-400', border: 'border-rose-800/60', hex: '#f43f5e' },
  ];
  let hash = 0;
  for (let i = 0; i < trimmed.length; i++) {
    hash = (hash << 5) - hash + trimmed.charCodeAt(i);
  }
  const idx = Math.abs(hash) % dynamicPalette.length;
  return dynamicPalette[idx];
}

export const RELEVANCE_COLORS: Record<string, string> = {
  High: 'text-rose-400',
  Medium: 'text-amber-400',
  Low: 'text-slate-400',
};

export const CONFIDENCE_COLORS: Record<string, string> = {
  High: 'text-emerald-400',
  Medium: 'text-sky-400',
  Low: 'text-slate-400',
};
