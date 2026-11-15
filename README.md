# TERraOps — Artemis IV Terrestrial Analog & Equipment Readiness Platform

> **Mission-aligned decision-support and equipment-testing platform for NASA's Artemis IV lunar South Pole surface campaign. Evaluates terrestrial analog fidelity, audits administrative and legal permit feasibility, and models single-stressor material degradation using reproducible machine learning.**

---

## 🚀 Key Highlights & Scientific Principles

1. **Artemis IV Surface Context (Early 2028):**
   - Targets the lunar South Pole with commercial Human Landing System (HLS) surface descent.
   - Public surface operational profile: Two approximately two-hour Moonwalks (EVAs) focused on sample collection, hardware mobility, and spacesuit capability testing.
   - **Non-Negotiable Caveat:** Earth cannot reproduce lunar vacuum, 1/6th gravity, the lunar radiation environment, or electrostatic dust levitation. Terrestrial sites serve strictly to test selected mechanical, terrain, and geochemical hardware interactions.
   - **Artemis III Distinction:** Historical candidate landing regions (e.g. Malapert Massif, Mons Mouton, Haworth) are recognized as campaign reference areas, **not confirmed Artemis IV landing coordinates**.

2. **Auditable 4-Pillar Site Evaluation:**
   Rather than collapsing site suitability into a single fabricated percentage, TERraOps displays **four distinct assessments**:
   - **Environmental Match (%):** Multi-dimensional physics comparison (temperature, slope, roughness, aridity, radar CPR).
   - **Operational Feasibility (0–100):** Logistical access, airstrip proximity, heavy gantry crane offloading, power grid availability, and seasonal access windows.
   - **Administrative Readiness Badge:** Categorized strictly as *Feasible pathway identified*, *Conditional*, *Restricted / legal review required*, or *Unverified*.
   - **Data Confidence (%):** Derived from spatial resolution, direct in-situ measurement vs satellite proxy, and data recency.

3. **Administrative & Legal Feasibility Layer (China Wolf Amendment Compliance):**
   - Distinguishes basic land access from 9 distinct activity permissions (sampling, rovers, excavation, drones, RF transmissions, export controls, etc.).
   - Implements US Public Law 112-55 Sec. 539 & NASA PRC FAQ compliance: differentiates public open-access data review from restricted NASA-funded bilateral cooperation or field operations.
   - Built-in **AI Permit Assistant** generating downloadable application checklists and prefilled cover letter drafts.

4. **Equipment Exposure Lab (Single Stressor: Sulfur Exposure):**
   - Regression model trained on 1,000 empirical laboratory cycles across `sulfur_ppm` (206–1600 ppm) and `exposure_days` (4–1000 days).
   - Fast-forward timeline scrubber with interactive play/pause auto-advance.
   - Held-out $R^2 = 93.39\%$, 5-fold CV $R^2 = 92.60\%$, and empirical error band of $\pm 0.0494\text{ }mg/cm^2$ (RMSE).
   - High-visibility provenance disclaimer: *"The model has been statistically evaluated on the supplied dataset, but independent physical validation has not been established."*

---

## 🛠️ Architecture & Tech Stack

```text
ECHO / TERraOps
├── backend/
│   ├── api/
│   │   ├── views.py                  # /api/find-analog/ & /api/simulate-wear/
│   │   ├── ml_service.py             # Random Forest wear model loader
│   │   ├── supabase.py               # Vector similarity matching with local CSV fallback
│   │   └── urls.py
│   ├── data/
│   │   ├── simulation_dataset.csv    # 1,000-row empirical benchmark dataset
│   │   ├── generate_dataset.py       # Reproducible training & benchmark script
│   │   └── validation_report.json    # Holdout and 5-fold CV metrics
│   ├── manage.py
│   └── requirements.txt
├── src/
│   ├── components/
│   │   ├── layout/                   # TopCommandBar, TelemetryStrip
│   │   └── views/
│   │       ├── OverviewView.tsx      # Module A: Mission Briefing Dashboard
│   │       ├── DiscoveryView.tsx     # Module B: Terrestrial Analog Discovery Map
│   │       ├── SiteDossierView.tsx   # Module C: Site Dossier & 4 Distinct Scores
│   │       ├── AdminPermitsView.tsx  # Module D: Administrative & Permit Feasibility
│   │       ├── VirtualLabView.tsx    # Module E: Equipment Exposure Lab (Sulfur Wear)
│   │       ├── ReportsView.tsx       # Module F: Validation & Evidence Report
│   │       ├── CalendarView.tsx      # Seasonal field test calendar
│   │       └── SimulatorView.tsx     # 3D Three.js hardware visualizer
│   ├── data/
│   │   ├── candidateSites.ts         # 13 seed candidate sites with distinct scores
│   │   ├── planetaryData.ts          # Lunar reference targets & layers
│   │   └── validationData.ts         # ML benchmarks, audit stats, export generators
│   ├── types/
│   │   └── terra.ts                  # TypeScript domain types
│   ├── App.tsx                       # Main view router
│   └── main.tsx
└── docs/
    ├── model_card.md                 # Detailed ML model card
    ├── data_manifest.md              # Data dictionary & provenance manifest
    └── validation_report.md          # Full statistical validation report
```

---

## ⚡ How to Run the Application

To run the complete platform, start both the backend API and the frontend client concurrently.

### 1. Start the Backend (Django REST Framework)

```powershell
# Open terminal and enter repository root
cd "d:\Marshal\Education\Projects\NASA_Synthetic Aperture Radar (SAR)\ECHO"

# Install Python requirements (Django, DRF, scikit-learn, pandas, numpy)
python -m pip install -r backend/requirements.txt

# Run migrations
python backend/manage.py migrate

# Start backend server on port 8000
python backend/manage.py runserver 127.0.0.1:8000 --noreload
```

*The API is live at `http://127.0.0.1:8000/api/simulate-wear/` and `http://127.0.0.1:8000/api/find-analog/`.*

### 2. Start the Frontend (React + Vite)

In a **second terminal window**:

```powershell
cd "d:\Marshal\Education\Projects\NASA_Synthetic Aperture Radar (SAR)\ECHO"

# Install dependencies (using Bun or npm)
bun install
# or: npm install

# Start development server
bun run dev
# or: npm run dev
```

*Open your browser at **`http://localhost:3000/`** (or the port displayed in your terminal).*

### 3. Verify Code Quality & Type Safety

```powershell
node ./node_modules/typescript/bin/tsc --noEmit
```
*(Compiles cleanly with 0 errors).*

---

## 📊 6-Module Feature Checklist

| Module | Feature | Implementation Details | Status |
|---|---|---|---|
| **Module A** | Mission Briefing Dashboard | Artemis IV context (early 2028, commercial HLS, 2 EVAs ~2 hr each, spacesuit test). Historical Artemis III candidate regions labeled as non-confirmed references. Physical environmental limits highlighted. Sources & assumptions ledger. | ✅ Implemented |
| **Module B** | Terrestrial Analog Discovery Map | Interactive 3D/2D map with 13 candidate sites across 6 categories (Basalt, Arid/Saline, Cold/Polar, Impact, Subsurface, Isolation). Filter pills and search bar. Approximate and verified coordinates. Direct button to Full Site Dossier. | ✅ Implemented |
| **Module C** | Site Dossier & Analog Explanation | 4 distinct separate scores (Environmental %, Operational Feasibility /100, Admin Status badge, Data Confidence %). Explicit "What this site does NOT reproduce" callout. Geologic and mineralogical evidence. | ✅ Implemented |
| **Module D** | Administrative & Permit Feasibility | Separation of basic land entry from 9 activity permissions. Administrative status model (Feasible, Conditional, Restricted, Unverified). China Wolf Amendment legal compliance check. AI Permit Assistant with prefilled cover letter drafts. | ✅ Implemented |
| **Module E** | Equipment Exposure Lab | Single stressor: sulfur-bearing material exposure. Parameter sliders (`sulfur_ppm` 200–1600, `exposure_days` 1–1000). Fast-forward play/pause auto-advance. Out-of-range warning alert. $\pm 0.0494\text{ }mg/cm^2$ RMSE confidence interval. Unvalidated provenance notice. Connected to `/api/simulate-wear/`. | ✅ Implemented |
| **Module F** | Validation & Evidence Report | Full data audit table for `simulation_dataset.csv` (1,000 rows, 13 outliers trimmed via IQR). 5-model benchmark comparison table. Actual vs Predicted scatter plot (Recharts). Residual distribution bar chart. High-visibility confidence notice. Multi-format exports (Markdown, HTML, CSV, JSON, PDF). | ✅ Implemented |

---

## 📈 Model Benchmark Summary

Evaluated on `backend/data/simulation_dataset.csv` using 80/20 train/test split and 5-fold cross-validation:

| Model Architecture | Parameters / Formula | Test $R^2$ (%) | Test MAE ($mg/cm^2$) | Test RMSE ($mg/cm^2$) | 5-Fold CV $R^2$ (%) | Status |
|---|---|---|---|---|---|---|
| **Baseline Dummy** | Constant Mean $\bar{y}$ | -0.06% | 0.1442 | 0.1754 | -0.01% | Rejected (Null) |
| **Linear Regression** | Ordinary Least Squares | 81.80% | 0.0601 | 0.0748 | 81.20% | Underfitting |
| **Polynomial Reg (Deg 2)** | Quadratic + Cross Terms | 92.82% | 0.0320 | 0.0470 | 92.10% | Strong Baseline |
| **Random Forest (Chosen)** | 100 Trees, max_depth=8 | **93.39%** | **0.0298** | **0.0494** | **92.60%** | **Chosen Production** |
| **Gradient Boosting** | 120 Trees, lr=0.08 | 94.12% | 0.0315 | 0.0465 | 93.10% | Candidate |

---

## 🌐 Data Sources: Integrated vs. Linked

### Actively Integrated in Platform
- **`simulation_dataset.csv`:** 1,000 empirical rows driving the Random Forest degradation service and Module F validation tables.
- **`backend/earth_analogs.csv`:** 13 candidate sites with coordinates, biomes, temperature ranges, and terrain slope data.
- **LRO Diviner Polar Resource Temperature Bins:** Embedded seasonal temperature distributions ($40\text{ K} - 120\text{ K}$) for South Pole PSR reference targets.

### Reference / Linked Products
- **NASA LOLA Polar 5 m / 30 m DEMs:** High-resolution topography reference (noting along-track interpolation uncertainty).
- **LROC Narrow Angle Camera (NAC):** Geomorphological and boulder distribution reference.
- **NASA EMIT L2B/L3:** Gypsum and mineral spectral abundance reference (explicitly tagged as a mineral proxy, not elemental sulfur ppm).
- **USGS / NASA Earthdata NASADEM (30 m):** Terrestrial elevation and slope baseline.

---

## 🎯 Hackathon Demonstration Walkthrough (for Judges)

1. **Step 1: Mission Brief (Module A)**
   - Open `http://localhost:3000/`. Review the Artemis IV context (early 2028, South Pole, commercial HLS, 2 Moonwalks ~2 hr each). Observe the prototype disclaimer and sources panel.
2. **Step 2: Discover Sites (Module B)**
   - Navigate to **2. Discover Sites**. Filter candidate biomes by category pill (e.g. *Cold / Polar* or *Basalt*). Select **University Valley, Antarctica** or **Haughton Crater, Canada**.
3. **Step 3: Inspect Site Dossier (Module C)**
   - Click **3. Site Dossier** or *Inspect Full Site Dossier*. Observe the **4 distinct scores** (Environmental Match, Operational Feasibility, Admin Readiness, and Data Confidence). Inspect the prominent *"What this site does NOT reproduce"* callout box.
4. **Step 4: Audit Legal Permits (Module D)**
   - Click **4. Access & Permits**. Notice that general land entry is separated from scientific drilling, rover testing, and drone operation. Check the **China Qaidam Basin** site to review the Wolf Amendment / P.L. 112-55 compliance analysis. Review the **AI Permit Assistant** checklist and copy the prefilled cover letter draft.
5. **Step 5: Equipment Exposure Lab (Module E)**
   - Navigate to **5. Exposure Lab**. Select sulfur concentration (e.g., 890 ppm) and click **Fast-Forward Timeline** to watch the mission scrubber advance from Day 1 to Day 1000. Observe the predicted degradation curve, the $\pm 0.0494\text{ }mg/cm^2$ confidence envelope, and the critical wear threshold line.
6. **Step 6: Validation & Evidence (Module F)**
   - Click **6. Validation & Evidence**. Review the mandatory confidence statement: *"The model has been statistically evaluated on the supplied dataset, but independent physical validation has not been established."*
   - Toggle between the **Model Comparison Benchmark**, the **Recharts Actual vs Predicted & Residual plots**, and the **Dataset Audit**.
   - Click **Report (MD)**, **Report (HTML)**, or **Metrics (CSV)** to download the auditable validation bundle.

---

## 📜 Documentation Index

- [docs/model_card.md](file:///d:/Marshal/Education\Projects\NASA_Synthetic%20Aperture%20Radar%20(SAR)\ECHO\docs\model_card.md) — Comprehensive ML model specifications and limits.
- [docs/data_manifest.md](file:///d:/Marshal/Education\Projects\NASA_Synthetic%20Aperture%20Radar%20(SAR)\ECHO\docs\data_manifest.md) — Data dictionary and provenance records.
- [docs/validation_report.md](file:///d:/Marshal/Education\Projects\NASA_Synthetic%20Aperture%20Radar%20(SAR)\ECHO\docs\validation_report.md) — Statistical benchmarks, IQR cleaning audit, and residual diagnostics.
- [session_handoff.md](file:///d:/Marshal/Education\Projects\NASA_Synthetic%20Aperture%20Radar%20(SAR)\ECHO\session_handoff.md) — Architecture history and development roadmap.
