export type CadModelPresetId =
  | 'drill'
  | 'viper'
  | 'scoop'
  | 'thruster'
  | 'custom';

export interface CadModelTelemetry {
  fileName: string;
  format: string;
  meshCount: number;
  subcomponentCount: number;
  vertexCount: number;
  polygonCount: number;
  dimensionsCm: {
    x: number;
    y: number;
    z: number;
  };
  degradationStatus: 'nominal' | 'degrading' | 'critical';
  wearIndex: number;
  fileSize?: string;
  sourceType: 'preset' | 'custom';
}

export interface CadModelPresetOption {
  id: CadModelPresetId;
  name: string;
  subtitle: string;
  icon: string;
  agencyRef: string;
  defaultTelemetry: Omit<CadModelTelemetry, 'degradationStatus' | 'wearIndex'>;
}

export const CAD_MODEL_PRESETS: CadModelPresetOption[] = [
  {
    id: 'drill',
    name: 'TX-DRL-40 Subsurface Coring Drill & Rover Assembly',
    subtitle: 'Artemis IV Cryo-Regolith Corer (Default)',
    icon: '⛏️',
    agencyRef: 'NASA-JPL / Honeybee Robotics',
    defaultTelemetry: {
      fileName: 'TX-DRL-40_REV7_FLIGHT_ASSEMBLY.step',
      format: 'NASA Procedural CAD (Solid Assembly)',
      meshCount: 18,
      subcomponentCount: 6,
      vertexCount: 24180,
      polygonCount: 16840,
      dimensionsCm: { x: 46.0, y: 124.0, z: 46.0 },
      fileSize: '4.8 MB',
      sourceType: 'preset',
    },
  },
  {
    id: 'viper',
    name: 'Artemis VIPER Lunar Rover Wheel & Compliant Suspension',
    subtitle: 'Volatiles Investigating Polar Exploration Rover',
    icon: '🛞',
    agencyRef: 'NASA-ARC / GRC Space Mobility',
    defaultTelemetry: {
      fileName: 'VIPER_COMPLIANT_WHEEL_REV4.glb',
      format: 'NASA Procedural CAD (Compliant Metal Mesh)',
      meshCount: 22,
      subcomponentCount: 5,
      vertexCount: 31420,
      polygonCount: 22650,
      dimensionsCm: { x: 50.0, y: 52.0, z: 44.0 },
      fileSize: '6.2 MB',
      sourceType: 'preset',
    },
  },
  {
    id: 'scoop',
    name: 'Regolith Cryo-Core Sampling Scoop & Articulated Arm',
    subtitle: 'Lunar Surface Science Manipulator Boom',
    icon: '🦾',
    agencyRef: 'NASA-JSC Curation Office',
    defaultTelemetry: {
      fileName: 'CRYO_CORE_SAMPLING_SCOOP_REV2.step',
      format: 'NASA Procedural CAD (Kinematic Arm)',
      meshCount: 16,
      subcomponentCount: 5,
      vertexCount: 26890,
      polygonCount: 19340,
      dimensionsCm: { x: 38.0, y: 110.0, z: 42.0 },
      fileSize: '5.1 MB',
      sourceType: 'preset',
    },
  },
  {
    id: 'thruster',
    name: 'Cold-Gas Attitude Control Thruster Nozzle',
    subtitle: 'Lander Desaturation & Attitude Vectoring Assembly',
    icon: '🚀',
    agencyRef: 'NASA-MSFC Propulsion Directorate',
    defaultTelemetry: {
      fileName: 'RCS_COLD_GAS_THRUSTER_DE_LAVAL.glb',
      format: 'NASA Procedural CAD (Supersonic Bell)',
      meshCount: 14,
      subcomponentCount: 5,
      vertexCount: 21300,
      polygonCount: 15480,
      dimensionsCm: { x: 32.0, y: 68.0, z: 32.0 },
      fileSize: '3.6 MB',
      sourceType: 'preset',
    },
  },
];
