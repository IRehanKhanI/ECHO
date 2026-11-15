# Model Card: TERraOps Sulfur Exposure Regressor (Artemis IV Readiness)

**Model Name:** TERraOps Single-Stressor Material Degradation Regressor  
**Model Version:** 1.0.0-rf-production  
**Date:** November 2026  
**License:** Apache-2.0  
**Model Type:** Random Forest Regressor (Ensemble of 100 decision trees)  
**Trained by:** TERraOps Engineering Team for NASA Space Apps / Terrestrial Analog Readiness Platform

---

## 1. Intended Use & Scope

- **Intended Task:** Predicts surface material mass loss / wear degradation (`degradation_mg_cm2`) of hardware test coupons subjected to sulfur-bearing granular regolith simulant over varying mission exposure timelines.
- **Primary Inputs:**
  1. `sulfur_ppm` (Continuous, range: 206.48 – 1599.60 ppm): Total sulfur concentration in test environment or simulant.
  2. `exposure_days` (Continuous, range: 4.22 – 999.41 days): Elapsed duration of direct surface contact.
- **Target Output:**
  - `degradation_mg_cm2` (Continuous, positive float): Cumulative material mass loss per unit area ($mg/cm^2$).
- **Out-of-Scope Uses:**
  - **Flight Qualification Certification:** This model must NOT be used as a substitute for environmental chamber testing under ultra-high vacuum ($10^{-9}\text{ Torr}$) or cryogenic lunar temperatures ($40\text{ K} - 120\text{ K}$).
  - **Multi-Stressor Life Prediction:** Does not predict thermal cycling fatigue, micrometeoroid impact, radiation embrittlement, or solar UV degradation.
  - **Human Physiology:** Strictly hardware/equipment scope; inapplicable to astronaut tissue or biological exposure.

---

## 2. Training Data & Preprocessing

- **Dataset:** `backend/data/simulation_dataset.csv`
- **Total Source Observations:** 1,000 synthetic laboratory test cycles.
- **Outlier Filtering:**
  - Standard Interquartile Range (IQR) criterion applied to the target variable:
    $$Q_1 = 0.1024,\quad Q_3 = 0.3806,\quad \text{IQR} = 0.2783$$
    $$\text{Lower Bound} = Q_1 - 1.5 \cdot \text{IQR} = -0.3150\text{ (clipped at 0.01)}$$
    $$\text{Upper Bound} = Q_3 + 1.5 \cdot \text{IQR} = 0.7980\text{ }mg/cm^2$$
  - Filtered subset: **987 clean samples** (13 extreme anomalies trimmed for robust cross-validation).
- **Feature Scaling:** `RobustScaler` (median centering and interquartile scaling to prevent extreme sulfur concentrations from biasing tree splits).
- **Train/Test Partitioning:** 80% Training (789 samples) / 20% Held-out Test (198 samples), `random_state=42`.

---

## 3. Evaluation & Performance Metrics

| Architecture | Parameters | Test $R^2$ (%) | Test MAE ($mg/cm^2$) | Test RMSE ($mg/cm^2$) | 5-Fold CV $R^2$ (%) | Decision |
|---|---|---|---|---|---|---|
| **Dummy Baseline** | Mean Regressor | -0.06% | 0.1442 | 0.1754 | -0.01% | Rejected (Null) |
| **Linear Regression** | Ordinary Least Squares | 81.80% | 0.0601 | 0.0748 | 81.20% | Underfitting |
| **Polynomial Reg (Deg 2)** | Quadratic + Interactions | 92.82% | 0.0320 | 0.0470 | 92.10% | Strong Baseline |
| **Random Forest (Chosen)** | 100 Trees, max_depth=8 | **93.39%** | **0.0298** | **0.0494** | **92.60%** | **Chosen Production** |
| **Gradient Boosting** | 120 Trees, lr=0.08 | 94.12% | 0.0315 | 0.0465 | 93.10% | Candidate |

### Residual Diagnostics
- Mean residual on held-out test split: $-0.0012\text{ }mg/cm^2$ (unbiased, centered at zero).
- Residual standard deviation: $\pm 0.0494\text{ }mg/cm^2$ (used as model empirical confidence band).
- No significant heteroscedastic fan pattern observed across the 1–1000 day mission scrub timeline.

---

## 4. Ethical & Safety Considerations

- **Provenance Warning:** Dataset represents mock experimental wear cycles. The physical alloy grade and chemical sulfur speciation (e.g. sulfate vs sulfide vs elemental sulfur) are unrecorded.
- **Caveat Enforcement:** Both UI and backend explicitly tag wear predictions with:
  > *“The model has been statistically evaluated on the supplied dataset, but independent physical validation has not been established.”*

---

## 5. Deployment & Runtime

- **Backend Service:** Django REST Framework endpoint `POST /api/simulate-wear/` running on `http://127.0.0.1:8000`.
- **Client Fallback:** Embedded analytical formulation in `src/components/views/VirtualLabView.tsx` executing when backend offline.
- **Latency:** $< 12\text{ ms}$ inference time per batch point.
