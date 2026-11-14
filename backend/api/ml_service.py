"""Sulfur-corrosion regression service used by the Virtual Lab API."""

from pathlib import Path

import pandas as pd
from sklearn.ensemble import RandomForestRegressor
from sklearn.preprocessing import RobustScaler


FEATURES = ["sulfur_ppm", "exposure_days"]
TARGET = "degradation_mg_cm2"
DATASET_PATH = Path(__file__).resolve().parents[1] / "data" / "simulation_dataset.csv"


def _train_model() -> tuple[RobustScaler, RandomForestRegressor]:
    dataset = pd.read_csv(DATASET_PATH)
    required_columns = set(FEATURES + [TARGET])
    missing_columns = required_columns - set(dataset.columns)
    if missing_columns:
        raise ValueError(
            "Simulation dataset is missing columns: "
            + ", ".join(sorted(missing_columns))
        )

    training_features = dataset[FEATURES]
    target = dataset[TARGET]
    scaler = RobustScaler()
    model = RandomForestRegressor(
        n_estimators=100,
        max_depth=8,
        random_state=42,
    )
    model.fit(scaler.fit_transform(training_features), target)
    return scaler, model


SCALER, MODEL = _train_model()


def predict_degradation(sulfur_ppm: float, exposure_days: float) -> float:
    if sulfur_ppm < 0 or exposure_days < 0:
        raise ValueError("sulfur_ppm and exposure_days must be non-negative.")

    input_features = pd.DataFrame(
        [[sulfur_ppm, exposure_days]],
        columns=FEATURES,
    )
    scaled_features = SCALER.transform(input_features)
    return float(MODEL.predict(scaled_features)[0])
