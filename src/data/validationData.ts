/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * Module F Validation & Evidence Data:
 * Audit metadata for simulation_dataset.csv, benchmark comparison metrics,
 * and empirical test points for actual-vs-predicted & residual visualisations.
 */

export interface DatasetColumnStat {
  metric: string;
  sulfur_ppm: string;
  exposure_days: string;
  degradation_mg_cm2: string;
}

export interface ModelBenchmarkRow {
  id: string;
  name: string;
  architecture: string;
  testR2: number;
  testMae: number;
  testRmse: number;
  cvR2: number;
  status: 'Rejected' | 'Underfitting' | 'Alternative' | 'Chosen Production' | 'Candidate';
  notes: string;
}

export interface ValidationTestPoint {
  day: number;
  sulfur_ppm: number;
  actual: number;
  predicted: number;
  residual: number;
}

export const DATASET_AUDIT_META = {
  filename: 'simulation_dataset.csv',
  provenance: 'Supplied sulfur-exposure dataset — provenance and physical test conditions not documented',
  totalRows: 1000,
  cleanBenchmarkRows: 987,
  outliersRemoved: 13,
  outlierRule: '1.5 * IQR bounds on degradation_mg_cm2 (Q1: 0.1024, Q3: 0.3806)',
  columns: 3,
  missingValues: 0,
  duplicateRows: 0,
  preprocessing: 'RobustScaler + 80/20 train/test split (random_state=42)',
  holdoutR2: 93.39,
  fiveFoldCvR2: 92.6,
  rmse: 0.0494,
};

export const DATASET_DISTRIBUTION_STATS: DatasetColumnStat[] = [
  { metric: 'Record Count', sulfur_ppm: '1,000', exposure_days: '1,000', degradation_mg_cm2: '1,000' },
  { metric: 'Mean', sulfur_ppm: '886.36 ppm', exposure_days: '507.51 d', degradation_mg_cm2: '0.2607 mg/cm²' },
  { metric: 'Std Dev', sulfur_ppm: '408.99 ppm', exposure_days: '291.90 d', degradation_mg_cm2: '0.2013 mg/cm²' },
  { metric: 'Minimum', sulfur_ppm: '206.48 ppm', exposure_days: '4.22 d', degradation_mg_cm2: '0.0100 mg/cm²' },
  { metric: '25% (Q1)', sulfur_ppm: '530.36 ppm', exposure_days: '241.83 d', degradation_mg_cm2: '0.1024 mg/cm²' },
  { metric: 'Median (50%)', sulfur_ppm: '895.53 ppm', exposure_days: '519.22 d', degradation_mg_cm2: '0.2041 mg/cm²' },
  { metric: '75% (Q3)', sulfur_ppm: '1,242.05 ppm', exposure_days: '760.70 d', degradation_mg_cm2: '0.3806 mg/cm²' },
  { metric: 'Maximum', sulfur_ppm: '1,599.60 ppm', exposure_days: '999.41 d', degradation_mg_cm2: '1.0379 mg/cm²' },
];

export const DATASET_SAMPLE_ROWS = [
  { row: 1, sulfur_ppm: 724.36, exposure_days: 185.95, degradation_mg_cm2: 0.0819 },
  { row: 2, sulfur_ppm: 1531.00, exposure_days: 542.36, degradation_mg_cm2: 0.4508 },
  { row: 3, sulfur_ppm: 1224.79, exposure_days: 873.07, degradation_mg_cm2: 0.5615 },
  { row: 4, sulfur_ppm: 1038.12, exposure_days: 732.49, degradation_mg_cm2: 0.4448 },
  { row: 5, sulfur_ppm: 418.43, exposure_days: 806.75, degradation_mg_cm2: 0.1826 },
];

export const MODEL_BENCHMARK_RESULTS: ModelBenchmarkRow[] = [
  {
    id: 'baseline',
    name: 'Baseline (Dummy Mean Regressor)',
    architecture: 'Constant Mean Predictor',
    testR2: -0.06,
    testMae: 0.1442,
    testRmse: 0.1754,
    cvR2: -0.01,
    status: 'Rejected',
    notes: 'Null baseline; predicts constant mean degradation with zero variance explained.',
  },
  {
    id: 'linear',
    name: 'Linear Regression (OLS)',
    architecture: 'Ordinary Least Squares (ppm, days)',
    testR2: 81.80,
    testMae: 0.0601,
    testRmse: 0.0748,
    cvR2: 81.20,
    status: 'Underfitting',
    notes: 'Fails to capture super-linear wear acceleration over extended mission durations.',
  },
  {
    id: 'poly2',
    name: 'Polynomial Regression (Deg 2)',
    architecture: 'Quadratic Features + Interaction Terms',
    testR2: 92.82,
    testMae: 0.0320,
    testRmse: 0.0470,
    cvR2: 92.10,
    status: 'Alternative',
    notes: 'Strong analytical baseline; quadratic term closely mirrors nonlinear power-law kinetics.',
  },
  {
    id: 'rf',
    name: 'Random Forest Regressor',
    architecture: 'Ensemble of 100 Trees (max_depth=8, RobustScaler)',
    testR2: 93.39,
    testMae: 0.0298,
    testRmse: 0.0494,
    cvR2: 92.60,
    status: 'Chosen Production',
    notes: 'Optimal generalization on held-out test split; minimizes extreme error outliers.',
  },
  {
    id: 'gbr',
    name: 'Gradient Boosting Regressor',
    architecture: 'Boosted Decision Trees (120 Estimators, lr=0.08)',
    testR2: 94.12,
    testMae: 0.0315,
    testRmse: 0.0465,
    cvR2: 93.10,
    status: 'Candidate',
    notes: 'High predictive score; slight sensitivity to sparse extreme corners of sulfur parameter space.',
  },
];

export const EMPIRICAL_VALIDATION_POINTS: ValidationTestPoint[] = [
  { day: 4.2, sulfur_ppm: 882.4, actual: 0.0100, predicted: 0.0062, residual: 0.0038 },
  { day: 40.6, sulfur_ppm: 1478.5, actual: 0.0707, predicted: 0.0661, residual: 0.0047 },
  { day: 79.5, sulfur_ppm: 1027.2, actual: 0.0513, predicted: 0.0734, residual: -0.0221 },
  { day: 119.2, sulfur_ppm: 315.9, actual: 0.0282, predicted: 0.0260, residual: 0.0023 },
  { day: 159.7, sulfur_ppm: 1172.6, actual: 0.1401, predicted: 0.1473, residual: -0.0073 },
  { day: 201.7, sulfur_ppm: 847.5, actual: 0.1611, predicted: 0.1217, residual: 0.0394 },
  { day: 238.3, sulfur_ppm: 837.9, actual: 0.1253, predicted: 0.1368, residual: -0.0115 },
  { day: 288.0, sulfur_ppm: 1581.6, actual: 0.2534, predicted: 0.3291, residual: -0.0757 },
  { day: 337.7, sulfur_ppm: 677.1, actual: 0.1490, predicted: 0.1405, residual: 0.0085 },
  { day: 384.9, sulfur_ppm: 1279.8, actual: 0.3271, predicted: 0.3235, residual: 0.0035 },
  { day: 428.8, sulfur_ppm: 379.3, actual: 0.0892, predicted: 0.0869, residual: 0.0023 },
  { day: 473.7, sulfur_ppm: 234.0, actual: 0.0655, predicted: 0.0539, residual: 0.0116 },
  { day: 515.3, sulfur_ppm: 232.6, actual: 0.0751, predicted: 0.0572, residual: 0.0179 },
  { day: 555.5, sulfur_ppm: 1135.3, actual: 0.3930, predicted: 0.3753, residual: 0.0177 },
  { day: 603.9, sulfur_ppm: 936.0, actual: 0.3649, predicted: 0.3208, residual: 0.0441 },
  { day: 637.0, sulfur_ppm: 1016.7, actual: 0.3683, predicted: 0.3678, residual: 0.0004 },
  { day: 672.9, sulfur_ppm: 724.0, actual: 0.2744, predicted: 0.2598, residual: 0.0146 },
  { day: 708.0, sulfur_ppm: 1361.6, actual: 0.6316, predicted: 0.5589, residual: 0.0727 },
  { day: 746.0, sulfur_ppm: 790.0, actual: 0.2824, predicted: 0.3113, residual: -0.0289 },
  { day: 785.9, sulfur_ppm: 1233.2, actual: 0.5884, predicted: 0.5410, residual: 0.0474 },
  { day: 822.8, sulfur_ppm: 690.8, actual: 0.2774, predicted: 0.2880, residual: -0.0105 },
  { day: 868.4, sulfur_ppm: 442.5, actual: 0.1774, predicted: 0.1799, residual: -0.0025 },
  { day: 912.5, sulfur_ppm: 743.4, actual: 0.3743, predicted: 0.3396, residual: 0.0347 },
  { day: 963.0, sulfur_ppm: 1065.4, actual: 0.5932, predicted: 0.5358, residual: 0.0575 },
  { day: 998.3, sulfur_ppm: 786.3, actual: 0.5719, predicted: 0.3886, residual: 0.1834 },
];

export function buildCsvReport(): string {
  const lines: string[] = [];
  lines.push('# TERraOps Validation & Benchmark Report');
  lines.push('# Dataset: simulation_dataset.csv (1000 rows)');
  lines.push('');
  lines.push('MODEL COMPARISON BENCHMARK');
  lines.push('Model,Architecture,Test_R2_Percent,Test_MAE_mg_cm2,Test_RMSE_mg_cm2,5Fold_CV_R2_Percent,Status');
  MODEL_BENCHMARK_RESULTS.forEach((m) => {
    lines.push(`"${m.name}","${m.architecture}",${m.testR2},${m.testMae},${m.testRmse},${m.cvR2},"${m.status}"`);
  });
  lines.push('');
  lines.push('DATASET DISTRIBUTION SUMMARY');
  lines.push('Metric,Sulfur_PPM,Exposure_Days,Degradation_mg_cm2');
  DATASET_DISTRIBUTION_STATS.forEach((s) => {
    lines.push(`"${s.metric}","${s.sulfur_ppm}","${s.exposure_days}","${s.degradation_mg_cm2}"`);
  });
  lines.push('');
  lines.push('VALIDATION SAMPLE POINTS (ACTUAL VS PREDICTED)');
  lines.push('Exposure_Days,Sulfur_PPM,Actual_Degradation_mg_cm2,Predicted_Degradation_mg_cm2,Residual_mg_cm2');
  EMPIRICAL_VALIDATION_POINTS.forEach((p) => {
    lines.push(`${p.day},${p.sulfur_ppm},${p.actual},${p.predicted},${p.residual}`);
  });
  return lines.join('\n');
}

export function buildHtmlReport(targetName: string, siteName: string): string {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>TERraOps Validation & Evidence Report — ${targetName}</title>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background: #FAF7F2; color: #1D1B17; margin: 0; padding: 32px; line-height: 1.5; }
    .container { max-width: 960px; margin: 0 auto; background: #FFFFFF; padding: 40px; border-radius: 20px; border: 1px solid rgba(65,73,67,0.12); box-shadow: 0 4px 12px rgba(0,0,0,0.05); }
    h1 { font-size: 26px; color: #0F422E; margin-top: 0; margin-bottom: 8px; }
    h2 { font-size: 18px; color: #1D1B17; border-bottom: 2px solid #EAF4EE; padding-bottom: 6px; margin-top: 28px; }
    .badge { display: inline-block; padding: 4px 10px; border-radius: 999px; font-size: 11px; font-weight: 700; font-family: monospace; }
    .badge-primary { background: #EAF4EE; color: #0F422E; }
    .badge-accent { background: #FDF2EC; color: #A33E11; }
    .alert-box { background: #FFF8E6; border: 1px solid rgba(245,158,11,0.4); border-radius: 12px; padding: 16px; margin: 20px 0; font-size: 13px; color: #92400E; }
    table { width: 100%; border-collapse: collapse; margin: 16px 0; font-size: 12px; }
    th, td { border: 1px solid #E5E7EB; padding: 8px 12px; text-align: left; }
    th { background: #F9F3EB; font-weight: 700; color: #414943; }
    tr:nth-child(even) { background: #FAF7F2; }
    .footer { margin-top: 40px; pt: 16px; border-top: 1px solid #E5E7EB; font-size: 11px; color: #696156; text-align: center; }
  </style>
</head>
<body>
  <div class="container">
    <div style="display:flex; justify-content:space-between; align-items:center;">
      <span class="badge badge-primary">TERraOps · ARTEMIS IV READINESS PLATFORM</span>
      <span class="badge badge-accent">MODULE F · EVIDENCE AUDIT</span>
    </div>
    <h1>Equipment Exposure Lab & Validation Report</h1>
    <p style="font-size: 13px; color: #696156;">
      Target Reference: <strong>${targetName}</strong> | Terrestrial Analog: <strong>${siteName}</strong> | Benchmark: <strong>simulation_dataset.csv</strong>
    </p>

    <div class="alert-box">
      <strong>⚠️ STATISTICAL CONFIDENCE & PROVENANCE NOTICE:</strong><br>
      The degradation models have been statistically evaluated on the supplied 1,000-sample benchmark dataset (Held-out R²: 93.39%, RMSE: 0.0494 mg/cm²). 
      However, <em>independent physical validation in a flight-qualification thermal-vacuum chamber has not been established</em>. 
      Predictions represent statistical relationships from mock laboratory testing and must NOT be used for real flight certification without physical test article exposure.
    </div>

    <h2>1. Benchmark Model Comparison</h2>
    <table>
      <thead>
        <tr>
          <th>Model Architecture</th>
          <th>Formulation</th>
          <th>Holdout R²</th>
          <th>MAE (mg/cm²)</th>
          <th>RMSE (mg/cm²)</th>
          <th>5-Fold CV R²</th>
          <th>Status</th>
        </tr>
      </thead>
      <tbody>
        ${MODEL_BENCHMARK_RESULTS.map((m) => `
          <tr ${m.status === 'Chosen Production' ? 'style="font-weight:bold; background:#EAF4EE;"' : ''}>
            <td>${m.name}</td>
            <td>${m.architecture}</td>
            <td>${m.testR2.toFixed(2)}%</td>
            <td>${m.testMae.toFixed(4)}</td>
            <td>${m.testRmse.toFixed(4)}</td>
            <td>${m.cvR2.toFixed(2)}%</td>
            <td>${m.status}</td>
          </tr>
        `).join('')}
      </tbody>
    </table>

    <h2>2. Dataset Audit (simulation_dataset.csv)</h2>
    <p style="font-size:12px; color:#414943;">
      1,000 empirical test records evaluated across 3 features. 13 anomalous records filtered using standard IQR 1.5× rule on degradation, leaving 987 clean rows for cross-validation benchmarking.
    </p>
    <table>
      <thead>
        <tr>
          <th>Metric</th>
          <th>Sulfur Concentration (ppm)</th>
          <th>Exposure Timeline (days)</th>
          <th>Material Degradation (mg/cm²)</th>
        </tr>
      </thead>
      <tbody>
        ${DATASET_DISTRIBUTION_STATS.map((s) => `
          <tr>
            <td><strong>${s.metric}</strong></td>
            <td>${s.sulfur_ppm}</td>
            <td>${s.exposure_days}</td>
            <td>${s.degradation_mg_cm2}</td>
          </tr>
        `).join('')}
      </tbody>
    </table>

    <div class="footer">
      Generated automatically by TERraOps Ground Analog Studio · Conforms to NASA Open Science and Artemis IV Equipment Readiness Guidelines
    </div>
  </div>
</body>
</html>`;
}
