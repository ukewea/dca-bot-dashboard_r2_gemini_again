# TODO - DCA Bot Dashboard

This file tracks the tasks for building the DCA Bot Dashboard website.

## Phase 1: Project Setup & Scaffolding

- [ ] Initialize project with Vite (React + TypeScript).
- [ ] Install dependencies:
    - [ ] `tailwindcss` for styling.
    - [ ] `recharts` for charts.
    - [ ] `react-router-dom` for navigation.
- [ ] Configure Tailwind CSS for the project.
- [ ] Create the application directory structure (`src/components`, `src/pages`, `src/lib`, `src/types`).

## Phase 2: Core Implementation

- [ ] Define TypeScript types for all data models (`positions_current`, `snapshots`, `transactions`).
- [ ] Implement data fetching and parsing utilities in `src/lib` for all `.json` and `.ndjson` files.
- [ ] Set up application routing using `react-router-dom`.
- [ ] Create the main application layout with a persistent navigation header/sidebar.
- [ ] Implement the light/dark theme toggle.

## Phase 3: Page & Feature Implementation

- [ ] **Dashboard Page:**
    - [ ] Display KPIs (Total Invested, Market Value, P/L).
    - [ ] Display the current positions table.
- [ ] **Charts Page:**
    - [ ] Display the main portfolio chart (Invested vs. Market Value).
    - [ ] Implement the time-range filter (24h, 7d, 30d, All).
    - [ ] Implement the symbol filter.
- [ ] **Transactions Page:**
    - [ ] Display a table of all transactions from `transactions.ndjson`.
    - [ ] Implement filtering controls (e.g., by asset).

## Phase 4: Finalization & Deployment

- [ ] Ensure the entire application is responsive and mobile-friendly.
- [ ] Run the production build (`npm run build`) to guarantee the code compiles without errors.
- [ ] Create a `.github/workflows/deployment.yml` file for deploying the static site to GitHub Pages (build job only).
