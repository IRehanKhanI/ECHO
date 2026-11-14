# TERRA-X — Design Specification & UI/UX System (`design.md`)

1. **Project Identity & Core Design Philosophy**
   * **System Name:** TERRA-X (Working Module: *AnalogWindow — Beyond Similarity*)
   * **Core Mission:** A transferability-aware planetary analog discovery, seasonal windowing, virtual hardware testing, and mission preparation workspace for the [NASA Space Apps Challenge](https://www.nasa.gov/analog-missions/).
   * **Design Ethos ("Human-Crafted Scientific Workspace, Zero AI-Slop"):**
     * Avoid generic AI-generated tropes: no neon purple/magenta gradients, no cluttered dashboard card walls, no floating glassmorphism bubbles, no decorative radar rings with fake numbers, and no chatbot sidebars.
     * Adopt an authentic, tactile aerospace engineering and planetary cartography aesthetic inspired by [NASA Planetary Analog Missions](https://science.nasa.gov/solar-system/planetary-analogs/), orbital mechanics telemetry tools, isometric stratigraphic layer visualizations, and precision CAD digital-twin viewers.
     * Keep the interface calm, high-contrast, geometrically aligned, and centered on a single dominant interactive viewport per view with collapsible, high-density scientific inspector panels.

2. **Visual Theme & Color Architecture**
   * **Surface Palette (Deep Orbital & Clean Laboratory Dual-Tone):**
     * **Primary Canvas Background (`--bg-orbital`):** `#0B0D11` (Deep Space Obsidian — used for the 3D Planetary Workspace, Analog Discovery, and Time-Series Layer Stack).
     * **Secondary Panel Surface (`--bg-panel`):** `#12161F` with `1px solid #222938` structural hairlines (matte anodized slate, zero blur/glassmorphism).
     * **Elevated Control Surface (`--bg-control`):** `#1A202C` (tactile recessed button wells and segmented switches).
     * **CAD / Digital Twin Studio Surface (`--bg-cad-light`):** `#EAECEF` to `#F4F5F7` radial studio gradient (specifically used inside the **3D Equipment Simulator** viewport to provide high-contrast metallic part inspection and red failure-zone highlighting, matching industrial CAD digital-twin standards).
   * **Typography & Data Hierarchy Tokens:**
     * **Primary Text (`--text-primary`):** `#F0F4F8` (Crisp Alabaster).
     * **Secondary Label Text (`--text-secondary`):** `#94A3B8` (Muted Technical Slate).
     * **Muted Metadata / Provenance (`--text-muted`):** `#64748B` (Dataset IDs, PDS resolution tags, observation timestamps).
   * **Scientific & Semantic Accent Tokens:**
     * **Planetary Target Accent — Moon (`--accent-lunar`):** `#38BDF8` (LRO Telemetry Cyan) & `#84CC16` / `#22C55E` (LOLA False-Color Topography Viridis/Green-Gold scale).
     * **Planetary Target Accent — Mars (`--accent-mars`):** `#E07A5F` (Oxide Ochre).
     * **Planetary Target Accent — Earth (`--accent-earth`):** `#10B981` (Terrestrial Biosphere Emerald).
     * **Fidelity / High Transferability (`--status-valid`):** `#16A34A` (Verified Match $\ge 80\%$).
     * **Partial / Conditional Fidelity (`--status-partial`):** `#D97706` (Seasonal or Scale-Limited Match $50\text{--}79\%$).
     * **Analogy Breakdown / Hardware Corrosion Alert (`--status-failure`):** `#EF4444` (Translucent Crimson `#EF4444` at `35%` fill opacity with `1.5px solid #DC2626` outline for 3D part failure/corrosion callouts and physical breakdown warnings).

3. **Typography & Scannable Alignment System**
   * **UI & Workspace Sans (`--font-sans`):** `Inter` or `IBM Plex Sans` — used for navigation, control labels, and scientific explanations.
   * **Telemetry, Coordinates & Quantitative Tables (`--font-mono`):** `JetBrains Mono` or `IBM Plex Mono` with `font-variant-numeric: tabular-nums` enforced globally so all coordinates, kelvin/celsius values, slope degrees, and similarity percentages align vertically across rows.
   * **Editorial Report Headings (`--font-display`):** `Space Grotesk` or `IBM Plex Sans Condensed` (`600` weight, tight `-0.02em` tracking, uppercase micro-labels at `11px` with `0.08em` letter-spacing).
   * **Type Scale:**
     * Workspace View Title: `18px` (`1.125rem`), line-height `1.3`, weight `600`.
     * Section / Panel Header: `12px` (`0.75rem`), uppercase, tracking `0.08em`, weight `600`, color `--text-secondary`.
     * Body & Analytical Copy: `14px` (`0.875rem`), line-height `1.5`, weight `400`.
     * Telemetry Readout / Percentage Score: `20px` (`1.25rem`) to `28px` (`1.75rem`), `--font-mono`, weight `600`.
     * Provenance Footnote / Sensor Tag: `11px` (`0.6875rem`), `--font-mono`, color `--text-muted`.

4. **Two-Tier Spatial Architecture & 6 Core Workspace Views**
   To prevent forcing a 3D planetary globe into every workflow, TERRA-X separates the experience into **six dedicated workspace modes** accessible via a persistent bottom or top segmented dock (`48px` height), keeping the screen divided into **three clean functional zones** (`Left Control Rail: 280px` | `Center Interactive Stage: Flexible 1fr` | `Right Inspector Drawer: 340px collapsible`).

| Workspace View | Primary Center Stage | Left Rail Controls (`280px`) | Right Inspector Panel (`340px`) |
| :--- | :--- | :--- | :--- |
| **1. Overview (Planetary Workspace)** | **Interactive 3D Planetary Globe** (Earth, Moon, Mars) with true scientific overlays ([LRO LOLA](https://pds-geosciences.wustl.edu/missions/lro/), [LRO Diviner](https://pds-geosciences.wustl.edu/missions/lro/diviner.htm), [MOLA/THEMIS](https://pds.nasa.gov/), [NASA Earthdata](https://search.earthdata.nasa.gov/)). | Target Body Switcher (`Earth` / `Moon` / `Mars`), Mission Objective Selector, Active Scientific Layer toggles. | Selected Reference Site telemetry, active sensor metadata (source, spatial resolution, epoch), quick launch to Analog Discovery. |
| **2. Analog Discovery** | **Dual-Synchronized Globe / Split Regional Map** comparing target planetary site (e.g., Lunar South Pole — Shackleton Rim or Jezero Crater) with ranked Earth analog pins & novelty filter. | Objective Weight Sliders (Thermal, Slope/Roughness, Illumination, Radar CPR) + **Novelty Filter** toggle (flags [CAFE](https://oro.open.ac.uk/33373) & [Preston & Dartnell (2014)](https://www.cambridge.org/core/product/244C9EB88B74D6905133DD2228DD3112/core-reader) sites). | Ranked Candidate List with per-dimension percentage bars, overall transferability score, and one-click **Analog Fidelity Card**. |
| **3. Analog Calendar (Time Machine)** | **Isometric Stratigraphic Time-Stack & 12-Month Matrix** showing daily/seasonal environmental waveforms and exact date ranges (`Timer / Date-Range Window`) when the Earth site matches target conditions. | Target Seasonal Bin selector (e.g., [Diviner 6 Seasonal Bins](https://www.diviner.ucla.edu/single-post/2020/07/20/new-diviner-seasonal-polar-data-products)) and Earth parameter toggles (Temperature, Solar Angle, Ice/Snow Cover, Wind/Dust). | **Optimal Testing Window Card**: exact start/end dates, diurnal amplitude ratio match, and seasonal breakdown notes (e.g., [McMurdo Dry Valleys](https://mcm.lternet.edu/node/4946) summer window). |
| **4. Virtual Lab (Route & Environment)** | **2.5D Terrain & Rover Route Explorer** where users draw a traverse path across the Earth analog or planetary DEM to inspect slope hazards, solar shadow traps, and thermal stress along the path. | Instrument Payload & Traverse Parameters (Rover wheel clearance, solar array height, drill depth, communication elevation mask). | **Analog Failure Lab Breakdown**: side-by-side table of what holds vs. where the analogy breaks down (gravity, vacuum, radiation, regolith cohesion). |
| **5. Equipment Simulator (Digital Twin)** | **Interactive 3D Hardware & Instrument CAD Viewer** (Rover Wheel Assembly, Rotary Percussive Drill, Thermal Louver, Fastener/Screw Joints) with **Explode / Isolate / Section** controls and a **Fast-Forward Time Scrubber (`0 to 10 Years`)**. | Environment Selector (`Earth Analog Site` vs. `Moon South Pole` vs. `Mars Jezero`) + Accelerated Degradation Stressors (Thermal Cycling Fatigue, Abrasive Dust/Regolith, Salinity/Perchlorate Corrosion). | **Component Failure & Corrosion Diagnostic Card**: highlights failing parts in translucent red (e.g., *"Year 5.0: Titanium Actuator Screw #4 — Thermal fatigue & galvanic pit corrosion"*), mechanism explanation, and Earth-vs-Mars divergence. |
| **6. Reports (Fidelity & Coverage)** | **Clean Reproducible Scientific Report & Mission Portfolio Matrix** (no 3D viewport clutter) with exportable tables, radar comparison notes ([CSA RCM](https://mdpi.com/2072-4292/12/20/3283) vs. [Mini-RF](https://ui.adsabs.harvard.edu/abs/2013JGRE..118.2016S)), and set-cover multi-site rehearsal combinations. | Report Section Outline, Case Study Switcher (`Lunar South Pole` / `Martian Jezero Crater`), and Export Format controls (`PDF`, `CSV`, `JSON`). | Citation & Dataset Provenance Ledger with verified links to [NASA PDS](https://pds.nasa.gov/), [Copernicus Data Space](https://dataspace.copernicus.eu/), and peer-reviewed literature. |

5. **Signature Component Specifications (Grounded in Reference Visuals)**
   * **Component 1: The Central 3D Planetary Globe & Scientific Layer Shader (`Overview` & `Discovery`)**
     * **Visual Behavior:** occupies `100%` of the center stage against pure `#0B0D11` deep space with subtle lat/long graticule lines (`1px` at `15%` white opacity) and physically accurate solar terminator shading.
     * **True Planetary Layer Switching:** Switching between `Earth`, `Moon`, and `Mars` dynamically loads body-specific geometry and scientific raster shaders—such as the LOLA false-color topography shader (green-to-ochre-to-crimson elevation ramp with sharp crater shadow relief) and [LRO Diviner](https://www.diviner.ucla.edu/single-post/new-diviner-south-polar-data-products-released-on-pds) polar temperature maps (`240 m` resolution)—never just swapping a flat decorative image skin.
     * **Provenance HUD Pill:** Bottom-left floating bar (`height: 32px`, `background: #12161F`, `border: 1px solid #222938`) displaying exact layer source, e.g., `SOURCE: NASA PDS / LRO LOLA DEM · RES: 240m/px · EPOCH: 2009–2020`.
   * **Component 2: Isometric Time-Series Waveform Stack & Analog Window Strip (`Analog Calendar`)**
     * **Visual Behavior:** Inspired by minimalist scientific horizon-stack visualizations, the center stage renders an isometric 3D stack of horizontal waveform slices across time (`1990–2026` climatology or `Jan–Dec` daily cycles) alongside a high-contrast timeline ruler at the top with crisp tick marks and an active date pointer.
     * **Parameter Filter Pills:** Directly beneath the timeline ruler, clean monochrome icon+label toggles (`THERMAL AMPLITUDE`, `SOLAR ELEVATION (2°–6°)`, `ICE/PERMAFROST STABILITY`, `RADAR CPR`) switch the isometric contour slices and highlight the exact **Analog Window Date Range** (e.g., `14 NOV – 28 JAN · 88.4% Thermal/Solar Fidelity`).
   * **Component 3: 3D Equipment Digital Twin & Fast-Forward Corrosion Viewer (`Equipment Simulator`)**
     * **Visual Behavior:** Uses a bright, clean engineering studio background (`#EAECEF` radial gradient) so metallic assemblies, bearings, fasteners, and drill flutes read with CAD precision.
     * **Direct On-Canvas Radial Action Pills:** Clicking any sub-component on the 3D instrument model spawns compact, floating white pill buttons (`border-radius: 9999px`, `background: #FFFFFF`, `box-shadow: 0 2px 8px rgba(0,0,0,0.12)`) directly around the part:
       1. `Explode` (separates assembly along axial vectors to inspect internal screws, seals, and bearings).
       2. `Isolate` (ghosts surrounding geometry to `10%` opacity).
       3. `Document` (opens the engineering failure physics note).
     * **Translucent Red Failure Volume & Callout Card:** As the user drags the **Fast-Forward Simulation Scrubber** (`Day 1` $\rightarrow$ `6 Months` $\rightarrow$ `2 Years` $\rightarrow$ `5 Years` $\rightarrow$ `10 Years`), vulnerable parts accumulate visual wear and are enveloped in a **translucent red diagnostic highlight (`rgba(239, 68, 68, 0.32)`)** with a crisp white floating callout card:
       * *Title Pill:* `Ti-6Al-4V Housing Fastener #3 / Main Crankcase Seal`
       * *Diagnostic Readout:* `Status at Year 5.0: Critical Failure · Mechanism: Chloride/sulfate pitting corrosion on Earth analog vs. abrasive electrostatic dust seal fretting & 180 K ΔT thermal fatigue on Mars.`
     * **Bottom Mode Dock:** Centered floating pill dock at the bottom of the CAD viewport (`Dashboard` | `Procedures` | `Documents` | `Parts` | `Section`).
   * **Component 4: The Analog Fidelity Card (`Validate` & `Reports`)**
     * **Structure:** A structured, border-grid engineering specification sheet (never a generic rounded marketing card) divided into four quadrants:
       1. **Dimension-by-Dimension Fidelity Table:** Explicit scores (`0–100%`) for Thermal Extremes, Diurnal-to-Seasonal Amplitude Ratio, Topographic Slope/Roughness, Illumination Angle, and Subsurface/Radar Backscatter, alongside the exact raw numbers (e.g., `Earth Site: -42°C to -12°C` vs. `Lunar Shackleton Rim: -183°C to -53°C`).
       2. **Temporal Analog Window:** Exact calendar dates when field testing is valid.
       3. **Where the Analogy Breaks Down (Mandatory Failure Lab Block):** Explicit physics mismatches (`Gravity: 9.81 m/s² vs 1.62 m/s²`, `Atmosphere: 101.3 kPa vs Hard Vacuum`, `Radiation: Magnetosphere shielded vs Galactic Cosmic Rays`, `Regolith: Weathered silicate soil vs agglutinitic sharp-edged lunar regolith`).
       4. **Suggested Field Protocol & Unresolved Risks:** What instrument tests transfer validly and what chamber tests must supplement field trials.

6. **Interaction Guardrails & Anti-Bloat Rules**
   * **Progressive Disclosure:** Advanced normalization settings, spherical harmonic terrain roughness scales, and custom objective weight sliders remain tucked inside an expandable `Advanced Parameters` drawer until clicked.
   * **Instant Layer Feedback:** Toggling a scientific layer (`Elevation`, `Slope`, `Roughness`, `Diviner Thermal`, `Illumination`, `Mini-RF / RCM CPR`) updates the 3D globe shader and colourbar legend within `<150ms` using pre-tiled WebGL textures.
   * **Strict Scientific Honesty Badges:** Every score or simulation output displays a machine-readable tag: `[VERIFIED DATA]`, `[COMPUTED METRIC]`, `[PHYSICS APPROXIMATION]`, or `[UNVERIFIED / STRETCH]`.
