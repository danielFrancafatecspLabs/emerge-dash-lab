import React, { useState, useEffect, useMemo } from 'react';
import { SignalFeature, extractSignalModule, DOMAIN_COLORS, getSignalTruthCoordinates } from '../types/signal';
import { FormattedBriefingReport } from './FormattedBriefingReport';
import {
  FileText,
  Copy,
  Check,
  Download,
  Shield,
  ArrowRight,
  RefreshCw,
  TrendingUp,
  AlertCircle,
  ExternalLink,
  Sparkles,
  Layers,
  Crosshair,
  Compass,
  Eye,
  Code,
} from 'lucide-react';
import { API_BASE } from '../utils/paths';

interface BriefingGeneratorProps {
  signals: SignalFeature[];
  onSelectSignal: (id: string) => void;
}

// Client session cache to retain briefing reports across tab switches without re-fetching
const briefingSessionCache = new Map<
  string,
  { content: string | null; mode: 'gemini' | 'algorithmic'; timestamp: string }
>();

export const BriefingGenerator: React.FC<BriefingGeneratorProps> = ({
  signals,
  onSelectSignal,
}) => {
  const [copied, setCopied] = useState(false);
  const [isGenerating, setIsGenerating] = useState<boolean>(false);
  const [hasGenerated, setHasGenerated] = useState<boolean>(false);
  const [generationTimestamp, setGenerationTimestamp] = useState<string>('');
  const [aiBriefingContent, setAiBriefingContent] = useState<string | null>(null);
  const [synthesisMode, setSynthesisMode] = useState<'gemini' | 'algorithmic'>('gemini');
  const [viewFormat, setViewFormat] = useState<'formatted' | 'raw'>('formatted');

  // Scoped to signals marked with "High" stakeholder relevance (with fallback to all signals if none tagged high)
  const highRelevanceSignals = useMemo(() => {
    const high = signals.filter(
      (s) => s.properties?.stakeholder_relevance?.trim().toLowerCase() === 'high'
    );
    return high.length > 0 ? high : signals;
  }, [signals]);

  const highRelevanceKey = useMemo(() => {
    return highRelevanceSignals.map((s) => s.properties?.id || s.id).sort().join(',');
  }, [highRelevanceSignals]);

  // Sync with session cache on dataset change; do NOT auto-generate
  useEffect(() => {
    const cached = briefingSessionCache.get(highRelevanceKey);
    if (cached) {
      setAiBriefingContent(cached.content);
      setSynthesisMode(cached.mode);
      setGenerationTimestamp(cached.timestamp);
      setHasGenerated(true);
    } else {
      setHasGenerated(false);
      setAiBriefingContent(null);
    }
  }, [highRelevanceKey]);

  // Extract metadata facets from high relevance signals
  const domains = useMemo(() => {
    return Array.from(new Set(highRelevanceSignals.map((s) => s.properties?.domain || 'Unknown')));
  }, [highRelevanceSignals]);

  const locations = useMemo(() => {
    return Array.from(new Set(highRelevanceSignals.map((s) => s.properties?.location || 'Unknown')));
  }, [highRelevanceSignals]);

  // Algorithmic convergence vectors fallback
  const convergenceVectors = useMemo(() => {
    const vectors: { title: string; category: string; description: string; signalsInvolved: string[] }[] = [];

    const hasTech = domains.some((d) => d.toLowerCase().includes('tech'));
    const hasPol = domains.some((d) => d.toLowerCase().includes('pol') || d.toLowerCase().includes('reg'));
    const hasEcon = domains.some((d) => d.toLowerCase().includes('econ'));

    if (hasTech && hasPol) {
      vectors.push({
        title: 'Technology & Regulatory Authorization Synchronicity',
        category: 'Tech-Regulatory Nexus',
        description:
          'Operational deployment velocities (heavy-lift multi-manifest launches and gateway upgrades) are tightly coupled with sovereign regulatory clearance windows (FAA launch licenses, FCC Special Temporary Authorizations). Constellation operations are executing in tight synchronicity with institutional waivers.',
        signalsInvolved: highRelevanceSignals
          .filter((s) => s.properties?.domain === 'Technological' || s.properties?.domain === 'Political' || s.properties?.domain === 'Regulatory')
          .map((s) => s.properties?.id || s.id),
      });
    }

    if (hasTech && hasEcon) {
      vectors.push({
        title: 'Launch Unit Economics & Market Penetration Parity',
        category: 'Commercial Scaling',
        description:
          'The transition to heavy-lift next-gen satellite deployment directly reduces per-gigabit transit costs, applying competitive pricing pressure against incumbent regional telecommunications operators and accelerating commercial payback cycles.',
        signalsInvolved: highRelevanceSignals
          .filter((s) => s.properties?.domain === 'Technological' || s.properties?.domain === 'Economic')
          .map((s) => s.properties?.id || s.id),
      });
    }

    if (locations.length > 0) {
      vectors.push({
        title: `Geographic Corridor Dispersion (${locations.slice(0, 3).join(', ')}${locations.length > 3 ? '...' : ''})`,
        category: 'Geospatial Alignment',
        description:
          `Critical priority signals converge across ${locations.length} strategic geographies, indicating simultaneous development across sovereign orbital launch gateways, spectrum coordination zones, and emerging terrestrial distribution hubs.`,
        signalsInvolved: highRelevanceSignals.map((s) => s.properties?.id || s.id),
      });
    }

    return vectors;
  }, [highRelevanceSignals, domains, locations]);

  // On-demand synthesis routine: calls /api/ai/briefing with fallback to deterministic engine
  const executeBriefingSynthesis = async (preferredMode: 'gemini' | 'algorithmic' = 'gemini') => {
    if (preferredMode === 'algorithmic') {
      const ts = new Date().toUTCString();
      setAiBriefingContent(null);
      setSynthesisMode('algorithmic');
      setGenerationTimestamp(ts);
      setHasGenerated(true);
      setIsGenerating(false);
      briefingSessionCache.set(highRelevanceKey, {
        content: null,
        mode: 'algorithmic',
        timestamp: ts,
      });
      return;
    }

    setIsGenerating(true);
    try {
      if (highRelevanceSignals.length > 0) {
        const response = await fetch(`${API_BASE}/ai/briefing`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ signals: highRelevanceSignals }),
        });

        if (response.ok) {
          const data = await response.json();
          if (data.source === 'gemini' && data.content) {
            const ts = new Date().toUTCString();
            setAiBriefingContent(data.content);
            setSynthesisMode('gemini');
            setGenerationTimestamp(ts);
            setHasGenerated(true);
            setIsGenerating(false);
            briefingSessionCache.set(highRelevanceKey, {
              content: data.content,
              mode: 'gemini',
              timestamp: ts,
            });
            return;
          }
        }
      }
    } catch {
      // Graceful fallback to deterministic synthesis
    }

    // Fallback: Algorithmic synthesis
    const fallbackTs = new Date().toUTCString();
    setAiBriefingContent(null);
    setSynthesisMode('algorithmic');
    setGenerationTimestamp(fallbackTs);
    setHasGenerated(true);
    setIsGenerating(false);
    briefingSessionCache.set(highRelevanceKey, {
      content: null,
      mode: 'algorithmic',
      timestamp: fallbackTs,
    });
  };

  // Structured Markdown report for Copy & Download
  const generateMarkdownReport = () => {
    if (aiBriefingContent && synthesisMode === 'gemini') {
      const today = new Date().toISOString().split('T')[0];
      return `# STRATEGIC OSINT INTELLIGENCE BRIEFING: HIGH RELEVANCE CONVERGENCE\n**Compiled:** ${today} | **Engine:** Gemini 3.8 Flash | **Focal Set:** ${highRelevanceSignals.length} High-Relevance Signals\n\n${aiBriefingContent}`;
    }

    const today = new Date().toISOString().split('T')[0];
    let md = `# STRATEGIC OSINT INTELLIGENCE BRIEFING: HIGH RELEVANCE CONVERGENCE\n`;
    md += `**Date of Compilation:** ${today} | **Classification:** OSINT / Strategic Synthesis\n`;
    md += `**Filter Criteria:** Strictly Scoped to High Stakeholder Relevance Signals\n`;
    md += `**High Relevance Population:** ${highRelevanceSignals.length} of ${signals.length} total active signals\n\n`;

    md += `## 1. STRATEGIC EXECUTIVE SYNTHESIS\n`;
    md += `This briefing evaluates exclusively the highest-consequence signals identified in the active dataset. Strategic convergence is concentrated across ${domains.join(', ')} sectors, spanning ${locations.join('; ')}. Key developments reveal intense positioning in LEO sovereign distribution rights, orbital manifest acceleration, and feeder link regulatory clearances.\n\n`;

    md += `## 2. CONVERGENCE & MULTI-DOMAIN VECTOR MAPPING\n\n`;
    convergenceVectors.forEach((v, idx) => {
      md += `### ${idx + 1}. ${v.title} [${v.category}]\n`;
      md += `${v.description}\n`;
      md += `- **Correlated Signal IDs:** ${v.signalsInvolved.map((id) => `\`${id}\``).join(', ')}\n\n`;
    });

    md += `## 3. HIGH-RELEVANCE PRIMARY SIGNALS DOSSIER\n\n`;
    highRelevanceSignals.forEach((s, idx) => {
      const p = s.properties;
      md += `### Signal ${idx + 1}: [${p.id}] ${p.title}\n`;
      md += `- **Date:** ${p.date} | **Module:** ${p.module || extractSignalModule(s)}\n`;
      md += `- **Domain:** ${p.domain} | **Subtheme:** ${p.subtheme}\n`;
      const truth = getSignalTruthCoordinates(s);
      const locCoords = truth ? `${truth[1].toFixed(2)}°, ${truth[0].toFixed(2)}°` : 'No map marker / Unmapped';
      md += `- **Location:** ${p.location} (${locCoords})\n`;
      md += `- **Relevance:** High | **Horizon:** ${p.horizon} | **Confidence:** ${p.confidence}\n`;
      if (p.Details || p.details) {
        md += `- **Operational Details:** ${p.Details || p.details}\n`;
      }
      if (p.Implication || p.implication) {
        md += `- **Strategic Implication:** ${p.Implication || p.implication}\n`;
      }
      md += `- **Primary Source Document:** ${p.source_url}\n\n`;
    });

    return md;
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(generateMarkdownReport());
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownload = () => {
    const md = generateMarkdownReport();
    const blob = new Blob([md], { type: 'text/markdown;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `osint-briefing-high-relevance-${new Date().toISOString().split('T')[0]}.md`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="flex-1 h-full bg-slate-950 p-4 md:p-6 overflow-y-auto select-none flex flex-col">
      {/* Top Header & Actions */}
      <div className="mb-6 flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-800/80">
        <div>
          <div className="flex items-center gap-2 text-cyan-400 text-xs font-mono mb-1">
            <Shield className="w-3.5 h-3.5" />
            <span>EXECUTIVE MEMORANDUM SYNTHESIS</span>
            <span aria-hidden="true" className="text-slate-600">·</span>
            <span className="text-rose-400 font-semibold">HIGH RELEVANCE FOCUS</span>
            <span aria-hidden="true" className="text-slate-600">·</span>
            {hasGenerated ? (
              synthesisMode === 'gemini' ? (
                <span className="text-cyan-300 font-semibold flex items-center gap-1 bg-cyan-950/80 border border-cyan-800/80 px-1.5 py-0.2 rounded text-[10px]">
                  <Sparkles className="w-2.5 h-2.5" />
                  <span>Gemini 3.8 Flash</span>
                </span>
              ) : (
                <span className="text-slate-400 font-mono text-[10px] bg-slate-900 border border-slate-800 px-1.5 py-0.2 rounded">
                  Rule-Based Engine
                </span>
              )
            ) : (
              <span className="text-cyan-400 font-mono text-[10px] bg-cyan-950/60 border border-cyan-800/60 px-1.5 py-0.2 rounded">
                On-Demand Ready
              </span>
            )}
          </div>
          <h2 className="text-lg font-bold text-slate-100 tracking-tight flex items-center gap-2">
            <span>Strategic OSINT Intelligence Briefing</span>
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Context-optimized synthesis of convergence vectors and strategic impacts from {highRelevanceSignals.length} signals marked with <strong className="text-rose-400 font-semibold font-mono">High Stakeholder Relevance</strong>.
          </p>
        </div>

        {hasGenerated ? (
          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={() => executeBriefingSynthesis('gemini')}
              disabled={isGenerating}
              className="px-3 py-1.5 bg-cyan-950 hover:bg-cyan-900 border border-cyan-800/80 rounded-md text-xs font-mono text-cyan-300 flex items-center gap-1.5 transition-colors disabled:opacity-50"
              title="Re-run Gemini AI intelligence convergence synthesis"
            >
              <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
              <span>{isGenerating ? 'Synthesizing...' : 'Re-synthesize (AI)'}</span>
            </button>

            <button
              onClick={() => executeBriefingSynthesis('algorithmic')}
              disabled={isGenerating}
              className="px-3 py-1.5 bg-slate-900 hover:bg-slate-800 border border-slate-700 rounded-md text-xs font-mono text-slate-300 flex items-center gap-1.5 transition-colors disabled:opacity-50"
              title="Switch to deterministic rule-based analysis"
            >
              <Layers className="w-3.5 h-3.5 text-slate-400" />
              <span>Rule-Based</span>
            </button>

            <button
              onClick={handleCopy}
              disabled={isGenerating || highRelevanceSignals.length === 0}
              className="px-3 py-1.5 bg-slate-900 hover:bg-slate-800 border border-slate-700 rounded-md text-xs font-mono text-slate-200 flex items-center gap-1.5 transition-colors disabled:opacity-50"
              title="Copy formatted Markdown briefing to clipboard"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5 text-slate-400" />}
              <span>{copied ? 'Copied' : 'Copy'}</span>
            </button>

            <button
              onClick={handleDownload}
              disabled={isGenerating || highRelevanceSignals.length === 0}
              className="px-3.5 py-1.5 bg-slate-900 hover:bg-slate-800 border border-slate-700 rounded-md text-xs font-mono text-slate-200 flex items-center gap-1.5 transition-colors disabled:opacity-50 shadow-sm"
              title="Download full briefing report as .md"
            >
              <Download className="w-3.5 h-3.5" />
              <span>.MD</span>
            </button>

            <button
              onClick={() => setHasGenerated(false)}
              disabled={isGenerating}
              className="px-2.5 py-1.5 text-slate-500 hover:text-slate-300 text-xs font-mono transition-colors"
              title="Return to Briefing Launch Deck"
            >
              Configure Scope
            </button>
          </div>
        ) : null}
      </div>

      {/* Loading / Generating State Overlay */}
      {isGenerating ? (
        <div className="max-w-4xl mx-auto w-full my-auto py-20 flex flex-col items-center justify-center text-center space-y-4">
          <div className="relative">
            <div className="w-14 h-14 rounded-full border-2 border-cyan-500/20 border-t-cyan-400 animate-spin flex items-center justify-center shadow-lg"></div>
            <Shield className="w-6 h-6 text-cyan-400 absolute inset-0 m-auto animate-pulse" />
          </div>
          <div className="space-y-1 font-mono">
            <div className="text-sm font-semibold text-slate-200 uppercase tracking-wider">
              Synthesizing Strategic OSINT Briefing...
            </div>
            <p className="text-xs text-slate-400 max-w-md">
              Evaluating {highRelevanceSignals.length} High-Relevance signals, mapping multi-domain convergence, and synthesizing strategic impact vectors...
            </p>
          </div>
          <div className="text-[11px] font-mono text-cyan-400/80 bg-cyan-950/40 border border-cyan-800/50 px-3 py-1 rounded">
            Target Contact Point 1: Gemini 3.8 Flash OSINT Engine
          </div>
        </div>
      ) : !hasGenerated ? (
        /* On-Demand Briefing Staging & Synthesis Deck */
        <div className="max-w-4xl mx-auto w-full my-auto py-6 space-y-6">
          <div className="p-6 bg-slate-900/80 border border-slate-800 rounded-xl space-y-5 shadow-xl">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center gap-2 text-cyan-400 font-mono text-xs font-semibold uppercase tracking-wider">
                <Shield className="w-4 h-4 text-cyan-400" />
                <span>Executive OSINT Briefing Staging</span>
              </div>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-cyan-950/80 border border-cyan-800/80 text-cyan-300">
                On-Demand Generation
              </span>
            </div>

            <div className="space-y-2">
              <h3 className="text-base font-bold text-slate-100">
                Generate Strategic Multi-Domain Convergence Memorandum
              </h3>
              <p className="text-xs text-slate-400 leading-relaxed max-w-2xl font-sans">
                Briefing generation is triggered on demand to preserve model token quota and ensure analysis is conducted against your validated filter criteria. Choose your preferred synthesis engine below:
              </p>
            </div>

            {/* Scope Summary Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 p-3.5 bg-slate-950/70 border border-slate-800/90 rounded-lg text-xs font-mono">
              <div>
                <span className="text-[10px] text-slate-500 block uppercase">Target Scope</span>
                <span className="text-slate-200 font-bold tabular-nums text-sm">{highRelevanceSignals.length} Signals</span>
                <span className="text-[10px] text-rose-400 block mt-0.5 font-sans">
                  {highRelevanceSignals.length === signals.length ? 'All Active Signals' : 'High Stakeholder Relevance'}
                </span>
              </div>
              <div>
                <span className="text-[10px] text-slate-500 block uppercase">Converging Sectors</span>
                <span className="text-cyan-300 font-semibold">{domains.length} Domains</span>
                <span className="text-[10px] text-slate-400 block mt-0.5 truncate">{domains.join(', ')}</span>
              </div>
              <div>
                <span className="text-[10px] text-slate-500 block uppercase">Geographic Corridors</span>
                <span className="text-slate-200 font-semibold">{locations.length} Locations</span>
                <span className="text-[10px] text-slate-400 block mt-0.5 truncate">{locations.slice(0, 3).join(', ')}</span>
              </div>
            </div>

            {/* Action Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-1">
              {/* Option A: Gemini 3.8 Flash AI Synthesis */}
              <div className="p-4 bg-slate-950/90 border border-cyan-900/70 hover:border-cyan-700/80 rounded-lg space-y-3 transition-colors flex flex-col justify-between">
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1.5 text-xs font-semibold text-cyan-300">
                      <Sparkles className="w-4 h-4 text-cyan-400" />
                      <span>Gemini 3.8 Flash Synthesis</span>
                    </div>
                    <span className="text-[10px] font-mono text-cyan-400 bg-cyan-950 border border-cyan-800/80 px-1.5 py-0.5 rounded">
                      Model Contact Point 1
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-400 leading-relaxed font-sans">
                    Produces a dense, structured intelligence memorandum covering executive synthesis, cross-domain nexus vectors, sector consequence matrices, and 30–90 day foresight directives.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => executeBriefingSynthesis('gemini')}
                  className="w-full py-2.5 px-4 bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold font-mono text-xs rounded-md transition-colors flex items-center justify-center gap-2 shadow-lg cursor-pointer"
                >
                  <Sparkles className="w-3.5 h-3.5 text-slate-950" />
                  <span>Synthesize with Gemini AI</span>
                </button>
              </div>

              {/* Option B: Deterministic Rule-Based Engine */}
              <div className="p-4 bg-slate-950/90 border border-slate-800 hover:border-slate-700 rounded-lg space-y-3 transition-colors flex flex-col justify-between">
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-200">
                      <Layers className="w-4 h-4 text-slate-400" />
                      <span>Deterministic OSINT Engine</span>
                    </div>
                    <span className="text-[10px] font-mono text-slate-400 bg-slate-900 border border-slate-800 px-1.5 py-0.5 rounded">
                      Instant Zero-Token
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-400 leading-relaxed font-sans">
                    Instantly maps cross-domain convergence vectors (Tech-Regulatory nexus, commercial scaling, geospatial corridors) using the verified algorithmic OSINT engine without model latency.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => executeBriefingSynthesis('algorithmic')}
                  className="w-full py-2.5 px-4 bg-slate-800 hover:bg-slate-700 text-slate-100 font-semibold font-mono text-xs rounded-md transition-colors flex items-center justify-center gap-2 border border-slate-700 cursor-pointer"
                >
                  <Layers className="w-3.5 h-3.5 text-slate-400" />
                  <span>Generate Rule-Based Report</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      ) : highRelevanceSignals.length === 0 ? (
        <div className="max-w-2xl mx-auto w-full p-8 bg-slate-900/60 border border-slate-800 rounded-xl text-center space-y-3 font-mono my-auto">
          <div className="inline-flex p-3 rounded-full bg-amber-950/60 border border-amber-800/80 text-amber-400">
            <AlertCircle className="w-6 h-6" />
          </div>
          <h3 className="text-sm font-semibold text-slate-200">
            No High Stakeholder Relevance Signals Detected
          </h3>
          <p className="text-xs text-slate-400 max-w-md mx-auto leading-relaxed">
            The active dataset contains {signals.length} signals, but none are currently classified with <code className="text-amber-300">stakeholder_relevance: &quot;High&quot;</code>. The briefing synthesizes impact convergence exclusively from high-relevance items.
          </p>
        </div>
      ) : (
        /* Briefing Content Container */
        <div className="max-w-4xl mx-auto w-full bg-slate-900/70 border border-slate-800 rounded-xl p-6 sm:p-8 space-y-6 text-xs text-slate-300 font-sans shadow-2xl">
          {/* Metadata Bar */}
          <div className="p-4 bg-slate-950/90 border border-slate-800 rounded-lg font-mono text-[11px] grid grid-cols-2 sm:grid-cols-4 gap-4 text-slate-400">
            <div>
              <span className="text-slate-500 block uppercase">Generated:</span>
              <span className="text-slate-200">{generationTimestamp || 'Active Real-Time'}</span>
            </div>
            <div>
              <span className="text-slate-500 block uppercase">Synthesis Engine:</span>
              <span className={synthesisMode === 'gemini' ? 'text-cyan-400 font-semibold' : 'text-slate-300'}>
                {synthesisMode === 'gemini' ? 'Gemini 3.8 Flash' : 'Rule-Based Engine'}
              </span>
            </div>
            <div>
              <span className="text-slate-500 block uppercase">High-Relevance Focal Set:</span>
              <span className="text-rose-400 font-bold tabular-nums">
                {highRelevanceSignals.length} of {signals.length} ({Math.round((highRelevanceSignals.length / signals.length) * 100)}%)
              </span>
            </div>
            <div>
              <span className="text-slate-500 block uppercase">Domains Converging:</span>
              <span className="text-cyan-300">{domains.join(', ')}</span>
            </div>
          </div>

          {/* AI-Synthesized Narrative Output (When available from Gemini) */}
          {aiBriefingContent && synthesisMode === 'gemini' ? (
            <div className="space-y-4 pt-2">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-cyan-900/60 pb-2">
                <div className="flex items-center gap-2 text-cyan-300 font-mono text-xs font-bold uppercase tracking-wider">
                  <Sparkles className="w-4 h-4 text-cyan-400" />
                  <span>Strategic OSINT Memorandum (Gemini 3.8 Flash)</span>
                </div>

                <div className="flex items-center gap-1 bg-slate-950 p-1 rounded-md border border-slate-800 text-[10px] font-mono">
                  <button
                    onClick={() => setViewFormat('formatted')}
                    className={`flex items-center gap-1 px-2 py-0.5 rounded transition-colors ${
                      viewFormat === 'formatted'
                        ? 'bg-cyan-950 text-cyan-300 border border-cyan-800/80 font-semibold'
                        : 'text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    <Eye className="w-3 h-3" />
                    <span>Formatted</span>
                  </button>
                  <button
                    onClick={() => setViewFormat('raw')}
                    className={`flex items-center gap-1 px-2 py-0.5 rounded transition-colors ${
                      viewFormat === 'raw'
                        ? 'bg-cyan-950 text-cyan-300 border border-cyan-800/80 font-semibold'
                        : 'text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    <Code className="w-3 h-3" />
                    <span>Raw MD</span>
                  </button>
                </div>
              </div>

              {viewFormat === 'formatted' ? (
                <FormattedBriefingReport
                  markdown={aiBriefingContent}
                  onSelectSignal={onSelectSignal}
                />
              ) : (
                <div className="font-mono text-[11px] text-slate-300 leading-relaxed space-y-4 whitespace-pre-wrap bg-slate-950 p-5 rounded-lg border border-slate-800 selection:bg-cyan-950">
                  {aiBriefingContent}
                </div>
              )}
            </div>
          ) : (
            /* Algorithmic Convergence Vectors Fallback */
            <div className="space-y-3">
              <div className="flex items-center justify-between border-b border-slate-800 pb-1.5">
                <h3 className="text-xs font-mono uppercase tracking-wider text-cyan-400 font-semibold flex items-center gap-1.5">
                  <TrendingUp className="w-3.5 h-3.5" />
                  <span>1. Strategic Convergence Analysis (Rule-Based Engine)</span>
                </h3>
                <span className="text-[10px] font-mono text-slate-500">
                  Derived from {highRelevanceSignals.length} high-impact signals
                </span>
              </div>

              <p className="text-slate-300 leading-relaxed text-xs">
                Synthesis of all signals meeting the high stakeholder relevance threshold reveals key structural shifts across commercial launch capacity, sovereign distribution boundaries, and orbital frequency protections. Rather than isolated events, these high-relevance observations demonstrate a synchronized acceleration across technology readiness and sovereign jurisdictional integration.
              </p>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-1">
                {convergenceVectors.map((v, i) => (
                  <div
                    key={i}
                    className="p-3.5 bg-slate-950/80 border border-slate-800/90 rounded-lg space-y-2 flex flex-col justify-between"
                  >
                    <div>
                      <div className="flex items-center justify-between text-[10px] font-mono text-slate-500 pb-1 border-b border-slate-800/60">
                        <span className="text-cyan-400 font-semibold uppercase">{v.category}</span>
                        <span>Vector {i + 1}</span>
                      </div>
                      <div className="font-semibold text-slate-100 text-xs mt-1.5">
                        {v.title}
                      </div>
                      <p className="text-slate-400 text-[11px] mt-1 leading-relaxed">
                        {v.description}
                      </p>
                    </div>
                    <div className="pt-2 border-t border-slate-800/50 flex flex-wrap items-center gap-1 text-[10px] font-mono text-slate-500">
                      <span>Signals:</span>
                      {v.signalsInvolved.map((id) => (
                        <span
                          key={id}
                          onClick={() => onSelectSignal(id)}
                          className="px-1.5 py-0.5 rounded bg-slate-900 text-cyan-300 hover:text-white border border-slate-700/60 cursor-pointer transition-colors"
                        >
                          {id}
                        </span>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Section 2: High-Relevance Primary Signals Registry */}
          <div className="space-y-3 pt-4 border-t border-slate-800/80">
            <div className="flex items-center justify-between border-b border-slate-800 pb-1.5">
              <h3 className="text-xs font-mono uppercase tracking-wider text-cyan-400 font-semibold flex items-center gap-1.5">
                <Crosshair className="w-3.5 h-3.5" />
                <span>Primary High-Relevance Signals Focal Set</span>
              </h3>
              <span className="text-[10px] font-mono text-rose-400 font-semibold">
                Priority Filter: High ({highRelevanceSignals.length})
              </span>
            </div>

            <div className="space-y-2.5">
              {highRelevanceSignals.map((signal) => {
                const p = signal.properties;
                const mod = extractSignalModule(signal);
                const domainColor = DOMAIN_COLORS[p.domain]?.hex || '#06b6d4';

                return (
                  <div
                    key={signal.id}
                    onClick={() => onSelectSignal(signal.id)}
                    className="p-3.5 bg-slate-950/70 hover:bg-slate-900/90 border border-slate-800/80 rounded-lg cursor-pointer transition-all group"
                  >
                    <div className="flex items-center justify-between font-mono text-[11px] text-slate-500 mb-1.5">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-cyan-400 font-bold">{p.id}</span>
                        <span aria-hidden="true" className="text-slate-700">·</span>
                        <span className="px-1.5 py-0.2 rounded bg-cyan-950/60 text-cyan-300 border border-cyan-800/60 uppercase font-semibold text-[10px]">
                          {mod}
                        </span>
                        <span aria-hidden="true" className="text-slate-700">·</span>
                        <span>{p.date}</span>
                        <span aria-hidden="true" className="text-slate-700">·</span>
                        <span style={{ color: domainColor }} className="font-semibold">
                          {p.domain}
                        </span>
                      </div>
                      <span className="px-2 py-0.5 text-[10px] font-mono font-bold rounded bg-rose-950/70 text-rose-300 border border-rose-800/60">
                        High Relevance
                      </span>
                    </div>

                    <div className="font-semibold text-slate-100 group-hover:text-cyan-300 transition-colors text-xs leading-snug">
                      {p.title}
                    </div>

                    {(p.Implication || p.implication) && (
                      <div className="mt-2 p-2 bg-amber-950/20 border border-amber-800/40 rounded text-[11px] text-amber-200/90 font-sans italic">
                        <strong>Implication:</strong> {p.Implication || p.implication}
                      </div>
                    )}

                    <div className="mt-2 text-slate-400 flex flex-wrap items-center justify-between gap-2 text-[11px]">
                      <div className="flex items-center gap-3">
                        <span className="text-slate-300">
                          <strong>Location:</strong> {p.location}
                        </span>
                        <span aria-hidden="true" className="text-slate-700">·</span>
                        <span>
                          <strong>Horizon:</strong> {p.horizon}
                        </span>
                        <span aria-hidden="true" className="text-slate-700">·</span>
                        <span>
                          <strong>Confidence:</strong> {p.confidence}
                        </span>
                      </div>

                      <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
                        <a
                          href={p.source_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-slate-400 hover:text-cyan-300 flex items-center gap-1 font-mono text-[10px] transition-colors"
                        >
                          <span>Source</span>
                          <ExternalLink className="w-3 h-3" />
                        </a>
                        <span className="text-cyan-400 font-mono text-[10px] group-hover:underline flex items-center gap-0.5">
                          <span>Inspect</span>
                          <ArrowRight className="w-3 h-3" />
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
