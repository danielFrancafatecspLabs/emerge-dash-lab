import React from 'react';
import { FilterState, getDomainColor } from '../types/signal';
import { Search, X, Filter, RotateCcw } from 'lucide-react';

interface FilterToolbarProps {
  filters: FilterState;
  onFilterChange: (filters: FilterState) => void;
  availableModules: string[];
  availableDomains: string[];
  availableHorizons: string[];
  availableRelevance: string[];
  availableLocationTypes: string[];
  activeFilterCount: number;
}

export const FilterToolbar: React.FC<FilterToolbarProps> = ({
  filters,
  onFilterChange,
  availableModules,
  availableDomains,
  availableHorizons,
  availableRelevance,
  availableLocationTypes,
  activeFilterCount,
}) => {
  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onFilterChange({ ...filters, searchQuery: e.target.value });
  };

  const handleModuleToggle = (module: string) => {
    const next = filters.modules.includes(module)
      ? filters.modules.filter((m) => m !== module)
      : [...filters.modules, module];
    onFilterChange({ ...filters, modules: next });
  };

  const handleModuleSelectChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const val = e.target.value;
    onFilterChange({
      ...filters,
      modules: val ? [val] : [],
    });
  };

  const handleDomainToggle = (domain: string) => {
    const next = filters.domains.includes(domain)
      ? filters.domains.filter((d) => d !== domain)
      : [...filters.domains, domain];
    onFilterChange({ ...filters, domains: next });
  };

  const handleHorizonToggle = (horizon: string) => {
    const next = filters.horizons.includes(horizon)
      ? filters.horizons.filter((h) => h !== horizon)
      : [...filters.horizons, horizon];
    onFilterChange({ ...filters, horizons: next });
  };

  const handleRelevanceToggle = (relevance: string) => {
    const next = filters.relevanceLevels.includes(relevance)
      ? filters.relevanceLevels.filter((r) => r !== relevance)
      : [...filters.relevanceLevels, relevance];
    onFilterChange({ ...filters, relevanceLevels: next });
  };

  const handleGeoStatusChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    onFilterChange({ ...filters, geoStatus: e.target.value as FilterState['geoStatus'] });
  };

  const handleLocationTypeChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const val = e.target.value;
    onFilterChange({
      ...filters,
      locationTypes: val ? [val] : [],
    });
  };

  const handleResetFilters = () => {
    onFilterChange({
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

  return (
    <div className="bg-slate-900/90 border-b border-slate-800/80 px-6 py-2.5 flex flex-wrap items-center justify-between gap-3 text-xs">
      {/* Left: Search input + Geo Status */}
      <div className="flex flex-wrap items-center gap-2 flex-1 min-w-[280px]">
        {/* Search */}
        <div className="relative min-w-[220px] max-w-sm flex-1">
          <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="text"
            placeholder="Search signals by keyword, title, ID, entity..."
            value={filters.searchQuery}
            onChange={handleSearchChange}
            className="w-full bg-slate-950/80 border border-slate-700/80 rounded-md pl-8 pr-7 py-1.5 text-xs text-slate-200 placeholder:text-slate-500 focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 transition-all font-mono"
          />
          {filters.searchQuery && (
            <button
              onClick={() => onFilterChange({ ...filters, searchQuery: '' })}
              className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-200"
            >
              <X className="w-3 h-3" />
            </button>
          )}
        </div>

        {/* Geo Status Select */}
        <select
          value={filters.geoStatus}
          onChange={handleGeoStatusChange}
          aria-label="Filter signals by geolocation status"
          className="bg-slate-950/80 border border-slate-700/80 rounded-md px-2.5 py-1.5 text-xs text-slate-300 font-mono focus:outline-none focus:border-cyan-500"
        >
          <option value="all">All Geometries</option>
          <option value="geocoded">Plotted Coordinates</option>
          <option value="country-centroid">Country Centroid Only</option>
          <option value="unmapped">Awaiting Geolocation</option>
        </select>

        {/* Module Select */}
        <select
          value={filters.modules[0] || ''}
          onChange={handleModuleSelectChange}
          aria-label="Filter signals by intelligence module"
          className="bg-slate-950/80 border border-cyan-800/60 rounded-md px-2.5 py-1.5 text-xs text-cyan-300 font-mono focus:outline-none focus:border-cyan-500"
        >
          <option value="">All Modules</option>
          {availableModules.map((mod) => (
            <option key={mod} value={mod}>
              Module: {mod.toUpperCase()}
            </option>
          ))}
        </select>

        {/* Location Type Select */}
        <select
          value={filters.locationTypes[0] || ''}
          onChange={handleLocationTypeChange}
          aria-label="Filter signals by location type"
          className="bg-slate-950/80 border border-slate-700/80 rounded-md px-2.5 py-1.5 text-xs text-slate-300 font-mono focus:outline-none focus:border-cyan-500"
        >
          <option value="">All Location Types</option>
          {availableLocationTypes.map((loc) => (
            <option key={loc} value={loc}>
              {loc}
            </option>
          ))}
        </select>
      </div>

      {/* Right: Interactive Segmented Facet Filters */}
      <div className="flex flex-wrap items-center gap-3">
        {/* Module Segmented Buttons (if modules available) */}
        {availableModules.length > 0 && (
          <div className="flex items-center gap-1 bg-slate-950/60 p-1 border border-cyan-900/60 rounded-md">
            <span className="text-[11px] font-mono text-cyan-400 font-medium px-1">Module:</span>
            {availableModules.map((mod) => {
              const isActive = filters.modules.includes(mod);
              return (
                <button
                  key={mod}
                  onClick={() => handleModuleToggle(mod)}
                  className={`px-2 py-0.5 text-[11px] font-mono rounded transition-colors whitespace-nowrap uppercase font-semibold ${
                    isActive
                      ? 'bg-cyan-950 text-cyan-300 border border-cyan-700/80'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  {mod}
                </button>
              );
            })}
          </div>
        )}

        {/* Domain Filter Buttons */}
        <div className="flex items-center gap-1 bg-slate-950/60 p-1 border border-slate-800 rounded-md">
          <span className="text-[11px] font-mono text-slate-500 px-1">Domain:</span>
          {availableDomains.map((domain) => {
            const isActive = filters.domains.includes(domain);
            const domainColor = getDomainColor(domain);
            return (
              <button
                key={domain}
                onClick={() => handleDomainToggle(domain)}
                className={`px-2 py-0.5 text-[11px] font-mono rounded transition-colors whitespace-nowrap flex items-center gap-1.5 ${
                  isActive
                    ? 'bg-cyan-950 text-cyan-300 border border-cyan-700/80 font-medium'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <span
                  className="w-1.5 h-1.5 rounded-full shrink-0"
                  style={{ backgroundColor: domainColor.hex }}
                ></span>
                <span>{domain}</span>
              </button>
            );
          })}
        </div>

        {/* Horizon Filter Buttons */}
        <div className="flex items-center gap-1 bg-slate-950/60 p-1 border border-slate-800 rounded-md">
          <span className="text-[11px] font-mono text-slate-500 px-1">Horizon:</span>
          {availableHorizons.map((horizon) => {
            const isActive = filters.horizons.includes(horizon);
            return (
              <button
                key={horizon}
                onClick={() => handleHorizonToggle(horizon)}
                className={`px-2 py-0.5 text-[11px] font-mono rounded transition-colors whitespace-nowrap ${
                  isActive
                    ? 'bg-cyan-950 text-cyan-300 border border-cyan-700/80 font-medium'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                {horizon}
              </button>
            );
          })}
        </div>

        {/* Relevance Filter Buttons */}
        <div className="flex items-center gap-1 bg-slate-950/60 p-1 border border-slate-800 rounded-md">
          <span className="text-[11px] font-mono text-slate-500 px-1">Relevance:</span>
          {availableRelevance.map((rel) => {
            const isActive = filters.relevanceLevels.includes(rel);
            return (
              <button
                key={rel}
                onClick={() => handleRelevanceToggle(rel)}
                className={`px-2 py-0.5 text-[11px] font-mono rounded transition-colors whitespace-nowrap ${
                  isActive
                    ? 'bg-rose-950 text-rose-300 border border-rose-700/80 font-medium'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                {rel}
              </button>
            );
          })}
        </div>

        {/* Reset Filter Action */}
        {activeFilterCount > 0 && (
          <button
            onClick={handleResetFilters}
            className="flex items-center gap-1 px-2.5 py-1 text-xs text-rose-400 hover:text-rose-300 bg-rose-950/30 hover:bg-rose-950/60 border border-rose-800/40 rounded-md transition-colors font-mono"
            title="Reset active filters"
          >
            <RotateCcw className="w-3 h-3" />
            <span>Reset ({activeFilterCount})</span>
          </button>
        )}
      </div>
    </div>
  );
};
