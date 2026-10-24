import React from 'react';
import {
  TrendingUp,
  Layers,
  Shield,
  Compass,
  FileText,
  AlertCircle,
  ExternalLink,
  ChevronRight,
  Sparkles,
} from 'lucide-react';

interface FormattedBriefingReportProps {
  markdown: string;
  onSelectSignal?: (signalId: string) => void;
}

export const FormattedBriefingReport: React.FC<FormattedBriefingReportProps> = ({
  markdown,
  onSelectSignal,
}) => {
  // Helper to parse inline markdown (bold, code/signal IDs, links)
  const renderInlineFormatted = (text: string): React.ReactNode => {
    // Regex matches:
    // 1. Markdown links: [label](url)
    // 2. Bold text: **content**
    // 3. Inline code: `content`
    // 4. Raw Signal IDs: (e.g. leo:2026-09-28:S01)
    const tokenRegex =
      /(\[[^\]]+\]\([^)]+\)|\*\*[^*]+\*\*|`[^`]+`|\b(?:leo|starlink|kuiper):\d{4}-\d{2}-\d{2}:[A-Za-z0-9_-]+\b)/g;

    const parts = text.split(tokenRegex);

    return parts.map((part, index) => {
      if (!part) return null;

      // Match [label](url)
      const linkMatch = part.match(/^\[([^\]]+)\]\(([^)]+)\)$/);
      if (linkMatch) {
        return (
          <a
            key={index}
            href={linkMatch[2]}
            target="_blank"
            rel="noopener noreferrer"
            className="text-cyan-400 hover:text-cyan-300 underline inline-flex items-center gap-0.5 font-mono text-[11px] transition-colors"
          >
            <span>{linkMatch[1]}</span>
            <ExternalLink className="w-2.5 h-2.5 inline" />
          </a>
        );
      }

      // Match **bold**
      if (part.startsWith('**') && part.endsWith('**') && part.length >= 4) {
        const inner = part.slice(2, -2);
        return (
          <strong key={index} className="text-slate-100 font-semibold">
            {renderInlineFormatted(inner)}
          </strong>
        );
      }

      // Match `code`
      if (part.startsWith('`') && part.endsWith('`') && part.length >= 2) {
        const codeContent = part.slice(1, -1);
        const isSignalId =
          codeContent.includes(':') &&
          (codeContent.startsWith('leo:') || codeContent.startsWith('signal:'));

        if (isSignalId && onSelectSignal) {
          return (
            <button
              key={index}
              type="button"
              onClick={() => onSelectSignal(codeContent)}
              className="inline-flex items-center gap-1 mx-0.5 px-1.5 py-0.5 rounded bg-cyan-950/80 hover:bg-cyan-900 border border-cyan-800/80 text-cyan-300 hover:text-white font-mono text-[11px] font-semibold cursor-pointer transition-colors shadow-sm"
              title={`Inspect signal ${codeContent}`}
            >
              <span>{codeContent}</span>
              <ChevronRight className="w-2.5 h-2.5" />
            </button>
          );
        }

        return (
          <code
            key={index}
            className="px-1.5 py-0.5 rounded bg-slate-900 border border-slate-700/80 text-cyan-300 font-mono text-[11px]"
          >
            {codeContent}
          </code>
        );
      }

      // Match raw signal ID without backticks
      if (part.match(/^(?:leo|starlink|kuiper):\d{4}-\d{2}-\d{2}:[A-Za-z0-9_-]+$/)) {
        if (onSelectSignal) {
          return (
            <button
              key={index}
              type="button"
              onClick={() => onSelectSignal(part)}
              className="inline-flex items-center gap-1 mx-0.5 px-1.5 py-0.5 rounded bg-cyan-950/80 hover:bg-cyan-900 border border-cyan-800/80 text-cyan-300 hover:text-white font-mono text-[11px] font-semibold cursor-pointer transition-colors"
              title={`Inspect signal ${part}`}
            >
              <span>{part}</span>
              <ChevronRight className="w-2.5 h-2.5" />
            </button>
          );
        }
        return (
          <span key={index} className="font-mono text-cyan-300 font-semibold">
            {part}
          </span>
        );
      }

      return <span key={index}>{part}</span>;
    });
  };

  // Split markdown into structured sections
  const parseSections = (raw: string) => {
    const lines = raw.split(/\r?\n/);
    const sections: { title: string; level: number; content: string[] }[] = [];
    let currentSection = { title: '', level: 0, content: [] as string[] };

    lines.forEach((line) => {
      const headingMatch = line.match(/^(#{1,4})\s+(.+)$/);
      if (headingMatch) {
        if (currentSection.title || currentSection.content.length > 0) {
          sections.push(currentSection);
        }
        currentSection = {
          title: headingMatch[2].replace(/\*\*/g, '').trim(),
          level: headingMatch[1].length,
          content: [],
        };
      } else {
        currentSection.content.push(line);
      }
    });

    if (currentSection.title || currentSection.content.length > 0) {
      sections.push(currentSection);
    }

    return sections;
  };

  const sections = parseSections(markdown);

  // Helper to determine an icon and color theme for each section header
  const getSectionTheme = (title: string, index: number) => {
    const lower = title.toLowerCase();
    if (lower.includes('executive') || lower.includes('operational') || lower.includes('summary')) {
      return {
        icon: TrendingUp,
        label: 'STRATEGIC OVERVIEW',
        badgeColor: 'text-cyan-400 bg-cyan-950/60 border-cyan-800/80',
        borderColor: 'border-cyan-800/40',
        headerColor: 'text-cyan-300',
      };
    }
    if (lower.includes('convergence') || lower.includes('vector') || lower.includes('nexus')) {
      return {
        icon: Layers,
        label: 'CROSS-DOMAIN CONVERGENCE',
        badgeColor: 'text-violet-400 bg-violet-950/60 border-violet-800/80',
        borderColor: 'border-violet-800/40',
        headerColor: 'text-violet-300',
      };
    }
    if (lower.includes('impact') || lower.includes('sector') || lower.includes('implication')) {
      return {
        icon: Shield,
        label: 'SECTOR CONSEQUENCE MATRIX',
        badgeColor: 'text-emerald-400 bg-emerald-950/60 border-emerald-800/80',
        borderColor: 'border-emerald-800/40',
        headerColor: 'text-emerald-300',
      };
    }
    if (lower.includes('foresight') || lower.includes('directive') || lower.includes('decision') || lower.includes('action')) {
      return {
        icon: Compass,
        label: 'DIRECTIVES & FORESIGHT',
        badgeColor: 'text-amber-400 bg-amber-950/60 border-amber-800/80',
        borderColor: 'border-amber-800/40',
        headerColor: 'text-amber-300',
      };
    }

    return {
      icon: FileText,
      label: `SECTION ${index + 1}`,
      badgeColor: 'text-slate-400 bg-slate-900 border-slate-700',
      borderColor: 'border-slate-800',
      headerColor: 'text-slate-200',
    };
  };

  // Render a block of lines inside a section
  const renderSectionBody = (lines: string[]) => {
    const elements: React.ReactNode[] = [];
    let currentList: string[] = [];

    const flushList = (key: number) => {
      if (currentList.length > 0) {
        elements.push(
          <div key={`list-${key}`} className="space-y-2 my-2">
            {currentList.map((item, idx) => {
              // Check if item has a bold lead title like **Title:** description
              const leadMatch = item.match(/^\*\*([^*]+)\*\*[:\s]*(.*)$/);
              if (leadMatch) {
                return (
                  <div
                    key={idx}
                    className="p-3 bg-slate-950/80 border border-slate-800/90 rounded-lg hover:border-slate-700/80 transition-all text-xs"
                  >
                    <div className="font-semibold text-slate-100 flex items-center gap-1.5 mb-1">
                      <div className="w-1.5 h-1.5 rounded-full bg-cyan-400 shrink-0" />
                      <span>{renderInlineFormatted(leadMatch[1])}</span>
                    </div>
                    {leadMatch[2] && (
                      <p className="text-slate-300 leading-relaxed text-[11px] pl-3">
                        {renderInlineFormatted(leadMatch[2])}
                      </p>
                    )}
                  </div>
                );
              }

              return (
                <div
                  key={idx}
                  className="flex items-start gap-2.5 text-xs text-slate-300 leading-relaxed p-2 rounded bg-slate-950/40 border border-slate-800/40"
                >
                  <div className="w-1.5 h-1.5 rounded-full bg-cyan-400/80 mt-1.5 shrink-0" />
                  <div className="flex-1">{renderInlineFormatted(item)}</div>
                </div>
              );
            })}
          </div>
        );
        currentList = [];
      }
    };

    lines.forEach((line, idx) => {
      const trimmed = line.trim();

      // Empty line
      if (!trimmed) {
        flushList(idx);
        return;
      }

      // List item (- or * or 1. )
      const listMatch = trimmed.match(/^[-*•]\s+(.+)$/) || trimmed.match(/^\d+\.\s+(.+)$/);
      if (listMatch) {
        currentList.push(listMatch[1]);
        return;
      }

      // If regular paragraph
      flushList(idx);

      // Check if line is a subheader like "### Title"
      const subHeaderMatch = trimmed.match(/^#{1,4}\s+(.+)$/);
      if (subHeaderMatch) {
        elements.push(
          <h4
            key={`sub-${idx}`}
            className="text-xs font-mono font-semibold text-cyan-300 uppercase tracking-wider pt-2 pb-1 border-b border-slate-800/60 mt-3"
          >
            {renderInlineFormatted(subHeaderMatch[1])}
          </h4>
        );
        return;
      }

      // Blockquote or note
      if (trimmed.startsWith('>')) {
        elements.push(
          <div
            key={`quote-${idx}`}
            className="border-l-2 border-cyan-500 bg-cyan-950/30 pl-3 py-1.5 my-2 text-xs italic text-cyan-200/90 rounded-r"
          >
            {renderInlineFormatted(trimmed.replace(/^>\s*/, ''))}
          </div>
        );
        return;
      }

      // Normal paragraph
      elements.push(
        <p key={`p-${idx}`} className="text-xs text-slate-300 leading-relaxed font-sans my-2">
          {renderInlineFormatted(trimmed)}
        </p>
      );
    });

    flushList(lines.length);

    return elements;
  };

  return (
    <div className="space-y-6">
      {sections.map((sec, secIdx) => {
        const theme = getSectionTheme(sec.title, secIdx);
        const IconComponent = theme.icon;

        // Skip document-level title if it just duplicates the header
        const isDocTitle =
          sec.level === 1 &&
          (sec.title.toLowerCase().includes('strategic osint') ||
            sec.title.toLowerCase().includes('intelligence briefing'));

        if (isDocTitle && sec.content.length === 0) {
          return null;
        }

        return (
          <div
            key={secIdx}
            className={`p-5 bg-slate-950/80 border ${theme.borderColor} rounded-xl shadow-lg space-y-3 transition-colors`}
          >
            {sec.title && (
              <div className="flex items-center justify-between pb-2 border-b border-slate-800/80">
                <div className="flex items-center gap-2">
                  <div className="p-1.5 rounded-md bg-slate-900 border border-slate-800 text-cyan-400">
                    <IconComponent className="w-4 h-4" />
                  </div>
                  <div>
                    <span className="block text-[10px] font-mono tracking-wider font-semibold text-slate-500 uppercase">
                      {theme.label}
                    </span>
                    <h3 className={`text-sm font-bold tracking-tight ${theme.headerColor}`}>
                      {sec.title}
                    </h3>
                  </div>
                </div>

                <div className="hidden sm:flex items-center gap-1 text-[10px] font-mono text-slate-500">
                  <Sparkles className="w-3 h-3 text-cyan-400" />
                  <span>Synthesized</span>
                </div>
              </div>
            )}

            <div className="space-y-2">{renderSectionBody(sec.content)}</div>
          </div>
        );
      })}
    </div>
  );
};
