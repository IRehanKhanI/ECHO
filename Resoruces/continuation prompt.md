# PROMPT 2 — TERraOps User Journey, Discovery Flow & Non-Breaking Integration

## Mission

Continue development of the existing **TERraOps — Artemis IV Terrestrial Analog & Equipment Readiness Platform** application.

This is a **continuation and integration prompt**, not a request to rebuild the product. The previous master prompt established the product scope, research constraints, candidate sites, datasets, administrative feasibility layer, sulfur-only equipment simulation, model-validation requirements, and suggested technical architecture.

Your task now is to configure the application into a coherent, intuitive end-to-end user journey while preserving the current working website.

**Primary objective:** Make the user experience feel like a guided mission workflow:

**Mission Dashboard → Lunar South Pole Discovery → Earth Analog Matching → Ranked Site Dossiers → Administrative Feasibility → Equipment Exposure Simulation → Validation & Evidence Report**

Do not break existing routes, components, data, styling, models, or working features while implementing this flow.

---

# 1. Non-negotiable integration rules — protect the current website

Before changing anything:

1. Inspect the complete existing repository, running application, routes, components, styles, state management, data files, model artifacts, and configuration.
2. Run the application and record what currently works. If tests or build scripts exist, run them and note the baseline.
3. Identify the current framework and architecture. **Do not replace the framework or introduce a new architecture just because you prefer it.**
4. Create a short implementation map showing:
   - Existing pages/routes.
   - Existing reusable components.
   - Existing data sources and schemas.
   - Existing simulation/model pipeline.
   - Existing map and 3D components.
   - Existing navigation and styling conventions.
5. Reuse and extend existing components wherever practical. Avoid duplicate pages, duplicate datasets, and parallel versions of features that already exist.
6. Preserve existing working functionality and existing data. Do not delete, rename, or overwrite working files without a clear technical reason.
7. Do not replace real data with mock data. If mock data are needed for a UI state, label them visibly as illustrative.
8. Implement incrementally. After each major stage, run the app/build/tests and fix regressions before continuing.
9. Keep changes modular and reversible. Prefer adding components, services, adapters, and route extensions over rewriting core files.
10. Do not silently change model inputs, units, target definitions, preprocessing, train/test split, or evaluation metrics.
11. Do not make a feature appear functional when it is only a visual placeholder. Clearly label unavailable, estimated, illustrative, or not-yet-integrated functionality.
12. Do not introduce new dependencies unless they solve a real requirement and are compatible with the current project. Explain why any new dependency is needed.
13. If the existing app already has a dashboard, discovery page, map, simulator, or report, improve and connect it rather than creating a second copy.

## Required first output from the coding agent

Before editing, briefly report:

- What framework and architecture the current app uses.
- Which relevant features already exist and work.
- Which requested flow steps are missing or incomplete.
- The files/components you intend to reuse.
- Any significant risks to backward compatibility.

Then proceed with implementation. Do not stop after producing a plan unless a genuine blocker prevents safe changes.

---

# 2. Product experience and navigation

The site should feel like a mission-support decision tool, not a collection of unrelated hackathon pages.

## Main navigation

Use the existing navigation style if one exists. Organize it around these primary destinations:

1. **Mission Dashboard**
2. **Discovery**
3. **Site Comparison / Shortlist**
4. **Administrative Layer**
5. **Equipment Lab**
6. **Validation & Reports**

A persistent workflow indicator or stepper should show the user's progress. It should make clear which steps are complete, in progress, or not yet available.

Keep the navigation concise. Do not force users to visit every page in a fixed order if they want to explore, but guide first-time users through the recommended sequence.

## Global UX principles

- Explain technical terms in plain language, with optional deeper technical detail.
- Keep the most important decision and evidence visible first; put detailed metadata in expandable panels.
- Always show units, source, date/version, spatial resolution, and uncertainty where available.
- Distinguish measured data, derived metrics, model outputs, assumptions, and illustrative content visually.
- Provide useful empty, loading, error, and unavailable states.
- Preserve the user's selected lunar region, selected Earth site, test objective, and simulation settings while moving between relevant pages.
- Provide clear **Back**, **Continue**, and **Change selection** actions.
- Avoid asking the user to re-enter information already selected in the workflow.
- Make the interface usable on a laptop first, while remaining responsive on smaller screens.
- Provide accessible labels, keyboard navigation, readable contrast, and meaningful chart/map legends.

---

# 3. Step 1 — Mission Dashboard: explain why TERraOps exists

The first screen on opening the website must be the **Mission Dashboard**.

Its job is to orient the user to Artemis IV and explain what the platform helps investigate.

## Dashboard content

Display:

- Product name: **TERraOps**.
- Subtitle: **Artemis IV Terrestrial Analog & Equipment Readiness Platform**.
- Mission: NASA Artemis IV.
- Destination: lunar South Pole region.
- Public target timeframe: early 2028, subject to updates from NASA.
- A short mission overview based on current public NASA sources.
- Why a terrestrial analogue is useful for selected equipment and field-operation testing.
- The workflow in a simple visual sequence:
  1. Select a lunar South Pole area.
  2. Compare it with Earth environments.
  3. Evaluate the best candidate locations.
  4. Check access and permit pathways.
  5. Test equipment against one selected environmental stressor.
  6. Review model validation and evidence.
- A prominent **Begin Discovery** / **Explore Lunar Region** action that opens Discovery.

## Mission accuracy

- Use current, sourced NASA information and retain source links.
- Do not imply that NASA has confirmed an exact Artemis IV landing coordinate if it has not.
- Treat the lunar South Pole area as a configurable reference region or selected study area.
- Do not mislabel Artemis III candidate regions as confirmed Artemis IV landing sites.
- State clearly that TERraOps is an independent prototype, not an official NASA system and not endorsed by NASA.

The dashboard should explain the mission without overwhelming the user with every technical parameter. Detailed references belong in a source panel or mission-information page.

---

# 4. Step 2 — Discovery: begin on the Moon, not on Earth

When the user selects **Begin Discovery**, open the Discovery workspace.

The initial Discovery view must show the **Moon first**. The user should understand the target lunar environment before being shown Earth candidates.

## 4.1 Lunar South Pole 3D view

Create or improve a 3D lunar globe/terrain view using the existing 3D/map stack wherever possible.

The view should:

- Open focused on the lunar South Pole reference area.
- Show the selected study region and the area of interest clearly.
- Allow the user to rotate, zoom, pan, and inspect the terrain.
- Include a visible South Pole marker and orientation/context.
- Display the boundary or footprint of the selected region where a reliable boundary is available.
- Provide a 2D fallback if 3D rendering or terrain data are unavailable.
- Include a legend and a short explanation of the layers being shown.

### Lunar data integrity

Use real lunar data products where they are available and suitable, such as LRO/LOLA topography, LRO imagery, and Diviner products. Display product names, source links, resolution, units, coverage, and limitations.

Important cautions:

- Do not draw an exact Artemis IV landing ellipse unless an authoritative source supplies it.
- Do not represent an approximate study region as a NASA-selected landing site.
- If the current 3D terrain is a generic Moon texture or a non-georeferenced visual, label it as a visual reference rather than scientific terrain data.
- If high-resolution polar DEM pixels include interpolated areas, disclose that limitation.
- Do not invent elevation, slope, illumination, temperature, ice, or mineral values to make the globe look complete.

## 4.2 Define the lunar area to investigate

Let the user select a study area through the existing map interaction, if available. Possible controls:

- Choose a preconfigured South Pole reference region.
- Select a named reference area if supported by sourced data.
- Draw/select a region or adjust a study-area boundary when the map stack supports it.
- View a summary of the currently selected area.

After selection, show a compact **Lunar Area Profile** containing the actual available parameters needed for analogue comparison.

Potential parameters include:

- Elevation and elevation range.
- Slope distribution and terrain roughness.
- Crater/rocky terrain indicators, if supported by data.
- Surface temperature and illumination context.
- Mineralogical or surface-composition indicators.
- Regolith/dust-related proxies, if available.
- Hydrogen/ice-related proxies, with careful uncertainty language.
- Other environmental parameters only when supported by an integrated, cited data source.

For every parameter show:
- Value or range.
- Unit.
- Source and product.
- Resolution and observation period.
- Data quality/uncertainty.
- Whether it is measured directly or is a proxy/derived variable.

Do not include a parameter in the matching algorithm merely because it appears in a list. It must have an Earth comparison variable with compatible meaning, units, scale, and adequate coverage—or be explicitly marked unavailable.

## 4.3 Explain what is being matched

Before searching Earth, show a **Matching Criteria** panel.

The user should see which lunar attributes are currently usable for comparison and which are unavailable. Allow the user to include/exclude supported criteria and adjust their importance using transparent weights.

Provide sensible defaults, but:
- Do not hide the weights.
- Do not imply that user-adjustable weights are NASA's internal criteria.
- Normalize variables carefully before combining them.
- Explain how missing values are handled.
- Show when a criterion has low-quality or mismatched data.

A clear action at the end of this step should read **Find Earth Analogues**.

---

# 5. Step 3 — Earth analogue discovery and ranking

After the user chooses **Find Earth Analogues**, the application should compare the selected lunar area with available Earth locations.

The Earth results must be driven by the selected lunar region and supported data—not by a fixed list of attractive locations.

## 5.1 Search strategy

Search the available Earth-site catalogue and integrated datasets for locations that best match the selected lunar criteria.

Prioritize:
1. Strong environmental/terrain similarity supported by data.
2. Sufficient data coverage and data quality.
3. Practical relevance to the selected equipment-testing objective.
4. A plausible administrative and operational pathway.
5. New or less commonly used analogue locations, where evidence supports them.

### Preference for less-used locations

The user prefers discovering **new locations that have not been used by NASA previously**, where possible.

Implement this carefully:

- Treat “previously used by NASA” as a research question, not a binary fact that can be assumed.
- Add a field such as `prior_nasa_use_status` with values:
  - `documented_prior_use`
  - `no_prior_use_found_in_review`
  - `unknown`
- Add evidence URL, source, and review date for each status.
- “No prior use found” must never be displayed as proof that NASA has never used the location.
- Do not sacrifice a substantially better environmental match merely to make a location look novel.
- Make novelty a transparent preference or tie-breaker, not a hidden score penalty.
- Explain why a less-used site is being recommended and what evidence is missing.

## 5.2 Matching and ranking method

Build on the existing scoring method if one already exists. Do not replace a functioning, documented method without reason.

If no reliable matching method exists, implement a transparent baseline:

- Convert comparable measurements to compatible units.
- Align spatial and temporal scales where possible.
- Normalize numeric features using an appropriate documented method.
- Use feature-specific distance or similarity measures.
- Apply visible user-selected weights.
- Handle missing data explicitly; do not treat missing as zero.
- Report data coverage alongside the match score.
- Include uncertainty and a warning when a site has insufficient comparable data.

A possible weighted distance formulation is acceptable, but document the exact formula and its limitations. Avoid calling the score a probability or scientific certainty.

**Important:** A 92% match score does not mean that the Earth site is 92% identical to the Moon. Label it as a relative similarity score under the chosen features, weights, data and method.

Keep separate indicators for:
- Environmental match.
- Data completeness/quality.
- Operational relevance.
- Administrative feasibility.
- Novelty/prior-use evidence.

Do not hide all these dimensions inside one opaque score.

## 5.3 Results screen

Show a ranked list of the strongest Earth candidates.

Each result card should contain:

- Rank.
- Site name and country.
- Small map/thumbnail preview if available.
- Analogue category.
- Environmental match score, clearly defined.
- Data coverage/completeness.
- Main matching factors.
- Main mismatches.
- Administrative status (preliminary).
- Prior NASA use evidence status.
- A **View Site Breakdown** action.

Provide:
- Map and list views.
- Filters by country, environment type, data completeness, administrative status and prior-use evidence.
- A way to compare two or more shortlisted locations.
- A way to save a location to the user's shortlist.

If a location is not sufficiently supported by data, show it as an unranked candidate or low-confidence result rather than inventing a score.

---

# 6. Step 4 — Site Breakdown: explain exactly why the location matches

When a user clicks a ranked Earth location, open a detailed **Site Dossier**.

This is a key decision screen. It must answer:

**How similar is this Earth location to the selected lunar area, what is different, and what can realistically be tested here?**

## 6.1 Side-by-side comparison

Show the selected lunar area and Earth site side by side.

For each comparable feature, show:

- Lunar value/range.
- Earth value/range.
- Unit.
- Difference or distance.
- Direction of difference.
- Source and resolution on both sides.
- Data quality and uncertainty.
- Whether the comparison is direct, derived, or proxy-based.

Use clear visualizations such as paired bars, range bands, radar charts only when appropriate, and terrain/map views. Do not use decorative charts that obscure the underlying values.

## 6.2 Similarities and differences

Provide an evidence-based explanation:

**Why this site matches**
- Identify the strongest matching attributes.
- Explain why each attribute matters for the chosen test objective.
- Cite the actual datasets.

**Where it differs**
- Identify the largest mismatches.
- Explain whether the mismatch is manageable, critical, or outside the scope of the test.
- Explain which lunar conditions cannot be recreated at this Earth site.

**Data limitations**
- Missing values.
- Coarse spatial resolution.
- Different observation periods.
- Proxy variables.
- Measurement uncertainty.
- Any interpolation or modelling assumptions.

Do not present a generated AI explanation as evidence. The explanation must be grounded in the underlying comparison results and linked sources.

## 6.3 What is the best thing to test at this location?

The MVP is for **equipment testing only**. Do not implement astronaut training or human testing as an active test workflow.

For each site, recommend suitable equipment-focused test objectives based on the evidence. Examples may include:

- Rover mobility or wheel/track interaction with the local terrain.
- Tool/material contact and wear.
- Instrument enclosure exposure.
- Sample-handling tool operation.
- Deployment and handling of equipment in remote field conditions.
- Exposure of a test coupon or component to the selected chemical/mineral stressor.

These are possible engineering use cases, not claims that NASA has specified them as official Artemis IV tests.

The dossier should include a section called **Recommended Test Applications** with:
- Recommended equipment/test type.
- Why the site is relevant.
- Which environmental features support the recommendation.
- Which features it cannot test.
- What additional measurements or approvals would be needed.

Do not recommend human/crew tests in the current build. You may show a disabled **Future scope: human/crew operations** label, clearly marked as not implemented.

---

# 7. Step 5 — Administrative Layer: can the activity actually happen here?

The Administrative Layer is not a generic country safety badge. It is an activity-specific feasibility assessment.

The same location may be usable for a short non-invasive equipment trial but not for drilling, sample collection, excavation, construction, or long-duration deployment. The app must evaluate the actual proposed activity.

## 7.1 Start with the selected site and proposed activity

When the user opens the Administrative Layer from a Site Dossier, carry forward the selected location and ask for/select the intended activity.

Use the existing user-input patterns. Keep the first interaction simple. Potential activity types:

- Non-invasive equipment operation.
- Temporary equipment deployment.
- Surface sampling.
- Drilling or excavation.
- Vehicle/rover testing.
- Drone or aerial survey.
- Radio/communications equipment operation.
- Temporary field camp or infrastructure.

The MVP can focus on **non-invasive equipment testing** and temporary equipment deployment, while showing other activity types as additional checks or future extensions.

## 7.2 Administrative checks

Research and display the relevant requirements for the exact location and activity. Consider, where applicable:

- Land ownership and land manager.
- Protected-area or conservation status.
- Research/scientific activity permits.
- Land access and temporary equipment-use permissions.
- Environmental impact review or assessment.
- Sampling, collection, drilling or excavation approvals.
- Indigenous/community rights, consultation and consent requirements.
- Cultural heritage and archaeological restrictions.
- Drone/aviation permissions.
- Radio-frequency and telecommunications permissions.
- Customs, temporary import/export and equipment transport.
- Export controls, sanctions and restricted-party considerations.
- Insurance, liability, emergency response and safety plans.
- Local institutional, university or research-station agreements.

Do not display every item as required everywhere. Mark each item as:
- Applicable and verified.
- Potentially applicable — authority confirmation needed.
- Not applicable based on cited evidence.
- Unknown / research required.

Every important legal/permit statement must have:
- Official authority or primary source.
- Link to the official information or application page.
- Jurisdiction.
- Date checked.
- The activity it applies to.
- A plain-language explanation.
- A confidence/evidence label.

If no authoritative source can be found, say **Not verified**. Do not invent permit names, fees, timelines, agency contacts, or application links.

## 7.3 Administrative outcome

Display one of these transparent statuses:

- **Feasible pathway identified** — credible official information supports a plausible route to permission, but no approval is implied.
- **Conditional** — potentially usable, subject to listed permissions, consultation, or conditions.
- **Restricted / legal review required** — a significant legal, policy, access, export-control, or jurisdictional concern requires specialist review.
- **Unverified** — insufficient authoritative information to reach a responsible conclusion.

Never use a simple “NASA can use this site” green tick unless actual permission has been granted and verified for the proposed activity. A permit pathway is not a permit approval.

## 7.4 Country and international restrictions — China example

The user specifically wants the system to account for locations that may be impractical or restricted for NASA-related work, including a potential site in China.

Implement this as a **specific legal and policy review**, not a blanket country assumption.

For example:
- Distinguish public access to openly published data from field visits, site access, bilateral collaboration, contracts, equipment transfer, funding arrangements, and work with a foreign entity.
- Check the current applicable NASA policies, US law, export controls, sanctions and other relevant rules from authoritative sources.
- NASA-related restrictions may apply to particular bilateral cooperation or coordination with Chinese entities; do not simplify this into “all China sites are automatically illegal” or “all Chinese sites are usable.”
- If the facts are incomplete, mark the location **Restricted / legal review required** or **Unverified**, and explain exactly what needs specialist review.
- Do not make a legal determination on behalf of NASA or the US Government.

Apply the same evidence-based method to every country. Do not unfairly flag a country based on assumptions or geopolitical sentiment.

## 7.5 Permit checklist and action plan

For each site, generate a clear table/checklist containing:

| Requirement | Why it may apply | Authority | Evidence/status | Official link | Next action |
|---|---|---|---|---|---|

The checklist should be specific to the selected site and activity.

Where a permit or permission pathway is verified, provide:
- Official application page or downloadable form.
- Required supporting documents, if officially stated.
- Known submission process, if officially stated.
- Contact point, only if verified from an official source.

Do not fabricate application forms or claim that a generic document is an official permit application.

---

# 8. Step 6 — AI Permit Assistant: help prepare, never falsely submit

Add or improve an AI-assisted permit preparation feature within the Administrative Layer.

The assistant should help the user understand and prepare for the verified requirements.

## Functions

- Summarize official permit guidance in plain language.
- Explain which permissions may apply to the selected activity.
- Generate a document checklist.
- Ask for missing non-sensitive project details needed for a draft.
- Draft a cover letter, research activity description, equipment deployment plan, environmental mitigation statement, or other supporting document when appropriate.
- Populate a draft template only when the official template is available and its fields are understood.
- Highlight facts that need confirmation by the applicant.
- Identify missing information and contradictions.
- Provide citations/links next to claims derived from official sources.

## Mandatory safeguards

- The assistant is a drafting and research aid, not a lawyer, regulator, or permit authority.
- It must never submit an application, sign a declaration, make a payment, or represent that permission has been granted.
- It must not invent an official form, agency contact, legal clause, permit fee, processing time, or required attachment.
- Clearly mark generated text as **Draft — review and verify before submission**.
- Do not fabricate NASA authorization, institutional affiliation, project approvals, insurance, environmental assessments, or applicant credentials.
- Do not create a misleading document that appears to have been issued or approved by an authority.
- If an LLM/API key is unavailable, retain a useful rule-based checklist and document-template fallback.
- Keep user-provided project details separate from verified legal facts and generated suggestions.

Add a **Download Draft** or export action only if the existing app can safely create a document. The downloaded file must be clearly labelled as a draft.

---

# 9. Step 7 — Select a site and enter the Equipment Lab

Once a user has selected an Earth site, the Site Dossier should show a clear action:

**Use this site for an equipment simulation**

The application should carry the selected site's relevant data into the simulator. Do not make the user manually re-enter environmental values that are already available.

Before launching the simulation, show a short confirmation panel:
- Selected Earth site.
- Data source(s) used.
- Selected stressor.
- Which data are measured, derived, proxy-based, or illustrative.
- Any missing values or limitations.

The user should also be able to open the Equipment Lab independently, but the guided route should pre-populate the selected site.

---

# 10. Step 8 — Equipment Lab: one stressor only in the MVP

The current simulation scope remains deliberately narrow.

**MVP: equipment/material degradation under one sulfur-related exposure variable.**

Do not expand to multiple stressors in this implementation. Future stressors may be shown as disabled roadmap items, but must not be mixed into the current model.

## 10.1 Define the stressor correctly

Use the exact variable and units supported by the supplied simulation dataset.

The supplied CSV has the following columns:

- `sulfur_ppm`
- `exposure_days`
- `degradation_mg_cm2`

The dataset has 1,000 rows and no missing values in these columns, but it does not provide essential experimental metadata such as material identity, sulfur chemical speciation, exposure protocol, replicate IDs, measurement uncertainty, or provenance.

Therefore:

- Do not automatically interpret `sulfur_ppm` as a verified field measurement of sulfur salts at an Earth site.
- Do not convert a mineral proxy such as gypsum abundance directly into elemental sulfur ppm.
- Do not imply that the CSV represents every equipment material or a validated lunar corrosion process.
- State that the current dataset supports a limited statistical relationship between the supplied columns, not a universal physical law.
- Keep units visible and preserve the original field definitions until their provenance is verified.
- If site data do not provide a compatible sulfur measurement, let the user enter a scenario value and label it as a user-defined scenario, not a measured site value.

The UI may use the plain-language label **Sulfur-related exposure (dataset variable: sulfur_ppm)**, with an explanation of the dataset's limitations.

## 10.2 Equipment/test article selection

The user should be able to define the test article. At minimum, support:

- Equipment/test article name.
- Component or material description.
- Material category, if known.
- Notes about the intended use.
- Optional material-specific calibration data, if available.

Because the current CSV does not include material identity, do not claim that its model predicts the behaviour of a specific uploaded component unless a validated material-specific model or calibration dataset is available.

## 10.3 User-uploaded equipment models and files

Add an **Upload Equipment / Test Article** area.

The purpose is to let users attach their own equipment information so that the test scenario can be documented and, as future adapters become available, connected to more detailed engineering analysis.

For the current MVP, support safe, practical upload types such as:
- PDF technical datasheets.
- CSV material/property data.
- JSON configuration/metadata.
- Images of a component or equipment setup.

If the existing stack supports it, allow common 3D CAD formats as attachments (for example STEP/STP or STL), but do not claim to run a physics-based CAD simulation merely because a file was uploaded.

For every upload:
- Validate extension, MIME type where possible, file size and parseability.
- Do not execute uploaded files or scripts.
- Store metadata and associate the file with the selected test article.
- Show the filename, type, upload status and extracted metadata, if extraction is supported.
- Ask the user to confirm extracted material properties before using them.
- Preserve the original file and make it removable by the user.
- Explain which uploaded properties are actually used by the current model and which are only stored as reference material.

If CAD preview is supported, display it as a preview only. The current sulfur regression model is not a CAD finite-element solver.

## 10.4 Simulation controls

Build a clear, usable simulation panel with:

- Selected test article.
- Selected Earth site.
- Sulfur exposure concentration (`sulfur_ppm`).
- Exposure duration (`exposure_days`).
- A time fast-forward control.
- Run / update simulation action.
- Reset to site values action, if site values are genuinely available.
- Clear display of input units and allowable model range.

The user should be able to advance exposure time and see how the model's predicted output changes.

### Time fast-forward behaviour

Implement this as a transparent scenario query:
- The user changes the exposure duration.
- The model predicts degradation for the selected concentration and duration.
- The graph updates across the selected time horizon.

Do not call this accelerated-life testing or validated accelerated kinetics unless the underlying experiment supports that interpretation. A slider that changes `exposure_days` is a model query, not proof that real-world ageing has been accelerated.

If the user moves outside the training data range, show a prominent extrapolation warning. Do not silently extrapolate as if the prediction were reliable.

## 10.5 Results

Display:
- Predicted degradation in the dataset's target units.
- A curve of predicted degradation against exposure time.
- The selected concentration and duration.
- Uncertainty or prediction interval only if the model pipeline can calculate it responsibly.
- Training-data range and whether the current query is inside that range.
- Model name/version.
- A concise interpretation.
- Clear limitations.

Do not add unsupported outputs such as remaining useful life, failure probability, corrosion rate, or equipment safety factor unless they are explicitly derived and validated.

---

# 11. Model performance, trust and validation

The user wants a model target around **87–92% performance**. Treat this as an aspiration for evaluation, not a number to force into the interface.

The application must never tune, select, or alter evaluation data merely to display an attractive score.

## 11.1 Existing preliminary model results

The previous analysis of the supplied 1,000-row dataset reported the following preliminary random 80/20 split results (random state 42), with five-fold cross-validation:

| Model | Test R² | Test MAE | Test RMSE | Mean CV R² |
|---|---:|---:|---:|---:|
| Linear Regression | 0.8133 | 0.06117 | 0.07957 | 0.8319 |
| Polynomial Regression, degree 2 | 0.9347 | 0.03031 | 0.04707 | 0.9365 |
| Random Forest | 0.9280 | 0.03171 | 0.04940 | 0.9228 |
| Gradient Boosting | 0.9307 | 0.03182 | 0.04849 | 0.9269 |

These are preliminary results from the supplied dataset, not physical validation and not proof of real equipment or lunar performance. Reproduce and verify them against the actual repository data and preprocessing before displaying them as current model results.

## 11.2 Validation report

Create a transparent **Model Validation & Evidence** panel/report.

Document:

1. Dataset source and provenance status.
2. Dataset dimensions and columns.
3. Units and definitions (verified or unverified).
4. Missing-value checks.
5. Duplicate checks.
6. Outlier investigation and treatment, if any.
7. Data cleaning steps.
8. Feature engineering, if any.
9. Train/test split strategy and random seed.
10. Cross-validation method.
11. Models evaluated.
12. Hyperparameter selection process.
13. Metrics: R², MAE and RMSE at minimum.
14. Baseline model comparison.
15. Residual analysis.
16. Prediction range and extrapolation limitations.
17. Reproducibility information, including code/model version.
18. Known limitations and what further experimental data are needed.

Do not remove outliers simply because they reduce model performance. Document the rationale for every cleaning or exclusion step.

If rows represent repeated measurements from the same material or experiment, a random row split could leak information. If grouping metadata becomes available, use group-aware splitting. If temporal or experimental batches exist, consider a split that tests generalization to unseen batches.

## 11.3 Explain the score honestly

- R² is not literal “percentage accuracy.”
- A test R² of 0.92 does not mean the model is 92% physically accurate.
- Report R² alongside MAE, RMSE, residuals, validation design and dataset limitations.
- Separate **statistical fit to the supplied dataset** from **physical validation against independent experiments**.
- Use a label such as **Dataset fit / statistical validation** for current results.
- Use **Physical validation** only when independent experimental evidence supports it.
- If the result does not reach the desired 0.87–0.92 R² range, report the actual result and explain why. Never manipulate the test set to reach the target.

The interface should communicate confidence through evidence, not through a decorative confidence percentage.

---

# 12. Step 9 — Final report and traceable decision

After a user has selected a site, reviewed its administrative pathway, and run a simulation, provide a **Generate Decision Report** action.

The report should be a concise, evidence-based record of the scenario.

## Report contents

1. TERraOps prototype disclaimer.
2. Artemis IV mission context and source date.
3. Selected lunar reference area and its source data.
4. Selected Earth site and map reference.
5. Analogue matching criteria, weights and method.
6. Ranked alternatives and why the selected site was chosen.
7. Side-by-side similarities and differences.
8. Data coverage, quality and uncertainty.
9. Prior NASA-use research status and evidence.
10. Administrative status for the selected activity.
11. Permit/approval checklist with official links and date checked.
12. Legal and operational uncertainties.
13. Equipment/test article details and uploaded attachments list.
14. Sulfur exposure input and duration.
15. Predicted degradation and model version.
16. Validation metrics and preprocessing summary.
17. Extrapolation warning, if applicable.
18. Limitations and recommended next steps.
19. Source register.

The report must preserve the distinction between facts, assumptions, estimates, model predictions and legal research.

Allow export to PDF or another format supported by the current application. If export is not currently supported, implement the simplest reliable report export compatible with the existing stack rather than destabilizing the application.

---

# 13. Data and service architecture

Use the current app architecture and data schemas. Add a clean separation between:

- Mission/reference data.
- Lunar geospatial data.
- Earth geospatial/environmental data.
- Analogue matching and ranking.
- Site dossier.
- Administrative/legal source records.
- Permit checklist and AI drafting.
- Equipment/test article uploads.
- Sulfur simulation.
- Model evaluation and report generation.

Suggested logical service boundaries (adapt to the existing codebase rather than forcing these exact names):

- `missionService`
- `lunarDataService`
- `earthDataService`
- `analogueMatchingService`
- `siteDossierService`
- `administrativeResearchService`
- `permitAssistantService`
- `equipmentUploadService`
- `sulfurSimulationService`
- `validationReportService`

## Data provenance requirements

Every important data field should retain, where possible:

- Value.
- Unit.
- Source name.
- Source URL or identifier.
- Date/version.
- Spatial resolution.
- Temporal coverage.
- Quality/uncertainty.
- Processing steps.
- Whether measured, derived, proxy, user-entered, or illustrative.

Never silently mix incompatible data. If a lunar variable and Earth variable are not comparable, show that it is excluded from scoring and explain why.

## Keep the matching engine separate from legal feasibility

Environmental similarity must not be used as a proxy for legal access. A site can be an excellent environmental match and still be unavailable for the proposed activity.

Likewise, administrative feasibility must not change the scientific match score. Show both dimensions independently.

---

# 14. Visual design and interaction direction

Keep the existing visual identity if it is already consistent and polished. Do not redesign the entire site unnecessarily.

The experience should feel:
- Scientific.
- Mission-oriented.
- Modern.
- Calm and uncluttered.
- Credible and evidence-led.

Use a clear visual hierarchy:
- Mission context at the top of the dashboard.
- Moon-first visual focus in Discovery.
- Side-by-side Earth/Moon evidence in the dossier.
- A distinct administrative status and permit checklist.
- A focused simulator with controls and results.
- Detailed methodology in expandable evidence sections.

Avoid:
- Excessive animations.
- Decorative gauges with no scientific meaning.
- Unsupported percentages.
- Fake live-data indicators.
- NASA logos or branding that could imply official affiliation.
- Huge walls of text on the primary workflow screens.

Use small tooltips or expandable “Why does this matter?” explanations for technical terms.

---

# 15. Acceptance criteria — how to know the flow is complete

The implementation is complete only when the following end-to-end path works without breaking existing functionality:

## A. Dashboard
- [ ] Opening the site lands on the Mission Dashboard.
- [ ] Dashboard explains Artemis IV and the purpose of TERraOps.
- [ ] Mission facts have source links and appropriate caveats.
- [ ] Begin Discovery opens the lunar Discovery workspace.

## B. Moon-first Discovery
- [ ] Discovery initially displays the lunar South Pole reference view.
- [ ] A 3D view works, or a clearly explained 2D fallback is available.
- [ ] Selected study area is visibly marked.
- [ ] Available lunar attributes and their provenance are shown.
- [ ] Matching criteria and weights are understandable.
- [ ] No invented Artemis IV landing coordinates or unsupported scientific values appear.

## C. Earth matching
- [ ] Find Earth Analogues uses the selected lunar area and selected criteria.
- [ ] Results are ranked by a documented, reproducible method.
- [ ] Data coverage and uncertainty are visible.
- [ ] New/less-used locations are a transparent preference, not an unsupported claim.
- [ ] User can open a site breakdown and shortlist a site.

## D. Site dossier
- [ ] Lunar and Earth attributes can be compared side by side.
- [ ] Similarities and mismatches are explained with evidence.
- [ ] The system recommends equipment test applications only.
- [ ] The system clearly explains what the site cannot reproduce.

## E. Administrative Layer
- [ ] Administrative checks are specific to the site and proposed activity.
- [ ] Official sources and application links are provided where verified.
- [ ] Requirements are classified as verified, potential, not applicable, or unknown.
- [ ] Feasibility status does not falsely imply permission.
- [ ] China and other jurisdictional concerns are handled through specific source-backed review, not blanket assumptions.
- [ ] User can see a clear next-action checklist.

## F. AI Permit Assistant
- [ ] Assistant can explain verified requirements and prepare draft supporting documents.
- [ ] Drafts are labelled as drafts.
- [ ] No application is submitted and no approval is claimed.
- [ ] Rule-based fallback works if AI integration is unavailable.

## G. Equipment Lab
- [ ] Selected site can be carried into the simulator.
- [ ] User can define a test article.
- [ ] User can attach supported equipment files.
- [ ] Uploads are validated and never executed.
- [ ] Sulfur-related exposure remains the only active stressor.
- [ ] User can change concentration and exposure duration.
- [ ] Fast-forward is represented as a time-variable model query.
- [ ] Results show units, model range and warnings.
- [ ] The app does not claim a material-specific or CAD physics simulation without evidence.

## H. Validation and reporting
- [ ] Actual model metrics are reproduced from the current data and code.
- [ ] R² is not called literal accuracy.
- [ ] Data cleaning, preprocessing, splitting, CV and benchmarks are documented.
- [ ] Statistical fit is distinguished from physical validation.
- [ ] A decision report can be generated from the selected scenario.

## I. Non-breaking requirement
- [ ] Existing features still work.
- [ ] Existing routes and data have not been unintentionally removed.
- [ ] Build and tests pass, or any pre-existing failures are clearly documented.
- [ ] No new critical console/runtime errors are introduced.

---

# 16. Implementation order

Prioritize a complete journey over polishing every advanced capability.

Implement in this order:

1. **Audit and preserve:** inspect the app, record baseline and map current components.
2. **Navigation and dashboard:** ensure the dashboard is the entry point and Discovery is reachable.
3. **Moon-first Discovery:** connect the lunar view, selected study area and available attribute profile.
4. **Earth matching:** connect selected lunar attributes to the existing Earth data and ranking.
5. **Site dossier:** show traceable side-by-side comparison and equipment-test recommendations.
6. **Administrative Layer:** connect site/activity-specific checks and evidence-backed permit checklist.
7. **AI Permit Assistant:** add safe drafting support with a non-AI fallback.
8. **Equipment Lab:** carry site data forward, support test article uploads and preserve the single sulfur variable.
9. **Validation/report:** connect model evidence and selected scenario to a report.
10. **Regression testing and polish:** run the entire flow from a fresh session and from saved/changed selections.

If time is limited, implement a fully connected path with honest fallbacks rather than superficial versions of all features.

---

# 17. Final instructions to the coding agent

You are modifying an existing application, not starting a new one.

- First understand the current implementation.
- Preserve what works.
- Reuse existing components, state, routes, datasets and model pipeline.
- Connect the workflow end to end.
- Make the Moon the starting point of Discovery.
- Make Earth ranking explainable and evidence-driven.
- Treat administrative feasibility as activity-specific legal research, not a simplistic country score.
- Keep the MVP simulation restricted to one sulfur-related variable and equipment-only use.
- Allow users to attach equipment files, but do not misrepresent file upload as physical simulation.
- Make every prediction and legal statement traceable to evidence.
- Never fabricate data, model accuracy, permits, NASA decisions or approvals.
- Test after each meaningful change.

At completion, provide:

1. A concise summary of what changed.
2. The final user journey and how to navigate it.
3. A list of files/components added or modified.
4. Any new dependencies and why they were needed.
5. Which requested features are fully working, partially working, or still unavailable.
6. Data sources integrated and data sources only linked/planned.
7. Actual model validation metrics and how they were reproduced.
8. Tests/build commands run and their results.
9. Known limitations and recommended next steps.

**Success means a user can start at the Artemis IV mission dashboard, select a real lunar South Pole study area, discover and compare evidence-backed Earth analogues, investigate whether a specific equipment test could be permitted there, run the one-variable sulfur exposure scenario, and produce a transparent report—without losing or breaking the functionality already present in the website.**
