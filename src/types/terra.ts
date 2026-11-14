export type PlanetBody = 'moon' | 'mars' | 'earth';

export type WorkspaceView =
  | 'overview'
  | 'discovery'
  | 'dossier'
  | 'permits'
  | 'lab'
  | 'reports'
  | 'calendar'
  | 'cad';

export type AnalogueCategory =
  | 'basalt_volcanic'
  | 'arid_saline'
  | 'cold_polar'
  | 'impact_terrain'
  | 'subsurface'
  | 'operational_isolation';

export type AdminStatusType =
  | 'Feasible pathway identified'
  | 'Conditional'
  | 'Restricted / legal review required'
  | 'Unverified';

export interface SiteDistinctScores {
  environmentalMatch: number; // 0..100
  operationalFeasibility: number; // 0..100
  administrativeReadiness: number; // 0..100
  dataConfidence: number; // 0..100
}

export interface AdminFeasibilityDetail {
  status: AdminStatusType;
  statusReason: string;
  authority: string;
  jurisdiction: string;
  leadTimeWeeks: number;
  officialUrl: string;
  permitsRequired: string[];
  chinaWolfAmendmentWarning?: boolean;
  indigenousConsultationRequired?: boolean;
}

export type ProvenanceTag =
  | 'VERIFIED NASA PDS / EARTHDATA'
  | 'COMPUTED METRIC'
  | 'PHYSICS APPROXIMATION';

export type DimensionKey =
  | 'thermalRange'
  | 'diurnalSeasonalRatio'
  | 'minTemp'
  | 'slope'
  | 'roughness'
  | 'solarElevation'
  | 'iceAridity'
  | 'radarCpr';

export type ScientificLayerId =
  | 'lola_topo'
  | 'diviner_thermal'
  | 'solar_grazing'
  | 'minirf_cpr'
  | 'mola_topo'
  | 'themis_inertia'
  | 'crism_mineralogy'
  | 'srtm_slope'
  | 'modis_lst'
  | 'permafrost_ice';

export interface EarthAnalogResult {
  id: number;
  location_name: string;
  country: string;
  lat: number;
  lng: number;
  min_temp_c: number;
  slope_deg: number;
  cosine_distance: number;
}

export interface ScientificLayerMeta {
  id: ScientificLayerId;
  body: PlanetBody;
  name: string;
  shortName: string;
  source: string;
  resolution: string;
  epoch: string;
  unit: string;
  minLabel: string;
  midLabel: string;
  maxLabel: string;
  rampColors: [string, string, string, string];
  provenance: ProvenanceTag;
  caveat?: string;
}

export interface AnalogyBreakdownItem {
  pillar: 'Gravity' | 'Atmosphere' | 'Radiation' | 'Regolith';
  earthValue: string;
  targetValue: string;
  gapFactor: string;
  engineeringImpact: string;
}

export interface PlanetaryTarget {
  id: string;
  body: 'moon' | 'mars';
  name: string;
  regionLabel: string;
  coordinates: string;
  lat: number;
  lon: number;
  elevationM: number;
  classLabel: string;
  spiceKernel: string;
  summary: string;
  // Physical target metrics
  minTempC: number;
  maxTempC: number;
  meanTempC: number;
  diurnalDeltaK: number;
  diurnalSeasonalRatio: number; // Ratio of diurnal swing to annual swing
  meanSlopeDeg: number;
  rmsRoughnessM: number;
  solarElevationMinDeg: number;
  solarElevationMaxDeg: number;
  solarElevationMeanDeg: number;
  iceStabilityIndex: number; // 0..100 (subsurface volatile / aridity target)
  radarCpr: number; // Mini-RF S/X-band or orbital radar CPR
  aeolianDustFlux: number; // 0..100 relative dust flux index
  mineralogyNote: string;
  sourceDataset: string;
  spatialResolution: string;
  caveatNote: string;
  provenance: ProvenanceTag;
  crossSectionElevationsM: number[]; // 12 points across 10km transect
}

export interface EarthCandidateSite {
  id: string;
  name: string;
  region: string;
  country: string;
  coordinates: string;
  lat: number;
  lon: number;
  elevationM: number;
  biomeCharacter: string;
  isCatalogKnown: boolean;
  catalogCitation?: string;
  // Static geomorphic properties (Copernicus DEM / SRTM / CSA RCM)
  slopeDeg: number;
  rmsRoughnessM: number;
  bareRockPct: number;
  albedo: number;
  aridityIndex: number; // 0..100 (100 = hyper-arid)
  radarCprProxy: number; // CSA RCM C-band compact pol CPR proxy
  salinityIndex: number; // 0..100 (chloride/sulfate/brine corrosivity)
  aeolianDustFlux: number; // 0..100
  // 12-month climatology arrays (Jan=0 .. Dec=11)
  monthlyMeanTempC: number[];
  monthlyMinTempC: number[];
  monthlyMaxTempC: number[];
  monthlyDiurnalDeltaK: number[];
  monthlySolarNoonDeg: number[];
  monthlySnowIcePct: number[];
  monthlyHumidityPct: number[];
  transectElevationsM: number[]; // 12 points across 10km transect
  fieldAccessNotes: string;
  provenance: ProvenanceTag;
  analogueCategory?: AnalogueCategory;
  whatItDoesNotReproduce?: string[];
  geologySummary?: string;
  mineralogyEvidence?: string;
  operationalLogistics?: string;
  distinctScores?: SiteDistinctScores;
  adminFeasibility?: AdminFeasibilityDetail;
}

export type DimensionWeights = Record<DimensionKey, number>;

export interface ObjectiveProfile {
  id: string;
  name: string;
  shortName: string;
  description: string;
  targetFilter: 'all' | 'moon' | 'mars';
  weights: DimensionWeights;
  primaryMetricFocus: string;
}

export interface DimensionScoreDetail {
  dimension: DimensionKey;
  label: string;
  score: number; // 0..100
  weight: number; // 0..1
  earthValueFormatted: string;
  targetValueFormatted: string;
  unit: string;
  provenance: ProvenanceTag;
}

export interface ScoredCandidate {
  site: EarthCandidateSite;
  bestMonthIndex: number; // 0..11
  bestMonthScore: number; // 0..100
  annualMeanScore: number;
  monthlyScores: number[]; // length 12
  dimensionBreakdown: DimensionScoreDetail[];
  windowSummary: TemporalWindow;
}

export interface TemporalWindow {
  startDateLabel: string;
  endDateLabel: string;
  durationDays: number;
  peakDateLabel: string;
  peakScore: number;
  thresholdPct: number;
  dailyScores: number[]; // 365 days
  validDayMask: boolean[]; // 365 days
  processAlignmentNote: string;
}

export interface PortfolioAllocation {
  objectiveId: string;
  objectiveName: string;
  assignedSiteId: string;
  assignedSiteName: string;
  bestMonthLabel: string;
  score: number;
}

export interface PortfolioResult {
  selectedSites: EarthCandidateSite[];
  allocations: PortfolioAllocation[];
  combinedCoveragePct: number;
  singleBestCoveragePct: number;
  gainPct: number;
}

export interface TraverseWaypoint {
  id: string;
  xNorm: number; // 0..1 across 2.4km terrain patch
  yNorm: number; // 0..1
}

export interface TraverseAnalysis {
  totalDistanceM: number;
  elevationGainM: number;
  maxSlopeDeg: number;
  meanSlopeDeg: number;
  hazardSegmentsCount: number;
  shadowTrapDurationMin: number;
  earthWheelSinkageCm: number;
  targetWheelSinkageCm: number;
  peakSolarPowerW: number;
  meanSolarPowerW: number;
  profilePoints: {
    distM: number;
    earthElevM: number;
    targetElevM: number;
    slopeDeg: number;
    inShadow: boolean;
    solarPowerW: number;
  }[];
}

export type SimEnvironment = 'earth_analog' | 'moon_south_pole' | 'mars_jezero';

export type CadPartId =
  | 'housing'
  | 'fasteners'
  | 'seal'
  | 'gears'
  | 'stator'
  | 'auger';

export interface CadPartSpec {
  id: CadPartId;
  name: string;
  material: string;
  subsystem: string;
  nominalLifeYears: Record<SimEnvironment, number>;
  primaryMechanism: Record<SimEnvironment, string>;
  earthDivergenceNote: string;
}

export interface PartDegradationState {
  part: CadPartSpec;
  damageIndex: number; // 0..2.0 (>= 1.0 = critical failure)
  thermalFatigueShare: number; // 0..1
  corrosionShare: number; // 0..1
  abrasionShare: number; // 0..1
  status: 'nominal' | 'degrading' | 'critical';
  mechanismSummary: string;
}
