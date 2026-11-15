# Data Manifest: TERraOps Artemis IV Terrestrial Analog Platform

**Version:** 1.0  
**Published:** November 2026  
**Catalog Scope:** Lunar Reference Sets, Earth Geospatial Observations, and Laboratory Simulation Data

---

## 1. Lunar Reference Datasets (NASA PDS / LRO)

| Dataset | Instrument / Mission | Variables Extracted | Spatial / Temporal Resolution | Official Source URL | Integration Mode |
|---|---|---|---|---|---|
| **LOLA Topography & Slope** | Lunar Reconnaissance Orbiter (LOLA) | Surface elevation, derived slope (deg), RMS roughness | 5 m/pixel (polar high-res, interpolated) to 30 m DEM | [NASA PGDA Products 78](https://pgda.gsfc.nasa.gov/products/78) | Linked & Reference |
| **Diviner Thermal Radiometry** | LRO Diviner (DLRE) | Surface temperature (K / °C), seasonal day/night thermal extremes | 128 pixels/degree polar gridded (~240 m) | [PDS Diviner Polar Resource Products](https://pds.nasa.gov/ds-view/pds/viewDataset.jsp?dsid=LRO-L-DLRE-5-PRP-V2.0) | Integrated & Model Bins |
| **LROC Narrow Angle Camera** | LRO LROC (NAC) | Geomorphology, boulder distribution, shadow extent, crater rims | 0.5 m/pixel panchromatic | [LROC PDS Archive](https://science.nasa.gov/mission/lro/data-products/) | Reference Imagery |
| **LEND Neutron Spectrometry** | LRO LEND | Epithermal neutron suppression (proxy for hydrogen-bearing volatiles) | ~10–20 km collimated footprint | [LRO Science & Data](https://science.nasa.gov/mission/lro/science-and-data/) | Linked Proxy |

> **Critical LOLA Notice:** NASA documentation notes that a large percentage of 5 m polar DEM pixels derive from along-track interpolation between laser ground tracks. Elevated uncertainty layers are documented and displayed.

---

## 2. Terrestrial Observation & Analog Geospatial Data

| Dataset | Provider | Variables Extracted | Resolution / Coverage | Source URL | Integration Mode |
|---|---|---|---|---|---|
| **NASADEM / SRTM** | NASA / USGS | Terrestrial elevation, slope, terrain roughness | 1 arc-second (~30 m), 60°N to 56°S | [NASA Earthdata NASADEM](https://data.nasa.gov/dataset/nasadem-merged-dem-global-1-arc-second-v001) | Integrated in Candidate Registry |
| **MODIS MOD11A2** | NASA LP DAAC | Day and night Land Surface Temperature (LST), emissivity | 1 km, 8-day composite | [MODIS MOD11A2 Data](https://ladsweb.modaps.eosdis.nasa.gov/missions-and-measurements/products/MOD11A2) | Integrated (Temperature Curves) |
| **NASA POWER / MERRA-2** | NASA LaRC | Surface wind speed, air temperature, relative humidity | 0.5° × 0.625° regional reanalysis | [NASA POWER Methodology](https://power.larc.nasa.gov/docs/methodology/data/sources_meteorology/) | Regional Climate Proxy |
| **EMIT Mineral Product (L2B/L3)** | NASA JPL | Mineral spectral abundance (Gypsum, Calcite, Kaolinite) | 60 m pixel / 0.5° aggregate | [NASA EMIT Minerals](https://data.nasa.gov/dataset/emit-l3-aggregated-mineral-spectral-abundance-and-uncertainty-0-5-deg-v002) | Geologic Proxy |
| **Copernicus DEM GLO-30** | European Space Agency (ESA) | Arctic / Antarctic elevation (fills NASADEM polar gap) | 30 m global coverage | [Copernicus Open Access](https://spacedata.copernicus.eu/) | High-Latitude Fallback |

> **EMIT Gypsum Limitation:** Gypsum is a calcium sulfate mineral ($CaSO_4 \cdot 2H_2O$). Mineral spectral abundance from EMIT is a mineralogical proxy and is **NOT** directly convertible to elemental sulfur concentration in ppm without physical geochemical core assays.

---

## 3. Laboratory Wear Benchmark Dataset

- **File Path:** `backend/data/simulation_dataset.csv`
- **Record Count:** 1,000 rows
- **Columns:**
  1. `sulfur_ppm` (Float64): Continuous concentration, range 206.48 – 1599.60 ppm. Mean: 886.36, Std: 408.99.
  2. `exposure_days` (Float64): Continuous duration, range 4.22 – 999.41 days. Mean: 507.51, Std: 291.90.
  3. `degradation_mg_cm2` (Float64): Target degradation, range 0.0100 – 1.0379 mg/cm². Mean: 0.2607, Std: 0.2013.
- **Data Quality:** 0 nulls, 0 duplicate records.
- **Outlier Processing:** 13 records pruned by 1.5 × IQR threshold on target wear (leaving 987 clean samples for cross-validation).
- **Provenance Status:** Unvalidated mock laboratory experiment. Protocol, alloy specimen metallurgy, sulfur speciation, and atmospheric humidity were not recorded in the source CSV. Labeled accordingly across all UI views and exports.
