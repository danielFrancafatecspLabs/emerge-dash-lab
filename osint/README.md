# Aegis Signals: Strategic OSINT Intelligence Dashboard

A geospatial open-source intelligence (OSINT) monitoring and analysis platform. Aegis Signals tracks, filters, visualizes, and synthesizes strategic developments across low Earth orbit (LEO) satellite constellations, heavy-lift launch cadence, spectrum regulatory filings, and sovereign telecommunications access.

The platform operates as a **hybrid, dual-mode system**:
- **Offline / Air-Gapped Mode**: 100% deterministic client-side algorithmic synthesis with zero external API calls, zero cloud costs, and complete privacy.
- **AI-Enhanced Mode**: Server-side Google Gemini integration (`gemini-3.8-flash` with resilient fallbacks and quota cooldown circuit breaker) generating executive intelligence memoranda and deep-dive tactical signal dossiers.

---

## Key Features

- **Interactive Tactical Geospatial Map**: Leaflet-powered global map with custom domain-coded SVG markers, coverage footprint rings, coordinate tracking, and dark/satellite/positron basemaps.
- **Multi-Domain Intelligence Tracking**: Categorizes signals across Technological, Economic, Political, Regulatory, Military, Infrastructure, Social, and Environmental vectors.
- **Executive Intelligence Briefing Generator**: Synthesizes high-stakeholder-relevance signals into executive memoranda covering Macro Trends, Cross-Domain Convergence Vectors, Strategic Sector Impacts, and 30–90 day Foresight Directives (with Markdown export).
- **Tactical Signal Dossier**: Detailed inspection panel for selected signals with on-demand AI strategic assessments (situational summary, strategic implications, adversary dynamics, monitoring indicators).
- **2D Strategic Impact Matrix**: Evaluates signal distributions across strategic horizons (*Now*, *12 months*, *2–3 years*, *Long-term*) and domains.
- **Tabular Signal Registry**: Filterable, searchable, and sortable registry table with CSV export.
- **Flexible Data Synchronization**:
  - Auto-loads bundled baseline dataset or custom mounted `./data/signals.geojson`.
  - In-app Data Ingest Modal (paste GeoJSON, drag-and-drop, server upload).
  - Live Feed & Directory Sync Toolbar (URL polling, File System Access API bindings).
  - Unmapped Signal Review modal for entries awaiting geolocation coordinates.

---

## Technology Stack

- **Backend**: Node.js (v20+), Express 4.21, `tsx`
- **Frontend**: React 19, React DOM 19, TypeScript 7
- **Build & Bundler**: Vite 8, Tailwind CSS v4 (`@tailwindcss/vite`)
- **Mapping & Visuals**: Leaflet 1.9, Three.js, Three-Globe
- **AI Integration**: `@google/genai` (Google Gen AI SDK v2.4.0)
- **Containerization**: Docker, Docker Compose, Nginx (Alpine)

---

## Configuration

Configuration is managed via environment variables.

1. Copy the sample environment file:
   ```bash
   cp .env.example .env
   # Or for local Vite/Node development:
   cp .env.example .env.local
   ```

2. Available environment variables:
   | Variable | Description | Default | Required? |
   | :--- | :--- | :--- | :--- |
   | `GEMINI_API_KEY` | Google Gemini API key for AI briefings and dossiers | *None* | Optional (runs in offline mode if omitted) |
   | `PORT` | Web server listening port | `3000` | Optional |
   | `NODE_ENV` | Runtime environment (`development` or `production`) | `production` | Optional |
   | `APP_URL` | Base URL of the hosted application | `http://localhost:3000` | Optional |

> **Note**: An API key is **not required** to use the application. If `GEMINI_API_KEY` is not set, all AI features automatically switch to built-in deterministic rule-based OSINT algorithms. Obtain a key at [Google AI Studio](https://aistudio.google.com/app/apikey).

---

## Quickstart & Running Locally

### Option 1: Running with Node.js / Bun

#### Prerequisites
- Node.js 20+ (or Bun)
- npm (or Bun)

#### 1. Install Dependencies
```bash
npm install
```

#### 2. Start in Development Mode
Starts the Express server with Vite middleware and hot module reloading:
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) in your browser.

#### 3. Build & Run in Production Mode
```bash
# Build the client bundle to dist/
npm run build

# Start the production server
npm start
```

---

### Option 2: Running with Docker Compose (Recommended)

Docker Compose builds the application container and mounts your local `./data` folder so you can supply or update signals dynamically without restarting.

```bash
# 1. (Optional) Provide your environment file
cp .env.example .env

# 2. Build and launch container in detached mode
docker compose up --build -d

# 3. View logs
docker compose logs -f

# 4. Stop the container
docker compose down
```
Access the application at [http://localhost:3000](http://localhost:3000).

---

### Option 3: Running with Standalone Docker CLI

```bash
# Build Docker image
docker build -t aegis-signals .

# Run with optional Gemini key and mounted data volume
docker run -d \
  --name aegis-signals \
  -p 3000:3000 \
  -e GEMINI_API_KEY="your-gemini-api-key" \
  -v "$(pwd)/data:/app/data" \
  aegis-signals
```

---

## Loading Custom Signal Datasets

The dashboard accepts GeoJSON `FeatureCollection` datasets matching the Aegis Signal schema.

### Method A: Host Directory Mount (Recommended for Docker)
1. Create a `data` folder at the root of the project:
   ```bash
   mkdir -p data
   ```
2. Copy your GeoJSON file to `./data/signals.geojson`:
   ```bash
   cp /path/to/my-signals.geojson data/signals.geojson
   ```
3. The server automatically serves this file at `/data/signals.geojson` with no-cache headers.

### Method B: In-App Ingestion Modal
1. Click **Data Ingest** in the top navigation bar.
2. Paste raw GeoJSON text, drop a `.geojson` file, or click **Upload to Server Feed** to persist it to the active server directory.

### Method C: Live Feed Toolbar
Use the top toolbar to configure automatic polling intervals (e.g., 30s, 60s) or use the **Select File** button to bind directly to a local file using the browser's File System Access API.

---

## Using Local / Self-Hosted LLMs (Model Agnosticism)

The platform is designed to be model-agnostic. To use local or self-hosted models (such as Ollama, vLLM, or LocalAI) instead of Gemini:

1. Open [`server.ts`](./server.ts).
2. In `callGeminiWithResilience()`, replace or augment the call with a standard fetch to your local endpoint:
   ```typescript
   const res = await fetch('http://localhost:11434/v1/chat/completions', {
     method: 'POST',
     headers: { 'Content-Type': 'application/json' },
     body: JSON.stringify({
       model: 'llama3.3:70b', // or qwen2.5:32b, mistral-small:24b
       messages: [{ role: 'user', content: prompt }]
     })
   });
   const data = await res.json();
   return { text: data.choices[0].message.content, model: 'llama3.3:70b' };
   ```

---

## Available Scripts

- `npm run dev`: Runs the full-stack Express + Vite development server.
- `npm run build`: Bundles the React frontend into `dist/`.
- `npm start`: Runs the production Express server using `tsx`.
- `npm run lint`: Performs static type checking via `tsc --noEmit`.
- `npm run clean`: Cleans build artifacts (`dist`).

---

## Additional Documentation

- [`AGENTS.md`](./AGENTS.md): Complete architecture guide, GeoJSON schema, and developer guidelines for AI agents and contributors.
- [`MEMORY.md`](./MEMORY.md): Persistent repository memory, technical facts, and system invariants.
- [`documentation/`](./documentation/): Architectural guides and configuration blueprints.
