import { EarthAnalogResult } from '../types/terra';

const LUNAR_TARGET_MIN_TEMPERATURE_C = -203;
const MAX_TEMPERATURE_PENALTY = 35;
const TEMPERATURE_PENALTY_EXPONENT = 5;

export function formatLocationName(
  name: string,
  _lat: number,
  _lon: number,
): string {
  if (name.includes('Antarctic Grid')) {
    return `McMurdo Sector: ${name.replace('Antarctic Grid ', 'Outpost ')}`;
  }

  return name;
}

export function calculateTemperatureMatchPercentage(
  analogTemperatureC: number,
): number {
  const temperatureDistance = Math.sqrt(
    (analogTemperatureC - LUNAR_TARGET_MIN_TEMPERATURE_C) ** 2,
  );
  const normalizedDistance =
    temperatureDistance / Math.abs(LUNAR_TARGET_MIN_TEMPERATURE_C);
  const penalty =
    MAX_TEMPERATURE_PENALTY *
    normalizedDistance ** TEMPERATURE_PENALTY_EXPONENT;

  return Math.max(0, Math.min(100, 100 - penalty));
}

export function sortEarthAnalogResults(
  results: EarthAnalogResult[],
): EarthAnalogResult[] {
  return [...results].sort(
    (left, right) =>
      calculateTemperatureMatchPercentage(right.min_temp_c) -
      calculateTemperatureMatchPercentage(left.min_temp_c),
  );
}
