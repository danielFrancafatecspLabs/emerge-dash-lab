import React, { useState, useEffect } from 'react';
import {
  SignalFeature,
  DOMAIN_COLORS,
  getDomainColor,
  RELEVANCE_COLORS,
  CONFIDENCE_COLORS,
  extractSignalModule,
  getSignalPlotCoordinates,
  getSignalTruthCoordinates,
  getGeomKindLabel,
} from '../types/signal';
import {
  X,
  ExternalLink,
  MapPin,
  Calendar,
  Shield,
  Clock,
  Compass,
  Copy,
  Check,
  Layers,
  FileText,
  AlertTriangle,
  Sparkles,
  RefreshCw,
  Activity,
  TrendingUp,
  Info,
} from 'lucide-react';
import { API_BASE } from '../utils/paths';

interface SignalDossierProps {
  signal: SignalFeature | null;
  onClose: () => void;
  onFocusMap: (id: string) => void;
  isAiEnabled?: boolean;
}

// In-memory client cache to preserve Gemini requests and avoid quota drain
const clientDossierCache = new Map<string, any>();

export const SignalDossier: React.FC<SignalDossierProps> = ({
  signal,
  onClose,
  onFocusMap,
  isAiEnabled = false,
}) => {
  const [copied, setCopied] = useState(false);
  const [aiAssessment, setAiAssessment] = useState<{
    situation_summary?: string;
    strategic_implications?: string;
    adversary_dynamics?: string;
    monitoring_indicators?: string[];
  } | null>(null);
  const [isLoadingAi, setIsLoadingAi] = useState<boolean>(false);
  const [isAiSource, setIsAiSource] = useState<boolean>(false);
  const [aiNotice, setAiNotice] = useState<string | null>(null);

  // Sync cache state when selected signal changes
  useEffect(() => {
    if (!signal) return;
    const signalId = signal.properties?.id || signal.id;
    if (signalId && clientDossierCache.has(signalId)) {
      setAiAssessment(clientDossierCache.get(signalId));
      setIsAiSource(true);
      setAiNotice(null);
    } else {
      setAiAssessment(null);
      setIsAiSource(false);
      setAiNotice(null);
    }
  }, [signal?.id]);

  // On-demand AI Deep Dive trigger
  const handleEnhanceWithAI = async () => {
    if (!signal) return;
    const signalId = signal.properties?.id || signal.id;

    if (signalId && clientDossierCache.has(signalId)) {
      setAiAssessment(clientDossierCache.get(signalId));
      setIsAiSource(true);
      return;
    }

    setIsLoadingAi(true);
    setAiNotice(null);

    try {
      const res = await fetch(`${API_BASE}/ai/dossier`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ signal }),
      });

      if (res.ok) {
        const data = await res.json();
        if (data.source === 'gemini' && data.assessment) {
          if (signalId) {
            clientDossierCache.set(signalId, data.assessment);
          }
          setAiAssessment(data.assessment);
          setIsAiSource(true);
          setIsLoadingAi(false);
          return;
        } else if (data.reason === 'quota_cooldown') {
          setAiNotice('API quota limit active. Showing verified rule-based OSINT analysis.');
        }
      }
    } catch {
      setAiNotice('Using verified rule-based OSINT analysis.');
    }

    setAiAssessment(null);
    setIsAiSource(false);
    setIsLoadingAi(false);
  };

  if (!signal) return null;

  const handleCopyGeoJSON = () => {
    navigator.clipboard.writeText(JSON.stringify(signal, null, 2));
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const domainStyle = getDomainColor(signal.properties.domain);

  const truthCoords = getSignalTruthCoordinates(signal);
  const plotCoords = getSignalPlotCoordinates(signal);
  const isJittered = Boolean(signal.properties.jitter);
  const geomKind = signal.properties.geom_kind;
  const isUnmapped = geomKind === 'none' || (!truthCoords && !plotCoords);
  const hasCoords = !isUnmapped && truthCoords !== null;
  const lon = truthCoords ? truthCoords[0] : null;
  const lat = truthCoords ? truthCoords[1] : null;
  const activeModule = signal.properties.module || extractSignalModule(signal);
  const details = signal.properties.Details || signal.properties.details;
  const implication = signal.properties.Implication || signal.properties.implication;

  return (
    <div className="w-full md:w-96 lg:w-[440px] h-full bg-slate-950 border-l border-slate-800/80 flex flex-col z-20 shadow-2xl select-none">
      {/* Dossier Header */}
      <div className="p-4 border-b border-slate-800/80 flex items-center justify-between bg-slate-900/50">
        <div className="flex items-center gap-2">
          <FileText className="w-4 h-4 text-cyan-400" />
          <span className="text-xs font-mono font-semibold tracking-wider text-slate-200 uppercase">
            OSINT Signal Dossier
          </span>
        </div>

        <div className="flex items-center gap-1.5">
          <button
            onClick={handleCopyGeoJSON}
            className="p-1.5 text-slate-400 hover:text-slate-200 hover:bg-slate-800 rounded transition-colors"
            title="Copy GeoJSON Feature object"
          >
            {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
          </button>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-200 hover:bg-slate-800 rounded transition-colors"
            title="Close Dossier"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Dossier Content */}
      <div className="flex-1 overflow-y-auto p-5 space-y-5 text-xs">
        {/* Prominently Highlighted Intelligence Module Card */}
        <div className="p-3 bg-gradient-to-r from-cyan-950/80 via-slate-900 to-indigo-950/60 border border-cyan-700/80 rounded-xl shadow-lg flex items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-cyan-950 border border-cyan-600/80 rounded-lg text-cyan-300 shadow-inner shrink-0">
              <Layers className="w-4 h-4 text-cyan-400" />
            </div>
            <div>
              <div className="text-[10px] uppercase font-mono tracking-widest text-cyan-400 font-bold flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-pulse"></span>
                <span>Active Module</span>
              </div>
              <div className="text-sm font-bold text-white tracking-wide font-sans mt-0.5 leading-snug">
                {activeModule}
              </div>
            </div>
          </div>
          {signal.properties.module_slug ? (
            <div className="text-right shrink-0">
              <span className="px-2 py-0.5 text-[10px] font-mono bg-cyan-950/90 border border-cyan-500/70 text-cyan-300 rounded font-semibold tracking-wider uppercase">
                {signal.properties.module_slug}
              </span>
            </div>
          ) : (
            <div className="text-right shrink-0">
              <span className="px-2 py-0.5 text-[10px] font-mono bg-cyan-950/90 border border-cyan-500/70 text-cyan-300 rounded font-semibold tracking-wider">
                {activeModule}
              </span>
            </div>
          )}
        </div>

        {/* Signal Title & ID */}
        <div>
          <div className="text-[11px] font-mono text-cyan-400 tracking-wider">
            {signal.properties.id}
          </div>
          <h2 className="mt-1 text-base font-semibold text-slate-100 leading-snug">
            {signal.properties.title}
          </h2>
          <div className="mt-2 flex items-center gap-2 text-xs text-slate-400 font-mono">
            <span>{signal.properties.date}</span>
            <span aria-hidden="true">·</span>
            <span className="text-cyan-300 font-medium">Module: {activeModule}</span>
            <span aria-hidden="true">·</span>
            <span>Status: {signal.properties.status}</span>
          </div>
        </div>

        {/* Primary Metadata Grid (Frontmatter Properties) */}
        <div className="grid grid-cols-2 gap-2 p-3 bg-slate-900/60 border border-slate-800/80 rounded-lg font-mono">
          <div>
            <div className="text-[10px] text-slate-500 uppercase tracking-wider">Domain</div>
            <div className={`mt-0.5 text-xs font-semibold ${domainStyle.text}`}>
              {signal.properties.domain}
            </div>
          </div>
          <div>
            <div className="text-[10px] text-slate-500 uppercase tracking-wider">Subtheme</div>
            <div className="mt-0.5 text-xs text-slate-200">
              {signal.properties.subtheme}
            </div>
          </div>
          <div className="pt-2 border-t border-slate-800/60">
            <div className="text-[10px] text-slate-500 uppercase tracking-wider">Stakeholder Relevance</div>
            <div className={`mt-0.5 text-xs font-semibold ${RELEVANCE_COLORS[signal.properties.stakeholder_relevance]}`}>
              {signal.properties.stakeholder_relevance}
            </div>
          </div>
          <div className="pt-2 border-t border-slate-800/60">
            <div className="text-[10px] text-slate-500 uppercase tracking-wider">Confidence Level</div>
            <div className={`mt-0.5 text-xs font-semibold ${CONFIDENCE_COLORS[signal.properties.confidence]}`}>
              {signal.properties.confidence}
            </div>
          </div>
          <div className="pt-2 border-t border-slate-800/60">
            <div className="text-[10px] text-slate-500 uppercase tracking-wider">Horizon</div>
            <div className="mt-0.5 text-xs text-cyan-300">
              {signal.properties.horizon}
            </div>
          </div>
          <div className="pt-2 border-t border-slate-800/60">
            <div className="text-[10px] text-slate-500 uppercase tracking-wider">Location Type</div>
            <div className="mt-0.5 text-xs text-slate-300">
              {signal.properties.location_type}
            </div>
          </div>
        </div>

        {/* Operational Details & Strategic Implication */}
        {(details || implication) && (
          <div className="p-3.5 bg-slate-900/70 border border-slate-800 rounded-xl space-y-3 shadow-sm">
            {details && (
              <div>
                <div className="flex items-center gap-1.5 text-[10px] font-mono uppercase tracking-wider text-cyan-400 font-semibold mb-1">
                  <Activity className="w-3.5 h-3.5" />
                  <span>Operational Details</span>
                </div>
                <p className="text-slate-200 text-xs leading-relaxed font-sans">
                  {details}
                </p>
              </div>
            )}

            {implication && (
              <div className={details ? 'pt-2.5 border-t border-slate-800/80' : ''}>
                <div className="flex items-center gap-1.5 text-[10px] font-mono uppercase tracking-wider text-amber-400 font-semibold mb-1">
                  <TrendingUp className="w-3.5 h-3.5" />
                  <span>Strategic Implication</span>
                </div>
                <div className="p-2.5 bg-amber-950/20 border border-amber-800/40 rounded-lg">
                  <p className="text-amber-200/90 text-xs leading-relaxed font-sans font-medium">
                    {implication}
                  </p>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Geospatial Intelligence & Coordinates */}
        <div className="p-3.5 bg-slate-900/60 border border-slate-800/80 rounded-xl space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5 text-slate-200 font-medium text-xs">
              <MapPin className="w-3.5 h-3.5 text-cyan-400" />
              <span>Geospatial Properties</span>
            </div>
            {!isUnmapped && (
              <button
                onClick={() => onFocusMap(signal.id)}
                className="text-cyan-400 hover:text-cyan-300 font-mono text-[11px] flex items-center gap-1 transition-colors cursor-pointer"
                title="Focus this signal on the tactical map"
              >
                <Compass className="w-3.5 h-3.5" />
                <span>Locate</span>
              </button>
            )}
          </div>

          {/* Place name / location label */}
          <div>
            <div className="text-[10px] text-slate-500 uppercase tracking-wider font-mono">Location</div>
            <div className="text-slate-200 font-semibold text-xs mt-0.5">
              {signal.properties.location}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-800/60 text-[11px] font-mono">
            <div>
              <span className="text-slate-500">Location Type:</span>{' '}
              <span className="text-slate-300">{signal.properties.location_type || 'N/A'}</span>
            </div>
            <div>
              <span className="text-slate-500">ISO-3 Country:</span>{' '}
              <span className="text-slate-300">{signal.properties.iso3 || 'N/A'}</span>
            </div>
          </div>

          {/* Marker Meaning based on geom_kind */}
          <div className="pt-2 border-t border-slate-800/60 text-[11px] font-mono">
            <div className="text-slate-500 text-[10px] uppercase tracking-wider mb-0.5">Marker Meaning (geom_kind)</div>
            <div className="text-slate-200">
              {geomKind === 'locality' && (
                <div className="flex items-center gap-1.5 text-cyan-300">
                  <span className="px-1.5 py-0.2 bg-cyan-950 border border-cyan-800 rounded text-[10px]">locality</span>
                  <span>City or site from the offline gazetteer</span>
                </div>
              )}
              {geomKind === 'country-centroid' && (
                <div className="flex items-center gap-1.5 text-amber-300">
                  <span className="px-1.5 py-0.2 bg-amber-950 border border-amber-800 rounded text-[10px]">country-centroid</span>
                  <span>Country centre (locality was missing or not in the gazetteer)</span>
                </div>
              )}
              {geomKind === 'none' && (
                <div className="flex items-center gap-1.5 text-slate-400">
                  <span className="px-1.5 py-0.2 bg-slate-800 border border-slate-700 rounded text-[10px]">none</span>
                  <span>No marker (Worldwide or no resolved country)</span>
                </div>
              )}
              {geomKind !== 'locality' && geomKind !== 'country-centroid' && geomKind !== 'none' && (
                <span className="text-slate-300">{getGeomKindLabel(geomKind)}</span>
              )}
            </div>
          </div>

          {/* Jitter offset statement if jitter is true */}
          {isJittered && (
            <div className="p-2.5 bg-cyan-950/40 border border-cyan-800/60 rounded-lg text-xs space-y-1">
              <div className="flex items-center gap-1.5 font-semibold text-cyan-300 text-[11px] font-mono">
                <Info className="w-3.5 h-3.5 shrink-0 text-cyan-400" />
                <span>Marker is offset from the country or city centre</span>
              </div>
              <p className="text-[11px] leading-relaxed text-cyan-200/90 font-sans">
                Position for <span className="font-semibold text-white">{signal.properties.location}</span> was offset so markers do not stack. The offset is not a location.
              </p>
              {plotCoords && (
                <div className="text-[10px] font-mono text-cyan-400/80 pt-0.5">
                  Plotted at: [{plotCoords[0].toFixed(4)}°, {plotCoords[1].toFixed(4)}°]
                </div>
              )}
            </div>
          )}

          {/* Coordinates representation */}
          {!isUnmapped && truthCoords ? (
            <div className="pt-2 border-t border-slate-800/60 text-[11px] font-mono text-slate-400 flex items-center justify-between">
              <div>
                <span className="text-slate-500">Truth Lon:</span>{' '}
                <span className="text-slate-200">{truthCoords[0].toFixed(4)}°</span>
              </div>
              <div>
                <span className="text-slate-500">Truth Lat:</span>{' '}
                <span className="text-slate-200">{truthCoords[1].toFixed(4)}°</span>
              </div>
            </div>
          ) : (
            <div className="pt-2 border-t border-slate-800/60 flex items-center justify-between text-[11px] font-mono">
              <div className="flex items-center gap-1.5 text-amber-400">
                <AlertTriangle className="w-3.5 h-3.5" />
                <span>No marker plotted (geom_kind: none)</span>
              </div>
              <span className="text-slate-500">Worldwide/unresolved</span>
            </div>
          )}
        </div>

        {/* Strategic Analysis & Implications (Live AI / On-Demand) */}
        {isAiEnabled && (
          <div className="p-3.5 bg-slate-900/80 border border-slate-800 rounded-lg space-y-3">
            <div className="flex items-center justify-between text-xs pb-1 border-b border-slate-800/80">
              <div className="font-semibold text-slate-200 tracking-wide flex items-center gap-1.5">
                <Shield className="w-3.5 h-3.5 text-cyan-400" />
                <span>Strategic OSINT Assessment</span>
              </div>
              {isLoadingAi ? (
                <span className="flex items-center gap-1 text-[10px] font-mono text-cyan-400">
                  <RefreshCw className="w-2.5 h-2.5 animate-spin" />
                  <span>Generating...</span>
                </span>
              ) : isAiSource ? (
                <span className="flex items-center gap-1 text-[10px] font-mono text-cyan-300 bg-cyan-950/80 border border-cyan-800/80 px-1.5 py-0.5 rounded">
                  <Sparkles className="w-2.5 h-2.5 text-cyan-400" />
                  <span>Gemini 3.8 Flash</span>
                </span>
              ) : (
                <span className="text-[10px] font-mono text-slate-500">
                  On-Demand
                </span>
              )}
            </div>

            {aiNotice && (
              <div className="p-2 bg-slate-950 border border-cyan-900/60 text-cyan-300 text-[11px] font-mono rounded">
                {aiNotice}
              </div>
            )}

            {isLoadingAi ? (
              <div className="py-4 space-y-2 animate-pulse">
                <div className="h-2.5 bg-slate-800 rounded w-3/4"></div>
                <div className="h-2 bg-slate-800/60 rounded w-full"></div>
                <div className="h-2 bg-slate-800/60 rounded w-5/6"></div>
                <div className="h-2 bg-slate-800/60 rounded w-2/3"></div>
              </div>
            ) : isAiSource && aiAssessment ? (
              <div className="space-y-3">
                <div>
                  <div className="text-[10px] font-mono text-slate-500 uppercase tracking-wider">
                    Situation Summary
                  </div>
                  <p className="mt-1 text-slate-300 leading-relaxed text-xs">
                    {aiAssessment.situation_summary}
                  </p>
                </div>

                {aiAssessment.strategic_implications && (
                  <div>
                    <div className="text-[10px] font-mono text-slate-500 uppercase tracking-wider">
                      Strategic Implications
                    </div>
                    <p className="mt-1 text-slate-300 leading-relaxed text-xs">
                      {aiAssessment.strategic_implications}
                    </p>
                  </div>
                )}

                {aiAssessment.adversary_dynamics && (
                  <div>
                    <div className="text-[10px] font-mono text-slate-500 uppercase tracking-wider">
                      Adversary & Competitor Moves
                    </div>
                    <p className="mt-1 text-slate-300 leading-relaxed text-xs">
                      {aiAssessment.adversary_dynamics}
                    </p>
                  </div>
                )}

                {aiAssessment.monitoring_indicators && aiAssessment.monitoring_indicators.length > 0 && (
                  <div className="pt-2 border-t border-slate-800/80">
                    <div className="text-[10px] font-mono text-slate-500 uppercase tracking-wider mb-1">
                      Key Indicators to Monitor
                    </div>
                    <ul className="list-disc list-inside space-y-1 text-slate-300 text-[11px] leading-relaxed">
                      {aiAssessment.monitoring_indicators.map((ind, i) => (
                        <li key={i}>{ind}</li>
                      ))}
                    </ul>
                  </div>
                )}

                <div className="pt-1 flex justify-end">
                  <button
                    type="button"
                    onClick={handleEnhanceWithAI}
                    className="text-[10px] font-mono text-cyan-400 hover:text-cyan-200 flex items-center gap-1 transition-colors cursor-pointer"
                    title="Re-run AI tactical assessment"
                  >
                    <RefreshCw className="w-2.5 h-2.5" />
                    <span>Re-analyze</span>
                  </button>
                </div>
              </div>
            ) : (
              <div className="py-2.5 space-y-3 text-center">
                <p className="text-xs text-slate-400 font-sans leading-relaxed">
                  No assessment generated for this signal yet.
                </p>
                <button
                  type="button"
                  onClick={handleEnhanceWithAI}
                  className="w-full py-2.5 px-4 bg-cyan-600 hover:bg-cyan-500 text-slate-950 font-bold font-mono text-xs rounded-md transition-colors flex items-center justify-center gap-2 shadow-md cursor-pointer"
                  title="Create strategic OSINT assessment for this signal"
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>Create Assessment</span>
                </button>
              </div>
            )}
          </div>
        )}

        {/* Verified Primary Source Link */}
        <div className="pt-1">
          <a
            href={signal.properties.source_url}
            target="_blank"
            rel="noopener noreferrer"
            className="w-full py-2 px-3 bg-slate-900 hover:bg-slate-800 border border-slate-700/80 rounded-lg text-slate-200 text-xs font-mono flex items-center justify-between transition-colors group"
          >
            <span className="truncate pr-2">Verify Source: {signal.properties.source_url}</span>
            <ExternalLink className="w-3.5 h-3.5 text-cyan-400 group-hover:translate-x-0.5 transition-transform shrink-0" />
          </a>
        </div>
      </div>
    </div>
  );
};
