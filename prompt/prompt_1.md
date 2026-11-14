# Prompt 1

## User Input

```text
<USER_REQUEST>
web application/stitch/projects/8840199321852835769/screens/0c21b4eb9bb544faadc1108c89d2ddfd
web application/stitch/projects/8840199321852835769/screens/9558f49fa19344ed809beb22b467a501
web application/stitch/projects/8840199321852835769/screens/d564faf5a30548a697d13c0b6b13d54f
web application/stitch/projects/8840199321852835769/screens/fc52ee22f36449e29693c2d2f3cfd196
web application/stitch/projects/8840199321852835769/screens/361eae55b9344a6eaf460e02158a27ed
web application/stitch/projects/8840199321852835769/screens/624703fbc8cf468d82f4022323f97df9 so this is the the ui but the current UIUX is not according to it make it like it
</USER_REQUEST>
<ADDITIONAL_METADATA>
The current local time is: 2026-11-14T11:31:29+05:30.
</ADDITIONAL_METADATA>
<USER_SETTINGS_CHANGE>
The user changed setting `Model Selection` from None to Gemini 3.8 Flash (High). No need to comment on this change if the user doesn't ask about it. If reporting what model you are, please use a human readable name instead of the exact string.
</USER_SETTINGS_CHANGE>
```

## Antigravity Response

The UI/UX has been rebuilt to match the **Google Stitch design system** and screens:

### 1. Navigation & Command Header ([TopCommandBar.tsx](file:///home/pathan/Documents/Projects%202026/NASA%20SPACE%20APP/src/components/layout/TopCommandBar.tsx))
* **Brand Wordmark:** Compass emblem in dark forest moss (`#184633`), bold uppercase **TERRA-X** title, terracotta **`Planetary Studio`** badge (`#E06A3B`), and subtitle *“NASA PDS & Analog Geological Intelligence”*.
* **Segmented Pill Navigation (Screens 1–6):**
  1. `1. 3D Overview`
  2. `2. Analog Discovery`
  3. `3. Expedition Calendar`
  4. `4. Virtual Lab`
  5. `5. Equipment Testing`
  6. `6. Research Reports`
* **Status & Controls:** Segmented `Earth` | `Moon` | `Mars` switcher with active dark green pill, live pulsing `• Live PDS Data` status badge, and user avatar button.

---

### 2. Contextual Telemetry Banner ([TelemetryStrip.tsx](file:///home/pathan/Documents/Projects%202026/NASA%20SPACE%20APP/src/components/layout/TelemetryStrip.tsx))
* **Screen 1 (`1. 3D Overview`):** Orbit icon, `Target: Lunar South Pole (Shackleton Rim)`, `SPICE Kernel: DE440/MOON`, `☀️ Solar Elevation: +1.84° (Stable Grazing)`, `Polar Stereographic Grid`, and `Altitude: 48.6 km`.
* **Screen 2 (`2. Analog Discovery`):** Green pill `Pareto Multi-Objective Discovery Active`, `Target Datum: Shackleton Rim (Lunar South Pole) • Lat 89.9°S • Permanent Grazing Light 86%`, `Evaluated 1,842,900 biomes`, and peach badge `✨ Novelty Engine Active`.

---

### 3. Screen 1: 3D Overview ([OverviewView.tsx](file:///home/pathan/Documents/Projects%202026/NASA%20SPACE%20APP/src/components/views/OverviewView.tsx))
* **Left Rail:**
  * **Active Study Region:** Shackleton Rim Massif, coordinates `89.90° S, 0.00° E • Elevation +1,240m` in terracotta typography, ridge perimeter summary, and orange indicator dot.
  * **Primary Field Objective (Priority 1):** 3 stacked cards with icons and selection states (`Thermal Cold-Soak & PSR` selected with checkmark circle; `Low-Sun Grazing Light` and `Ice-Regolith Coring` in soft cream cards).
  * **Spectral & DEM Layers (2 Active):** LOLA DEM Elevation Mesh slider (`100%`), Diviner Thermal Bolometry slider (`75%`), and continuous Viridis-to-terracotta gradient elevation ramp (`-4,200m PSR` to `+4,300m Peak`).
  * **Primary CTA:** Terracotta button `Launch Analog Search →`.
* **Center Viewport:**
  * Header pill with orange dot: `• Lunar South Pole 3D | 240m GSD` alongside segmented controls (`3D Orbit`, `↓ Top View`, `◇ Contour Relief`, rotate trigger).
  * Circular polar stereographic cartographic projection with concentric latitude rings, radial meridian lines (`0° PRIME MERIDIAN • EARTH FACING`), crater outlines (`FAUSTINI`, `SHOEMAKER`), and glowing pin `Station Alpha • Shackleton Rim +1,240m`.
  * Overlaid floating HUD pills: `Grazing Sun: Subsolar +1.84° • Shadow: 74%` and `Cross-Section (A-B) +1,240m to -3,800m` elevation SVG curve.
  * Bottom epoch timeline: `Bin 1` through `Bin 5` with `Bin 3 (Sol-Max)` active, plus `• NASA PDS LOLA & Diviner Certified`.
* **Right Rail:**
  * **Geological Dossier (CLASS A-1):** 2×2 metric grid (`Min Surface T: -203°C`, `Max Surface T: -48°C`, `Baseline Slope: 14.8°`, `Grazing Solar: 1.8°–5.6°`).
  * **Top Matched Earth Analogs (Top 3 Sites):** Ranked items with progress bars (University Valley `86.4%`, Salar de Gorbea `84.2%`, Qaidam Basin `79.1%`).
  * **Terrain Match Reference:** University Valley Ridge artwork with floating `Polar Regolith Simulant` pill.
  * **CTA:** Pill button `Open Analog Fidelity Dossier`.

---

### 4. Screen 2: Analog Discovery ([DiscoveryView.tsx](file:///home/pathan/Documents/Projects%202026/NASA%20SPACE%20APP/src/components/views/DiscoveryView.tsx))
* **Left Rail:**
  * **Criteria Weights (100% Calibrated):** 4 calibrated sliders with metadata readouts (`Thermal Amplitude (ΔT) 40%` [Priority Primary], `Diurnal / Seasonal Ratio 25%` [Cyclic Pattern], `Slope & Rugosity (DEM) 20%` [Morphology], and `Solar Grazing Angle 15%` [Horizon]).
  * **Novelty Discovery:** iOS-style toggle switch for `Suppress Legacy Sites`, stat card `Novel Clusters Identified: 14`, threshold slider `≥ 75.0%` (Broad 50% to Exact Match 95%), and `Refresh Pareto Calculation` action.
* **Center Viewport:**
  * Segmented bar: `Analog Globe 3D` | `Geodetic Datum` with `Rotate 3D`, `Heatmap`, `Relief`, and crosshair actions.
  * Polar radar map with sector highlighting and analog markers (`#1 Univ. Valley 86.4%`, `#2 Salar de Gorbea 84.2%` active prime marker, `#3 Qaidam Basin 79.1%`, `#4 Svalbard 76.5%`).
  * Elevation gradient bar with `• Inspection Focus: Chile–Argentina Transect`.
  * **10 km Regional Transect Comparison:** 3 side-by-side synchronized plots:
    1. *Elevation Relief (Δz)*: RMS Δ 34m dual-profile curves.
    2. *Diurnal Temperature Wave*: ΔT = 224 K sinusoidal wave.
    3. *Slope Rugosity Bins*: 92% overlap grouped bar chart.
* **Right Rail (Candidate Report #1 — Salar de Gorbea):**
  * Coordinates `25°24'40"S, 68°38'24"W`, elevation `4,020 m`, and biome `Hyper-Arid Cold Salar`.
  * **Global Fidelity Ring:** SVG circular progress ring displaying **84% Match**.
  * **Dimension Overlap Bars:** Thermal (`88%`), Slope/DEM (`91%`), Aridity (`82%`), and Illumination (`64%`).
  * **Physical Analogy Boundaries:** Peach callout container highlighting the gravity, atmosphere, and regolith divergence limits.
  * **Primary CTA:** Dark green pill button `Open Seasonal Calendar →` with caption *“Suggested Expedition Window: Nov 15 – Jan 28”*.

---

### 5. Screens 3–6 Consistency Polish
* [CalendarView.tsx](file:///home/pathan/Documents/Projects%202026/NASA%20SPACE%20APP/src/components/views/CalendarView.tsx): Isometric 3D waveform canvas updated to warm studio tones (`#F8F5EE`), with moss green (`#184633`) and terracotta (`#E06A3B`) waveform curves.
* [VirtualLabView.tsx](file:///home/pathan/Documents/Projects%202026/NASA%20SPACE%20APP/src/components/views/VirtualLabView.tsx) & [SimulatorView.tsx](file:///home/pathan/Documents/Projects%202026/NASA%20SPACE%20APP/src/components/views/SimulatorView.tsx): Control pill bars, action buttons, and diagnostic callouts aligned with the same palette and typography.
