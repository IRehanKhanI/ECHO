# NASA Sulfur-Corrosion Simulator Dataset

This folder contains small lookup tables and a reproducible Python generator
for an ML simulator that estimates material degradation from sulfur
concentration and exposure time.

## Files

| File | Purpose |
| --- | --- |
| `artemis_sites.csv` | Lunar south-pole site lookup data |
| `earth_analogs.csv` | Terrestrial analog and access-status lookup data |
| `generate_dataset.py` | Recreates the deterministic simulation dataset and validation report |
| `simulation_dataset.csv` | Generated 1,000-row dataset for training or demos |
| `validation_report.json` | Row counts, preprocessing details, and benchmark metrics |

The generated dataset is a simulated benchmark, not a replacement for
laboratory measurements or mission-qualified engineering data. Treat the
lookup values and model output as demo/research inputs until they have been
independently verified for your project.

## Add it to another Python project

Copy these files into a data directory in the other project. For example:

```text
my-project/
├── app/
├── data/
│   ├── artemis_sites.csv
│   ├── earth_analogs.csv
│   ├── simulation_dataset.csv
│   └── validation_report.json
└── scripts/
    └── generate_dataset.py
```

Install the required Python packages from the project environment:

```powershell
python -m pip install numpy pandas scikit-learn
```

Regenerate the deterministic dataset whenever you change the generator:

```powershell
python .\scripts\generate_dataset.py
```

The script uses a fixed random seed (`42`), writes exactly 1,000 generated
rows to `simulation_dataset.csv`, and writes the metrics to
`validation_report.json`.

## Load the data

```python
from pathlib import Path
import json
import pandas as pd

DATA_DIR = Path(__file__).resolve().parents[1] / "data"

simulation = pd.read_csv(DATA_DIR / "simulation_dataset.csv")
artemis_sites = pd.read_csv(DATA_DIR / "artemis_sites.csv")
earth_analogs = pd.read_csv(DATA_DIR / "earth_analogs.csv")

with (DATA_DIR / "validation_report.json").open(encoding="utf-8") as file:
    report = json.load(file)

assert len(simulation) == report["validated_rows"] == 1000
```

## Train the included model in your application

Use the same preprocessing and model configuration if you want results
comparable with `validation_report.json`:

```python
from sklearn.ensemble import RandomForestRegressor
from sklearn.preprocessing import RobustScaler

FEATURES = ["sulfur_ppm", "exposure_days"]
TARGET = "degradation_mg_cm2"

scaler = RobustScaler()
model = RandomForestRegressor(
    n_estimators=100,
    max_depth=8,
    random_state=42,
)

X = scaler.fit_transform(simulation[FEATURES])
y = simulation[TARGET]
model.fit(X, y)
```

For a prediction from UI inputs:

```python
def predict_degradation(sulfur_ppm: float, exposure_days: float) -> float:
    if sulfur_ppm < 0 or exposure_days < 0:
        raise ValueError("Inputs must be non-negative.")

    values = scaler.transform([[sulfur_ppm, exposure_days]])
    return float(model.predict(values)[0])


estimate = predict_degradation(sulfur_ppm=900, exposure_days=365)
print(f"Estimated degradation: {estimate:.4f} mg/cm2")
```

Keep the fitted `scaler` with the fitted model. New inputs must go through
the same scaler before prediction; do not fit a new scaler for every request.
For a web API, load the model and scaler once at application startup.

## Use the site and access filters

The lookup tables can drive selectors and administrative filters independently
of the regression model:

```python
available_analogs = earth_analogs[
    earth_analogs["access_status"].isin(["CLEARED", "CONDITIONAL"])
]

selected_site = artemis_sites.loc[
    artemis_sites["site_id"].eq("ART-03")
].iloc[0]

print(selected_site["name"])
print(available_analogs[["analog_id", "name", "access_status"]])
```

## Recommended application flow

1. Load the three CSV files and the validation report at startup.
2. Let the user select a lunar site or Earth analog.
3. Use the selected row's `sulfur_ppm` as the default sulfur input.
4. Let the user set `exposure_days`.
5. Call `predict_degradation(...)`.
6. Display the estimate with its unit (`mg/cm2`) and the validation report's
   benchmark metrics as simulator metadata.
7. Keep `RESTRICTED` analogs visible for administrative demonstrations, but
   prevent them from being treated as available field sites.

## Reproducibility and validation

The current generated report records:

- 1,000 generated rows
- 987 rows used for the IQR-filtered benchmark
- RobustScaler preprocessing
- 93.39% holdout R²
- 92.60% five-fold cross-validation R²
- 0.0494 mg/cm² holdout RMSE

These are benchmark results for this generated dataset. They should not be
presented as measured mission accuracy or as a guarantee of performance on
new physical test data.
