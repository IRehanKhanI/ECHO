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
  accent?: 'moss' | 'terracotta' | 'amber' | 'slate';
  active?: boolean;
  scoreBadge?: string;
}

export type GlobeCameraMode = 'orbit' | 'polar' | 'relief';

interface PlanetaryGlobe3DProps {
  body: PlanetBody;
  layerId: ScientificLayerId;
  layerOpacity?: number;
  cameraMode?: GlobeCameraMode;
  focusLat?: number;
  focusLon?: number;
  pins: GlobePin[];
  onPinClick?: (pinId: string) => void;
  autoRotate?: boolean;
  themeSurface?: 'studio-light' | 'orbital-dark';
  className?: string;
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

function fbm(x: number, y: number, octaves = 4): number {
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

function generatePlanetaryTextures(
  body: PlanetBody,
  layerId: ScientificLayerId,
  layerOpacity: number,
): { albedoMap: THREE.CanvasTexture; bumpMap: THREE.CanvasTexture } {
  const width = 768;
  const height = 384;

  const albedoCanvas = document.createElement('canvas');
  albedoCanvas.width = width;
  albedoCanvas.height = height;
  const aCtx = albedoCanvas.getContext('2d')!;
  const aImg = aCtx.createImageData(width, height);

  const bumpCanvas = document.createElement('canvas');
  bumpCanvas.width = width;
  bumpCanvas.height = height;
  const bCtx = bumpCanvas.getContext('2d')!;
  const bImg = bCtx.createImageData(width, height);

  // Layer scientific color ramps
  const rampMap: Record<ScientificLayerId, string[]> = {
    lola_topo: ['#1B4332', '#3B7A5C', '#E69A28', '#A33E11'],
    diviner_thermal: ['#172E3C', '#2A5A44', '#E69A28', '#D94E28'],
    solar_grazing: ['#1E1D1B', '#4A4E48', '#D99126', '#FFF5DD'],
    minirf_cpr: ['#2D3833', '#386851', '#E69A28', '#C4451C'],
    mola_topo: ['#1F4F3A', '#6B8A47', '#E69A28', '#A33E11'],
    themis_inertia: ['#2B2724', '#7A5438', '#E06A3B', '#FFB654'],
    crism_mineralogy: ['#3F3933', '#2A5A44', '#D99126', '#A33E11'],
    srtm_slope: ['#2A5A44', '#6E9358', '#E69A28', '#A33E11'],
    modis_lst: ['#1E3F4B', '#2A5A44', '#E69A28', '#BA1A1A'],
    permafrost_ice: ['#7A5438', '#C8BFB2', '#5F8F77', '#0F422E'],
  };

  const layerStops = (rampMap[layerId] || rampMap.lola_topo).map(hexToRgb);

  // Pre-seed craters for Moon/Mars
  const craters =
    body === 'earth'
      ? []
      : Array.from({ length: 42 }, (_, i) => ({
          u: hash2d(i * 3.1, 7.2),
          v: 0.1 + hash2d(i * 5.7, 2.3) * 0.8,
          r: 0.02 + hash2d(i * 9.1, 4.4) * 0.065,
        }));

  for (let y = 0; y < height; y++) {
    const v = y / height; // 0 = North Pole, 1 = South Pole
    const lat = 90 - v * 180;
    const latRad = (lat * Math.PI) / 180;

    for (let x = 0; x < width; x++) {
      const u = x / width;
      const lon = u * 360 - 180;
      const idx = (y * width + x) * 4;

      // Spherical seamless-ish domain coordinates
      const nx = Math.cos((lon * Math.PI) / 180) * Math.cos(latRad) * 2.6 + 5.0;
      const ny = Math.sin((lon * Math.PI) / 180) * Math.cos(latRad) * 2.6 + 5.0;
      const nz = Math.sin(latRad) * 2.6 + 5.0;

      let heightVal = fbm(nx + nz * 0.6, ny + nz * 0.4, 4);

      if (body === 'moon') {
        // Add crater relief + Shackleton/SPA depression near South Pole
        for (let c = 0; c < craters.length; c++) {
          const cr = craters[c];
          const du = Math.min(Math.abs(u - cr.u), 1 - Math.abs(u - cr.u));
          const dv = v - cr.v;
          const dist = Math.hypot(du, dv * 0.7);
          if (dist < cr.r) {
            const norm = dist / cr.r;
            heightVal -= (1 - norm * norm) * 0.28;
          } else if (dist < cr.r * 1.25) {
            heightVal += (1 - (dist - cr.r) / (cr.r * 0.25)) * 0.09;
          }
        }
        // South Pole Aitken & Shackleton rim contrast
        if (lat < -75) {
          const polarNoise = valueNoise(u * 24, v * 24);
          heightVal = heightVal * 0.65 + (polarNoise > 0.55 ? 0.32 : -0.18);
        }
      } else if (body === 'mars') {
        // Tharsis bulge + Valles Marineris + dichotomy
        const dichotomy = lat > 15 ? -0.22 : 0.16;
        heightVal += dichotomy;
        for (let c = 0; c < craters.length; c++) {
          const cr = craters[c];
          const du = Math.min(Math.abs(u - cr.u), 1 - Math.abs(u - cr.u));
          const dv = v - cr.v;
          const dist = Math.hypot(du, dv * 0.75);
          if (dist < cr.r * 0.85) heightVal -= 0.18;
        }
      } else {
        // Earth stylized continents (South America, Antarctica, High Arctic, Tibet, Africa/Eurasia)
        const continentBase = fbm(u * 6.5 + 1.2, v * 3.8 + 0.7, 4);
        const antarctica = lat < -68 ? 0.45 : 0;
        const greenlandArctic = lat > 64 && lon > -115 && lon < 35 ? 0.35 : 0;
        const andes =
          lon > -76 && lon < -62 && lat > -52 && lat < 8 ? 0.34 : 0;
        const tibet =
          lon > 72 && lon < 104 && lat > 27 && lat < 44 ? 0.38 : 0;
        heightVal = Math.max(
          continentBase + antarctica + greenlandArctic + andes + tibet - 0.12,
          0,
        );
      }

      const hClamped = Math.max(0, Math.min(1, heightVal));

      // Natural planetary base RGB
      let baseRgb: [number, number, number];
      if (body === 'moon') {
        const g = Math.round(132 + hClamped * 92);
        baseRgb = [g, g - 3, g - 8];
      } else if (body === 'mars') {
        baseRgb = [
          Math.round(146 + hClamped * 76),
          Math.round(86 + hClamped * 48),
          Math.round(62 + hClamped * 30),
        ];
      } else {
        const isLand = hClamped > 0.46;
        if (!isLand) {
          baseRgb = [223, 217, 206]; // Cartographic warm alabaster ocean
        } else if (lat < -65 || lat > 72) {
          baseRgb = [242, 240, 236]; // Polar cryo sheet
        } else {
          baseRgb = [
            Math.round(166 - (hClamped - 0.46) * 90),
            Math.round(158 - (hClamped - 0.46) * 65),
            Math.round(138 - (hClamped - 0.46) * 75),
          ];
        }
      }

      // Compute scientific layer scalar 0..1
      let sciScalar = hClamped;
      if (layerId === 'diviner_thermal') {
        const latCooling = Math.cos(latRad);
        sciScalar = Math.max(
          0,
          Math.min(1, latCooling * 0.72 + (hClamped - 0.4) * 0.45),
        );
      } else if (layerId === 'solar_grazing') {
        const polarBand = 1 - Math.min(1, Math.abs(Math.abs(lat) - 86) / 14);
        sciScalar = Math.max(0, Math.min(1, polarBand * 0.75 + hClamped * 0.35));
      } else if (layerId === 'minirf_cpr') {
        const polarIce = Math.abs(lat) > 78 ? 0.42 : 0.0;
        sciScalar = Math.max(0, Math.min(1, valueNoise(u * 20, v * 20) * 0.55 + polarIce));
      } else if (layerId === 'modis_lst') {
        const eqWarm = Math.cos(latRad);
        sciScalar = Math.max(0, Math.min(1, eqWarm * 0.82 - hClamped * 0.25 + 0.12));
      } else if (layerId === 'permafrost_ice') {
        const highLat = Math.max(0, (Math.abs(lat) - 48) / 42);
        sciScalar = Math.max(0, Math.min(1, highLat * 0.8 + (hClamped > 0.65 ? 0.25 : 0)));
      } else if (layerId === 'themis_inertia') {
        sciScalar = Math.max(0, Math.min(1, valueNoise(u * 14, v * 14) * 0.6 + hClamped * 0.4));
      }

      const sciRgb = sampleRamp(sciScalar, layerStops);
      const blend =
        body === 'earth' && hClamped <= 0.46 && layerId !== 'modis_lst'
          ? layerOpacity * 0.16
          : layerOpacity * 0.78;

      aImg.data[idx] = Math.round(baseRgb[0] * (1 - blend) + sciRgb[0] * blend);
      aImg.data[idx + 1] = Math.round(baseRgb[1] * (1 - blend) + sciRgb[1] * blend);
      aImg.data[idx + 2] = Math.round(baseRgb[2] * (1 - blend) + sciRgb[2] * blend);
      aImg.data[idx + 3] = 255;

      const bumpByte = Math.round(hClamped * 255);
      bImg.data[idx] = bumpByte;
      bImg.data[idx + 1] = bumpByte;
      bImg.data[idx + 2] = bumpByte;
      bImg.data[idx + 3] = 255;
    }
  }

  aCtx.putImageData(aImg, 0, 0);
  bCtx.putImageData(bImg, 0, 0);

  const albedoMap = new THREE.CanvasTexture(albedoCanvas);
  albedoMap.colorSpace = THREE.SRGBColorSpace;
  albedoMap.wrapS = THREE.RepeatWrapping;

  const bumpMap = new THREE.CanvasTexture(bumpCanvas);
  bumpMap.wrapS = THREE.RepeatWrapping;

  return { albedoMap, bumpMap };
}

export const PlanetaryGlobe3D: React.FC<PlanetaryGlobe3DProps> = ({
  body,
  layerId,
  layerOpacity = 0.85,
  cameraMode = 'orbit',
  focusLat = -85,
  focusLon = 0,
  pins,
  onPinClick,
  autoRotate = false,
  themeSurface = 'studio-light',
  className = '',
}) => {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [projectedPins, setProjectedPins] = useState<ProjectedPin[]>([]);
  const [webglError, setWebglError] = useState(false);

  const pinsRef = useRef<GlobePin[]>(pins);
  pinsRef.current = pins;

  const sceneRefs = useRef<{
    renderer?: THREE.WebGLRenderer;
    scene?: THREE.Scene;
    camera?: THREE.PerspectiveCamera;
    controls?: OrbitControls;
    globeMesh?: THREE.Mesh;
    graticuleGroup?: THREE.Group;
    requestRender?: () => void;
    transitionActive?: boolean;
    desiredCamPos: THREE.Vector3;
    isSoftwareGl: boolean;
  }>({
    desiredCamPos: new THREE.Vector3(0, -1.8, 2.7),
    isSoftwareGl: false,
  });

  // Update desired camera vector on mode/focus changes
  useEffect(() => {
    const state = sceneRefs.current;
    const dist = cameraMode === 'polar' ? 3.15 : cameraMode === 'relief' ? 2.65 : 3.05;
    const lat = cameraMode === 'polar' ? (body === 'moon' ? -88 : focusLat) : focusLat;
    latLonToVec3(lat, focusLon, dist, _targetCamPos);
    if (cameraMode === 'relief') {
      _targetCamPos.y += 0.65;
      _targetCamPos.normalize().multiplyScalar(dist);
    }
    state.desiredCamPos.copy(_targetCamPos);
    state.transitionActive = true;
    state.requestRender?.();
  }, [body, cameraMode, focusLat, focusLon]);

  // Update textures when body / layer / opacity changes
  useEffect(() => {
    const state = sceneRefs.current;
    const mesh = state.globeMesh;
    const renderer = state.renderer;
    if (!mesh || !renderer) return;

    const { albedoMap, bumpMap } = generatePlanetaryTextures(
      body,
      layerId,
      layerOpacity,
    );
    const maxAniso = renderer.capabilities.getMaxAnisotropy();
    albedoMap.anisotropy = maxAniso;
    bumpMap.anisotropy = maxAniso;

    const mat = mesh.material as THREE.MeshStandardMaterial;
    const oldMap = mat.map;
    const oldBump = mat.bumpMap;

    mat.map = albedoMap;
    mat.bumpMap = bumpMap;
    mat.bumpScale = body === 'earth' ? 0.035 : 0.055;
    mat.roughness = body === 'moon' ? 0.88 : body === 'mars' ? 0.82 : 0.72;
    mat.metalness = 0.04;
    mat.needsUpdate = true;

    oldMap?.dispose();
    oldBump?.dispose();

    state.requestRender?.();
  }, [body, layerId, layerOpacity]);

  // Update scene background when themeSurface changes
  useEffect(() => {
    const state = sceneRefs.current;
    if (!state.scene) return;
    const bgHex = themeSurface === 'orbital-dark' ? 0x0b0d11 : 0xfaf8f5;
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

  // Initialize Three.js scene once
  useEffect(() => {
    const mount = containerRef.current;
    if (!mount) return;

    // Software WebGL check from GPU renderer string
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
    renderer.setPixelRatio(
      isSoftwareGl ? 1 : Math.min(window.devicePixelRatio, 2),
    );
    renderer.setSize(width, height);
    mount.appendChild(renderer.domElement);

    const scene = new THREE.Scene();
    scene.background = new THREE.Color(
      themeSurface === 'orbital-dark' ? 0x0b0d11 : 0xfaf8f5,
    );

    const pmrem = new THREE.PMREMGenerator(renderer);
    scene.environment = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;
    pmrem.dispose();

    const camera = new THREE.PerspectiveCamera(38, width / height, 0.1, 50);
    latLonToVec3(focusLat, focusLon, 3.05, camera.position);
    camera.lookAt(0, 0, 0);

    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enablePan = false;
    controls.minDistance = 1.85;
    controls.maxDistance = 5.2;
    controls.enableDamping = !isSoftwareGl;
    controls.dampingFactor = 0.07;
    controls.rotateSpeed = 0.65;

    // 3-point planetary illumination (low grazing solar key + cool fill + rim)
    const keyLight = new THREE.DirectionalLight(0xfff5e4, 2.35);
    keyLight.position.set(4.5, 1.8, 3.5);
    scene.add(keyLight);

    const hemiLight = new THREE.HemisphereLight(0xdfe8ec, 0x3b352e, 0.95);
    scene.add(hemiLight);

    const rimLight = new THREE.DirectionalLight(0xcbe0d5, 0.65);
    rimLight.position.set(-4.0, -2.5, -3.0);
    scene.add(rimLight);

    // Planetary sphere geometry + procedural scientific material
    const sphereGeo = new THREE.SphereGeometry(1.0, 64, 48);
    const { albedoMap, bumpMap } = generatePlanetaryTextures(
      body,
      layerId,
      layerOpacity,
    );
    albedoMap.anisotropy = renderer.capabilities.getMaxAnisotropy();
    bumpMap.anisotropy = renderer.capabilities.getMaxAnisotropy();

    const sphereMat = new THREE.MeshStandardMaterial({
      map: albedoMap,
      bumpMap,
      bumpScale: 0.05,
      roughness: 0.85,
      metalness: 0.04,
    });
    const globeMesh = new THREE.Mesh(sphereGeo, sphereMat);
    scene.add(globeMesh);

    // Subtle scientific lat/lon graticule rings
    const graticuleGroup = new THREE.Group();
    const gratMat = new THREE.LineBasicMaterial({
      color: themeSurface === 'orbital-dark' ? 0x94a3b8 : 0x5c5852,
      transparent: true,
      opacity: 0.22,
    });

    // Latitude circles (-60, -30, 0, 30, 60)
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

    // Longitude meridians every 45°
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

    const state = sceneRefs.current;
    state.renderer = renderer;
    state.scene = scene;
    state.camera = camera;
    state.controls = controls;
    state.globeMesh = globeMesh;
    state.graticuleGroup = graticuleGroup;
    state.isSoftwareGl = isSoftwareGl;
    state.desiredCamPos.copy(camera.position);

    let frameId = 0;
    let renderBusy = false;
    let renderDirty = false;
    let disposed = false;
    let lastTime = performance.now();

    function projectPins() {
      const el = containerRef.current;
      if (!el) return;
      const w = el.clientWidth;
      const h = el.clientHeight;
      _camDir.copy(camera.position).normalize();

      const nextProjected: ProjectedPin[] = pinsRef.current.map((pin) => {
        latLonToVec3(pin.lat, pin.lon, 1.02, _v1);
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
      sphereMat.map?.dispose();
      sphereMat.bumpMap?.dispose();
      sphereMat.dispose();
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

  // Re-project pins whenever pin list updates
  useEffect(() => {
    sceneRefs.current.requestRender?.();
  }, [pins]);

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

      {/* Projected 3D Spatial Pin Labels (outside canvas, solid backgrounds, zero backdrop-filter) */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        {projectedPins.map((pin) => {
          if (!pin.visible) return null;
          const dotColor =
            pin.accent === 'terracotta'
              ? 'bg-[#E06A3B]'
              : pin.accent === 'amber'
                ? 'bg-[#E69A28]'
                : pin.accent === 'slate'
                  ? 'bg-[#7A7670]'
                  : 'bg-[#2A5A44]';

          return (
            <button
              key={pin.id}
              type="button"
              onClick={() => onPinClick?.(pin.id)}
              style={{
                transform: `translate3d(${pin.x}px, ${pin.y}px, 0) translate(-50%, -100%)`,
              }}
              className={`pointer-events-auto absolute top-0 left-0 flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium shadow-md border transition-colors whitespace-nowrap ${
                pin.active
                  ? 'bg-[#1D1B17] text-[#FAF8F5] border-[#1D1B17]'
                  : 'bg-[#FFFFFF] text-[#1D1B17] border-[#7A7670]/25 hover:border-[#2A5A44]'
              }`}
            >
              <span className={`w-2 h-2 rounded-full shrink-0 ${dotColor}`} />
              <span>{pin.label}</span>
              {pin.scoreBadge && (
                <span
                  className={`font-mono text-[11px] px-1.5 py-0.2 rounded-full ${
                    pin.active
                      ? 'bg-[#2A5A44] text-white'
                      : 'bg-[#2A5A44]/10 text-[#0F422E]'
                  }`}
                >
                  {pin.scoreBadge}
                </span>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
};
