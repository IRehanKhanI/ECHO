# MASTER BUILD PROMPT
## TERraOps — Artemis IV Terrestrial Analog & Equipment Readiness Platform

**Project type:** NASA Space Apps / space hackathon prototype  
**Build window:** 6 hours  
**Team skill level:** Intermediate programming  
**Research cutoff for this brief:** 14 November 2026  
**Primary deliverable:** A working, demonstrable web application with a map, an administrative feasibility layer, a single-stressor equipment simulation, and an auditable validation report.

---

# 0. Your role and operating instructions

Act as a senior multidisciplinary product and engineering team consisting of:

- A planetary geologist familiar with lunar South Pole science.
- A NASA-style mission systems analyst who understands public Artemis mission objectives.
- A geospatial data scientist and GIS engineer.
- An applied machine-learning engineer.
- A full-stack developer experienced in rapid MVP delivery.
- A research and compliance analyst who understands that permits and legal restrictions must be verified from authoritative sources.

Your job is to **build the working application**, not merely describe an architecture or return a plan.

The user is a computer engineering student with intermediate coding ability and only six hours to complete the hackathon project. Keep the implementation achievable, readable, modular, and easy to run.

## Operating rules

1. First inspect the existing repository and all supplied files. Preserve a working project structure and existing code where possible.
2. Do not ask unnecessary questions. Make sensible defaults, document them, and proceed unless a missing decision genuinely blocks implementation.
3. Prioritize a complete, reliable end-to-end demonstration over a large collection of unfinished features.
4. Do not fabricate NASA data, site coordinates, permit requirements, legal approvals, model performance, or experimental results.
5. Clearly distinguish:
   - NASA-published facts.
   - Findings from the supplied Perplexity research summary.
   - Independently researched public information.
   - Engineering assumptions and inferences.
   - Illustrative/demo data.
6. Every external dataset and legal claim must have a source, date or version where available, units, spatial/temporal resolution where relevant, and a link.
7. If a live data source is unavailable, show a clear fallback state and explain that the displayed data are cached, illustrative, or unavailable. Never silently substitute invented values.
8. Do not imply that this is an official NASA product, that NASA has endorsed it, or that it is connected to NASA internal systems.
9. Build for **equipment testing only** in this MVP. Human/crew testing is a future extension, not part of the six-hour implementation.
10. Do not claim that an Earth site reproduces the Moon. It can only reproduce selected, explicitly stated environmental or operational characteristics.

---

# 1. Reframed problem statement

## Original challenge

The hackathon challenge asks participants to identify and characterize Earth locations that can act as useful analogues for lunar or Martian environments. It encourages the combination of open Earth, Moon, and Mars datasets to compare geology, surface materials, terrain, temperature, water/ice, dust, biological conditions, subsurface features, and operational factors.

The key scientific principle is that no Earth location is a perfect Moon or Mars replica. A useful analogue is purpose-specific: one location may be useful for basaltic geology, another for dry-environment instrument testing, and another for cold-weather or remote operations.

## Refined mission-focused problem statement

**How might a mission-aligned decision-support platform help Artemis-related engineering and science teams discover Earth field sites that reproduce selected, testable characteristics of the lunar South Pole, determine whether an equipment-testing campaign could legally and practically operate at those sites, and estimate the effect of one controlled environmental stressor on a test material using transparent, reproducible machine learning?**

Instead of building a generic Moon/Mars analogue directory, build a focused tool for the publicly documented objectives and operational context of **NASA's Artemis IV lunar surface mission**.

The product must answer three connected questions:

1. **Scientific suitability:** Which Earth locations provide a meaningful analogue for a selected lunar South Pole condition or equipment test objective?
2. **Administrative and operational feasibility:** Can a NASA-affiliated or NASA-funded team plausibly access and use the location for the proposed activity, and what approvals may be required?
3. **Engineering behaviour:** Under one selected environmental stressor, how does a test article's degradation response change as exposure time advances, and how trustworthy is the prediction?

The platform should not choose a site solely because satellite imagery looks lunar. It must explain the physical evidence, differences, data gaps, operational constraints, and legal uncertainty.

## Proposed product name

**TERraOps — Terrestrial Readiness & Operations Platform**

Subtitle: **Artemis IV Analog Intelligence and Equipment Exposure Lab**

Use the name as a prototype identity only. Do not use NASA logos or imply NASA ownership.

---

# 2. Mission context: Artemis IV

Use the supplied NASA documents as source material, but use newer NASA announcements to update any outdated mission assumptions.

## Current public mission facts to reflect

As of the research cutoff in this brief:

- NASA's Artemis IV mission page targets an early-2028 crewed surface landing near the lunar South Pole.
- The mission page describes four astronauts travelling to lunar orbit, with two crew members descending to the surface in a commercial Human Landing System (HLS).
- The Artemis IV mission page describes the two surface crew members spending approximately a week near the lunar South Pole conducting science.
- NASA's 23 October 2026 update describes two approximately two-hour lunar surface Moonwalks during the initial surface missions. These activities include lunar sample collection and testing capabilities of the Axiom-provided spacesuit.
- NASA's 23 October 2026 announcement states that the lander provider for the first crewed lunar landing had not yet been assigned to a specific Artemis lunar landing mission; the selection depends on provider readiness.
- NASA's updated architecture must take precedence over older mission descriptions in the supplied PDFs where they conflict.

The approximate week refers to the mission page's surface stay description; the two approximately two-hour Moonwalks refer to the announced surface activity plan. Do not confuse surface-stay duration with EVA duration.

## Mission activities relevant to this MVP

Translate publicly documented mission activities into equipment-testing use cases:

- Surface geology and sample collection.
- Instrument deployment and operation.
- Surface observation and imaging.
- Equipment mobility and operation on uneven terrain.
- Tools and hardware exposed to abrasive or chemically unusual surface materials.
- Surface science support equipment.
- Spacesuit-supporting tools and equipment, without simulating human physiology or crew performance in this MVP.

These are **mission-aligned use cases inferred from public mission information**, not a claim that NASA has published a complete list of its internal test requirements.

## Lunar South Pole characteristics to consider

Use a configurable South Pole reference region rather than pretending that a final Artemis IV landing coordinate is publicly established.

Relevant characteristics include:

- Rugged cratered terrain, ridges, slopes, rocks and boulders.
- Strongly varying illumination and low-angle sunlight.
- Permanently shadowed regions (PSRs) near illuminated terrain.
- Extreme thermal variation between illuminated and shadowed locations.
- Regolith and mineralogical variation.
- Potential water ice or hydrogen-bearing materials in selected cold-trap regions.
- Dust and granular surface-material interactions.
- Communications visibility and navigation constraints.
- Safe access and mobility between landing, work and science areas.

NASA's 2024 Artemis III landing-region release lists nine candidate regions: Peak near Cabeus B, Haworth, Malapert Massif, Mons Mouton Plateau, Mons Mouton, Nobile Rim 1, Nobile Rim 2, de Gerlache Rim 2, and Slater Plain. These are useful historical Artemis campaign reference areas, **not confirmed Artemis IV landing coordinates**. Label them accordingly if they appear in the application.

NASA's public lunar site-selection factors include science potential, launch-window availability, terrain suitability, communications with Earth, lighting conditions, and vehicle/trajectory capabilities. Treat these as mission context, not as a complete public copy of NASA's internal selection model.

## Non-negotiable mission caveat

Earth cannot reproduce lunar vacuum, one-sixth gravity, the lunar radiation environment, electrostatic dust behaviour, micrometeoroid exposure, or the complete lunar thermal environment. A terrestrial site can help test selected terrain, geology, dust, material, logistics, and equipment behaviours. Vacuum, radiation, and reduced-gravity tests require separate laboratory or specialised facilities.

---

# 3. Product scope and user journey

## MVP scope

Build one coherent workflow:

1. Open a mission dashboard explaining the Artemis IV context.
2. Explore a map of candidate terrestrial analogue sites.
3. Select a site and inspect its environmental evidence and limitations.
4. Check whether a proposed equipment-testing activity could be conducted there.
5. View possible permits, responsible authorities, legal restrictions, and application links.
6. Open the equipment exposure simulator.
7. Adjust sulfur concentration and exposure time.
8. View predicted degradation, a time-series curve, uncertainty, and model limitations.
9. Generate an evidence report that documents data processing, model validation, site reasoning, and permit research.

## Explicitly out of scope for the six-hour MVP

- Crew health, human performance, or astronaut physiological simulations.
- A full lunar lander simulator.
- A physically complete lunar environment simulator.
- A full global legal database.
- Automatic legal application submission.
- Autonomous permit approval or legal clearance.
- Training a model on unverified synthetic data and presenting it as real-world validation.
- Downloading and processing every raw NASA archive.

Design the architecture so that additional stressors and human-operation modules could be added later, but do not implement them now.

---

# 4. Core application modules

## Module A — Mission Dashboard

Show:

- Mission name: Artemis IV.
- Public target timeframe: early 2028 (verify current NASA page when the application is built).
- Destination: lunar South Pole region.
- Publicly described crew/surface-operation context.
- Main equipment-testing objectives supported by the app.
- A concise explanation of why terrestrial analogues are needed.
- A clear notice that the tool is an independent prototype, not an official NASA system.

Include a small “Mission assumptions and sources” panel with source links and last-checked dates.

## Module B — Terrestrial Analog Discovery Map

Build an interactive global map.

Candidate seed environments from the supplied Perplexity research include:

| Candidate | Research-reported analogue value |
|---|---|
| Atacama Desert, Chile | Extreme aridity, low-biomass environments, Mars instrument and life-detection research |
| Haughton Crater, Devon Island, Canada | Impact geology, cold and remote operations, rocky terrain |
| McMurdo Dry Valleys, Antarctica | Cold, dry, exposed rock, ice and remote field operations |
| Mauna Kea, Hawaii, USA | Volcanic terrain, basaltic materials and tephra |
| Kilauea volcanic terrain, Hawaii, USA | Basaltic lava, rough terrain and lava-cave geology |
| Black Point Lava Flow, Arizona, USA | Young basaltic lava, rough terrain and rover-access challenges |
| Pilbara, Western Australia | Ancient geology, volcanic rocks, mineral deposits and past habitability research |
| Death Valley, USA | Arid terrain and desert field operations |
| Negev Desert / D-MARS, Israel | Arid environment and simulated exploration operations |
| Mars Desert Research Station, Utah, USA | Habitat, field geology, EVA-workflow and isolation research |
| Pyhäsalmi Mine / Callio SpaceLab, Finland | Subsurface, confined-space and autonomous equipment testing |

Treat this table as **candidate hypotheses from the supplied research summary**, not as proof that each site is currently accessible, legally usable, or suitable for Artemis IV equipment tests.

Requirements:

- Verify site names, approximate map locations, country, and current status from credible sources before placing markers.
- Do not invent exact coordinates. Use a sourced site centroid or a clearly labelled approximate marker.
- If no reliable coordinate is found, keep the site in a text shortlist and do not put a fabricated pin on the map.
- Allow filtering by analogue type: basalt/volcanic, arid/saline, cold/polar, impact terrain, subsurface, and operational isolation.
- Include a search field and site-selection panel.
- A selected site must open a detailed site dossier.

## Module C — Site Dossier and Analogue Explanation

For every candidate site, display:

- Site name, country, region and map location.
- What makes the site relevant to the selected lunar South Pole test objective.
- Geology and surface-material evidence.
- Terrain and topography evidence.
- Temperature and environmental evidence.
- Mineralogical or geochemical evidence, where available.
- Dust, wind, moisture or precipitation evidence, where available.
- Water/ice or subsurface evidence, where relevant.
- Operational access and logistics.
- What the site does **not** reproduce.
- Data source, acquisition date, resolution, units and uncertainty.
- Missing data and confidence limitations.

The application must explain **why** a site is a useful analogue and where the analogy breaks down.

### Keep the scores separate

Do not collapse all site attributes into one unexplained percentage.

Display four distinct assessments:

1. **Environmental Analogue Match:** How closely the measured Earth characteristics match the selected lunar test objective.
2. **Operational Feasibility:** Access, logistics, infrastructure, safety, field support and emergency considerations.
3. **Administrative Readiness:** Permit and policy status, shown as a status and evidence checklist rather than an invented legal probability.
4. **Data Confidence:** Completeness, resolution, source quality, age, uncertainty and directness of the measurements.

A site can be a strong scientific analogue but a poor practical choice. Make that visible.

### Scoring rules

- Make the selected test objective explicit before calculating a similarity score.
- Expose score weights and explain why each variable matters.
- Normalise comparable variables appropriately and record the method.
- Do not compare unlike units without a documented transformation.
- Do not treat a mineral proxy as a direct chemical measurement.
- Missing data must reduce confidence or make a dimension “not assessed”; it must not be silently converted into a favourable score.
- Show the underlying measurements and source evidence beside every score.
- Never display a fabricated “97% lunar match”.

---

# 5. Data architecture: what attributes are required?

The app should use a data manifest that records each dataset's name, provider, source URL, variable, unit, resolution, date/version, processing steps, limitations and role in the analysis.

## A. Lunar reference data

| Dataset / instrument | Attributes to extract | Role |
|---|---|---|
| LRO LOLA | Elevation, slope, DEM, surface roughness where supported, uncertainty | Lunar terrain reference |
| LRO Diviner | Surface temperature, thermal behaviour, relevant thermal/mineral channels | Thermal and material context |
| LROC NAC/WAC | High-resolution imagery, craters, boulders, shadows and surface features | Visual and geomorphological context |
| LRO LEND | Neutron/hydrogen indicators | Potential hydrogen-bearing regions; not a definitive ice confirmation |
| Lunar illumination products | Sunlight duration, shadow fraction, PSR boundaries, where sourced | South Pole lighting context |
| Lunar mineralogical products | Mineral/rock signatures and uncertainty | Geologic comparison |

Useful official starting points:

- LRO data products: https://science.nasa.gov/mission/lro/data-products/
- NASA high-resolution LOLA South Pole terrain products: https://pgda.gsfc.nasa.gov/products/78
- LRO Diviner Polar Resource Products: https://pds.nasa.gov/ds-view/pds/viewDataset.jsp?dsid=LRO-L-DLRE-5-PRP-V2.0
- LRO science and LEND information: https://science.nasa.gov/mission/lro/science-and-data/

**Important LOLA limitation:** The cited high-resolution South Pole products include interpolated terrain values. Their documentation notes that a large fraction of 5 m pixels are interpolated. Display the supplied elevation/slope uncertainty layers and do not imply that every 5 m cell is a direct laser measurement.

## B. Earth observation and geospatial data

| Dataset | Attributes | Limitations / interpretation |
|---|---|---|
| NASADEM / SRTM | Elevation, derived slope, terrain metrics | NASADEM 1 arc-second coverage is approximately 60°N to 56°S; it does not cover the polar regions |
| MODIS MOD11A2 | Day/night land-surface temperature, emissivity and quality flags | 1 km, 8-day composite; land-surface temperature is not the same as air temperature |
| NASA POWER / MERRA-2 / GEOS | Temperature, wind, precipitation and meteorological context | Regional grid-scale information; not a substitute for local microclimate measurements |
| NASA EMIT L2B / L3 | Mineral identification, spectral abundance and uncertainty | Mineral proxies only; not a direct bulk soil chemistry or elemental sulfur assay |
| NASA SMAP | Soil moisture products | Use only when the selected product and spatial resolution are appropriate |
| NASA GPM IMERG | Precipitation estimates | Rainfall context; not a direct surface-material measurement |
| NASA aerosol products | Aerosol optical depth and related atmospheric indicators | Aerosol optical depth is not identical to ground-level dust deposition or abrasive dust loading |

Useful official starting points:

- NASADEM: https://data.nasa.gov/dataset/nasadem-merged-dem-global-1-arc-second-v001
- MODIS MOD11A2: https://ladsweb.modaps.eosdis.nasa.gov/missions-and-measurements/products/MOD11A2
- NASA POWER meteorological data sources: https://power.larc.nasa.gov/docs/methodology/data/sources_meteorology/
- NASA EMIT mineral products: https://data.nasa.gov/dataset/emit-l3-aggregated-mineral-spectral-abundance-and-uncertainty-0-5-deg-v002

NASA POWER's MERRA-2 meteorological data are provided on a relatively coarse grid (approximately 0.5° latitude by 0.625° longitude). Use them for regional context, not for claims about a small test pad or a local microclimate.

NASA EMIT mineral products include gypsum among their target minerals. Gypsum is a sulfate mineral, but **gypsum abundance is not equivalent to elemental sulfur concentration in ppm**. Do not convert EMIT mineral abundance into the `sulfur_ppm` simulation input without a validated conversion and appropriate chemical data.

For high-latitude sites beyond NASADEM/SRTM coverage, identify suitable additional DEM products such as Antarctic or Arctic elevation datasets. Clearly label non-NASA sources and do not misrepresent them as NASA datasets.

## C. Field and geochemical data needed for a meaningful sulfur test

A remote-sensing mineral proxy alone is not enough to establish the sulfur concentration experienced by a piece of equipment.

For a defensible sulfur-bearing material exposure study, the eventual data schema should include:

- Total sulfur concentration and its measurement basis.
- Chemical form/speciation: for example, sulfate minerals, gypsum, elemental sulfur or other sulfur-bearing compounds.
- Sample collection coordinates and depth.
- Sample preparation and laboratory assay method.
- Moisture content and pH.
- Temperature and relative humidity during exposure.
- Material composition, grade and surface finish of the test article.
- Coating or protective layer, if any.
- Exposure geometry and contact conditions.
- Exposure duration.
- Replicate count and measurement uncertainty.
- Degradation measurement method.
- Data provenance, laboratory, protocol and calibration information.

If these variables are not available, clearly label the model as a preliminary dataset-fit experiment, not a validated corrosion or equipment-life model.

## D. Canonical site data schema

Use a structured record for every candidate location. Suggested fields:

- `site_id`
- `site_name`
- `country`
- `administrative_region`
- `latitude`
- `longitude`
- `boundary_or_polygon` (if available)
- `coordinate_source`
- `geology`
- `lithology`
- `mineralogy`
- `sulfur_measurement_ppm` (only if directly supported)
- `sulfate_or_gypsum_proxy`
- `elevation_m`
- `slope_deg`
- `roughness_metric`
- `land_surface_temp_day_c`
- `land_surface_temp_night_c`
- `air_temp_min_c`
- `air_temp_max_c`
- `wind_speed_ms`
- `wind_direction_deg`
- `precipitation_mm`
- `soil_moisture`
- `dust_or_aerosol_indicator`
- `water_or_ice_indicator`
- `land_cover`
- `protected_area_status`
- `land_owner_or_manager`
- `access_constraints`
- `emergency_access`
- `communications_context`
- `data_source_ids`
- `last_verified`
- `data_quality_notes`

Do not fill fields with guessed values. Use `null`, “unknown”, or “not assessed” when evidence is missing.

---

# 6. Administrative and permit feasibility layer

This is a major differentiator of the project.

The platform must not simply ask whether a location resembles the Moon. It must ask whether a proposed field campaign could actually take place there.

## A. Separate access from activity permission

For each candidate, distinguish:

- Permission to enter the land.
- Permission to conduct research.
- Permission to operate equipment.
- Permission to drive or deploy robotic platforms.
- Permission to collect, drill, excavate or remove samples.
- Permission to operate drones or aircraft.
- Permission to use radio transmitters or specialised communications equipment.
- Permission to export samples or temporarily import equipment.
- Permission to work in protected, Indigenous, culturally sensitive or environmentally sensitive areas.

A general land-access permission does not automatically authorise every activity.

## B. Administrative screening checklist

Research the following for each selected site and proposed activity:

1. Country and applicable national restrictions.
2. Land ownership and management authority.
3. Protected-area, national-park or conservation status.
4. Indigenous/local community rights, consultation and consent requirements.
5. Scientific research and fieldwork permits.
6. Equipment deployment and vehicle access.
7. Drilling, excavation and sample collection permissions.
8. Environmental assessment or impact requirements.
9. Drone/aviation permissions, if applicable.
10. Radio-frequency or experimental communications permissions, if applicable.
11. Customs, temporary import and export requirements for equipment.
12. Export-control requirements for the specific hardware and technical data.
13. Sample transport and export requirements.
14. Visa, work authorisation, insurance, liability and emergency response.
15. Permit authority, official form, fees and lead time where these can be verified.

Do not assume all permits apply. Link each requirement to the actual planned activity and local jurisdiction.

## C. Administrative status model

Use these statuses:

- **Feasible pathway identified:** No obvious blocking issue found in the sources reviewed, and a plausible official permission pathway is documented. This is not permit approval.
- **Conditional:** Additional permits, consultations, agreements or approvals appear necessary.
- **Restricted / legal review required:** Significant legal, policy, export-control, national-security or access restrictions have been identified.
- **Unverified:** The available evidence is insufficient to determine feasibility.

Show a short reason and the supporting official source for every status.

Do not make a site “green” simply because a website does not mention restrictions.

## D. China example: apply the law accurately

NASA's public guidance on restrictions involving China states that NASA-funded bilateral participation, collaboration or coordination with Chinese entities can be restricted. NASA also states that publicly available Chinese data may be used without entering into an agreement with a Chinese organisation.

Therefore:

- Do not label every location in China automatically impossible to use.
- Flag relevant NASA-funded bilateral collaboration restrictions.
- Distinguish public-data use from a physical field campaign, local partnership, contract, equipment transfer or agreement.
- Identify the exact activity and parties involved.
- Mark the case “Restricted / legal review required” when facts are incomplete or a restriction may apply.
- Require review by the relevant NASA/US government contracting, export-control and legal authorities before any real campaign.

Official starting point: https://science.nasa.gov/researchers/sara/faqs/prc-faq-roses/

This is a legal-research aid, not a legal opinion. Laws, appropriations, agency guidance and sanctions can change. Re-check official sources when the app is used.

## E. AI Permit Assistant

Create an assistant that can:

- Summarise the likely permit pathway for the selected site and test activity.
- Produce a checklist of forms and supporting documents.
- Identify the responsible authority.
- Link to official application pages and downloadable forms.
- Draft a cover letter or application narrative using only user-provided and verified facts.
- Prefill a draft template where the relevant information is known.
- Mark missing fields and assumptions clearly.
- Produce a permit preparation package for human review.

The assistant must **not**:

- Claim a permit is approved.
- Guarantee approval.
- Invent application URLs, government contacts, fees or processing times.
- Submit applications or sign declarations.
- Provide a definitive legal clearance.
- Hide uncertainty or skip required consultation.

If no LLM API key is available, implement a deterministic, rule-based checklist and template generator. Label it honestly; do not pretend a live AI service is connected.

Every permit record should include:

- `permit_name`
- `activity_covered`
- `authority`
- `jurisdiction`
- `official_url`
- `required_documents`
- `fee` (only if verified)
- `lead_time` (only if verified)
- `legal_basis_or_guidance`
- `last_checked`
- `status`
- `confidence`
- `human_review_required`

---

# 7. Equipment Exposure Lab — one stressor only

This is the core simulation for the MVP.

## A. Initial simulation objective

Build a small, transparent regression model that estimates the degradation response associated with **one environmental stressor: sulfur-bearing material exposure**.

The model must use:

- Input 1: `sulfur_ppm`
- Input 2: `exposure_days` (the time/fast-forward control)
- Output: `degradation_mg_cm2`

This is one environmental stressor with exposure duration as the time variable. Do not add temperature, humidity, wind, dust abrasion or radiation as additional model inputs in this first simulation.

## B. Supplied dataset

The user has supplied:

`simulation_dataset.csv`

Observed structure:

| Column | Interpretation from column name | Role |
|---|---|---|
| `sulfur_ppm` | Sulfur concentration in ppm | Model input |
| `exposure_days` | Exposure duration in days | Model input / time control |
| `degradation_mg_cm2` | Recorded degradation per area | Prediction target |

Initial inspection of the supplied file found:

- 1,000 rows.
- 3 numeric columns.
- No missing values.
- No exact duplicate rows.
- 1,000 unique sulfur concentration values.
- 1,000 unique exposure-duration values.
- 990 unique degradation values.
- `sulfur_ppm` range: approximately 206.48–1599.60.
- `exposure_days` range: approximately 4.22–999.41.
- `degradation_mg_cm2` range: 0.01–1.03786.

The file does not include a data dictionary, experimental protocol, source citation, material composition, sulfur speciation, sample IDs, replicate information, or measurement uncertainty. The column names suggest units, but the experimental meaning and provenance have not been independently verified.

Therefore, label it:

**“Supplied sulfur-exposure dataset — provenance and physical test conditions not documented.”**

Do not claim that it is a NASA dataset or a verified lunar-regolith experiment.

## C. Preliminary model experiment (recompute in the application)

An exploratory comparison was performed on the supplied CSV using an 80/20 shuffled train/test split with `random_state=42` and five-fold shuffled cross-validation.

Preliminary results:

| Model | Test R² | Test MAE | Test RMSE | Mean 5-fold CV R² |
|---|---:|---:|---:|---:|
| Linear Regression | 0.8133 | 0.06117 | 0.07957 | 0.8319 |
| Polynomial Regression, degree 2 | 0.9347 | 0.03031 | 0.04707 | 0.9365 |
| Random Forest | 0.9280 | 0.03171 | 0.04940 | 0.9228 |
| Gradient Boosting | 0.9307 | 0.03182 | 0.04849 | 0.9269 |

The polynomial degree-2 model is a reasonable initial candidate, but the app must re-run the pipeline and verify the results in its own environment.

These metrics describe how well models fit and predict the supplied dataset under this split. They do **not** establish physical accuracy on real equipment.

## D. The 87–92% target: define it correctly

The requested 87–92% target must be translated into a regression performance target, not casually labelled “accuracy”.

Use held-out **R²** as one performance indicator, with a desired range of approximately 0.87–0.92 or better if justified. Also report MAE and RMSE in the target's real units.

Rules:

- Do not force the model to reach a target by manipulating the test set.
- Do not tune against the final test set.
- Do not hide a poor result.
- If the result is below target, explain why and what data is missing.
- If R² exceeds 0.92, report the actual value rather than reducing it.
- R² is not a percentage probability that an individual prediction is correct.
- Good statistical fit does not prove the physical mechanism is correct.

## E. Required ML workflow

Implement a reproducible pipeline:

1. Load the supplied CSV.
2. Validate expected column names and numeric types.
3. Check missing values, duplicate rows, negative values, invalid ranges and obvious data-quality problems.
4. Preserve a raw copy; do not overwrite source data.
5. Document every cleaning or preprocessing action.
6. Do not remove outliers automatically without a reason and a recorded decision.
7. Split data into training and test partitions before fitting transformations.
8. Use a scikit-learn `Pipeline` so preprocessing is fitted only on training folds.
9. Compare at least:
   - Mean/baseline predictor.
   - Linear regression.
   - Polynomial regression (degree 2).
   - Random forest or gradient boosting.
10. Use five-fold cross-validation on the training data where practical.
11. Evaluate the held-out test set only after model selection.
12. Report R², MAE and RMSE.
13. Produce actual-vs-predicted and residual plots.
14. Save the selected model and a model metadata file.
15. Record model version, features, target, split seed, CV design, metrics, date and dataset fingerprint/hash.

If the dataset later includes repeated measurements from the same specimen, material or experiment, use group-aware validation rather than allowing related samples to leak across train and test partitions.

## F. Simulator interface

Build a clear interactive panel:

- Sulfur concentration slider or numeric input, constrained to the observed range by default.
- Exposure-time slider in days, constrained to the observed range by default.
- A “Fast-forward exposure” control that advances the selected exposure time through the supported range.
- A live prediction of `degradation_mg_cm2`.
- A time-versus-predicted-degradation curve.
- A visible marker for the selected time.
- A model uncertainty interval, only if it is computed using a defensible method.
- A warning if a user enters a value outside the training-data range.
- A display of the exact inputs used for the prediction.
- A short explanation of what the result means and what it does not mean.

**Important:** Fast-forwarding is a repeated prediction at different exposure durations using the fitted regression model. It is not a validated accelerated-aging or chemical-kinetics model. Do not describe it as a physically accelerated reaction unless a validated kinetic model and supporting data are added.

The current dataset has no material identity. Do not offer a material selector that implies the model knows how different alloys, coatings or rover components behave. The output should be labelled as a generic dataset response, not a certified rover-life prediction.

## G. Future stressors (do not implement now)

Keep the architecture extensible for future independent modules such as:

- Dust abrasion.
- Thermal cycling.
- Moisture/humidity exposure.
- Wind-driven particulate impact.
- Radiation exposure.
- Mechanical vibration.
- Regolith grain-size and angularity effects.
- Material/coating-specific degradation.

Add a new stressor only when an appropriate dataset, target variable, experimental context and validation method exist.

---

# 8. Validation, transparency and scientific trust

Create a dedicated **Validation & Evidence** page.

It must show:

## Data audit

- Source filename and provenance status.
- Number of rows and columns.
- Missing-value count.
- Duplicate count.
- Column data types.
- Min/max and units.
- Outlier review method.
- Preprocessing steps and their rationale.
- Known data limitations.

## Model validation

- Train/test split method and seed.
- Cross-validation method and fold count.
- Model comparison table.
- R², MAE and RMSE.
- Actual-vs-predicted plot.
- Residual plot.
- Baseline comparison.
- Model-selection rationale.
- Extrapolation warnings.
- Confidence/uncertainty method.

## Confidence communication

Use confidence language that is tied to evidence:

- **High statistical confidence:** strong held-out and cross-validation results, good data coverage and stable residual behaviour.
- **Moderate statistical confidence:** useful predictive performance but meaningful uncertainty or data limitations.
- **Low statistical confidence:** sparse, poorly documented or unstable data.

Keep statistical confidence separate from physical validation.

If no independent physical experiment is available, explicitly say:

**“The model has been statistically evaluated on the supplied dataset, but independent physical validation has not been established.”**

## Required outputs

Generate:

- `model_card.md`
- `data_manifest.md`
- `validation_report.md`
- A downloadable report from the app, preferably PDF or HTML.
- A CSV of site comparison results where data support it.

The validation report should document exactly what was done: cleaning, preprocessing, model choice, benchmarks, split design, metrics, residual analysis, uncertainty, known limitations and next experiments needed.

---

# 9. Recommended application architecture and technology

First inspect the existing project. If a stack is already present and working, use it.

If no project exists, choose the fastest maintainable stack for a six-hour build:

- Python 3.11+
- Streamlit for the web application.
- Pandas and NumPy for data processing.
- Scikit-learn for the regression pipeline.
- Plotly for interactive charts.
- Folium and `streamlit-folium` for the map.
- Requests for lightweight public API calls.
- Joblib for model persistence.

Avoid heavy frameworks and infrastructure that do not materially improve the demo.

Suggested structure:

```text
terraops/
├── app.py
├── pages/
│   ├── 1_Mission_Dashboard.py
│   ├── 2_Analog_Discovery.py
│   ├── 3_Site_Dossier.py
│   ├── 4_Access_and_Permits.py
│   ├── 5_Exposure_Lab.py
│   └── 6_Validation_Report.py
├── src/
│   ├── data_ingestion.py
│   ├── earth_data.py
│   ├── lunar_reference.py
│   ├── analog_scoring.py
│   ├── admin_feasibility.py
│   ├── permit_assistant.py
│   ├── simulation.py
│   ├── model_validation.py
│   └── report_generator.py
├── data/
│   ├── simulation_dataset.csv
│   ├── candidate_sites.json
│   └── data_manifest.json
├── artifacts/
│   ├── model.joblib
│   └── model_metadata.json
├── docs/
│   ├── model_card.md
│   ├── data_manifest.md
│   └── validation_report.md
├── requirements.txt
├── README.md
└── .env.example
```

Modify this structure if the existing project requires it.

## Data integration strategy for six hours

Prioritise data sources that can be integrated reliably:

1. Use the supplied CSV for the working ML simulation.
2. Integrate NASA POWER for a selected site's regional meteorological context if the API is reachable.
3. Use a small, curated candidate-site registry with verified coordinates and citations.
4. Link to official NASADEM, MODIS, EMIT, LRO and PDS products in the site dossier.
5. Add actual raster or satellite-layer processing only if it can be completed and verified within the time limit.

Do not claim that raw NASADEM, EMIT or LRO rasters are being analysed if the application only displays a link or a static summary.

For any live API:

- Handle timeouts and rate limits.
- Cache responses.
- Show retrieval date.
- Show the source and units.
- Provide a fallback when the API is unavailable.
- Do not require a secret API key unless necessary; document setup if one is required.

---

# 10. User interface and visual direction

Create a professional, modern mission-operations dashboard.

## Visual style

- Dark navy or charcoal base.
- Restrained electric-blue and cyan highlights.
- Warm amber/orange for warnings and conditional states.
- Clear typography and high contrast.
- Compact data cards, readable charts and strong map hierarchy.
- Avoid excessive gradients, clutter, fake telemetry and decorative gauges that do not represent real data.
- Use clear source and confidence labels.

## Navigation

Use these pages or equivalent tabs:

1. **Mission Brief** — Artemis IV context and objectives.
2. **Discover Sites** — interactive map and filters.
3. **Site Dossier** — scientific evidence and analogue limitations.
4. **Access & Permits** — administrative feasibility and permit assistant.
5. **Exposure Lab** — sulfur exposure simulation.
6. **Validation & Evidence** — data processing, benchmarks, model confidence and report export.

## Essential interaction

The main demonstration path must work:

`Mission Brief → Select Earth Site → Inspect Analogue Evidence → Check Access & Permits → Open Exposure Lab → Change Sulfur/Time → View Prediction → Generate Report`

No dead buttons. Every visible control must perform its labelled action.

---

# 11. Six-hour execution plan

Work in this order. If time becomes tight, protect the complete end-to-end user journey.

| Time | Priority | Deliverable |
|---|---|---|
| 0:00–0:30 | Inspect repository and files; set up environment | App boots; CSV is read |
| 0:30–1:15 | Candidate registry and interactive map | Map markers and site selection work |
| 1:15–2:00 | Site dossier and separate analogue/operational assessments | Selected site has evidence and limitations |
| 2:00–2:45 | Administrative layer | Permit checklist, status, official links and AI/rule-based draft |
| 2:45–4:15 | ML pipeline and exposure lab | Working model, time slider, predictions and plots |
| 4:15–5:15 | Validation report and export | Model metrics, data audit and downloadable report |
| 5:15–6:00 | QA, visual polish and demo preparation | Stable application and concise presentation |

## Priority order if behind schedule

1. Application runs.
2. Map and site selection work.
3. Site dossier explains evidence and limitations.
4. Administrative status and permit checklist work.
5. Sulfur exposure simulator works with the supplied CSV.
6. Validation metrics and plots are correct.
7. Report export and visual polish.
8. Optional live integrations.

Do not sacrifice scientific honesty to add more features.

---

# 12. Acceptance criteria

The project is complete only when:

- [ ] The application starts using the documented command.
- [ ] The supplied `simulation_dataset.csv` is loaded and validated.
- [ ] The app explains Artemis IV using current public information.
- [ ] The app does not confuse Artemis III candidate regions with confirmed Artemis IV landing sites.
- [ ] The map shows only candidate locations with verified or explicitly approximate coordinates.
- [ ] A user can select a site and view its scientific analogue evidence.
- [ ] Environmental analogue score, operational feasibility, administrative readiness and data confidence are separate.
- [ ] Missing data and proxy measurements are clearly labelled.
- [ ] The administrative layer shows permit pathways and official sources, not unsupported legal conclusions.
- [ ] The China example is handled with the bilateral-cooperation nuance described above.
- [ ] The permit assistant produces a draft/checklist but does not submit an application.
- [ ] The exposure lab has one stressor only: sulfur-bearing material exposure.
- [ ] Exposure time can be advanced and the prediction curve updates.
- [ ] The model is evaluated using a reproducible train/test split and cross-validation.
- [ ] R², MAE and RMSE are displayed correctly.
- [ ] The app never labels R² as literal real-world accuracy.
- [ ] The app states that independent physical validation is not established unless supporting experimental evidence is provided.
- [ ] A validation report documents data cleaning, preprocessing, benchmarking and limitations.
- [ ] There are no fake NASA endorsements, fake permits, fake live data or nonfunctional controls.

---

# 13. Suggested hackathon demonstration

Tell the story in this order:

1. **The mission:** Artemis IV is preparing for crewed operations near the lunar South Pole. Equipment must be tested against relevant environmental challenges before deployment.
2. **The problem:** A visually similar Earth site may still be scientifically weak, inaccessible or legally unusable.
3. **The discovery:** TERraOps compares candidate sites using measured environmental and geological evidence.
4. **The administrative breakthrough:** Before recommending a field campaign, it checks the jurisdiction, land manager, permits, restrictions and required approvals.
5. **The engineering experiment:** Select the sulfur-bearing material exposure scenario, set concentration, and fast-forward exposure time.
6. **The evidence:** Show the predicted degradation, validation metrics, residuals, uncertainty and data limitations.
7. **The next step:** Once the single-stressor model is independently validated with suitable material-specific experiments, additional environmental factors can be introduced one at a time.

## Short project pitch

“TERraOps turns terrestrial analogue discovery into a mission-readiness workflow. Instead of simply finding places on Earth that look like the Moon, it evaluates whether a site reproduces a specific lunar-relevant condition, whether an equipment-testing campaign could realistically and legally operate there, and how a test article may respond to a controlled environmental stressor. Every recommendation is linked to evidence, every permit pathway is traceable, and every model prediction comes with validation and limitations.”

---

# 14. Source register

Use the following source hierarchy: current NASA mission announcements first for mission status; NASA/PDS/Earthdata documentation for datasets; official government and land-management authorities for permits; peer-reviewed or recognised scientific sources for analogue claims.

## User-provided files

Inspect and use these files:

- `Artemis IV - NASA.pdf`
- `Artemis Science - NASA.pdf`
- `Human Landing System - NASA.pdf`
- `NASA Provides Update on Artemis III Moon Landing Regions - NASA.pdf`
- `Spacesuit for NASA’s Artemis III Moon Surface Mission Debuts.pdf`
- `PERPLEXITY.pdf`
- `simulation_dataset.csv`
- `Pasted text.txt`

The Perplexity document is a research summary, not a substitute for primary-source verification. Use it to seed candidate environments and comparison criteria, then verify important claims.

## Current NASA mission sources

- Artemis IV mission page: https://www.nasa.gov/mission/artemis-iv/
- NASA, Partners Accelerate Lander Development for 2028 Moon Missions (23 October 2026): https://www.nasa.gov/missions/artemis/nasa-partners-accelerate-lander-development-for-2028-moon-missions/
- NASA Provides Update on Artemis III Moon Landing Regions: https://www.nasa.gov/news-release/nasa-provides-update-on-artemis-iii-moon-landing-regions/
- NASA Moon Base FAQ: https://www.nasa.gov/moon-base-frequently-asked-questions/

## Lunar data

- LRO data products: https://science.nasa.gov/mission/lro/data-products/
- NASA high-resolution LOLA South Pole products: https://pgda.gsfc.nasa.gov/products/78
- LRO Diviner Polar Resource Products: https://pds.nasa.gov/ds-view/pds/viewDataset.jsp?dsid=LRO-L-DLRE-5-PRP-V2.0
- LRO science and data, including LEND: https://science.nasa.gov/mission/lro/science-and-data/
- NASA Lunar South Pole data context: https://fireballs.ndc.nasa.gov/mem/library/lunarsouthpole.html

## Earth data

- NASADEM: https://data.nasa.gov/dataset/nasadem-merged-dem-global-1-arc-second-v001
- MODIS MOD11A2: https://ladsweb.modaps.eosdis.nasa.gov/missions-and-measurements/products/MOD11A2
- NASA POWER meteorological data sources: https://power.larc.nasa.gov/docs/methodology/data/sources_meteorology/
- NASA EMIT mineral product: https://data.nasa.gov/dataset/emit-l3-aggregated-mineral-spectral-abundance-and-uncertainty-0-5-deg-v002
- NASA EMIT 60 m mineral identification product: https://doi.org/10.5067/EMIT/EMITL2BMIN.001

## Administrative/legal research

- NASA Science PRC FAQ for ROSES: https://science.nasa.gov/researchers/sara/faqs/prc-faq-roses/
- NASA Office of Inspector General, NASA's Compliance with Federal Export Control Laws: https://oig.nasa.gov/wp-content/uploads/2025/02/ig-25-003.pdf

For actual candidate sites, identify the relevant country's official land-management, environmental, research, aviation, radio, customs and export-control authorities. Do not infer permit requirements from blogs when an official authority is available.

---

# 15. Final instruction to the coding agent

Start by inspecting the repository and supplied files. Then implement the application in the simplest suitable stack.

Do not stop after writing an architecture document. Build the working MVP, run it, test the main user journey, fix errors, and provide:

1. The exact command to run the application.
2. The list of implemented features.
3. The data sources actually integrated versus merely linked.
4. The model-validation results actually reproduced.
5. The known limitations and missing data.
6. The report/export location.
7. A short demo walkthrough suitable for the hackathon judges.

**The winning idea is not “we found the most Moon-like place on Earth.” It is “we built an evidence-driven way to decide where a specific Artemis-relevant equipment test can be conducted, what approvals it may require, and how confidently we can predict the test article's response.”**
