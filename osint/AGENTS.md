# AGENT.md — Developer & AI Agent Guide

## 1. Project Overview & Identity

**Aegis Signals: Strategic OSINT Intelligence Dashboard** is a geospatial open-source intelligence (OSINT) monitoring and analysis platform. It tracks, filters, visualizes, and synthesizes strategic developments across:
- **Low Earth Orbit (LEO) & Mega-Constellations** (e.g., Starlink, Amazon Leo/Kuiper)
- **Space Infrastructure & Orbital Launch Cadence** (e.g., Starship, heavy-lift economics)
- **Spectrum Regulatory Filings & Authorizations** (e.g., FCC STAs, ITU filings, landing rights)
- **Sovereign Telecommunications & Market Access** (e.g., national telco distribution, ground stations)

The application operates as a **hybrid, dual-mode system**:
1. **Deterministic / Air-Gapped Mode (Offline)**: 100% client-side algorithmic synthesis, zero external API calls, zero cloud costs, air-gapped safe.
2. **AI-Enhanced Mode (Live)**: Server-side Google Gemini integration (`gemini-3.8-flash` with resilient fallbacks, quota cooldown, and response caching) producing executive intelligence memoranda and deep-dive tactical dossiers.

---

## 2. Technology Stack

| Layer | Technologies |
| :--- | :--- |
| **Backend Runtime** | Node.js (v20+), Express 4.21, `tsx` (TypeScript execute) |
| **Frontend Framework** | React 19.0, React DOM 19.0, TypeScript 7.0 |
| **Build & Tooling** | Vite 8.3 (`@vitejs/plugin-react`), Tailwind CSS v4 (`@tailwindcss/vite`) |
| **AI / LLM SDK** | `@google/genai` (v2.4.0) via server-side Express routes |
| **Geospatial & Mapping** | Leaflet 1.9.4 (`@types/leaflet`), Three.js (`three`), `three-globe` |
| **Icons & UI Utilities** | Lucide React (`lucide-react`), Motion (`motion`) |
| **Containerization** | Docker, Docker Compose, Nginx (Alpine) |

---

## 3. Repository Structure & Key Files

```
.
├── server.ts                               # Full-stack Express server + Vite dev middleware + AI endpoints
├── package.json                            # Scripts, dependencies (React 19, Vite 8, Express, Google GenAI)
├── bun.lock                                # Bun lockfile
├── tsconfig.json                           # TypeScript configuration
├── vite.config.ts                          # Vite config with React & Tailwind plugins
├── index.html                              # HTML entry point (Leaflet CSS imported here)
├── metadata.json                           # AI Studio metadata & capabilities
├── docker-compose.yml                      # Container orchestrator with ./data volume mount
├── Dockerfile.txt                          # Multi-stage container recipe (Node 20 Alpine)
├── nginx.conf                              # Nginx configuration for static builds with /data proxy
├── .env.example                            # Template for GEMINI_API_KEY, PORT, NODE_ENV
├── README.md                               # AI Studio quickstart
│
├── documentation/                          # Architectural documentation PDFs
│   ├── Signal_Dashboard_NO_LLM_Version_Config.pdf
│   ├── Signal_Dashboard_WITH_LLM_Version_Config.pdf
│   └── Signal_Dashboard_updated_runtime_instructions.pdf
│
├── public/
│   └── data/
│       └── signals.geojson                 # Bundled baseline GeoJSON dataset
│
└── src/
    ├── main.tsx                            # React DOM root entry
    ├── App.tsx                             # Top-level state (dataset, filters, active tab, selected signal)
    ├── index.css                           # Tailwind CSS v4 theme and custom styles
    │
    ├── types/
    │   ├── signal.ts                       # Signal schema, GeoJSON types, domain color mappings, filter state
    │   └── graph.ts                        # Knowledge Graph schema, node type configs, filtering, fallback
    │
    ├── data/
    │   └── defaultSignals.ts               # In-memory default FeatureCollection fallback
    │
    ├── utils/
    │   ├── feedSyncService.ts              # URL fetch, fingerprinting, File System Access API bindings
    │   └── tacticalGlobeTexture.ts         # Procedural 2048x1024 canvas texture generator for Earth globe
    │
    └── components/
        ├── Header.tsx                      # Top app banner, dataset stats badge, ingest/review triggers
        ├── FeedSyncToolbar.tsx             # Polling config, auto-refresh intervals, file picker sync
        ├── MetricsBar.tsx                  # KPI ribbon (total, high-relevance, geocoded, domain breakdowns)
        ├── FilterToolbar.tsx               # Multi-facet filter controls (search, domain, horizon, geoStatus)
        ├── TacticalMap.tsx                 # Leaflet interactive map with custom domain markers & footprints
        ├── KnowledgeGraphView.tsx          # 2D Canvas force-directed knowledge graph network visualization
        ├── SignalList.tsx                  # Feed sidebar of signal cards with relevance badges
        ├── SignalDossier.tsx               # Slide-over dossier drawer for selected signal (+ AI assessment)
        ├── BriefingGenerator.tsx           # Multi-signal executive briefing engine (+ AI / algorithmic fallback)
        ├── FormattedBriefingReport.tsx     # Structured rendering for briefing memorandum with export options
        ├── ImpactMatrix.tsx                # Strategic domain vs horizon 2D impact grid
        ├── SignalRegistryTable.tsx         # Sortable, filterable tabular registry with CSV export
        ├── DataIngestModal.tsx             # Modal to paste, drag-and-drop, or server-upload custom GeoJSON
        ├── AwaitingGeolocationModal.tsx    # Modal inspector for unmapped signals (geometry: null)
        └── MapErrorBoundary.tsx            # Component error boundary for Leaflet/WebGL rendering resilience
```

---

## 4. Signal Data Schema (GeoJSON)

Every intelligence observation is modeled as a GeoJSON `Feature` conforming to `SignalFeature`:

```typescript
export interface SignalProperties {
  id: string;                    // e.g. "module-name:YYYY-MM-DD:S01"
  title: string;                 // Descriptive event headline
  date: string;                  // ISO Date (YYYY-MM-DD)
  module: string;                // Human-readable module name (e.g. "LEO / satellite internet / space connectivity")
  module_slug?: string;          // Topic slug (e.g., "leo", "haps-uav-connectivity")
  subtheme: string;              // Specific sub-category (e.g., "Launch Manifest", "Ground/wholesale")
  domain: string;                // Technological | Economic | Political | Social | Regulatory | Military | Infrastructure | Environmental
  location_type: string;         // e.g., "Launch Site", "Market", "Regulator Headquarters"
  location: string;              // String representation (e.g., "Boca Chica, Texas, USA")
  confidence: 'High' | 'Medium' | 'Low' | string;
  stakeholder_relevance: 'High' | 'Medium' | 'Low' | string;
  horizon: 'Now' | '12 months' | '2-3 years' | 'Long-term' | string;
  source_url: string;            // Validated source URL
  status: 'signal' | 'validated' | 'escalated' | 'archived' | string;
  Details?: string;              // Operational reality & event details
  Implication?: string;          // Strategic, market, or sovereign security implication
  geom_kind: 'locality' | 'country-centroid' | 'none' | string;
  coord_source?: string;
  iso3: string;                  // ISO 3166-1 alpha-3 country code
  truth_coordinates?: [number, number] | null;   // [lon, lat] ground truth (matches geometry.coordinates)
  display_coordinates?: [number, number] | null; // [lon, lat] plotted marker position
  jitter?: boolean;              // true if marker was offset to prevent stacking (offset is not a location)
  notes?: string;
  tags?: string[];
}

export interface SignalGeometry {
  type: 'Point';
  coordinates: [number, number]; // [Longitude, Latitude] (Note: GeoJSON is [lon, lat])
}
```

### Plot Position & Coordinates Convention
1. **Plot Position Algorithm**:
   - If `properties.display_coordinates` exists and is a valid `[lon, lat]` pair, plot that (preferred over other).
   - Else if `geometry` is a Point, plot `geometry.coordinates`.
   - Else skip the marker (`geom_kind: "none"`: Worldwide or no resolved country).
2. **Truth vs. Display**:
   - `geometry.coordinates` and `properties.truth_coordinates` are the same truth point. Never plot both.
   - `display_coordinates` may differ when `properties.jitter: true` (marker offset so it does not stack). The offset is not a location.
3. **Marker Meaning (`geom_kind`)**:
   - `locality`: City or site from the offline gazetteer.
   - `country-centroid`: Country centre, because the locality was missing or not in the gazetteer.
   - `none`: No marker.
4. **Signal Dossier Location Labels**:
   - Uses `location`, `location_type`, and `geom_kind`.
   - If `jitter: true`, labels the place from `properties.location` and states that the marker is offset from the country or city centre.

### Module Convention
The `module` property provides a clean, human-readable topic name (e.g. `"HAPS / drones / UAV connectivity"`, `"LEO / satellite internet / space connectivity"`, `"Robotics"`). Function `extractSignalModule()` uses `properties.module` directly, falling back to parsing the ID prefix `<module-slug>:<date>:<identifier>` if omitted.

---

## 5. Dual-Mode Intelligence & Backend API

`server.ts` provides server-side endpoints with Gemini integration and deterministic fallback:

### 1. Intelligence Briefing (`POST /api/ai/briefing`)
- **Input**: `{ signals: SignalFeature[] }` (Frontend scopes this to signals where `stakeholder_relevance === 'High'`).
- **Prompt**: Directs Gemini to produce a four-part executive memorandum in pure Markdown:
  1. *Operational Executive Synthesis* (2-3 paragraphs macro analysis)
  2. *Multi-Domain Convergence Vectors* (Cross-cutting domain intersections with correlated signal IDs)
  3. *Strategic Sector Impacts* (Sovereign Telcos, Orbital Launch Cadence, Spectrum Governance)
  4. *Foresight & Decision Directives* (30-90 day monitoring indicators)
- **Response**: `{ source: 'gemini', model: string, content: string }` or `{ source: 'fallback', reason: string }`.
- **Resilience**: Caches by composite ID-date hash; attempts `gemini-3.8-flash` then `gemini-3.1-flash-lite`; activates a 60-second cooldown on 429/quota exhaustion.

### 2. Tactical Signal Dossier (`POST /api/ai/dossier`)
- **Input**: `{ signal: SignalFeature }`
- **Output**: Structured JSON object with four keys:
  - `situation_summary`: 2-3 concise operational reality sentences
  - `strategic_implications`: Market dominance, regulatory precedent, sovereign security assessment
  - `adversary_dynamics`: Competitor, state incumbent, or geopolitical rival reactions
  - `monitoring_indicators`: Array of 3 specific regulatory filings/events to track next
- **Response**: `{ source: 'gemini', model: string, assessment: { ... } }` or fallback.
- **Resilience**: Caches by signal ID; returns deterministic analysis on quota/offline state.

### 3. Dataset Management Endpoints
- `GET /api/health`: Reports server status, API key presence, active data folder path, and signals availability.
- `POST /api/feed/upload`: Validates FeatureCollection payload, writes to disk at `data/signals.geojson`, and clears AI caches.
- `GET /data/signals.geojson`: Serves active or bundled GeoJSON with `no-store, no-cache` headers.

---

## 6. Model Agnosticism & Local LLM Integration

The application is completely model-agnostic. To substitute Gemini with a self-hosted LLM (Ollama, vLLM, LocalAI) or OpenAI/Anthropic:
1. In `server.ts`, modify `callGeminiWithResilience()` or replace it with a standard OpenAI-compatible `fetch()` to `http://localhost:11434/v1/chat/completions`.
2. Recommended models:
   - **Briefing synthesis**: `llama3.3:70b`, `qwen2.5:32b`, `mistral-small:24b`, or `claude-3-5-sonnet`.
   - **Dossier extraction**: `mistral-nemo:12b`, `llama3.1:8b`, or `gpt-4o-mini`.

---

## 7. Running & Developing the Application

### Prerequisites
- Node.js 20+ (or Bun)
- Optional: Google Gemini API Key

### Local Development Setup
```bash
# 1. Install dependencies
npm install

# 2. Configure environment (optional for AI features)
cp .env.example .env.local
# Set GEMINI_API_KEY="your-key-here"

# 3. Start development server (Express + Vite on port 3000)
npm run dev

# 4. Open in browser
# http://localhost:3000
```

### Production Build & Execution
```bash
npm run build
npm start
```

### Docker Execution
> **Note**: The repo includes `Dockerfile.txt`. If building via Docker Compose, ensure `Dockerfile` exists:
```bash
# Ensure Dockerfile exists
cp Dockerfile.txt Dockerfile

# Launch via Docker Compose
docker compose up --build -d
```
Mount custom data anytime by placing `signals.geojson` into `./data/`.

---

## 8. Agent Development Rules & Conventions

When modifying this repository, observe the following constraints:

1. **Maintain Zero-API Fallbacks**:
   - Never remove or break the deterministic rule-based synthesis in `BriefingGenerator.tsx` or `SignalDossier.tsx`.
   - The dashboard must remain fully functional in completely air-gapped environments without an internet connection or API key.

2. **Respect GeoJSON Coordinate Ordering**:
   - In GeoJSON standard: `coordinates: [longitude, latitude]`.
   - Leaflet standard: `L.latLng(latitude, longitude)`.
   - Always verify coordinate index order when passing points between GeoJSON features and Leaflet markers.

3. **Leaflet DOM Cleanup**:
   - When mounting `TacticalMap`, always delete `(container as any)._leaflet_id` before re-initializing to avoid the React StrictMode "Map container is already initialized" runtime error.

4. **React 19 & State Caching**:
   - Dossier and briefing responses are cached both server-side (in `server.ts`) and client-side (session `Map` instances in components).
   - Invalidate or refresh caches appropriately when mutating signals or uploading new datasets.

5. **Type Safety**:
   - Run `npm run lint` (`tsc --noEmit`) to verify TypeScript type compliance before finalizing changes.
   - All domain styles must pass through `getDomainColor()` from `src/types/signal.ts` to guarantee deterministic fallback styling for unexpected custom domains.

6. **AI_ENABLED Configuration**:
   - Master toggle configured via `AI_ENABLED` in `.env` / `.env.example` / `docker-compose.yml`.
   - When absent, empty, or false (`AI_ENABLED=false`), the application strictly does **not** render any UI components that rely on external LLM calls (the `OSINT Briefing` navigation button / tab and the `Strategic OSINT Assessment` card in `SignalDossier`).
   - Server endpoints `/api/ai/briefing` and `/api/ai/dossier` return 403 when `AI_ENABLED` is false.

