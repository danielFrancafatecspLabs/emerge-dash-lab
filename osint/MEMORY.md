# Project Memory: Aegis Signals (OSINT Intelligence Dashboard)

## Project Overview
- **Name**: Aegis Signals: Strategic OSINT Intelligence Dashboard
- **Directory**: `/home/anton/pocs/signal-osint`
- **Purpose**: Strategic OSINT intelligence dashboard for monitoring and plotting geospatial signals, regulatory developments, market expansions, and satellite infrastructure (LEO telecommunications, orbital launches, spectrum governance, sovereign market access).
- **Core Value Proposition**: Dual-mode operational capability: runs 100% offline/air-gapped without API keys using deterministic TypeScript synthesis, or runs with live LLM synthesis via Google Gemini (`gemini-3.8-flash`).

---

## Technical Stack & Runtime Facts
- **Backend**: Node.js v20+, Express 4.21, `tsx` server runner (`server.ts`).
- **Frontend**: React 19.0.1, React DOM 19.0.1, TypeScript 7.0.2.
- **Styling**: Tailwind CSS v4 (`@tailwindcss/vite`, `tailwindcss: ^4.3.3`), Lucide React icons (`lucide-react`).
- **Build Tool**: Vite 8.3.0.
- **Mapping & Visuals**: Leaflet 1.9.4 (`leaflet`, `@types/leaflet`), Three.js (`three`), Three-Globe (`three-globe`).
- **AI SDK**: `@google/genai` (v2.4.0) with server-side proxying in `server.ts`.
- **Deployment**: Docker (`Dockerfile` created from `Dockerfile.txt`), `docker-compose.yml`, `nginx.conf`.
- **Package Manager**: Bun lockfile present (`bun.lock`) alongside `package.json`.

---

## Key Endpoints & Architecture
1. **`GET /api/health`**: Reports AI readiness (`hasApiKey`, `aiActive`), active data directory, and signals availability.
2. **`POST /api/feed/upload`**: Ingests new GeoJSON, saves to disk (`data/signals.geojson`), invalidates AI caches.
3. **`POST /api/ai/briefing`**: Contact Point 1 — generates 4-section executive memorandum for High stakeholder relevance signals.
   - Caches responses by composite signal ID-date hash.
   - Circuit breaker: activates 60-second cooldown on 429/quota exhaustion.
   - Resilient model order: `gemini-3.8-flash` -> `gemini-3.1-flash-lite` -> fallback to deterministic engine.
4. **`POST /api/ai/dossier`**: Contact Point 2 — deep-dive tactical assessment on a single signal (structured JSON output).
   - In-memory cache by `signal.id`.
5. **Static `/data/signals.geojson`**: Serves either `./data/signals.geojson` (custom mount) or `./public/data/signals.geojson` (bundled baseline) with `no-store, no-cache` headers.

---

## UI Views & Navigation
- **Tactical Map (`TacticalMap.tsx`)**: Leaflet-based interactive global map with custom SVG domain markers, coverage footprint circles, dark/satellite/positron basemaps.
- **Knowledge Graph (`KnowledgeGraphView.tsx`)**: *(Disabled for now)* Interactive 2D Canvas force-directed network graph visualizing relationships between signals, modules, domains, subthemes, orgs, places, location types, and watches (based on `/data/graph.json`).
- **Registry Table (`SignalRegistryTable.tsx`)**: Spreadsheet-like registry with sorting, filtering, and export.
- **Impact Matrix (`ImpactMatrix.tsx`)**: Strategic 2D grid distributing signals by domain and strategic horizon.
- **Executive Briefing (`BriefingGenerator.tsx` & `FormattedBriefingReport.tsx`)**: AI or rule-based intelligence briefing synthesis with copy and markdown download.
- **Signal Dossier Drawer (`SignalDossier.tsx`)**: Slide-over panel for selected signal with on-demand AI strategic OSINT assessment.
- **Modals**:
  - `DataIngestModal.tsx`: Custom GeoJSON ingest via paste, file drop, or server sync.
  - `AwaitingGeolocationModal.tsx`: Unmapped signal inspector for entries with missing coordinates.

---

## Critical Invariants & Rules
1. **Zero-API Offline Capability**: Must never require an active internet connection or API key to be fully usable. The deterministic rule-based algorithms in `BriefingGenerator.tsx` and `SignalDossier.tsx` are critical baseline features.
2. **GeoJSON vs Leaflet Coordinates**: GeoJSON coordinates are `[longitude, latitude]`; Leaflet expects `[latitude, longitude]`. Always verify coordinate order.
3. **Leaflet Container Cleanup**: Delete `(containerRef.current as any)._leaflet_id` before re-initializing map instances in React effects to prevent `Map container is already initialized` runtime errors.
4. **Domain Styling**: Always use `getDomainColor(domain)` from `src/types/signal.ts` for styling badges/markers to handle unexpected or custom domain tags cleanly.
5. **Docker Setup**: `docker-compose.yml` expects `Dockerfile`. `Dockerfile` has been created from `Dockerfile.txt`.
6. **Docker NPM Resolution**: `package.json` specifies `"esbuild": "^0.28.0"` to align with `vite@8.3.x`'s peer dependency requirement, and `Dockerfile` runs `npm install --legacy-peer-deps` to avoid strict ERESOLVE failures during container image builds.
7. **Signal Schema v2**: Signals feature human-readable `module` names (e.g. `"LEO / satellite internet / space connectivity"`), `module_slug`, and dedicated `Details` (operational event reality) and `Implication` (strategic takeaway) properties, prominently integrated into `SignalDossier`, `server.ts` AI prompts, and full-text search.
8. **AI_ENABLED Master Toggle**: When `AI_ENABLED` is absent or `false` in `.env` / `.env.example`, any component depending on external LLM calls (`OSINT Briefing` tab in Header/App and `Strategic OSINT Assessment` card in `SignalDossier`) is strictly omitted from rendering. Server routes `/api/ai/briefing` and `/api/ai/dossier` return 403.
9. **Plot Position & Jitter Coordinates Convention**:
   - `getSignalPlotCoordinates()` plots `properties.display_coordinates` first, falling back to `geometry.coordinates`, and skipping `geom_kind: "none"`.
   - `properties.truth_coordinates` and `geometry.coordinates` are the same truth point. Never plot both.
   - `properties.jitter: true` means marker position was offset so it does not stack; the offset is not a location.
   - Marker meaning from `geom_kind`: `locality` (city or site from offline gazetteer), `country-centroid` (country centre, locality missing from gazetteer), `none` (no marker).
   - Signal Dossier uses `location`, `location_type`, and `geom_kind`. When `jitter: true`, places are labeled from `properties.location` and state that the marker is offset from the country or city centre.

