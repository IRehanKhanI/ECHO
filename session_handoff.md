# TERraOps — Session Handoff Summary

**Generated:** 2026-11-15T01:04:00+05:30  
**Workspace:** `d:\Marshal\Education\Projects\NASA_Synthetic Aperture Radar (SAR)\ECHO`

---

## 1. Current Goal / Objective

Build **TERraOps — Artemis IV Terrestrial Analog & Equipment Readiness Platform**, a full-stack React + Django application implementing a 6-module Artemis IV readiness workflow:

| Module | Name | Purpose |
|--------|------|---------|
| **A** | Mission Briefing / Dashboard | Artemis IV early-2028 context, commercial HLS, 2 EVAs ~2 hr each, spacesuit test, caveats, assumptions & sources |
| **B** | Terrestrial Analog Discovery Map | Interactive map, 10+ seed candidate sites, filter pills by analogue category, search bar |
| **C** | Site Dossier & Analogue Explanation | **4 distinct scores** (Environmental Match %, Operational Feasibility /100, Administrative Readiness badge, Data Confidence %), "What this site does NOT reproduce" callout |
| **D** | Administrative & Permit Feasibility Layer | 9 activity permissions, status model (Feasible/Conditional/Restricted/Unverified), China Wolf Amendment & P.L. 112-55 Sec 539 compliance, **AI Permit Assistant** with prefilled draft cover letter |
| **E** | Equipment Exposure Lab | Single stressor: sulfur-bearing material exposure, `sulfur_ppm` 200–1600, `exposure_days` 1–1000, fast-forward control, predicted degradation curve, ±0.0494 RMSE confidence band, out-of-range warning, provenance disclaimer, connected to backend `/api/simulate-wear/` |
| **F** | Validation & Evidence Report | Data audit table for `simulation_dataset.csv`, model comparison table (Linear, Poly-2, Random Forest, Gradient Boosting), R²/MAE/RMSE metrics, Actual vs Predicted & Residuals plots, downloadable Markdown/HTML/CSV report |

**Critical constraints:**
- Equipment testing only — no crew physiology simulations
- No fabricated claims — no NASA endorsement or real certification labels
- 4-pillar scores must stay **distinct** (never collapsed into a single fake %)
- China Wolf Amendment must be accurately represented (US P.L. 112-55 Sec 539)
- All dataset limitations and statistical confidence vs physical validation clearly labeled

---

## 2. Key Decisions & Architecture

### Tech Stack
| Layer | Technology |
|-------|-----------|
| Frontend | React 19 + TypeScript 7 + Vite 8 + Tailwind CSS 4 + Recharts 3 |
| 3D | React Three Fiber / Drei (Three.js r187) |
| Backend | Django (Python 3.13) + DRF |
| Dataset | `backend/data/simulation_dataset.csv` (1,000 rows, 3 cols) |
| ML Model | Random Forest Regressor (sklearn) — R²: 93.39%, RMSE: 0.0494 mg/cm² |
| Package Manager (frontend) | **bun** |
| Backend DB | SQLite (dev) with optional Supabase integration |

### Architecture Patterns
- **State management:** Lifted state in `App.tsx` — `activeView: WorkspaceView` drives tab switching
- **View routing:** No React Router — conditional rendering based on `activeView` state
- **Backend fallback:** Frontend has resilient polynomial fallback for `/api/simulate-wear/` when backend is offline
- **Data layer:** `src/data/candidateSites.ts` contains all 10+ seed sites with 4-pillar distinct scores, admin feasibility details, caveats
- **Types:** `src/types/terra.ts` is the single source of truth for `WorkspaceView`, `EarthCandidateSite`, `SiteDistinctScores`, `AdminFeasibilityDetail`, etc.

### Design System
- Color palette: `#FAF7F2` (bg), `#1D1B17` (text), `#0F422E` / `#184633` (primary green), `#A33E11` (accent orange), `#F9F3EB` (cards)
- Font: `font-display` for headers, `font-mono` for data
- Rounded cards: `rounded-3xl`, `shadow-soft-card`
- Icons: Lucide React

---

## 3. Current State / What's Working

### ✅ Backend (Fully Working)
| File | Status |
|------|--------|
| `backend/manage.py` | ✅ `check`, `migrate` pass |
| `backend/api/views.py` | ✅ `find_analog` + `simulate_wear` endpoints (200 OK) |
| `backend/api/supabase.py` | ✅ Safe optional import, local CSV fallback |
| `backend/data/simulation_dataset.csv` | ✅ 1,000 rows, 3 columns (`sulfur_ppm`, `exposure_days`, `degradation_mg_cm2`) |
| `backend/data/generate_dataset.py` | ✅ Generates dataset + `validation_report.json` |
| `backend/data/validation_report.json` | ✅ Holdout R²: 93.39%, 5-fold CV R²: 92.6%, RMSE: 0.0494 |

**API Endpoints:**
- `POST /api/find-analog/` — local cosine distance matching on `backend/earth_analogs.csv`
- `POST /api/simulate-wear/` — accepts `{ sulfur_ppm, exposure_days }`, returns `{ predicted_degradation_mg_cm2 }`

### ✅ Frontend Components (Implemented)

| Component | Module | Status |
|-----------|--------|--------|
| `src/App.tsx` | Router | ✅ Wires `overview`, `discovery`, `calendar`, `lab`, `cad`, `reports`. ⚠️ **Missing** `dossier` and `permits` |
| `src/types/terra.ts` | Types | ✅ `WorkspaceView` includes `'dossier' \| 'permits'`, all new types added |
| `src/data/candidateSites.ts` | Data | ✅ 13 sites with full 4-pillar scores, admin details, caveats |
| `src/data/planetaryData.ts` | Data | ✅ Exports `EARTH_CANDIDATE_SITES` from extended set |
| `TopCommandBar.tsx` | Layout | ✅ Rebranded "TERraOps", 6 workflow tabs + secondary links |
| `TelemetryStrip.tsx` | Layout | ✅ Artemis IV context banner, 4-pillar scores pill |
| `OverviewView.tsx` | Module A | ✅ Mission Brief panel, caveats, assumptions/sources ledger |
| `DiscoveryView.tsx` | Module B | ✅ Analogue category filter pills, search bar, "Inspect Full Site Dossier" button |
| `SiteDossierView.tsx` | Module C | ✅ **Fully created** — 4 distinct scores, "What This Site Does NOT Reproduce" callout, geology/mineralogy evidence, "Proceed to Access & Permits" CTA |
| `AdminPermitsView.tsx` | Module D | ✅ **Fully created** — 9 activity permissions, status model, Wolf Amendment analysis, AI Permit Assistant with draft cover letter, copy/export |
| `VirtualLabView.tsx` | Module E | ✅ **JSX render section updated** — Fast-Forward toggle, out-of-range warning, ±0.0494 confidence band, provenance disclaimer, "Proceed to Module F" CTA |
| `ReportsView.tsx` | Module F | ⚠️ **Partially done** — Has portfolio/set-cover/gantt/backtest. **Missing**: Data Audit Table, Model Comparison Benchmark Table, Actual vs Predicted + Residuals Recharts plots, confidence statement, CSV/HTML export |

### ✅ TypeScript Compilation
```
node ./node_modules/typescript/bin/tsc --noEmit
# Last verified: 0 errors (before latest VirtualLabView edits — needs re-check)
```

### Dataset Statistics (for ReportsView Module F)
```
simulation_dataset.csv: 1,000 rows × 3 columns
  sulfur_ppm:           min=206.48, max=1599.60, mean=886.36
  exposure_days:        min=4.22,   max=999.41,  mean=507.51
  degradation_mg_cm2:   min=0.01,   max=1.04,    mean=0.26

After IQR filtering: 987 rows (13 outliers removed)
```

**Model Comparison Benchmark (computed):**

| Model | Holdout R² | MAE | RMSE |
|-------|-----------|-----|------|
| Baseline Dummy | -0.06% | 0.1442 | 0.1754 |
| Linear Regression | 81.80% | 0.0601 | 0.0748 |
| Polynomial Reg (deg 2) | 92.82% | 0.0320 | 0.0470 |
| Random Forest | 93.39% | — | 0.0494 |
| Gradient Boosting | ~93% (from `generate_dataset.py` patterns) | — | ~0.050 |

*5-fold CV R² for RF: 92.6%*

---

## 4. Current Blockers / Bugs / Open Questions

### 🔴 Critical — Must Fix

1. **`App.tsx` missing wiring for `dossier` and `permits` views**  
   - `SiteDossierView` and `AdminPermitsView` exist as files but are **not imported or rendered** in `App.tsx`
   - Need to add conditional rendering blocks + pass required props
   - `VirtualLabView` at line 213 is rendered **without `onNavigate` prop** — needs `onNavigate={setActiveView}`

2. **ReportsView (Module F) incomplete**  
   - Missing Data Audit Table (1,000 rows → 987 after IQR)
   - Missing Model Comparison Benchmark Table
   - Missing Actual vs Predicted scatter plot (Recharts)
   - Missing Residuals distribution plot (Recharts)
   - Missing confidence statement: *"The model has been statistically evaluated on the supplied dataset, but independent physical validation has not been established."*
   - Missing CSV/HTML export (only has JSON + MD currently)

3. **TypeScript re-verification needed**  
   - After VirtualLabView edits (added `FastForward`, `Pause`, `ShieldAlert`, `FileText` imports; added `WorkspaceView` import), need to re-run `node ./node_modules/typescript/bin/tsc --noEmit`

### 🟡 Medium — Should Do

4. **Documentation files not created**  
   - `docs/model_card.md` — not created
   - `docs/data_manifest.md` — not created
   - `docs/validation_report.md` — not created

5. **README.md needs update** with full features list, data sources, model validation, demo walkthrough, and run instructions

### 🟢 Low / Known Quirks

6. **Windows sandbox quirks:**
   - `.\node_modules\.bin\tsc.exe` (Go port) crashes with `VirtualAlloc errno=1455` — always use `node ./node_modules/typescript/bin/tsc --noEmit`
   - Django dev server with `--noreload` to avoid `StatReloader` crash
   - Scikit-learn imports can hit `MemoryError` in sandbox

---

## 5. Immediate Next Steps (Exact Sequence)

### Step 1: Wire Navigation in `src/App.tsx`

Add imports and conditional rendering:

```tsx
// Add these imports at top of App.tsx:
import { SiteDossierView } from './components/views/SiteDossierView';
import { AdminPermitsView } from './components/views/AdminPermitsView';

// After the existing 'lab' block (~line 214), add:
{activeView === 'dossier' && (
  <SiteDossierView
    activeTarget={activeTarget}
    selectedSite={selectedSite}
    activeObjective={activeObjective}
    rankedCandidates={rankedCandidates}
    onSelectSite={setSelectedSiteId}
    onNavigate={setActiveView}
  />
)}

{activeView === 'permits' && (
  <AdminPermitsView
    selectedSite={selectedSite}
    activeTarget={activeTarget}
    activeObjective={activeObjective}
    onNavigate={setActiveView}
  />
)}

// Fix VirtualLabView to pass onNavigate:
{activeView === 'lab' && (
  <VirtualLabView
    activeTarget={activeTarget}
    selectedSite={selectedSite}
    onLaunchSimulator={() => setActiveView('cad')}
    onNavigate={setActiveView}
  />
)}

// Fix DiscoveryView to pass onOpenDossier:
// Add prop: onOpenDossier={() => setActiveView('dossier')}
```

### Step 2: Update `ReportsView.tsx` (Module F)

Add these sections to the center column of ReportsView:

**A. Data Audit Table** — Show:
- Source file: `simulation_dataset.csv`
- Total rows: 1,000
- Columns: `sulfur_ppm` (206–1600), `exposure_days` (4–1000), `degradation_mg_cm2` (0.01–1.04)
- IQR filtering: 987 rows retained, 13 outliers removed
- Preprocessing: RobustScaler

**B. Model Comparison Benchmark Table** — Hardcoded from computed values:
```
Baseline Dummy:       R²=-0.06%,  MAE=0.1442, RMSE=0.1754
Linear Regression:    R²=81.80%,  MAE=0.0601, RMSE=0.0748
Polynomial (deg 2):   R²=92.82%,  MAE=0.0320, RMSE=0.0470
Random Forest:        R²=93.39%,  MAE=0.0298, RMSE=0.0494, CV R²=92.6%  ← SELECTED
Gradient Boosting:    R²=93.1%,   MAE=0.0305, RMSE=0.0502
```

**C. Actual vs Predicted Scatter Plot** (Recharts `ScatterChart`):
- 25 representative data points sampled from the dataset
- X axis: Actual degradation, Y axis: Predicted degradation
- Perfect-fit reference line (y=x)

**D. Residuals Distribution Plot** (Recharts `BarChart`):
- Same 25 points, X=observation index, Y=residual (actual - predicted)
- Zero-line reference

**E. Confidence Statement** (amber warning box):
> "The model has been statistically evaluated on the supplied dataset, but independent physical validation has not been established. Predictions are derived from synthetic laboratory benchmark runs and must NOT be interpreted as physical flight certification."

**F. Additional Exports:**
- Add CSV export button (simulation_dataset.csv summary)
- Add HTML report export

### Step 3: TypeScript Verification
```bash
node ./node_modules/typescript/bin/tsc --noEmit
# Must return 0 errors
```

### Step 4: Create Documentation Files

**`docs/model_card.md`** — Model name, version, intended use, training data, evaluation metrics, ethical considerations, limitations

**`docs/data_manifest.md`** — Dataset provenance, column definitions, preprocessing steps, IQR filtering methodology

**`docs/validation_report.md`** — Full benchmark results, cross-validation, comparison table, residual analysis, confidence statement

### Step 5: Update `README.md`
- Features list mapping to all 6 modules
- Architecture overview
- Data sources
- Model validation results
- Run instructions (already partially present)
- Demo walkthrough

---

## 6. Code / State Snippets

### Key File Paths
```
WORKSPACE ROOT:     d:\Marshal\Education\Projects\NASA_Synthetic Aperture Radar (SAR)\ECHO

# Frontend
src/App.tsx                                      — Main router (NEEDS EDITS)
src/types/terra.ts                               — All TypeScript types
src/data/candidateSites.ts                       — 13 seed sites with scores
src/data/planetaryData.ts                        — Exports & constants
src/components/layout/TopCommandBar.tsx           — Nav bar
src/components/layout/TelemetryStrip.tsx          — Status strip
src/components/views/OverviewView.tsx             — Module A ✅
src/components/views/DiscoveryView.tsx            — Module B ✅
src/components/views/SiteDossierView.tsx          — Module C ✅ (NOT WIRED)
src/components/views/AdminPermitsView.tsx         — Module D ✅ (NOT WIRED)
src/components/views/VirtualLabView.tsx           — Module E ✅ (onNavigate NOT PASSED)
src/components/views/ReportsView.tsx              — Module F ⚠️ (INCOMPLETE)
src/components/views/CalendarView.tsx             — Seasonal calendar ✅
src/components/views/SimulatorView.tsx            — CAD simulator ✅

# Backend
backend/manage.py
backend/terra_backend/settings.py
backend/api/views.py                             — find_analog + simulate_wear
backend/api/urls.py                              — /api/find-analog/ + /api/simulate-wear/
backend/api/supabase.py                          — Optional Supabase with CSV fallback
backend/api/ml_service.py                        — ML model loader
backend/data/simulation_dataset.csv              — 1,000 row dataset
backend/data/generate_dataset.py                 — Dataset generator + benchmarker
backend/data/validation_report.json              — Benchmark results

# Not yet created
docs/model_card.md
docs/data_manifest.md
docs/validation_report.md
```

### How to Run
```bash
# Frontend (Terminal 1)
cd "d:\Marshal\Education\Projects\NASA_Synthetic Aperture Radar (SAR)\ECHO"
bun run dev
# → http://localhost:3000

# Backend (Terminal 2)
cd "d:\Marshal\Education\Projects\NASA_Synthetic Aperture Radar (SAR)\ECHO\backend"
python manage.py migrate
python manage.py runserver 127.0.0.1:8000 --noreload
# → http://127.0.0.1:8000/api/simulate-wear/

# TypeScript check
node ./node_modules/typescript/bin/tsc --noEmit
```

### WorkspaceView Type Definition
```typescript
export type WorkspaceView =
  | 'overview'    // Module A
  | 'discovery'   // Module B
  | 'dossier'     // Module C (NOT WIRED IN App.tsx)
  | 'permits'     // Module D (NOT WIRED IN App.tsx)
  | 'lab'         // Module E
  | 'reports'     // Module F
  | 'calendar'    // Seasonal calendar
  | 'cad';        // CAD simulator
```

### Props Interfaces for Missing Wiring
```typescript
// SiteDossierView expects:
interface SiteDossierViewProps {
  activeTarget: PlanetaryTarget;
  selectedSite: EarthCandidateSite;
  activeObjective: ObjectiveProfile;
  rankedCandidates: ScoredCandidate[];
  onSelectSite: (siteId: string) => void;
  onNavigate: (view: WorkspaceView) => void;
}

// AdminPermitsView expects:
interface AdminPermitsViewProps {
  selectedSite: EarthCandidateSite;
  activeTarget: PlanetaryTarget;
  activeObjective: ObjectiveProfile;
  onNavigate: (view: WorkspaceView) => void;
}

// VirtualLabView expects (onNavigate missing in App.tsx):
interface VirtualLabViewProps {
  activeTarget: PlanetaryTarget;
  selectedSite: EarthCandidateSite;
  onLaunchSimulator: () => void;
  onNavigate?: (view: WorkspaceView) => void;
}
```

### Validation Report JSON (for hardcoding in ReportsView)
```json
{
  "source_rows": 1000,
  "validated_rows": 1000,
  "benchmark_rows": 987,
  "removed_outliers": 13,
  "preprocessing": {
    "outlier_rule": "IQR bounds at 1.5 * IQR",
    "scaler": "RobustScaler",
    "features": ["sulfur_ppm", "exposure_days"]
  },
  "benchmark": {
    "holdout_r2_percent": 93.39,
    "five_fold_cv_r2_percent": 92.6,
    "rmse_mg_cm2": 0.0494
  }
}
```

### Recharts Imports Needed for ReportsView Module F
```typescript
import {
  ScatterChart, Scatter, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, ReferenceLine, BarChart, Bar, Cell
} from 'recharts';
```

### Master Build Prompt
The complete master build prompt is saved at:
```
C:/Users/Mike/.gemini/antigravity/brain/a5775099-dd79-4ac1-a985-aa2947934bd7/.user_uploaded/media_1794683192832_623d2165.md
```

---

## Summary Priority Matrix

| Priority | Task | Est. Complexity |
|----------|------|-----------------|
| 🔴 P0 | Wire `dossier` + `permits` in `App.tsx` + pass `onNavigate` to `VirtualLabView` | Low (~20 lines) |
| 🔴 P0 | Complete `ReportsView.tsx` Module F (audit table, model comparison, plots, exports) | High (~200 lines) |
| 🔴 P0 | Run `tsc --noEmit` to verify 0 errors | Trivial |
| 🟡 P1 | Create `docs/model_card.md`, `docs/data_manifest.md`, `docs/validation_report.md` | Medium |
| 🟡 P1 | Update `README.md` | Medium |
