# Project Technical Stack

## 1) Technical overview

Project: **Keyword Presence & Competitor Gap Analyzer**  
Architecture: **browser-first single-page app** with a lightweight local Node proxy.  
Language: **TypeScript** (frontend), **JavaScript (Node ESM)** for proxy script.  
Build tool: **Vite**.

High-level split:
- Frontend app: analysis UI, extraction/matching pipeline, reporting, SERP popup, rankings history.
- Local proxy server: resilient HTML fetching and SerpApi passthrough endpoint.

## 2) Runtime and tooling

Core commands:
- `npm run dev` -> starts Vite dev server.
- `npm run proxy` -> starts local proxy at `http://localhost:8787`.
- `npm run build` -> production build via Vite.
- `npm run preview` -> preview built assets.

Compiler/build configuration:
- `tsconfig.json`
  - `target: ES2020`
  - `module: ESNext`
  - `moduleResolution: Bundler`
  - `strict: true`
  - `resolveJsonModule: true` (used for city dataset import)
  - `noEmit: true` (Vite handles bundling)
- `vite.config.ts`
  - minimal setup, `server.open = false`

## 3) Dependencies

From `package.json`:
- `vite` -> dev server + bundling.
- `typescript` -> type checking and TS authoring.
- `playwright` -> optional JS-rendering path in local proxy (`render=1`).

No frontend framework (no React/Vue/etc). UI is plain TypeScript + DOM rendering.

## 4) Core architecture

Entry and bootstrap:
- `src/main.ts` -> DOM-ready bootstrap.
- `src/app/app.ts` -> app init wrapper and fatal error guard.

State and UI orchestration:
- `src/app/state.ts` -> central in-memory app state.
- `src/app/ui.ts` -> primary controller for:
  - event binding,
  - form handling,
  - running analysis,
  - rendering all sections,
  - SERP controls,
  - rankings history/archive actions.

Domain pipeline:
- `src/core/fetcher.ts` -> robust fetch strategy (direct/proxy/public fallback).
- `src/core/extractor.ts` -> content extraction and main-content heuristics.
- `src/core/normalizer.ts` -> text normalization.
- `src/core/matcher.ts` -> keyword matching across buckets.
- `src/core/analyzer.ts` -> orchestrates per-page analysis and builds `AnalysisResult`.
- `src/core/reporter.ts` -> competitor gap computation.
- `src/core/exporters.ts` -> HTML export.

Feature modules (checks):
- `src/core/summary.ts`
- `src/core/first100.ts`
- `src/core/content-structure.ts`
- `src/core/faq.ts`
- `src/core/reviews.ts`
- `src/core/schema.ts`
- `src/core/image-alts.ts`
- `src/core/video-embeds.ts`
- `src/core/technical-checks.ts`

Section render modules:
- `src/app/summary-ui.ts`
- `src/app/first100-ui.ts`
- `src/app/content-structure-ui.ts`
- `src/app/faq-ui.ts`
- `src/app/reviews-ui.ts`
- `src/app/schema-ui.ts`
- `src/app/image-alts-ui.ts`
- `src/app/video-embeds-ui.ts`
- `src/app/technical-checks-ui.ts`
- `src/app/rankings-history-ui.ts`
- `src/app/serp-window.ts`
- `src/app/page-cell.ts`

Storage layer:
- `src/storage/keyword-groups.ts`
- `src/storage/proxy-settings.ts`
- `src/storage/rankings-history.ts`

Shared types and helpers:
- `src/types.ts`
- `src/utils/dom.ts`, `src/utils/id.ts`, `src/utils/text.ts`, `src/utils/url.ts`, `src/utils/validation.ts`

## 5) Data model (key types)

Primary type contracts in `src/types.ts`:
- `KeywordGroup`
- `ProxySettings`
- `ExtractedContent`
- `KeywordMatch`
- `PageResult`
- `AnalysisResult`
- `GapKeyword`
- `TechnicalCheckRow` (`pass | fail | warn`)

History types in `src/storage/rankings-history.ts`:
- `RankingHistoryEntry` with `id`, `createdAt`, `keyword`, `response (SerpResponse)`.

## 6) Data flow

### 6.1 On-page analysis flow
1. User submits URLs + keyword group.
2. `runAnalysis()` in `src/core/analyzer.ts` creates targets (`my-site` + competitors).
3. For each target:
   - fetch HTML (`fetcher.ts`)
   - extract content (`extractor.ts`)
   - match keywords (`matcher.ts`)
   - execute feature checks (FAQ/reviews/schema/first100/content structure/image ALT/video/technical checks)
4. UI renders all result tables and gap analysis.

### 6.2 SERP flow
1. Planet icon click on keyword row.
2. UI reads SERP controls (location + device) from My URL panel.
3. `openSerpRankingWindow()` sends request to local `/serp`.
4. Proxy calls SerpApi, aggregates results (scan depth default top 60), returns normalized response.
5. Popup renders target ranks, top 10, People Also Ask, People Also Search For.
6. Snapshot saved to local rankings history.

### 6.3 History/archive flow
1. New SERP check -> pushed to active history.
2. Clicking `Archive` on an entry:
   - removes from active history,
   - inserts into archive list,
   - both persisted in localStorage.

## 7) Persistence (localStorage)

Current persisted domains:
- Keyword groups.
- Proxy settings.
- SERP location/device preferences.
- Active rankings history.
- Rankings archive.

Storage is fully client-side; no database.

## 8) Local proxy/server layer

File: `scripts/proxy-server.mjs`

Endpoints:
- `/proxy?url=...` -> fetches target HTML with browser-like headers.
- `/serp` (POST) -> SerpApi adapter.

Key behavior:
- CORS enabled for local app usage.
- Blocked/empty HTML detection heuristic.
- Optional Playwright rendering path.
- SERP parser normalizes:
  - organic positions,
  - target-domain matching,
  - top organic table,
  - People Also Ask,
  - People Also Search For.

Environment variables:
- `SERPAPI_KEY` (required for `/serp`).
- `PORT` (optional, default `8787`).

## 9) External sources and integrations

External APIs/services:
- **SerpApi** (`https://serpapi.com/search.json`) for SERP ranking data.

External data file:
- `src/data/uk-major-cities-50k.json`
  - UK city list (>=50k population),
  - used for SERP location typeahead.

External network targets during analysis:
- User-provided page URLs and competitor URLs.
- Optional public proxy fallbacks in auto mode.

## 10) Core files quick index

Most critical implementation files:
- App orchestration: `src/app/ui.ts`
- Analysis pipeline: `src/core/analyzer.ts`
- Fetch resilience: `src/core/fetcher.ts`
- Extraction heuristics: `src/core/extractor.ts`
- Matching engine: `src/core/matcher.ts`
- Local proxy + SERP backend bridge: `scripts/proxy-server.mjs`
- SERP popup renderer/request client: `src/app/serp-window.ts`
- Type contracts: `src/types.ts`

## 11) Build/deploy characteristics

- Static frontend build output in `dist/`.
- No dedicated backend service required for core analysis logic.
- Local proxy is optional for basic sites and required for many blocked/JS-heavy pages and SERP checks.

## 12) Current technical limitations

- No backend persistence (history is local browser storage only).
- No authentication or multi-user model.
- No test framework configured yet (manual validation and build checks).
- HTML export currently covers keyword result tables; advanced tables/history are UI-side.
