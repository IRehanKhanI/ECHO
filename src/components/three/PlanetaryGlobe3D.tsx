import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';
import { PlanetBody, ScientificLayerId } from '../../types/terra';

export interface GlobePin {
  id: string;
  label: string;
  sublabel?: string;
  lat: number;
  lon: number;
  accent?: 'moss' | 'terracotta' | 'amber' | 'slate' | string;
  active?: boolean;
  scoreBadge?: string;
}

export type GlobeCameraMode = 'orbit' | 'polar' | 'relief';

export interface PlanetaryGlobe3DProps {
  body: PlanetBody;
  layerId?: ScientificLayerId | string;
  activeLayerId?: ScientificLayerId | string;
  layerOpacity?: number;
  cameraMode?: GlobeCameraMode;
  focusLat?: number;
  focusLon?: number;
  pins: GlobePin[];
  onPinClick?: (pinId: string) => void;
  autoRotate?: boolean;
  themeSurface?: 'studio-light' | 'orbital-dark';
  className?: string;
  showPins?: boolean;
  onlyActiveLabel?: boolean;
}

interface ProjectedPin extends GlobePin {
  x: number;
  y: number;
  visible: boolean;
}

// Module-scope reusable scratch objects (zero GC in render loop)
const _v1 = new THREE.Vector3();
const _v2 = new THREE.Vector3();
const _camDir = new THREE.Vector3();
const _targetCamPos = new THREE.Vector3();
const _toCam = new THREE.Vector3();
const _tangent = new THREE.Vector3();
const _side = new THREE.Vector3();
const _vTemp = new THREE.Vector3();
const _rotMatrix = new THREE.Matrix4();
const _raycaster = new THREE.Raycaster();
const _mouse = new THREE.Vector2();

// Authentic NASA Texture asset paths (served from public/assets/planets/)
const PLANET_TEXTURES = {
  earth: {
    day: '/assets/planets/earth_day.jpg',
    normal: '/assets/planets/earth_normal.jpg',
    specular: '/assets/planets/earth_specular.jpg',
    clouds: '/assets/planets/earth_clouds.png',
  },
  moon: {
    albedo: '/assets/planets/moon_albedo.jpg',
  },
  mars: {
    albedo: '/assets/planets/mars_albedo.jpg',
    normal: '/assets/planets/mars_normal.jpg',
  },
};

// Global texture & canvas caches across component mounts
const textureLoader = new THREE.TextureLoader();
const textureCache = new Map<string, THREE.Texture>();
const invertedSpecularCache = new Map<string, THREE.CanvasTexture>();
const sciTextureCache = new Map<string, THREE.CanvasTexture>();

function loadTexture(
  url: string,
  isColor = true,
  onLoaded?: () => void,
): THREE.Texture {
  if (textureCache.has(url)) {
    const cached = textureCache.get(url)!;
    if (onLoaded && cached.image) {
      setTimeout(onLoaded, 0);
    }
    return cached;
  }
  const tex = textureLoader.load(url, () => {
    tex.needsUpdate = true;
    onLoaded?.();
  });
  tex.colorSpace = isColor ? THREE.SRGBColorSpace : THREE.NoColorSpace;
  tex.wrapS = THREE.RepeatWrapping;
  tex.wrapT = THREE.ClampToEdgeWrapping;
  textureCache.set(url, tex);
  return tex;
}

function loadInvertedSpecular(
  url: string,
  onLoaded?: () => void,
): THREE.CanvasTexture {
  if (invertedSpecularCache.has(url)) {
    const cached = invertedSpecularCache.get(url)!;
    if (onLoaded && cached.image) {
      setTimeout(onLoaded, 0);
    }
    return cached;
  }
  const canvas = document.createElement('canvas');
  canvas.width = 64;
  canvas.height = 32;
  const ctx = canvas.getContext('2d');
  if (ctx) {
    ctx.fillStyle = '#808080';
    ctx.fillRect(0, 0, 64, 32);
  }
  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.NoColorSpace;
  tex.wrapS = THREE.RepeatWrapping;
  tex.wrapT = THREE.ClampToEdgeWrapping;
  invertedSpecularCache.set(url, tex);

  const img = new Image();
  img.crossOrigin = 'anonymous';
  img.onload = () => {
    canvas.width = img.width;
    canvas.height = img.height;
    const c = canvas.getContext('2d');
    if (!c) return;
    c.drawImage(img, 0, 0);
    const imgData = c.getImageData(0, 0, canvas.width, canvas.height);
    const data = imgData.data;
    for (let i = 0; i < data.length; i += 4) {
      // Invert specular: ocean white (255) -> 0 roughness (high specular gloss)
      // continent black (0) -> 255 roughness (matte land)
      const inv = 255 - data[i];
      data[i] = inv;
      data[i + 1] = inv;
      data[i + 2] = inv;
      data[i + 3] = 255;
    }
    c.putImageData(imgData, 0, 0);
    tex.needsUpdate = true;
    onLoaded?.();
  };
  img.onerror = () => {
    // Keep neutral gray fallback
    tex.needsUpdate = true;
  };
  img.src = url;
  return tex;
}

function latLonToVec3(lat: number, lon: number, radius: number, out: THREE.Vector3) {
  const phi = (90 - lat) * (Math.PI / 180);
  const theta = (lon + 180) * (Math.PI / 180);
  out.x = -radius * Math.sin(phi) * Math.cos(theta);
  out.y = radius * Math.cos(phi);
  out.z = radius * Math.sin(phi) * Math.sin(theta);
  return out;
}

function hash2d(x: number, y: number): number {
  const n = Math.sin(x * 127.1 + y * 311.7) * 43758.5453123;
  return n - Math.floor(n);
}

function valueNoise(x: number, y: number): number {
  const ix = Math.floor(x);
  const iy = Math.floor(y);
  const fx = x - ix;
  const fy = y - iy;
  const ux = fx * fx * (3 - 2 * fx);
  const uy = fy * fy * (3 - 2 * fy);
  const a = hash2d(ix, iy);
  const b = hash2d(ix + 1, iy);
  const c = hash2d(ix, iy + 1);
  const d = hash2d(ix + 1, iy + 1);
  return a + (b - a) * ux + (c - a) * uy + (a - b - c + d) * ux * uy;
}

function fbm(x: number, y: number, octaves = 3): number {
  let val = 0;
  let amp = 0.5;
  let freq = 1;
  for (let i = 0; i < octaves; i++) {
    val += amp * valueNoise(x * freq, y * freq);
    freq *= 2.02;
    amp *= 0.5;
  }
  return val;
}

function hexToRgb(hex: string): [number, number, number] {
  const clean = hex.replace('#', '');
  const n = parseInt(clean, 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}

function sampleRamp(
  t: number,
  stops: [number, number, number][],
): [number, number, number] {
  const c = Math.max(0, Math.min(1, t));
  const scaled = c * (stops.length - 1);
  const idx = Math.min(stops.length - 2, Math.floor(scaled));
  const frac = scaled - idx;
  const a = stops[idx];
  const b = stops[idx + 1];
  return [
    Math.round(a[0] + (b[0] - a[0]) * frac),
    Math.round(a[1] + (b[1] - a[1]) * frac),
    Math.round(a[2] + (b[2] - a[2]) * frac),
  ];
}

function getScientificTexture(body: PlanetBody, layerId: string): THREE.CanvasTexture {
  const cacheKey = `${body}_${layerId}`;
  if (sciTextureCache.has(cacheKey)) {
    return sciTextureCache.get(cacheKey)!;
  }

  const width = 512;
  const height = 256;
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d')!;
  const imgData = ctx.createImageData(width, height);

  const rampMap: Record<string, string[]> = {
    lola_topo: ['#1B4332', '#3B7A5C', '#E69A28', '#A33E11'],
    diviner_thermal: ['#172E3C', '#2A5A44', '#E69A28', '#D94E28'],
    solar_grazing: ['#1E1D1B', '#4A4E48', '#D99126', '#FFF5DD'],
    minirf_cpr: ['#2D3833', '#386851', '#E69A28', '#C4451C'],
    mola_topo: ['#1F4F3A', '#6B8A47', '#E69A28', '#A33E11'],
    themis_inertia: ['#2B2724', '#7A5438', '#E06A3B', '#FFB654'],
    crism_mineralogy: ['#3F3933', '#2A5A44', '#D99126', '#A33E11'],
    earth_dem: ['#1B4332', '#6E9358', '#E69A28', '#A33E11'],
    srtm_slope: ['#2A5A44', '#6E9358', '#E69A28', '#A33E11'],
    modis_lst: ['#1E3F4B', '#2A5A44', '#E69A28', '#BA1A1A'],
    permafrost_ice: ['#7A5438', '#C8BFB2', '#5F8F77', '#0F422E'],
  };

  const rawStops = rampMap[layerId] || rampMap.lola_topo;
  const stops = rawStops.map(hexToRgb);

  for (let y = 0; y < height; y++) {
    const v = y / height;
    const lat = 90 - v * 180;
    const latRad = (lat * Math.PI) / 180;

    for (let x = 0; x < width; x++) {
      const u = x / width;
      const lon = u * 360 - 180;
      const idx = (y * width + x) * 4;

      const nx = Math.cos((lon * Math.PI) / 180) * Math.cos(latRad) * 2.5 + 4.0;
      const ny = Math.sin((lon * Math.PI) / 180) * Math.cos(latRad) * 2.5 + 4.0;
      const nz = Math.sin(latRad) * 2.5 + 4.0;
      const baseNoise = fbm(nx + nz * 0.5, ny + nz * 0.5, 3);

      let sciScalar = baseNoise;

      if (body === 'moon') {
        if (layerId === 'lola_topo') {
          const spaDepression = lat < -65 ? -0.35 * Math.sin(((lat + 65) / -25) * (Math.PI / 2)) : 0;
          const rimUplift = lat < -85 ? 0.38 : 0;
          sciScalar = Math.max(0, Math.min(1, baseNoise * 0.65 + spaDepression + rimUplift + 0.35));
        } else if (layerId === 'diviner_thermal') {
          const latWarmth = Math.cos(latRad);
          const psrCold = lat < -80 ? -0.45 : 0;
          sciScalar = Math.max(0, Math.min(1, latWarmth * 0.7 + baseNoise * 0.25 + psrCold + 0.1));
        } else if (layerId === 'solar_grazing') {
          const polarBand = Math.max(0, 1 - Math.abs(lat - -89) / 8);
          sciScalar = Math.max(0, Math.min(1, polarBand * 0.65 + baseNoise * 0.35));
        } else if (layerId === 'minirf_cpr') {
          const polarIce = lat < -78 ? 0.45 : 0;
          sciScalar = Math.max(0, Math.min(1, valueNoise(u * 16, v * 16) * 0.5 + polarIce));
        }
      } else if (body === 'mars') {
        if (layerId === 'mola_topo') {
          const dichotomy = lat > 0 ? -0.22 : 0.22;
          const tharsis = Math.exp(-((lat - 10) ** 2) / 300 - ((lon - -105) ** 2) / 600) * 0.45;
          sciScalar = Math.max(0, Math.min(1, baseNoise * 0.5 + dichotomy + tharsis + 0.45));
        } else if (layerId === 'themis_inertia') {
          sciScalar = Math.max(0, Math.min(1, valueNoise(u * 12, v * 12) * 0.6 + baseNoise * 0.4));
        } else {
          sciScalar = Math.max(0, Math.min(1, baseNoise * 0.8 + 0.1));
        }
      } else {
        if (layerId === 'modis_lst') {
          const eqWarm = Math.cos(latRad);
          sciScalar = Math.max(0, Math.min(1, eqWarm * 0.85 + (baseNoise - 0.5) * 0.3));
        } else if (layerId === 'permafrost_ice') {
          const highLat = Math.max(0, (Math.abs(lat) - 48) / 42);
          sciScalar = Math.max(0, Math.min(1, highLat * 0.85 + baseNoise * 0.15));
        } else {
          const andes = lon > -76 && lon < -64 && lat > -50 && lat < 5 ? 0.45 : 0;
          const tibet = lon > 74 && lon < 102 && lat > 28 && lat < 42 ? 0.5 : 0;
          sciScalar = Math.max(0, Math.min(1, baseNoise * 0.45 + andes + tibet + 0.1));
        }
      }

      const rgb = sampleRamp(sciScalar, stops);
      imgData.data[idx] = rgb[0];
      imgData.data[idx + 1] = rgb[1];
      imgData.data[idx + 2] = rgb[2];
      imgData.data[idx + 3] = 235;
    }
  }

  ctx.putImageData(imgData, 0, 0);
  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.wrapS = THREE.RepeatWrapping;
  tex.wrapT = THREE.ClampToEdgeWrapping;
  sciTextureCache.set(cacheKey, tex);
  return tex;
}

// 3D Map Pin Geometries
function createPinBodyGeometry(): THREE.BufferGeometry {
  const shape = new THREE.Shape();
  const headR = 0.022;
  const headY = 0.052;
  const tipY = 0.002;

  shape.moveTo(0, tipY);
  shape.bezierCurveTo(0.005, 0.016, headR * 1.02, headY - headR * 0.45, headR, headY);
  shape.absarc(0, headY, headR, 0, Math.PI, false);
  shape.bezierCurveTo(-headR, headY - headR * 0.45, -0.005, 0.016, 0, tipY);

  const extrudeSettings: THREE.ExtrudeGeometryOptions = {
    depth: 0.007,
    bevelEnabled: true,
    bevelSegments: 2,
    steps: 1,
    bevelSize: 0.002,
    bevelThickness: 0.002,
  };
  const geo = new THREE.ExtrudeGeometry(shape, extrudeSettings);
  // Center along Z depth
  geo.translate(0, 0, -0.0055);
  return geo;
}

function createPinDotGeometry(): THREE.BufferGeometry {
  const geo = new THREE.CylinderGeometry(0.009, 0.009, 0.013, 24);
  geo.rotateX(Math.PI / 2);
  geo.translate(0, 0.052, 0);
  return geo;
}

function createPinRingGeometry(): THREE.BufferGeometry {
  const geo = new THREE.RingGeometry(0.003, 0.011, 24);
  geo.rotateX(-Math.PI / 2);
  geo.translate(0, 0.001, 0);
  return geo;
}

function createActiveRingGeometry(): THREE.BufferGeometry {
  const geo = new THREE.RingGeometry(0.012, 0.03, 36);
  geo.rotateX(-Math.PI / 2);
  geo.translate(0, 0.0015, 0);
  return geo;
}

function getPinColor(pin: GlobePin): string {
  if (pin.active) {
    return '#2563EB'; // Vibrant royal blue
  }
  switch (pin.accent) {
    case 'terracotta':
      return '#E06A3B';
    case 'amber':
      return '#E69A28';
    case 'moss':
      return '#184633';
    case 'slate':
      return '#64748B';
    default:
      return '#2563EB'; // Default royal blue matching reference
  }
}

export const PlanetaryGlobe3D: React.FC<PlanetaryGlobe3DProps> = ({
  body,
  layerId,
  activeLayerId,
  layerOpacity = 0.85,
  cameraMode = 'orbit',
  focusLat = -85,
  focusLon = 0,
  pins,
  onPinClick,
  autoRotate = false,
  themeSurface = 'studio-light',
  className = '',
  showPins = true,
  onlyActiveLabel = false,
}) => {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [projectedPins, setProjectedPins] = useState<ProjectedPin[]>([]);
  const [webglError, setWebglError] = useState(false);
  const [hoveredPinId, setHoveredPinId] = useState<string | null>(null);

  const pinsRef = useRef<GlobePin[]>(pins);
  pinsRef.current = pins;

  const showPinsRef = useRef<boolean>(showPins);
  showPinsRef.current = showPins;

  const sceneRefs = useRef<{
    renderer?: THREE.WebGLRenderer;
    scene?: THREE.Scene;
    camera?: THREE.PerspectiveCamera;
    controls?: OrbitControls;
    globeMesh?: THREE.Mesh;
    scientificMesh?: THREE.Mesh;
    cloudsMesh?: THREE.Mesh;
    pinsGroup?: THREE.Group;
    graticuleGroup?: THREE.Group;
    keyLight?: THREE.DirectionalLight;
    hemiLight?: THREE.HemisphereLight;
    rimLight?: THREE.DirectionalLight;
    requestRender?: () => void;
    transitionActive?: boolean;
    desiredCamPos: THREE.Vector3;
    isSoftwareGl: boolean;
    sharedGeos?: {
      pinBody: THREE.BufferGeometry;
      pinDot: THREE.BufferGeometry;
      pinRing: THREE.BufferGeometry;
      activeRing: THREE.BufferGeometry;
    };
  }>({
    desiredCamPos: new THREE.Vector3(0, -1.8, 2.7),
    isSoftwareGl: false,
  });

  const effectiveLayer = (activeLayerId || layerId || 'lola_topo') as string;

  // Helper: update authentic surface materials and lighting per planet body
  const updatePlanetMaterials = (targetBody: PlanetBody) => {
    const state = sceneRefs.current;
    const mesh = state.globeMesh;
    const renderer = state.renderer;
    const clouds = state.cloudsMesh;
    const keyLight = state.keyLight;
    const hemiLight = state.hemiLight;
    const rimLight = state.rimLight;
    if (!mesh || !renderer) return;

    const mat = mesh.material as THREE.MeshStandardMaterial;
    const onLoaded = () => state.requestRender?.();

    if (targetBody === 'earth') {
      const albedoTex = loadTexture(PLANET_TEXTURES.earth.day, true, onLoaded);
      const normalTex = loadTexture(PLANET_TEXTURES.earth.normal, false, onLoaded);
      const roughnessTex = loadInvertedSpecular(PLANET_TEXTURES.earth.specular, onLoaded);

      const maxAniso = renderer.capabilities.getMaxAnisotropy();
      albedoTex.anisotropy = maxAniso;
      normalTex.anisotropy = maxAniso;

      mat.map = albedoTex;
      mat.normalMap = normalTex;
      mat.normalScale.set(0.04, 0.04);
      mat.roughnessMap = roughnessTex;
      mat.roughness = 0.45;
      mat.metalness = 0.05;
      mat.bumpMap = null;
      mat.bumpScale = 0;

      if (clouds) clouds.visible = true;

      if (keyLight) keyLight.intensity = 2.3;
      if (hemiLight) {
        hemiLight.intensity = 0.95;
        hemiLight.color.setHex(0xdfe8ec);
      }
      if (rimLight) rimLight.intensity = 0.65;
    } else if (targetBody === 'moon') {
      const albedoTex = loadTexture(PLANET_TEXTURES.moon.albedo, true, onLoaded);
      const bumpTex = loadTexture(PLANET_TEXTURES.moon.albedo, false, onLoaded);

      const maxAniso = renderer.capabilities.getMaxAnisotropy();
      albedoTex.anisotropy = maxAniso;

      mat.map = albedoTex;
      mat.normalMap = null;
      mat.roughnessMap = null;
      mat.roughness = 0.92;
      mat.metalness = 0.02;
      mat.bumpMap = bumpTex;
      mat.bumpScale = 0.006;

      if (clouds) clouds.visible = false;

      // High-contrast lunar lighting
      if (keyLight) keyLight.intensity = 2.85;
      if (hemiLight) {
        hemiLight.intensity = 0.32;
        hemiLight.color.setHex(0x22262a);
      }
      if (rimLight) rimLight.intensity = 0.45;
    } else if (targetBody === 'mars') {
      const albedoTex = loadTexture(PLANET_TEXTURES.mars.albedo, true, onLoaded);
      const normalTex = loadTexture(PLANET_TEXTURES.mars.normal, false, onLoaded);

      const maxAniso = renderer.capabilities.getMaxAnisotropy();
      albedoTex.anisotropy = maxAniso;
      normalTex.anisotropy = maxAniso;

      mat.map = albedoTex;
      mat.normalMap = normalTex;
      mat.normalScale.set(0.06, 0.06);
      mat.roughnessMap = null;
      mat.roughness = 0.82;
      mat.metalness = 0.04;
      mat.bumpMap = null;
      mat.bumpScale = 0;

      if (clouds) clouds.visible = false;

      if (keyLight) keyLight.intensity = 2.4;
      if (hemiLight) {
        hemiLight.intensity = 0.65;
        hemiLight.color.setHex(0xfadbc8);
      }
      if (rimLight) rimLight.intensity = 0.55;
    }

    mat.needsUpdate = true;
    state.requestRender?.();
  };

  // Helper: update scientific overlay dataset & blending
  const updateScientificOverlay = (
    targetBody: PlanetBody,
    targetLayer: string,
    opacity: number,
  ) => {
    const state = sceneRefs.current;
    const sciMesh = state.scientificMesh;
    if (!sciMesh) return;

    const sciTex = getScientificTexture(targetBody, targetLayer);
    const mat = sciMesh.material as THREE.MeshStandardMaterial;
    mat.map = sciTex;
    mat.opacity = Math.min(0.92, Math.max(0, opacity * 0.82));
    mat.needsUpdate = true;

    sciMesh.visible = opacity > 0.05;
    state.requestRender?.();
  };

  // Helper: update 3D pins inside Three.js scene
  const updatePins = (pinList: GlobePin[]) => {
    const state = sceneRefs.current;
    const pinsGroup = state.pinsGroup;
    const geos = state.sharedGeos;
    if (!pinsGroup || !geos) return;

    while (pinsGroup.children.length > 0) {
      const child = pinsGroup.children[0];
      pinsGroup.remove(child);
      if (child instanceof THREE.Group) {
        child.traverse((c) => {
          if (c instanceof THREE.Mesh) {
            if (Array.isArray(c.material)) c.material.forEach((m) => m.dispose());
            else c.material.dispose();
          }
        });
      }
    }

    pinList.forEach((pin) => {
      const pinGroup = new THREE.Group();
      pinGroup.name = `pin_${pin.id}`;
      pinGroup.userData = { pinId: pin.id };

      latLonToVec3(pin.lat, pin.lon, 1.002, pinGroup.position);
      const normal = pinGroup.position.clone().normalize();
      pinGroup.userData.normal = normal;

      const pinHex = getPinColor(pin);
      const bodyMat = new THREE.MeshStandardMaterial({
        color: new THREE.Color(pinHex),
        roughness: 0.35,
        metalness: 0.15,
      });
      const bodyMesh = new THREE.Mesh(geos.pinBody, bodyMat);
      bodyMesh.userData = { pinId: pin.id };
      pinGroup.add(bodyMesh);

      const dotMat = new THREE.MeshBasicMaterial({ color: 0xffffff });
      const dotMesh = new THREE.Mesh(geos.pinDot, dotMat);
      dotMesh.userData = { pinId: pin.id };
      pinGroup.add(dotMesh);

      const ringMat = new THREE.MeshBasicMaterial({
        color: new THREE.Color(pinHex),
        side: THREE.DoubleSide,
        transparent: true,
        opacity: pin.active ? 0.85 : 0.45,
      });
      const ringMesh = new THREE.Mesh(geos.pinRing, ringMat);
      ringMesh.userData = { pinId: pin.id };
      pinGroup.add(ringMesh);

      if (pin.active) {
        const activeMat = new THREE.MeshBasicMaterial({
          color: new THREE.Color('#3B82F6'),
          side: THREE.DoubleSide,
          transparent: true,
          opacity: 0.85,
        });
        const activeMesh = new THREE.Mesh(geos.activeRing, activeMat);
        activeMesh.userData = { pinId: pin.id };
        pinGroup.add(activeMesh);
      }

      pinsGroup.add(pinGroup);
    });

    state.requestRender?.();
  };

  // Update desired camera vector on mode/focus changes
  useEffect(() => {
    const state = sceneRefs.current;
    const dist = cameraMode === 'polar' ? 3.15 : cameraMode === 'relief' ? 2.65 : 2.95;

    let targetLat = focusLat;
    let targetLon = focusLon;

    if (body === 'moon') {
      // For lunar south polar candidates (lat < -75), angle camera obliquely at -68° facing targetLon
      // so the globe camera dynamically rotates and focuses on that target's latitude and longitude,
      // avoiding collinear gimbal lock while giving a clear 3D perspective of the massifs and pins.
      if (cameraMode === 'polar') {
        targetLat = -86;
      } else {
        targetLat = Math.min(-62, Math.max(-72, focusLat * 0.76 - 2));
      }
      targetLon = focusLon;
    } else if (cameraMode === 'polar') {
      targetLat = -88;
    }

    latLonToVec3(targetLat, targetLon, dist, _targetCamPos);
    if (cameraMode === 'relief') {
      _targetCamPos.y += 0.35;
      _targetCamPos.normalize().multiplyScalar(dist);
    }
    state.desiredCamPos.copy(_targetCamPos);
    state.transitionActive = true;
    state.requestRender?.();
  }, [body, cameraMode, focusLat, focusLon]);

  // Update scene background when themeSurface changes
  useEffect(() => {
    const state = sceneRefs.current;
    if (!state.scene) return;
    const bgHex = themeSurface === 'orbital-dark' ? 0x0b0d11 : 0xffffff;
    state.scene.background = new THREE.Color(bgHex);
    state.requestRender?.();
  }, [themeSurface]);

  // Update autoRotate flag
  useEffect(() => {
    const state = sceneRefs.current;
    if (state.controls && !state.isSoftwareGl) {
      state.controls.autoRotate = autoRotate;
      state.controls.autoRotateSpeed = 0.75;
      state.requestRender?.();
    }
  }, [autoRotate]);

  // Prop updates: body change
  useEffect(() => {
    updatePlanetMaterials(body);
  }, [body]);

  // Prop updates: scientific overlay change
  useEffect(() => {
    updateScientificOverlay(body, effectiveLayer, layerOpacity);
  }, [body, effectiveLayer, layerOpacity]);

  // Prop updates: pins change
  useEffect(() => {
    updatePins(pins);
  }, [pins]);

  // Prop updates: showPins toggle
  useEffect(() => {
    if (sceneRefs.current.pinsGroup) {
      sceneRefs.current.pinsGroup.visible = showPins;
      sceneRefs.current.requestRender?.();
    }
    if (!showPins) {
      setProjectedPins([]);
    }
  }, [showPins]);

  // Initialize Three.js Scene once on mount
  useEffect(() => {
    const mount = containerRef.current;
    if (!mount) return;

    const isSoftwareGl = (() => {
      try {
        const probe = document.createElement('canvas').getContext('webgl2');
        if (!probe) return true;
        const ext = probe.getExtension('WEBGL_debug_renderer_info');
        const param = ext ? ext.UNMASKED_RENDERER_WEBGL : probe.RENDERER;
        const gpu = String(probe.getParameter(param));
        probe.getExtension('WEBGL_lose_context')?.loseContext();
        return /SwiftShader|llvmpipe|softpipe|Software|Basic Render/i.test(gpu);
      } catch {
        return true;
      }
    })();

    let renderer: THREE.WebGLRenderer;
    try {
      renderer = new THREE.WebGLRenderer({
        antialias: !isSoftwareGl,
        powerPreference: 'high-performance',
        alpha: false,
      });
    } catch {
      setWebglError(true);
      return;
    }

    const width = Math.max(300, mount.clientWidth);
    const height = Math.max(300, mount.clientHeight);

    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.08;
    renderer.setPixelRatio(isSoftwareGl ? 1 : Math.min(window.devicePixelRatio, 2));
    renderer.setSize(width, height);
    mount.appendChild(renderer.domElement);

    const scene = new THREE.Scene();
    scene.background = new THREE.Color(
      themeSurface === 'orbital-dark' ? 0x0b0d11 : 0xffffff,
    );

    const pmrem = new THREE.PMREMGenerator(renderer);
    scene.environment = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;
    pmrem.dispose();

    const camera = new THREE.PerspectiveCamera(38, width / height, 0.1, 50);
    const initialLat =
      body === 'moon' ? Math.min(-62, Math.max(-72, focusLat * 0.76 - 2)) : focusLat;
    latLonToVec3(initialLat, focusLon, 2.95, camera.position);
    camera.lookAt(0, 0, 0);

    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enablePan = false;
    controls.minDistance = 1.85;
    controls.maxDistance = 5.2;
    controls.enableDamping = !isSoftwareGl;
    controls.dampingFactor = 0.07;
    controls.rotateSpeed = 0.65;

    // 3-point planetary illumination
    const keyLight = new THREE.DirectionalLight(0xfff5e4, 2.35);
    keyLight.position.set(4.5, 1.8, 3.5);
    scene.add(keyLight);

    const hemiLight = new THREE.HemisphereLight(0xdfe8ec, 0x3b352e, 0.95);
    scene.add(hemiLight);

    const rimLight = new THREE.DirectionalLight(0xcbe0d5, 0.65);
    rimLight.position.set(-4.0, -2.5, -3.0);
    scene.add(rimLight);

    // 1. Globe sphere mesh
    const sphereGeo = new THREE.SphereGeometry(1.0, 64, 48);
    const sphereMat = new THREE.MeshStandardMaterial({
      roughness: 0.85,
      metalness: 0.04,
    });
    const globeMesh = new THREE.Mesh(sphereGeo, sphereMat);
    scene.add(globeMesh);

    // 2. Scientific Overlay sphere mesh (radius 1.002)
    const sciGeo = new THREE.SphereGeometry(1.002, 64, 48);
    const sciMat = new THREE.MeshStandardMaterial({
      transparent: true,
      opacity: Math.min(0.92, Math.max(0, layerOpacity * 0.82)),
      depthWrite: false,
      roughness: 0.75,
      metalness: 0.0,
      blending: THREE.NormalBlending,
    });
    const scientificMesh = new THREE.Mesh(sciGeo, sciMat);
    scientificMesh.visible = layerOpacity > 0.05;
    scene.add(scientificMesh);

    // 3. Earth Atmospheric Cloud Mesh (radius 1.012)
    const cloudGeo = new THREE.SphereGeometry(1.012, 64, 48);
    const cloudTex = loadTexture(PLANET_TEXTURES.earth.clouds, true, () => {
      state.requestRender?.();
    });
    const cloudMat = new THREE.MeshStandardMaterial({
      map: cloudTex,
      transparent: true,
      opacity: 0.82,
      blending: THREE.NormalBlending,
      depthWrite: false,
      roughness: 0.95,
      metalness: 0.0,
    });
    const cloudsMesh = new THREE.Mesh(cloudGeo, cloudMat);
    cloudsMesh.visible = body === 'earth';
    scene.add(cloudsMesh);

    // 4. Subtle scientific lat/lon graticule rings
    const graticuleGroup = new THREE.Group();
    const gratMat = new THREE.LineBasicMaterial({
      color: themeSurface === 'orbital-dark' ? 0x94a3b8 : 0x5c5852,
      transparent: true,
      opacity: 0.22,
    });

    const latLines = [-75, -60, -30, 0, 30, 60, 75];
    for (const lat of latLines) {
      const pts: THREE.Vector3[] = [];
      for (let i = 0; i <= 72; i++) {
        const lon = (i / 72) * 360 - 180;
        pts.push(latLonToVec3(lat, lon, 1.006, new THREE.Vector3()));
      }
      const g = new THREE.BufferGeometry().setFromPoints(pts);
      graticuleGroup.add(new THREE.Line(g, gratMat));
    }

    for (let lon = -180; lon < 180; lon += 45) {
      const pts: THREE.Vector3[] = [];
      for (let i = 0; i <= 48; i++) {
        const lat = -90 + (i / 48) * 180;
        pts.push(latLonToVec3(lat, lon, 1.006, new THREE.Vector3()));
      }
      const g = new THREE.BufferGeometry().setFromPoints(pts);
      graticuleGroup.add(new THREE.Line(g, gratMat));
    }
    scene.add(graticuleGroup);

    // Subtle outer orbital datum ring
    const ringPts: THREE.Vector3[] = [];
    for (let i = 0; i <= 96; i++) {
      const a = (i / 96) * Math.PI * 2;
      ringPts.push(new THREE.Vector3(Math.cos(a) * 1.16, 0, Math.sin(a) * 1.16));
    }
    const datumRing = new THREE.Line(
      new THREE.BufferGeometry().setFromPoints(ringPts),
      new THREE.LineBasicMaterial({
        color: 0x2a5a44,
        transparent: true,
        opacity: 0.3,
      }),
    );
    scene.add(datumRing);

    // 5. 3D Map Pins Group & Shared Geometries
    const pinsGroup = new THREE.Group();
    pinsGroup.visible = showPinsRef.current;
    scene.add(pinsGroup);

    const sharedGeos = {
      pinBody: createPinBodyGeometry(),
      pinDot: createPinDotGeometry(),
      pinRing: createPinRingGeometry(),
      activeRing: createActiveRingGeometry(),
    };

    const state = sceneRefs.current;
    state.renderer = renderer;
    state.scene = scene;
    state.camera = camera;
    state.controls = controls;
    state.globeMesh = globeMesh;
    state.scientificMesh = scientificMesh;
    state.cloudsMesh = cloudsMesh;
    state.pinsGroup = pinsGroup;
    state.graticuleGroup = graticuleGroup;
    state.keyLight = keyLight;
    state.hemiLight = hemiLight;
    state.rimLight = rimLight;
    state.sharedGeos = sharedGeos;
    state.isSoftwareGl = isSoftwareGl;
    state.desiredCamPos.copy(camera.position);

    // Initialize materials, overlay & pins immediately on scene creation
    updatePlanetMaterials(body);
    updateScientificOverlay(body, effectiveLayer, layerOpacity);
    updatePins(pinsRef.current);

    let frameId = 0;
    let renderBusy = false;
    let renderDirty = false;
    let disposed = false;
    let lastTime = performance.now();

    function projectPins() {
      if (!showPinsRef.current) {
        setProjectedPins([]);
        return;
      }
      const el = containerRef.current;
      if (!el) return;
      const w = el.clientWidth;
      const h = el.clientHeight;
      _camDir.copy(camera.position).normalize();

      const nextProjected: ProjectedPin[] = pinsRef.current.map((pin) => {
        // Project above the top of the 3D pin (pin head ~1.054, top ~1.074)
        latLonToVec3(pin.lat, pin.lon, 1.085, _v1);
        const dot = _v2.copy(_v1).normalize().dot(_camDir);
        const visible = dot > 0.08;
        _v1.project(camera);
        return {
          ...pin,
          x: ((_v1.x + 1) / 2) * w,
          y: ((-_v1.y + 1) / 2) * h,
          visible,
        };
      });
      setProjectedPins(nextProjected);
    }

    function afterDraw(cb: () => void) {
      const gl = renderer.getContext() as WebGL2RenderingContext;
      const sync = gl.fenceSync?.(gl.SYNC_GPU_COMMANDS_COMPLETE, 0);
      gl.flush();
      const poll = () => {
        if (disposed) return;
        const st = sync && gl.getSyncParameter(sync, gl.SYNC_STATUS);
        if (st === gl.UNSIGNALED) {
          frameId = window.setTimeout(poll, 5);
        } else {
          if (sync) gl.deleteSync(sync);
          frameId = window.setTimeout(cb, 80);
        }
      };
      frameId = window.setTimeout(poll, 5);
    }

    function requestRender() {
      if (disposed) return;
      if (renderBusy) {
        renderDirty = true;
        return;
      }
      renderBusy = true;
      frameId = requestAnimationFrame((now) => {
        if (disposed) return;
        const dt = Math.min(0.05, (now - lastTime) / 1000);
        lastTime = now;
        renderDirty = false;

        // Smooth camera transitions
        if (state.transitionActive) {
          const alpha = 1 - Math.exp(-6.5 * dt);
          camera.position.lerp(state.desiredCamPos, alpha);
          if (camera.position.distanceTo(state.desiredCamPos) < 0.015) {
            camera.position.copy(state.desiredCamPos);
            state.transitionActive = false;
          } else {
            renderDirty = true;
          }
        }

        // Earth Atmospheric Cloud Rotation
        if (cloudsMesh && cloudsMesh.visible) {
          cloudsMesh.rotation.y += dt * 0.015;
          renderDirty = true;
        }

        // Orient 3D Map Pins perpendicular to surface normal, facing camera
        const camPos = camera.position;
        if (pinsGroup && showPinsRef.current) {
          pinsGroup.visible = true;
          _camDir.copy(camPos).normalize();
          for (let i = 0; i < pinsGroup.children.length; i++) {
            const pGroup = pinsGroup.children[i] as THREE.Group;
            const norm = pGroup.userData.normal as THREE.Vector3;
            if (!norm) continue;

            const dot = norm.dot(_camDir);
            const isFront = dot > 0.04;
            pGroup.visible = isFront;

            if (isFront) {
              _toCam.copy(camPos).sub(pGroup.position);
              _tangent.copy(_toCam).sub(_vTemp.copy(norm).multiplyScalar(_toCam.dot(norm)));
              if (_tangent.lengthSq() > 0.00001) {
                _tangent.normalize();
                _side.crossVectors(norm, _tangent).normalize();
                _rotMatrix.makeBasis(_side, norm, _tangent);
                pGroup.quaternion.setFromRotationMatrix(_rotMatrix);
              }
            }
          }
        } else if (pinsGroup) {
          pinsGroup.visible = false;
        }

        const changed = controls.update();
        if (changed || controls.autoRotate) renderDirty = true;

        renderer.render(scene, camera);
        projectPins();

        const done = () => {
          renderBusy = false;
          if (renderDirty && !disposed) requestRender();
        };

        if (isSoftwareGl) afterDraw(done);
        else done();
      });
    }

    state.requestRender = requestRender;

    controls.addEventListener('start', () => {
      state.transitionActive = false;
    });
    controls.addEventListener('change', () => {
      requestRender();
    });

    const handleResize = () => {
      if (!mount || disposed) return;
      const nw = Math.max(300, mount.clientWidth);
      const nh = Math.max(300, mount.clientHeight);
      camera.aspect = nw / nh;
      camera.updateProjectionMatrix();
      renderer.setSize(nw, nh);
      requestRender();
    };
    const resizeObs = new ResizeObserver(handleResize);
    resizeObs.observe(mount);

    const handleContextLost = (e: Event) => {
      e.preventDefault();
      setWebglError(true);
    };
    renderer.domElement.addEventListener('webglcontextlost', handleContextLost);

    requestRender();

    return () => {
      disposed = true;
      cancelAnimationFrame(frameId);
      clearTimeout(frameId);
      resizeObs.disconnect();
      renderer.domElement.removeEventListener('webglcontextlost', handleContextLost);
      controls.dispose();
      sphereGeo.dispose();
      sphereMat.dispose();
      sciGeo.dispose();
      sciMat.dispose();
      cloudGeo.dispose();
      cloudMat.dispose();
      sharedGeos.pinBody.dispose();
      sharedGeos.pinDot.dispose();
      sharedGeos.pinRing.dispose();
      sharedGeos.activeRing.dispose();
      graticuleGroup.children.forEach((c) => {
        if (c instanceof THREE.Line) c.geometry.dispose();
      });
      gratMat.dispose();
      datumRing.geometry.dispose();
      (datumRing.material as THREE.Material).dispose();
      renderer.dispose();
      if (renderer.domElement.parentNode === mount) {
        mount.removeChild(renderer.domElement);
      }
    };
  }, []);

  // Raycasting & Pointer Interaction on 3D Map Pins
  useEffect(() => {
    const mount = containerRef.current;
    if (!mount) return;

    let pointerDownPos = { x: 0, y: 0 };

    const getCoords = (e: MouseEvent) => {
      const rect = mount.getBoundingClientRect();
      return {
        x: ((e.clientX - rect.left) / rect.width) * 2 - 1,
        y: -((e.clientY - rect.top) / rect.height) * 2 + 1,
      };
    };

    const handlePointerDown = (e: MouseEvent) => {
      pointerDownPos = { x: e.clientX, y: e.clientY };
    };

    const handlePointerUp = (e: MouseEvent) => {
      if (!showPinsRef.current) return;
      const dx = e.clientX - pointerDownPos.x;
      const dy = e.clientY - pointerDownPos.y;
      if (Math.hypot(dx, dy) > 6) return; // camera drag, not a click

      const state = sceneRefs.current;
      if (!state.camera || !state.pinsGroup) return;

      const c = getCoords(e);
      _mouse.set(c.x, c.y);
      _raycaster.setFromCamera(_mouse, state.camera);

      const hits = _raycaster.intersectObjects(state.pinsGroup.children, true);
      if (hits.length > 0) {
        let obj: THREE.Object3D | null = hits[0].object;
        while (obj && !obj.userData?.pinId && obj.parent) {
          obj = obj.parent;
        }
        if (obj?.userData?.pinId) {
          onPinClick?.(obj.userData.pinId);
        }
      }
    };

    const handlePointerMove = (e: MouseEvent) => {
      if (!showPinsRef.current) return;
      const state = sceneRefs.current;
      if (!state.camera || !state.pinsGroup) return;

      const c = getCoords(e);
      _mouse.set(c.x, c.y);
      _raycaster.setFromCamera(_mouse, state.camera);

      const hits = _raycaster.intersectObjects(state.pinsGroup.children, true);
      if (hits.length > 0) {
        mount.style.cursor = 'pointer';
      } else {
        mount.style.cursor = 'grab';
      }
    };

    mount.addEventListener('pointerdown', handlePointerDown);
    mount.addEventListener('pointerup', handlePointerUp);
    mount.addEventListener('pointermove', handlePointerMove);

    return () => {
      mount.removeEventListener('pointerdown', handlePointerDown);
      mount.removeEventListener('pointerup', handlePointerUp);
      mount.removeEventListener('pointermove', handlePointerMove);
    };
  }, [onPinClick]);

  if (webglError) {
    return (
      <div
        className={`relative flex items-center justify-center bg-[#F5F1EB] rounded-2xl border border-[#7A7670]/15 ${className}`}
      >
        <div className="text-center p-6 max-w-sm">
          <p className="font-display font-semibold text-[#1D1B17]">
            3D WebGL Context Unavailable
          </p>
          <p className="text-xs text-[#414943] mt-1">
            Planetary surface coordinates and scientific scoring remain fully active in tabular mode.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className={`relative w-full h-full overflow-hidden ${className}`}>
      <div ref={containerRef} className="w-full h-full cursor-grab active:cursor-grabbing" />

      {/* Projected 3D Spatial Pin Labels (anchored above the 3D pin meshes) */}
      {showPins && (
        <div className="pointer-events-none absolute inset-0 overflow-hidden">
          {projectedPins
            .filter((p) => p.visible)
            .sort((a, b) => {
              const scoreA = a.active ? 2 : hoveredPinId === a.id ? 1 : 0;
              const scoreB = b.active ? 2 : hoveredPinId === b.id ? 1 : 0;
              return scoreA - scoreB;
            })
            .map((pin) => {
              const isTargetActive = !!pin.active;
              const isHovered = hoveredPinId === pin.id;
              const isExpanded = onlyActiveLabel ? isTargetActive : (isTargetActive || isHovered);
              const isArtemis =
                body === 'moon' && (isTargetActive || (pin.sublabel && pin.sublabel.toLowerCase().includes('artemis')));

              const dotColor =
                isTargetActive
                  ? 'bg-[#3B82F6]'
                  : pin.accent === 'terracotta'
                    ? 'bg-[#E06A3B]'
                    : pin.accent === 'amber'
                      ? 'bg-[#E69A28]'
                      : pin.accent === 'slate'
                        ? 'bg-[#7A7670]'
                        : 'bg-[#184633]';

              if (isExpanded) {
                return (
                  <button
                    key={pin.id}
                    type="button"
                    onClick={() => onPinClick?.(pin.id)}
                    onMouseEnter={() => setHoveredPinId(pin.id)}
                    onMouseLeave={() => setHoveredPinId(null)}
                    style={{
                      transform: `translate3d(${pin.x}px, ${pin.y}px, 0) translate(-50%, -100%)`,
                    }}
                    className={`pointer-events-auto absolute top-0 left-0 flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold shadow-xl border transition-all whitespace-nowrap cursor-pointer ${
                      isTargetActive
                        ? 'bg-[#0F172A] text-[#FAF8F5] border-[#3B82F6] ring-2 ring-[#60A5FA]/60 shadow-[0_0_20px_rgba(59,130,246,0.55)] scale-105 z-30'
                        : 'bg-[#1E293B] text-[#FAF8F5] border-[#3B82F6]/60 shadow-lg scale-105 z-20'
                    }`}
                  >
                    <span
                      className={`w-2.5 h-2.5 rounded-full shrink-0 ${
                        isTargetActive
                          ? 'bg-[#3B82F6] animate-pulse ring-2 ring-white/70'
                          : `${dotColor} ring-1 ring-white/60`
                      }`}
                    />
                    <span className="font-bold">{pin.label}</span>
                    {isArtemis && (
                      <span className="px-1.5 py-0.5 rounded-full bg-[#2563EB] text-white text-[10px] font-extrabold uppercase tracking-wider">
                        ARTEMIS IV
                      </span>
                    )}
                    {pin.scoreBadge && (
                      <span
                        className={`font-mono text-[11px] px-1.5 py-0.5 rounded-full font-semibold ${
                          isTargetActive
                            ? 'bg-[#1E293B] text-[#93C5FD] border border-[#3B82F6]/40'
                            : 'bg-[#0F172A] text-[#93C5FD] border border-[#3B82F6]/30'
                        }`}
                      >
                        {pin.scoreBadge}
                      </span>
                    )}
                  </button>
                );
              }

              // Sleek, compact glowing circular dot beacon for non-active pins (zero duplicate background box or label overlap!)
              return (
                <button
                  key={pin.id}
                  type="button"
                  onClick={() => onPinClick?.(pin.id)}
                  onMouseEnter={() => setHoveredPinId(pin.id)}
                  onMouseLeave={() => setHoveredPinId(null)}
                  style={{
                    transform: `translate3d(${pin.x}px, ${pin.y}px, 0) translate(-50%, -50%)`,
                  }}
                  aria-label={pin.label}
                  title={`${pin.label}${pin.scoreBadge ? ` · ${pin.scoreBadge}` : ''} (Click to select)`}
                  className="pointer-events-auto absolute top-0 left-0 z-10 transition-transform duration-150 hover:scale-140 focus:outline-none cursor-pointer p-0.5"
                >
                  <div className="relative flex items-center justify-center">
                    <span className={`w-2.5 h-2.5 rounded-full ${dotColor} border border-white/90 shadow-xs`} />
                  </div>
                </button>
              );
            })}
        </div>
      )}
    </div>
  );
};
