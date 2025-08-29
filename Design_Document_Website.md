# Crypto DCA Bot — Website (File-Based) Design Document

## 0. Overview

A lightweight web UI that renders the simulated DCA portfolio from files written by the bot, without requiring a database. It consumes JSON/NDJSON files produced by the bot and presents:
- Current dashboard (totals, per-asset positions)
- Time-series charts (invested, market value, P/L) from snapshot lines
- Optional drilldowns (prices, transactions) if enabled

Two deployment modes are supported:
- Static-only (P0): Pure SPA that fetches files (positions_current.json, snapshots.ndjson). Ideal when the website sits on the same host/origin as the files.
- API-backed (P1): Tiny read-only API that streams/aggregates NDJSON for heavier queries (transactions/prices) and enables cross-origin setups.

Getting started in a new repo (bootstrap)
- Locate the bot-produced files: it's in `public/data/` (you can ):
  - Required: `positions_current.json`, `snapshots.ndjson`
  - Optional (drilldowns): `prices.ndjson`, `transactions.ndjson`, `iterations.ndjson`
- Serve the SPA and the `public/data/` directory from the same origin so the browser can fetch files without CORS.
- Configure the SPA’s data base path via an env/JSON config (defaults to `/data`).

## 1. Goals / Non-Goals

### Goals
- Read only, no writes; zero dependence on DB for P0
- Fast dashboard load (<500ms network round-trip + render on typical LAN)
- Chart-ready time series from snapshots.ndjson without recomputation
- Robust parsing against partial writes and missing fields
- Production-grade build and hosting on `ukewea.github.io/dca-bot-dashboard_r2_gemini_again` 

### Non-Goals (P0)
- Authentication and roles (can be added later behind reverse-proxy)
- Real trading, alerting; data mutations
- Server-side rendering (SSR) — SPA is sufficient

## 2. Data Sources & Contracts

Files are produced by the bot under `storage.data_dir` (default `./data`). The website relies on these contracts:

- positions_current.json
  - `{ updated_at, base_currency, total_quote_invested, positions: [{symbol, open_qty, total_cost, avg_cost}] }`
  - Overwritten atomically after each iteration

- snapshots.ndjson (preferred for charts)
  - One JSON object per line with: `{ ts, base_currency, total_quote_invested, total_market_value, total_unrealized_pl, positions: [{symbol, open_qty, total_cost, price, market_value, unrealized_pl, avg_cost}] }`
  - Appended when snapshot gating triggers

- prices.ndjson (optional for drilldowns)
  - `{ ts, symbol, price, source, iteration_id }` appended per symbol per iteration

- transactions.ndjson (optional for drilldowns)
  - Append-only ledger of executed buys (one line per successful mock buy)

- iterations.ndjson (optional ops page)
  - `{ iteration_id, started_at, ended_at, assets_total, buys_executed, status, notes }`

Versioning: A `v` field may be added in future lines/objects. The website must ignore unknown fields and tolerate missing optional fields.

## 3. Architecture

### 3.1 Static-only (P0)
- Frontend: SPA built with TypeScript + React + Vite (or SvelteKit in SPA mode)
- Hosting: Any static server (NGINX, GitHub Pages if files are bundled, or same host as the bot mounting `/data` read-only)
- File Access: Fetch from same origin/relative paths:
  - `/data/positions_current.json`
  - `/data/snapshots.ndjson`
  - (Optional) `/data/prices.ndjson`, `/data/transactions.ndjson`
- Parsing: 
  - JSON: straight fetch + JSON.parse
  - NDJSON: fetch text, split by newlines, JSON.parse per line; ignore empty/invalid last line

Configuration
- Build-time (Vite): `VITE_DATA_BASE_PATH` to override `/data` (e.g., `/static/data`)
- Runtime (no rebuild): optional `/app-config.json` injected into `window.__APP_CONFIG__` with `{ dataBasePath: "/data" }`

## 4. UI/UX

### Pages
- Dashboard
  - KPIs: total invested, market value, P/L, base currency
  - Positions table: symbol, open qty, avg cost, total cost, last price, market value, P/L
  - Last updated timestamp
- Charts
  - Portfolio: invested vs market value vs P/L over time (from snapshots)
  - Per-symbol charts toggle/filter
- (Optional) Drilldowns
  - Transactions list (per asset or all)
  - Price history table (per asset)
- (Optional) Ops
  - Iterations timeline (start/end, status, buys)

### Interactions
- Time range selector: 24h / 7d / 30d / all
- Symbol filter (multi-select)
- Light/Dark theme; responsive layout

## 5. Data Model & Computations

- Positions (current): Use positions_current.json directly
- Charts: Prefer snapshots.ndjson lines synthesized by the bot
  - MarketValue(t) and P/L(t) already provided → no recomputation
- Fallback paths (if snapshots absent):
  - Invested(t): cumulative sum of quote_spent up to t from transactions.ndjson
  - MarketValue(t): sum(price(t) × qty_held(t)) from prices + cumulative transactions
  - This path requires more CPU/memory and is not P0 priority

## 6. Performance
- Lazy load charts; fetch snapshots on chart view open
- Parse NDJSON in streaming manner when supported; otherwise chunked split
- Downsample client-side for very dense series (e.g., keep ~1k points); use bucket-by-time
- Cache parsed data in memory; simple ETag-based revalidation if behind a server

## 7. Resilience & Edge Cases
- Atomic writes: positions_current.json written via temp+rename → safe to read
- NDJSON parsing: tolerate an empty or malformed last line
- Missing files: show friendly empty states; retry/backoff
- Timezones: use UTC internally; display in local TZ toggle
- Versioning: ignore unknown fields, handle missing optional properties

## 8. Security
- Read-only website; no secrets in client
- CORS: for API-backed mode only; restrict to known origins
- Optional HTTP basic auth via reverse-proxy if needed

## 9. Accessibility & i18n
- Semantic HTML, keyboard navigation, focus states
- High contrast theme; chart colors accessible
- Simple i18n scaffolding (en-US default), numeric formatting by locale

## 10. Build & Deployment
- Frontend: Vite build creates static assets
- Container: Simple NGINX-based image to serve static files; optional reverse-proxy to `/data` mount or `/api`
- Config via env or JSON config file injected at build or served runtime (e.g., `window.__APP_CONFIG__`)

Repo structure (new website)
```
website/
  src/                 # SPA (React+TS)
    components/
    pages/
    lib/               # file readers (JSON/NDJSON), selectors
    types/
  public/
    data/              # copy of bot files for local dev (positions_current.json, snapshots.ndjson, ...)
    app-config.json    # optional runtime config { dataBasePath: "/data" }
  package.json
  vite.config.ts
  .github/workflows/ci.yml
```

## 11. Testing Strategy
- Unit: parsers for NDJSON/JSON; selectors for data transforms; chart utilities
- Component tests: tables, charts, filters with jest + testing-library
- E2E: Cypress/Playwright using fixture data directories
- Performance: parse large NDJSON fixture within defined time bounds

Fixture data (examples)
- positions_current.json
```
{ "updated_at":"2025-08-26T13:32:47Z", "base_currency":"USDC", "total_quote_invested":"500", "positions":[{"symbol":"BTCUSDT","open_qty":"0.0082","total_cost":"400","avg_cost":"48780.49"}] }
```
- snapshots.ndjson (two lines)
```
{"ts":"2025-08-26T13:32:47Z","base_currency":"USDC","total_quote_invested":"500","total_market_value":"512.34","total_unrealized_pl":"12.34","positions":[{"symbol":"BTCUSDT","open_qty":"0.0082","total_cost":"400","avg_cost":"48780.49","price":"59231.12","market_value":"485.69","unrealized_pl":"85.69"}]}
{"ts":"2025-08-26T19:32:47Z","base_currency":"USDC","total_quote_invested":"550","total_market_value":"560.00","total_unrealized_pl":"10.00","positions":[{"symbol":"BTCUSDT","open_qty":"0.009","total_cost":"450","avg_cost":"50000.00","price":"60000.00","market_value":"540.00","unrealized_pl":"90.00"}]}
```

## 14. Tech Choices (P0)
- Frontend: TypeScript + React + Vite; Tailwind CSS; Recharts or ECharts for charts
- Lint/Format: ESLint + Prettier
- Tests: Vitest/Jest + testing-library + Cypress
- Container: NGINX static server
