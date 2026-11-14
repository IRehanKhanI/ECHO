"""Generate and validate the sulfur-corrosion simulator dataset."""

from pathlib import Path
import json

import numpy as np
import pandas as pd
from sklearn.ensemble import RandomForestRegressor
from sklearn.metrics import mean_squared_error, r2_score
from sklearn.model_selection import cross_val_score, train_test_split
from sklearn.preprocessing import RobustScaler


ROOT = Path(__file__).resolve().parent
DATASET_PATH = ROOT / "simulation_dataset.csv"
REPORT_PATH = ROOT / "validation_report.json"


def main() -> None:
    rng = np.random.RandomState(42)
    n_samples = 1000
    sulfur_ppm = rng.uniform(200, 1600, n_samples)
    exposure_days = rng.uniform(1, 1000, n_samples)

    base_wear = 0.015 * (sulfur_ppm / 500) ** 1.15 * (exposure_days / 30) ** 0.78
    noise = rng.normal(0, 0.16 * base_wear)
    degradation = np.clip(base_wear + noise, 0.01, None)

    df = pd.DataFrame(
        {
            "sulfur_ppm": sulfur_ppm,
            "exposure_days": exposure_days,
            "degradation_mg_cm2": degradation,
        }
    )

    q1, q3 = df["degradation_mg_cm2"].quantile([0.25, 0.75])
    iqr = q3 - q1
    lower_bound = q1 - 1.5 * iqr
    upper_bound = q3 + 1.5 * iqr
    df_clean = df[df["degradation_mg_cm2"].between(lower_bound, upper_bound)].copy()

    scaler = RobustScaler()
    features = ["sulfur_ppm", "exposure_days"]
    x = scaler.fit_transform(df_clean[features])
    y = df_clean["degradation_mg_cm2"].to_numpy()
    x_train, x_test, y_train, y_test = train_test_split(
        x, y, test_size=0.2, random_state=42
    )

    model = RandomForestRegressor(n_estimators=100, max_depth=8, random_state=42)
    model.fit(x_train, y_train)
    predictions = model.predict(x_test)
    holdout_r2 = r2_score(y_test, predictions) * 100
    cv_r2 = cross_val_score(model, x, y, cv=5, scoring="r2").mean() * 100
    rmse = np.sqrt(mean_squared_error(y_test, predictions))

    # Keep the complete generated sample as the simulator lookup dataset; the
    # filtered subset is used only to make the benchmark robust to outliers.
    df.to_csv(DATASET_PATH, index=False, float_format="%.8f")
    report = {
        "source_rows": len(df),
        "validated_rows": len(df),
        "benchmark_rows": len(df_clean),
        "removed_outliers": len(df) - len(df_clean),
        "preprocessing": {
            "outlier_rule": "IQR bounds at 1.5 * IQR",
            "scaler": "RobustScaler",
            "features": features,
        },
        "benchmark": {
            "holdout_r2_percent": round(holdout_r2, 2),
            "five_fold_cv_r2_percent": round(cv_r2, 2),
            "rmse_mg_cm2": round(rmse, 4),
        },
    }
    REPORT_PATH.write_text(json.dumps(report, indent=2) + "\n", encoding="utf-8")

    if len(df) != n_samples or len(df_clean) == 0:
        raise ValueError("Dataset validation failed.")
    print(
        f"Generated {len(df)} validated rows; benchmark used {len(df_clean)} "
        f"after IQR filtering. "
        f"Holdout R2: {holdout_r2:.2f}% | 5-fold CV R2: {cv_r2:.2f}% | "
        f"RMSE: {rmse:.4f} mg/cm2"
    )


if __name__ == "__main__":
    main()
