import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { OBJLoader } from 'three/examples/jsm/loaders/OBJLoader.js';
import {
  AlertTriangle,
  CheckCircle2,
  Cpu,
  Layers,
  Maximize2,
  RotateCw,
  Upload,
  X,
} from 'lucide-react';
import {
  CAD_MODEL_PRESETS,
  CadModelPresetId,
  CadModelTelemetry,
} from '../../types/cad';
import { CadPartId, PartDegradationState } from '../../types/terra';

export interface PartScreenAnchor {
  id: CadPartId;
  x: number;
  y: number;
  visible: boolean;
}

export interface EquipmentTwin3DProps {
  selectedPartId?: CadPartId | null;
  onSelectPart?: (partId: CadPartId | null) => void;
  exploded?: boolean;
  isolatedPartId?: CadPartId | null;
  sectionMode?: boolean;
  cameraResetTrigger?: number;
  degradationStates?: PartDegradationState[];
  onAnchorsUpdate?: (anchors: Record<CadPartId, PartScreenAnchor>) => void;
  className?: string;

  // New Custom CAD & Presets Props
  activePresetId?: CadModelPresetId;
  onSelectPreset?: (presetId: CadModelPresetId) => void;
  customFile?: File | null;
  onCustomFileSelect?: (file: File) => void;
  onTelemetryUpdate?: (telemetry: CadModelTelemetry) => void;
  predictedDegradation?: number;
  showControlsOverlay?: boolean;
}

const _projVec = new THREE.Vector3();

function createRadialContactShadowTexture(): THREE.CanvasTexture {
  const size = 256;
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d')!;
  const grad = ctx.createRadialGradient(
    size / 2,
    size / 2,
    12,
    size / 2,
    size / 2,
    size / 2,
  );
  grad.addColorStop(0, 'rgba(28, 32, 38, 0.36)');
  grad.addColorStop(0.55, 'rgba(28, 32, 38, 0.14)');
  grad.addColorStop(1, 'rgba(28, 32, 38, 0.0)');
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, size, size);
  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

function createBrushedMetalTexture(): THREE.CanvasTexture {
  const size = 256;
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d')!;
  ctx.fillStyle = '#9aa1aa';
  ctx.fillRect(0, 0, size, size);
  for (let y = 0; y < size; y++) {
    const shade = 140 + Math.floor(Math.sin(y * 0.7) * 14 + ((y * 37) % 19));
    ctx.fillStyle = `rgb(${shade},${shade},${shade})`;
    ctx.fillRect(0, y, size, 1);
  }
  const tex = new THREE.CanvasTexture(canvas);
  tex.wrapS = THREE.RepeatWrapping;
  tex.wrapT = THREE.RepeatWrapping;
  return tex;
}

function createGearShape(teeth: number, outerR: number, innerR: number, holeR: number) {
  const shape = new THREE.Shape();
  const step = (Math.PI * 2) / teeth;
  for (let i = 0; i < teeth; i++) {
    const a0 = i * step;
    const a1 = a0 + step * 0.22;
    const a2 = a0 + step * 0.45;
    const a3 = a0 + step * 0.67;
    if (i === 0) shape.moveTo(Math.cos(a0) * innerR, Math.sin(a0) * innerR);
    else shape.lineTo(Math.cos(a0) * innerR, Math.sin(a0) * innerR);
    shape.lineTo(Math.cos(a1) * outerR, Math.sin(a1) * outerR);
    shape.lineTo(Math.cos(a2) * outerR, Math.sin(a2) * outerR);
    shape.lineTo(Math.cos(a3) * innerR, Math.sin(a3) * innerR);
  }
  shape.closePath();

  if (holeR > 0.01) {
    const hole = new THREE.Path();
    hole.absarc(0, 0, holeR, 0, Math.PI * 2, true);
    shape.holes.push(hole);
  }
  return shape;
}

function createHelicalRibbonGeometry(
  innerR: number,
  outerR: number,
  height: number,
  turns: number,
): THREE.BufferGeometry {
  const segs = 120;
  const positions: number[] = [];
  const indices: number[] = [];

  for (let i = 0; i <= segs; i++) {
    const t = i / segs;
    const angle = t * turns * Math.PI * 2;
    const y = -t * height;
    const cos = Math.cos(angle);
    const sin = Math.sin(angle);

    // Top & bottom ribbon thickness
    positions.push(cos * innerR, y, sin * innerR);
    positions.push(cos * outerR, y, sin * outerR);
    positions.push(cos * innerR, y - 0.032, sin * innerR);
    positions.push(cos * outerR, y - 0.032, sin * outerR);
  }

  for (let i = 0; i < segs; i++) {
    const a = i * 4;
    const b = (i + 1) * 4;
    // Top face
    indices.push(a, a + 1, b);
    indices.push(a + 1, b + 1, b);
    // Outer edge
    indices.push(a + 1, a + 3, b + 1);
    indices.push(a + 3, b + 3, b + 1);
    // Bottom face
    indices.push(a + 2, b + 2, a + 3);
    indices.push(a + 3, b + 2, b + 3);
  }

  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
  geo.setIndex(indices);
  geo.computeVertexNormals();
  return geo;
}

interface CustomMeshRecord {
  mesh: THREE.Mesh;
  materials: THREE.MeshStandardMaterial[];
  baseColors: THREE.Color[];
  baseEmissives: THREE.Color[];
  originalPosition: THREE.Vector3;
}

export const EquipmentTwin3D: React.FC<EquipmentTwin3DProps> = ({
  selectedPartId = null,
  onSelectPart = () => {},
  exploded = false,
  isolatedPartId = null,
  sectionMode = false,
  cameraResetTrigger = 0,
  degradationStates = [],
  onAnchorsUpdate,
  className = '',
  activePresetId = 'drill',
  onSelectPreset,
  customFile = null,
  onCustomFileSelect,
  onTelemetryUpdate,
  predictedDegradation = 0.05,
  showControlsOverlay = true,
}) => {
  const mountRef = useRef<HTMLDivElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [webglError, setWebglError] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [isLoadingModel, setIsLoadingModel] = useState(false);
  const [fileError, setFileError] = useState<string | null>(null);
  const [activeTelemetry, setActiveTelemetry] = useState<CadModelTelemetry | null>(null);

  const propsRef = useRef({
    selectedPartId,
    onSelectPart,
    exploded,
    isolatedPartId,
    sectionMode,
    degradationStates,
    onAnchorsUpdate,
    activePresetId,
    customFile,
    predictedDegradation,
    onTelemetryUpdate,
  });

  propsRef.current = {
    selectedPartId,
    onSelectPart,
    exploded,
    isolatedPartId,
    sectionMode,
    degradationStates,
    onAnchorsUpdate,
    activePresetId,
    customFile,
    predictedDegradation,
    onTelemetryUpdate,
  };

  const sceneStateRef = useRef<{
    requestRender?: () => void;
    rebuildActiveAssembly?: () => void;
    loadCustomFile?: (file: File) => void;
    renderer?: THREE.WebGLRenderer;
    camera?: THREE.PerspectiveCamera;
    controls?: OrbitControls;
    clipPlane?: THREE.Plane;
    assemblyRoot?: THREE.Group;
    explodeProgress: number;
    partGroups: Partial<Record<CadPartId, THREE.Group>>;
    partMaterials: Partial<Record<CadPartId, THREE.MeshStandardMaterial[]>>;
    partBaseColors: Partial<Record<CadPartId, THREE.Color[]>>;
    failureSpheres: Partial<Record<CadPartId, THREE.Group>>;
    basePositions: Partial<Record<CadPartId, THREE.Vector3>>;
    explodeOffsets: Record<CadPartId, THREE.Vector3>;
    anchorLocalOffsets: Record<CadPartId, THREE.Vector3>;
    customWrapper?: THREE.Group;
    customMeshRecords: CustomMeshRecord[];
    clickableMeshes: THREE.Object3D[];
    geometriesToDispose: THREE.BufferGeometry[];
    materialsToDispose: THREE.Material[];
    resetCamRequested: boolean;
  }>({
    explodeProgress: 0,
    partGroups: {},
    partMaterials: {},
    partBaseColors: {},
    failureSpheres: {},
    basePositions: {},
    explodeOffsets: {
      housing: new THREE.Vector3(0, 0.45, 0),
      fasteners: new THREE.Vector3(0, 0.88, 0),
      stator: new THREE.Vector3(0, 0.14, 0),
      gears: new THREE.Vector3(0, -0.35, 0),
      seal: new THREE.Vector3(0, -0.78, 0),
      auger: new THREE.Vector3(0, -1.25, 0),
    },
    anchorLocalOffsets: {
      housing: new THREE.Vector3(0.45, 0.38, 0.25),
      fasteners: new THREE.Vector3(0.42, 0.56, 0.25),
      stator: new THREE.Vector3(-0.32, 0.12, 0.25),
      gears: new THREE.Vector3(0.32, -0.18, 0.22),
      seal: new THREE.Vector3(0.24, -0.45, 0.18),
      auger: new THREE.Vector3(0.18, -1.05, 0.15),
    },
    customMeshRecords: [],
    clickableMeshes: [],
    geometriesToDispose: [],
    materialsToDispose: [],
    resetCamRequested: false,
  });

  // Camera reset trigger
  useEffect(() => {
    if (cameraResetTrigger > 0) {
      sceneStateRef.current.resetCamRequested = true;
      sceneStateRef.current.requestRender?.();
    }
  }, [cameraResetTrigger]);

  // Handle active preset or custom file change
  useEffect(() => {
    if (propsRef.current.activePresetId === 'custom' && customFile) {
      sceneStateRef.current.loadCustomFile?.(customFile);
    } else {
      sceneStateRef.current.rebuildActiveAssembly?.();
    }
  }, [activePresetId, customFile]);

  // Trigger render & material updates on state prop changes
  useEffect(() => {
    const st = sceneStateRef.current;
    if (st.renderer) {
      st.renderer.localClippingEnabled = sectionMode;
    }
    st.requestRender?.();
  }, [
    exploded,
    isolatedPartId,
    sectionMode,
    selectedPartId,
    degradationStates,
    predictedDegradation,
  ]);

  // Main Three.js Scene Setup
  useEffect(() => {
    const mount = mountRef.current;
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
        alpha: true,
      });
    } catch {
      setWebglError(true);
      return;
    }

    const width = Math.max(300, mount.clientWidth);
    const height = Math.max(300, mount.clientHeight);

    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.05;
    renderer.setPixelRatio(
      isSoftwareGl ? 1 : Math.min(window.devicePixelRatio, 2),
    );
    renderer.setSize(width, height);
    renderer.shadowMap.enabled = !isSoftwareGl;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    renderer.localClippingEnabled = propsRef.current.sectionMode;
    mount.appendChild(renderer.domElement);

    const scene = new THREE.Scene();

    const pmrem = new THREE.PMREMGenerator(renderer);
    scene.environment = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;
    pmrem.dispose();

    const camera = new THREE.PerspectiveCamera(36, width / height, 0.1, 40);
    camera.position.set(2.45, 1.35, 2.75);

    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = !isSoftwareGl;
    controls.dampingFactor = 0.07;
    controls.target.set(0, -0.15, 0);
    controls.minDistance = 1.4;
    controls.maxDistance = 7.0;

    // Studio lighting rig
    const keyLight = new THREE.DirectionalLight(0xfff6ea, 2.2);
    keyLight.position.set(3.5, 5.0, 3.2);
    keyLight.castShadow = !isSoftwareGl;
    keyLight.shadow.mapSize.set(1024, 1024);
    keyLight.shadow.bias = -0.0005;
    keyLight.shadow.normalBias = 0.02;
    scene.add(keyLight);

    const hemiLight = new THREE.HemisphereLight(0xf1f5f9, 0x94a3b8, 0.85);
    scene.add(hemiLight);

    const rimLight = new THREE.DirectionalLight(0xdbeafe, 0.9);
    rimLight.position.set(-3.5, 2.2, -3.0);
    scene.add(rimLight);

    // Clipping plane for CAD Section mode
    const clipPlane = new THREE.Plane(new THREE.Vector3(-1, 0, 0), 0.0);

    // Ground contact shadow + subtle CAD reference grid
    const contactShadowTex = createRadialContactShadowTexture();
    const shadowPlane = new THREE.Mesh(
      new THREE.PlaneGeometry(3.6, 3.6),
      new THREE.MeshBasicMaterial({
        map: contactShadowTex,
        transparent: true,
        depthWrite: false,
      }),
    );
    shadowPlane.rotation.x = -Math.PI / 2;
    shadowPlane.position.y = -1.62;
    scene.add(shadowPlane);

    const gridHelper = new THREE.GridHelper(3.6, 18, 0xcbd5e1, 0xdbe2ea);
    gridHelper.position.y = -1.63;
    scene.add(gridHelper);

    const brushedTex = createBrushedMetalTexture();
    brushedTex.anisotropy = renderer.capabilities.getMaxAnisotropy();

    const assemblyRoot = new THREE.Group();
    scene.add(assemblyRoot);

    const st = sceneStateRef.current;
    st.renderer = renderer;
    st.camera = camera;
    st.controls = controls;
    st.clipPlane = clipPlane;
    st.assemblyRoot = assemblyRoot;

    function clearAssembly() {
      while (assemblyRoot.children.length > 0) {
        assemblyRoot.remove(assemblyRoot.children[0]);
      }
      st.geometriesToDispose.forEach((g) => g.dispose());
      st.materialsToDispose.forEach((m) => m.dispose());
      st.geometriesToDispose = [];
      st.materialsToDispose = [];
      st.clickableMeshes = [];
      st.partGroups = {};
      st.partMaterials = {};
      st.partBaseColors = {};
      st.failureSpheres = {};
      st.basePositions = {};
      st.customWrapper = undefined;
      st.customMeshRecords = [];
    }

    function registerPart(
      id: CadPartId,
      group: THREE.Group,
      baseY: number,
      failureCenter: THREE.Vector3,
      failureRadius: number,
    ) {
      group.position.set(0, baseY, 0);
      group.userData.partId = id;
      assemblyRoot.add(group);
      st.partGroups[id] = group;
      st.basePositions[id] = new THREE.Vector3(0, baseY, 0);

      const mats: THREE.MeshStandardMaterial[] = [];
      const baseColors: THREE.Color[] = [];
      group.traverse((child) => {
        if (child instanceof THREE.Mesh) {
          child.castShadow = true;
          child.receiveShadow = true;
          child.userData.partId = id;
          st.clickableMeshes.push(child);
          const m = child.material as THREE.MeshStandardMaterial;
          m.clippingPlanes = [clipPlane];
          m.clipShadows = true;
          m.side = THREE.DoubleSide;
          mats.push(m);
          baseColors.push(m.color.clone());
        }
      });
      st.partMaterials[id] = mats;
      st.partBaseColors[id] = baseColors;

      // Crimson failure highlight sphere + hairline ring
      const failGroup = new THREE.Group();
      failGroup.position.copy(failureCenter);
      const sphereGeo = new THREE.SphereGeometry(failureRadius, 24, 18);
      const sphereMat = new THREE.MeshBasicMaterial({
        color: 0xef4444,
        transparent: true,
        opacity: 0.34,
        depthWrite: false,
      });
      const ringGeo = new THREE.RingGeometry(
        failureRadius * 1.02,
        failureRadius * 1.07,
        48,
      );
      const ringMat = new THREE.MeshBasicMaterial({
        color: 0xdc2626,
        side: THREE.DoubleSide,
        transparent: true,
        opacity: 0.85,
      });
      const failSphere = new THREE.Mesh(sphereGeo, sphereMat);
      const failRing = new THREE.Mesh(ringGeo, ringMat);
      failRing.rotation.x = Math.PI / 3;
      failGroup.add(failSphere, failRing);
      failGroup.visible = false;
      group.add(failGroup);

      st.failureSpheres[id] = failGroup;
      st.geometriesToDispose.push(sphereGeo, ringGeo);
      st.materialsToDispose.push(sphereMat, ringMat);
    }

    // ========================================================
    // PRESET 1: TX-DRL-40 Coring Drill & Rover Assembly
    // ========================================================
    function buildDrillAssembly() {
      // 1. Housing
      const housingGroup = new THREE.Group();
      const lathePts = [
        new THREE.Vector2(0.32, -0.35),
        new THREE.Vector2(0.46, -0.35),
        new THREE.Vector2(0.48, -0.1),
        new THREE.Vector2(0.48, 0.35),
        new THREE.Vector2(0.54, 0.4),
        new THREE.Vector2(0.54, 0.5),
        new THREE.Vector2(0.34, 0.5),
        new THREE.Vector2(0.34, 0.36),
        new THREE.Vector2(0.41, 0.36),
        new THREE.Vector2(0.41, -0.28),
        new THREE.Vector2(0.32, -0.28),
      ];
      const barrelGeo = new THREE.LatheGeometry(lathePts, 40);
      const barrelMat = new THREE.MeshStandardMaterial({
        color: 0x64748b,
        metalness: 0.78,
        roughness: 0.34,
        roughnessMap: brushedTex,
      });
      const barrel = new THREE.Mesh(barrelGeo, barrelMat);
      housingGroup.add(barrel);

      const ribGeo = new THREE.TorusGeometry(0.485, 0.018, 10, 40);
      const ribMat = new THREE.MeshStandardMaterial({
        color: 0x475569,
        metalness: 0.82,
        roughness: 0.28,
      });
      for (const ry of [-0.08, 0.06, 0.2]) {
        const rib = new THREE.Mesh(ribGeo, ribMat);
        rib.rotation.x = Math.PI / 2;
        rib.position.y = ry;
        housingGroup.add(rib);
      }

      const capGeo = new THREE.CylinderGeometry(0.28, 0.34, 0.14, 32);
      const capMat = new THREE.MeshStandardMaterial({
        color: 0x334155,
        metalness: 0.7,
        roughness: 0.42,
      });
      const cap = new THREE.Mesh(capGeo, capMat);
      cap.position.y = 0.56;
      housingGroup.add(cap);

      st.geometriesToDispose.push(barrelGeo, ribGeo, capGeo);
      st.materialsToDispose.push(barrelMat, ribMat, capMat);
      registerPart(
        'housing',
        housingGroup,
        0.15,
        new THREE.Vector3(0, 0.15, 0),
        0.6,
      );

      // 2. Fasteners
      const fastGroup = new THREE.Group();
      const headGeo = new THREE.CylinderGeometry(0.038, 0.038, 0.045, 6);
      const shankGeo = new THREE.CylinderGeometry(0.02, 0.02, 0.14, 16);
      const washerGeo = new THREE.CylinderGeometry(0.052, 0.052, 0.012, 20);

      for (let i = 0; i < 6; i++) {
        const angle = (i / 6) * Math.PI * 2 + Math.PI / 6;
        const r = 0.44;
        const bolt = new THREE.Group();
        bolt.position.set(Math.cos(angle) * r, 0.67, Math.sin(angle) * r);
        const tiMat = new THREE.MeshStandardMaterial({
          color: i === 3 ? 0xd4a373 : 0xcbd5e1,
          metalness: 0.92,
          roughness: 0.22,
        });
        const head = new THREE.Mesh(headGeo, tiMat);
        head.position.y = 0.03;
        const washer = new THREE.Mesh(washerGeo, tiMat);
        washer.position.y = 0.006;
        const shank = new THREE.Mesh(shankGeo, tiMat);
        shank.position.y = -0.07;
        bolt.add(head, washer, shank);
        fastGroup.add(bolt);
        st.materialsToDispose.push(tiMat);
      }
      st.geometriesToDispose.push(headGeo, shankGeo, washerGeo);
      const fAngle = (3 / 6) * Math.PI * 2 + Math.PI / 6;
      registerPart(
        'fasteners',
        fastGroup,
        0,
        new THREE.Vector3(Math.cos(fAngle) * 0.44, 0.67, Math.sin(fAngle) * 0.44),
        0.16,
      );

      // 3. Stator
      const statorGroup = new THREE.Group();
      const coreGeo = new THREE.CylinderGeometry(0.32, 0.32, 0.44, 24, 1, true);
      const coreMat = new THREE.MeshStandardMaterial({
        color: 0x3f4752,
        metalness: 0.85,
        roughness: 0.45,
      });
      const core = new THREE.Mesh(coreGeo, coreMat);
      statorGroup.add(core);

      const copperMat = new THREE.MeshStandardMaterial({
        color: 0xc26d3a,
        metalness: 0.94,
        roughness: 0.2,
      });
      const coilCurve = new THREE.CatmullRomCurve3(
        [
          new THREE.Vector3(0.24, -0.2, 0),
          new THREE.Vector3(0.34, -0.22, 0),
          new THREE.Vector3(0.34, 0.22, 0),
          new THREE.Vector3(0.24, 0.2, 0),
        ],
        true,
      );
      const coilGeo = new THREE.TubeGeometry(coilCurve, 24, 0.022, 8, true);
      for (let i = 0; i < 10; i++) {
        const coil = new THREE.Mesh(coilGeo, copperMat);
        coil.rotation.y = (i / 10) * Math.PI * 2;
        statorGroup.add(coil);
      }
      st.geometriesToDispose.push(coreGeo, coilGeo);
      st.materialsToDispose.push(coreMat, copperMat);
      registerPart('stator', statorGroup, 0.22, new THREE.Vector3(0, 0, 0), 0.38);

      // 4. Gears
      const gearGroup = new THREE.Group();
      const steelMat = new THREE.MeshStandardMaterial({
        color: 0x94a3b8,
        metalness: 0.9,
        roughness: 0.24,
      });
      const bronzeMat = new THREE.MeshStandardMaterial({
        color: 0xb48246,
        metalness: 0.86,
        roughness: 0.28,
      });

      const sunShape = createGearShape(14, 0.14, 0.11, 0.05);
      const sunGeo = new THREE.ExtrudeGeometry(sunShape, {
        depth: 0.12,
        bevelEnabled: true,
        bevelThickness: 0.01,
        bevelSize: 0.008,
        bevelSegments: 2,
      });
      sunGeo.rotateX(Math.PI / 2);
      const sunMesh = new THREE.Mesh(sunGeo, steelMat);
      sunMesh.position.y = 0.06;
      gearGroup.add(sunMesh);

      const planetShape = createGearShape(10, 0.095, 0.072, 0.025);
      const planetGeo = new THREE.ExtrudeGeometry(planetShape, {
        depth: 0.1,
        bevelEnabled: true,
        bevelThickness: 0.008,
        bevelSize: 0.006,
        bevelSegments: 2,
      });
      planetGeo.rotateX(Math.PI / 2);
      for (let i = 0; i < 3; i++) {
        const a = (i / 3) * Math.PI * 2;
        const p = new THREE.Mesh(planetGeo, bronzeMat);
        p.position.set(Math.cos(a) * 0.22, 0.05, Math.sin(a) * 0.22);
        gearGroup.add(p);
      }
      const carrierGeo = new THREE.TorusGeometry(0.29, 0.032, 12, 36);
      const carrier = new THREE.Mesh(carrierGeo, steelMat);
      carrier.rotation.x = Math.PI / 2;
      gearGroup.add(carrier);
      st.geometriesToDispose.push(sunGeo, planetGeo, carrierGeo);
      st.materialsToDispose.push(steelMat, bronzeMat);
      registerPart('gears', gearGroup, -0.16, new THREE.Vector3(0, 0, 0), 0.34);

      // 5. Seal
      const sealGroup = new THREE.Group();
      const vitonGeo = new THREE.TorusGeometry(0.18, 0.042, 18, 40);
      const vitonMat = new THREE.MeshStandardMaterial({
        color: 0x1e293b,
        metalness: 0.06,
        roughness: 0.78,
      });
      const viton = new THREE.Mesh(vitonGeo, vitonMat);
      viton.rotation.x = Math.PI / 2;
      const springGeo = new THREE.TorusGeometry(0.155, 0.011, 10, 40);
      const springMat = new THREE.MeshStandardMaterial({
        color: 0xe2e8f0,
        metalness: 0.95,
        roughness: 0.16,
      });
      const spring = new THREE.Mesh(springGeo, springMat);
      spring.rotation.x = Math.PI / 2;
      spring.position.y = 0.025;
      sealGroup.add(viton, spring);
      st.geometriesToDispose.push(vitonGeo, springGeo);
      st.materialsToDispose.push(vitonMat, springMat);
      registerPart('seal', sealGroup, -0.36, new THREE.Vector3(0, 0, 0), 0.25);

      // 6. Auger
      const augerGroup = new THREE.Group();
      const shaftGeo = new THREE.CylinderGeometry(0.065, 0.065, 1.05, 24);
      const shaftMat = new THREE.MeshStandardMaterial({
        color: 0x64748b,
        metalness: 0.88,
        roughness: 0.28,
      });
      const shaft = new THREE.Mesh(shaftGeo, shaftMat);
      shaft.position.y = -0.52;
      const helixGeo = createHelicalRibbonGeometry(0.062, 0.145, 0.88, 3.2);
      const helixMat = new THREE.MeshStandardMaterial({
        color: 0x475569,
        metalness: 0.92,
        roughness: 0.22,
      });
      const helix = new THREE.Mesh(helixGeo, helixMat);
      helix.position.y = -0.14;
      const tipGeo = new THREE.ConeGeometry(0.095, 0.22, 6);
      const tipMat = new THREE.MeshStandardMaterial({
        color: 0x27272a,
        metalness: 0.95,
        roughness: 0.18,
      });
      const tip = new THREE.Mesh(tipGeo, tipMat);
      tip.rotation.x = Math.PI;
      tip.position.y = -1.14;
      augerGroup.add(shaft, helix, tip);
      st.geometriesToDispose.push(shaftGeo, helixGeo, tipGeo);
      st.materialsToDispose.push(shaftMat, helixMat, tipMat);
      registerPart(
        'auger',
        augerGroup,
        -0.38,
        new THREE.Vector3(0, -1.05, 0),
        0.24,
      );
    }

    // ========================================================
    // PRESET 2: Artemis VIPER Lunar Rover Wheel & Compliant Suspension
    // ========================================================
    function buildViperAssembly() {
      // 1. Compliant wire-mesh tire & grousers
      const tireGroup = new THREE.Group();
      const tireMeshGeo = new THREE.CylinderGeometry(0.55, 0.55, 0.44, 36, 6, true);
      const tireMat = new THREE.MeshStandardMaterial({
        color: 0x94a3b8,
        metalness: 0.92,
        roughness: 0.28,
        wireframe: false,
      });
      const tireMesh = new THREE.Mesh(tireMeshGeo, tireMat);
      tireMesh.rotation.z = Math.PI / 2;
      tireGroup.add(tireMesh);

      // Radial chevron grousers (16 cleats)
      const grouserGeo = new THREE.BoxGeometry(0.035, 0.08, 0.42);
      const grouserMat = new THREE.MeshStandardMaterial({
        color: 0x475569,
        metalness: 0.88,
        roughness: 0.32,
      });
      for (let i = 0; i < 16; i++) {
        const theta = (i / 16) * Math.PI * 2;
        const g = new THREE.Mesh(grouserGeo, grouserMat);
        g.position.set(0, Math.sin(theta) * 0.57, Math.cos(theta) * 0.57);
        g.rotation.x = theta + 0.15;
        tireGroup.add(g);
      }
      st.geometriesToDispose.push(tireMeshGeo, grouserGeo);
      st.materialsToDispose.push(tireMat, grouserMat);
      registerPart('seal', tireGroup, 0.0, new THREE.Vector3(0, 0, 0), 0.58);

      // 2. Hub & Planetary Drive Motor
      const hubGroup = new THREE.Group();
      const hubGeo = new THREE.CylinderGeometry(0.24, 0.24, 0.48, 32);
      const hubMat = new THREE.MeshStandardMaterial({
        color: 0x334155,
        metalness: 0.85,
        roughness: 0.3,
      });
      const hub = new THREE.Mesh(hubGeo, hubMat);
      hub.rotation.z = Math.PI / 2;
      hubGroup.add(hub);

      const flangeGeo = new THREE.TorusGeometry(0.26, 0.02, 12, 32);
      const flangeMat = new THREE.MeshStandardMaterial({
        color: 0xd97706,
        metalness: 0.9,
        roughness: 0.25,
      });
      const flange = new THREE.Mesh(flangeGeo, flangeMat);
      flange.rotation.y = Math.PI / 2;
      flange.position.x = 0.24;
      hubGroup.add(flange);

      st.geometriesToDispose.push(hubGeo, flangeGeo);
      st.materialsToDispose.push(hubMat, flangeMat);
      registerPart('fasteners', hubGroup, 0.0, new THREE.Vector3(0.24, 0, 0), 0.3);

      // 3. Wishbone Suspension Arm
      const armGroup = new THREE.Group();
      const armGeo = new THREE.CylinderGeometry(0.045, 0.045, 0.85, 16);
      const armMat = new THREE.MeshStandardMaterial({
        color: 0x64748b,
        metalness: 0.82,
        roughness: 0.35,
      });
      const arm1 = new THREE.Mesh(armGeo, armMat);
      arm1.position.set(0.28, 0.32, 0.22);
      arm1.rotation.z = -Math.PI / 4;
      const arm2 = new THREE.Mesh(armGeo, armMat);
      arm2.position.set(0.28, 0.32, -0.22);
      arm2.rotation.z = -Math.PI / 4;
      armGroup.add(arm1, arm2);
      st.geometriesToDispose.push(armGeo);
      st.materialsToDispose.push(armMat);
      registerPart('housing', armGroup, 0.0, new THREE.Vector3(0.3, 0.35, 0), 0.45);

      // 4. Steer Knuckle & Damper Strut
      const strutGroup = new THREE.Group();
      const bodyGeo = new THREE.CylinderGeometry(0.065, 0.065, 0.55, 18);
      const bodyMat = new THREE.MeshStandardMaterial({
        color: 0x1e293b,
        metalness: 0.9,
        roughness: 0.2,
      });
      const strutBody = new THREE.Mesh(bodyGeo, bodyMat);
      strutBody.position.set(0.36, 0.58, 0);

      const springGeo = new THREE.TorusGeometry(0.09, 0.018, 12, 32);
      const springMat = new THREE.MeshStandardMaterial({
        color: 0xef4444,
        metalness: 0.8,
        roughness: 0.3,
      });
      for (let s = 0; s < 5; s++) {
        const ring = new THREE.Mesh(springGeo, springMat);
        ring.rotation.x = Math.PI / 2;
        ring.position.set(0.36, 0.42 + s * 0.08, 0);
        strutGroup.add(ring);
      }
      strutGroup.add(strutBody);
      st.geometriesToDispose.push(bodyGeo, springGeo);
      st.materialsToDispose.push(bodyMat, springMat);
      registerPart('gears', strutGroup, 0.0, new THREE.Vector3(0.36, 0.58, 0), 0.28);
    }

    // ========================================================
    // PRESET 3: Regolith Cryo-Core Sampling Scoop & Articulated Arm
    // ========================================================
    function buildScoopAssembly() {
      // 1. Shoulder Turret Base
      const turretGroup = new THREE.Group();
      const baseGeo = new THREE.CylinderGeometry(0.42, 0.46, 0.16, 32);
      const baseMat = new THREE.MeshStandardMaterial({
        color: 0x334155,
        metalness: 0.8,
        roughness: 0.32,
      });
      const turretBase = new THREE.Mesh(baseGeo, baseMat);
      turretBase.position.y = -0.75;
      turretGroup.add(turretBase);

      const yawCapGeo = new THREE.CylinderGeometry(0.32, 0.36, 0.24, 28);
      const yawCap = new THREE.Mesh(yawCapGeo, baseMat);
      yawCap.position.y = -0.58;
      turretGroup.add(yawCap);
      st.geometriesToDispose.push(baseGeo, yawCapGeo);
      st.materialsToDispose.push(baseMat);
      registerPart('housing', turretGroup, 0, new THREE.Vector3(0, -0.65, 0), 0.48);

      // 2. Carbon-Fiber Twin Boom Linkage
      const boomGroup = new THREE.Group();
      const boomGeo = new THREE.BoxGeometry(0.12, 0.82, 0.14);
      const boomMat = new THREE.MeshStandardMaterial({
        color: 0x1e293b,
        metalness: 0.4,
        roughness: 0.6,
      });
      const boom1 = new THREE.Mesh(boomGeo, boomMat);
      boom1.position.set(0.14, -0.15, 0);
      boom1.rotation.z = -0.25;
      const boom2 = new THREE.Mesh(boomGeo, boomMat);
      boom2.position.set(-0.14, -0.15, 0);
      boom2.rotation.z = 0.25;
      boomGroup.add(boom1, boom2);
      st.geometriesToDispose.push(boomGeo);
      st.materialsToDispose.push(boomMat);
      registerPart('stator', boomGroup, 0, new THREE.Vector3(0, -0.15, 0), 0.42);

      // 3. Rotary Elbow Joint Actuator
      const elbowGroup = new THREE.Group();
      const elbowGeo = new THREE.CylinderGeometry(0.19, 0.19, 0.32, 28);
      const elbowMat = new THREE.MeshStandardMaterial({
        color: 0x64748b,
        metalness: 0.9,
        roughness: 0.22,
      });
      const elbow = new THREE.Mesh(elbowGeo, elbowMat);
      elbow.rotation.x = Math.PI / 2;
      elbow.position.set(0, 0.32, 0);
      elbowGroup.add(elbow);
      st.geometriesToDispose.push(elbowGeo);
      st.materialsToDispose.push(elbowMat);
      registerPart('gears', elbowGroup, 0, new THREE.Vector3(0, 0.32, 0), 0.26);

      // 4. Forearm Boom & Wrist Gimbal
      const wristGroup = new THREE.Group();
      const foreGeo = new THREE.CylinderGeometry(0.065, 0.08, 0.58, 20);
      const foreMat = new THREE.MeshStandardMaterial({
        color: 0xcbd5e1,
        metalness: 0.85,
        roughness: 0.25,
      });
      const fore = new THREE.Mesh(foreGeo, foreMat);
      fore.position.set(0.18, 0.62, 0);
      fore.rotation.z = -0.45;
      wristGroup.add(fore);
      st.geometriesToDispose.push(foreGeo);
      st.materialsToDispose.push(foreMat);
      registerPart('fasteners', wristGroup, 0, new THREE.Vector3(0.18, 0.62, 0), 0.32);

      // 5. Serrated Cryo-Core Sampling Scoop Head
      const scoopGroup = new THREE.Group();
      const bucketGeo = new THREE.CylinderGeometry(0.22, 0.18, 0.28, 18, 1, false, 0, Math.PI);
      const bucketMat = new THREE.MeshStandardMaterial({
        color: 0xd4a373,
        metalness: 0.92,
        roughness: 0.2,
      });
      const bucket = new THREE.Mesh(bucketGeo, bucketMat);
      bucket.position.set(0.42, 0.88, 0);
      bucket.rotation.z = -Math.PI / 3;

      // 5 carbide teeth
      const toothGeo = new THREE.ConeGeometry(0.03, 0.09, 4);
      const toothMat = new THREE.MeshStandardMaterial({
        color: 0x18181b,
        metalness: 0.95,
        roughness: 0.15,
      });
      for (let t = 0; t < 5; t++) {
        const tooth = new THREE.Mesh(toothGeo, toothMat);
        tooth.position.set(0.38 + t * 0.04, 0.76, (t - 2) * 0.07);
        tooth.rotation.z = Math.PI;
        scoopGroup.add(tooth);
      }
      scoopGroup.add(bucket);
      st.geometriesToDispose.push(bucketGeo, toothGeo);
      st.materialsToDispose.push(bucketMat, toothMat);
      registerPart('auger', scoopGroup, 0, new THREE.Vector3(0.42, 0.88, 0), 0.34);
    }

    // ========================================================
    // PRESET 4: Cold-Gas Attitude Control Thruster Nozzle
    // ========================================================
    function buildThrusterAssembly() {
      // 1. Supersonic De Laval Exit Bell
      const bellGroup = new THREE.Group();
      const bellPts = [
        new THREE.Vector2(0.08, -0.65),
        new THREE.Vector2(0.12, -0.5),
        new THREE.Vector2(0.19, -0.3),
        new THREE.Vector2(0.28, -0.05),
        new THREE.Vector2(0.38, 0.22),
        new THREE.Vector2(0.44, 0.45),
        new THREE.Vector2(0.45, 0.46),
        new THREE.Vector2(0.43, 0.46),
        new THREE.Vector2(0.36, 0.22),
        new THREE.Vector2(0.26, -0.05),
        new THREE.Vector2(0.17, -0.3),
        new THREE.Vector2(0.1, -0.5),
        new THREE.Vector2(0.065, -0.65),
      ];
      const bellGeo = new THREE.LatheGeometry(bellPts, 36);
      const bellMat = new THREE.MeshStandardMaterial({
        color: 0x94a3b8,
        metalness: 0.92,
        roughness: 0.18,
      });
      const bell = new THREE.Mesh(bellGeo, bellMat);
      bell.position.y = -0.15;
      bellGroup.add(bell);
      st.geometriesToDispose.push(bellGeo);
      st.materialsToDispose.push(bellMat);
      registerPart('auger', bellGroup, 0, new THREE.Vector3(0, 0, 0), 0.48);

      // 2. Throat Choke & Injector Chamber
      const throatGroup = new THREE.Group();
      const throatGeo = new THREE.CylinderGeometry(0.16, 0.16, 0.35, 24);
      const throatMat = new THREE.MeshStandardMaterial({
        color: 0x475569,
        metalness: 0.85,
        roughness: 0.28,
      });
      const throat = new THREE.Mesh(throatGeo, throatMat);
      throat.position.y = -0.85;

      // Annular cooling fins
      const finGeo = new THREE.TorusGeometry(0.18, 0.015, 10, 24);
      const finMat = new THREE.MeshStandardMaterial({
        color: 0xd97706,
        metalness: 0.9,
        roughness: 0.25,
      });
      for (const fy of [-0.92, -0.85, -0.78]) {
        const fin = new THREE.Mesh(finGeo, finMat);
        fin.rotation.x = Math.PI / 2;
        fin.position.y = fy;
        throatGroup.add(fin);
      }
      throatGroup.add(throat);
      st.geometriesToDispose.push(throatGeo, finGeo);
      st.materialsToDispose.push(throatMat, finMat);
      registerPart('seal', throatGroup, 0, new THREE.Vector3(0, -0.85, 0), 0.28);

      // 3. Dual Solenoid Valve Manifold Block
      const valveGroup = new THREE.Group();
      const blockGeo = new THREE.BoxGeometry(0.36, 0.24, 0.28);
      const blockMat = new THREE.MeshStandardMaterial({
        color: 0x1e293b,
        metalness: 0.78,
        roughness: 0.35,
      });
      const valveBlock = new THREE.Mesh(blockGeo, blockMat);
      valveBlock.position.y = -1.15;

      const solGeo = new THREE.CylinderGeometry(0.065, 0.065, 0.18, 20);
      const solMat = new THREE.MeshStandardMaterial({
        color: 0xef4444,
        metalness: 0.85,
        roughness: 0.3,
      });
      const sol1 = new THREE.Mesh(solGeo, solMat);
      sol1.position.set(-0.1, -1.28, 0);
      const sol2 = new THREE.Mesh(solGeo, solMat);
      sol2.position.set(0.1, -1.28, 0);
      valveGroup.add(valveBlock, sol1, sol2);
      st.geometriesToDispose.push(blockGeo, solGeo);
      st.materialsToDispose.push(blockMat, solMat);
      registerPart('housing', valveGroup, 0, new THREE.Vector3(0, -1.15, 0), 0.32);

      // 4. Structural Mounting Flange & Feed Line
      const mountGroup = new THREE.Group();
      const flangeGeo = new THREE.CylinderGeometry(0.32, 0.32, 0.05, 8);
      const flangeMat = new THREE.MeshStandardMaterial({
        color: 0xcbd5e1,
        metalness: 0.9,
        roughness: 0.22,
      });
      const mountFlange = new THREE.Mesh(flangeGeo, flangeMat);
      mountFlange.position.y = -1.34;

      const feedCurve = new THREE.CatmullRomCurve3([
        new THREE.Vector3(0, -1.35, 0),
        new THREE.Vector3(0.24, -1.35, 0.1),
        new THREE.Vector3(0.35, -1.1, 0.15),
      ]);
      const feedGeo = new THREE.TubeGeometry(feedCurve, 16, 0.025, 8, false);
      const feedMat = new THREE.MeshStandardMaterial({
        color: 0x94a3b8,
        metalness: 0.92,
        roughness: 0.2,
      });
      const feedLine = new THREE.Mesh(feedGeo, feedMat);
      mountGroup.add(mountFlange, feedLine);
      st.geometriesToDispose.push(flangeGeo, feedGeo);
      st.materialsToDispose.push(flangeMat, feedMat);
      registerPart('fasteners', mountGroup, 0, new THREE.Vector3(0, -1.34, 0), 0.35);
    }

    function rebuildActiveAssembly() {
      clearAssembly();
      const presetId = propsRef.current.activePresetId;

      if (presetId === 'viper') {
        buildViperAssembly();
      } else if (presetId === 'scoop') {
        buildScoopAssembly();
      } else if (presetId === 'thruster') {
        buildThrusterAssembly();
      } else if (presetId === 'custom' && propsRef.current.customFile) {
        loadCustomFile(propsRef.current.customFile);
        return;
      } else {
        buildDrillAssembly();
      }

      // Update telemetry for preset
      const presetMeta = CAD_MODEL_PRESETS.find((p) => p.id === presetId) || CAD_MODEL_PRESETS[0];
      const wearRatio = (propsRef.current.predictedDegradation ?? 0.05) / 0.15;
      const tele: CadModelTelemetry = {
        ...presetMeta.defaultTelemetry,
        degradationStatus: wearRatio >= 1.0 ? 'critical' : wearRatio >= 0.62 ? 'degrading' : 'nominal',
        wearIndex: +wearRatio.toFixed(2),
      };
      setActiveTelemetry(tele);
      propsRef.current.onTelemetryUpdate?.(tele);

      applyVisualStates();
      requestRender();
    }

    st.rebuildActiveAssembly = rebuildActiveAssembly;

    // ========================================================
    // CUSTOM MODEL LOADER (.glb, .gltf, .obj)
    // ========================================================
    function loadCustomFile(file: File) {
      const ext = file.name.split('.').pop()?.toLowerCase();
      if (ext !== 'glb' && ext !== 'gltf' && ext !== 'obj') {
        const errText = `Unsupported CAD file format ".${ext || 'unknown'}". Supported NASA CAD formats: GLTF Binary (.glb), GLTF JSON (.gltf), and Wavefront OBJ (.obj).`;
        setFileError(errText);
        setIsLoadingModel(false);
        return;
      }

      setFileError(null);
      setIsLoadingModel(true);

      const objectUrl = URL.createObjectURL(file);

      const handleParsedScene = (loadedScene: THREE.Object3D, formatLabel: string) => {
        URL.revokeObjectURL(objectUrl);
        setIsLoadingModel(false);
        clearAssembly();

        // Compute Bounding Box
        const box = new THREE.Box3().setFromObject(loadedScene);
        const center = box.getCenter(new THREE.Vector3());
        const size = box.getSize(new THREE.Vector3());

        // Center at origin (0, 0, 0)
        loadedScene.position.x = -center.x;
        loadedScene.position.y = -center.y;
        loadedScene.position.z = -center.z;

        const wrapper = new THREE.Group();
        wrapper.add(loadedScene);

        // Auto-scale to fit within standard camera view bounds
        const maxDim = Math.max(size.x, size.y, size.z);
        const targetSize = 2.0;
        const scale = maxDim > 0.0001 ? targetSize / maxDim : 1.0;
        wrapper.scale.setScalar(scale);

        let meshCount = 0;
        let subcomponentCount = 0;
        let vertexCount = 0;
        let polygonCount = 0;
        const customRecords: CustomMeshRecord[] = [];

        loadedScene.traverse((child) => {
          if (child instanceof THREE.Mesh) {
            meshCount++;
            child.castShadow = !isSoftwareGl;
            child.receiveShadow = !isSoftwareGl;
            st.clickableMeshes.push(child);

            const geom = child.geometry;
            if (geom) {
              const pos = geom.getAttribute('position');
              if (pos) vertexCount += pos.count;
              if (geom.index) {
                polygonCount += Math.floor(geom.index.count / 3);
              } else if (pos) {
                polygonCount += Math.floor(pos.count / 3);
              }
            }

            const rawMats = Array.isArray(child.material) ? child.material : [child.material];
            const stdMats: THREE.MeshStandardMaterial[] = [];
            const baseCols: THREE.Color[] = [];
            const baseEmis: THREE.Color[] = [];

            rawMats.forEach((m) => {
              let std: THREE.MeshStandardMaterial;
              if (m instanceof THREE.MeshStandardMaterial) {
                std = m.clone();
              } else {
                std = new THREE.MeshStandardMaterial({
                  color: (m as any).color ? (m as any).color.clone() : new THREE.Color(0x94a3b8),
                  metalness: 0.82,
                  roughness: 0.32,
                  map: (m as any).map || null,
                });
              }
              std.clippingPlanes = [clipPlane];
              std.clipShadows = true;
              std.side = THREE.DoubleSide;
              stdMats.push(std);
              baseCols.push(std.color.clone());
              baseEmis.push(std.emissive.clone());
            });

            child.material = Array.isArray(child.material) ? stdMats : stdMats[0];
            customRecords.push({
              mesh: child,
              materials: stdMats,
              baseColors: baseCols,
              baseEmissives: baseEmis,
              originalPosition: child.position.clone(),
            });
          } else if (child instanceof THREE.Group && child !== loadedScene) {
            subcomponentCount++;
          }
        });

        assemblyRoot.add(wrapper);
        st.customWrapper = wrapper;
        st.customMeshRecords = customRecords;

        // Bounding Dimensions in cm
        let unitScale = 100; // default meters to cm
        if (maxDim > 500) unitScale = 0.1; // mm to cm
        else if (maxDim > 20) unitScale = 1; // already cm
        const dimX = +(size.x * unitScale).toFixed(1);
        const dimY = +(size.y * unitScale).toFixed(1);
        const dimZ = +(size.z * unitScale).toFixed(1);

        const wearRatio = (propsRef.current.predictedDegradation ?? 0.05) / 0.15;
        const tele: CadModelTelemetry = {
          fileName: file.name,
          format: formatLabel,
          meshCount,
          subcomponentCount: Math.max(1, subcomponentCount),
          vertexCount,
          polygonCount,
          dimensionsCm: { x: dimX, y: dimY, z: dimZ },
          degradationStatus: wearRatio >= 1.0 ? 'critical' : wearRatio >= 0.62 ? 'degrading' : 'nominal',
          wearIndex: +wearRatio.toFixed(2),
          fileSize: `${(file.size / (1024 * 1024)).toFixed(2)} MB`,
          sourceType: 'custom',
        };

        setActiveTelemetry(tele);
        propsRef.current.onTelemetryUpdate?.(tele);

        applyVisualStates();
        requestRender();
      };

      const handleFail = (err: any) => {
        URL.revokeObjectURL(objectUrl);
        setIsLoadingModel(false);
        const msg = `Unable to parse CAD model "${file.name}": ${err?.message || 'Unsupported internal structure or corrupted geometry'}.`;
        setFileError(msg);
      };

      if (ext === 'glb' || ext === 'gltf') {
        const loader = new GLTFLoader();
        loader.load(
          objectUrl,
          (gltf) => handleParsedScene(gltf.scene, ext === 'glb' ? 'GLB (Binary GLTF 2.0)' : 'GLTF 2.0 (JSON)'),
          undefined,
          handleFail,
        );
      } else if (ext === 'obj') {
        const loader = new OBJLoader();
        loader.load(
          objectUrl,
          (obj) => handleParsedScene(obj, 'Wavefront OBJ (.obj)'),
          undefined,
          handleFail,
        );
      }
    }

    st.loadCustomFile = loadCustomFile;

    // Raycasting click handler
    const raycaster = new THREE.Raycaster();
    const pointer = new THREE.Vector2();
    let pointerDownPos = { x: 0, y: 0 };

    const onPointerDown = (e: PointerEvent) => {
      pointerDownPos = { x: e.clientX, y: e.clientY };
    };

    const onPointerUp = (e: PointerEvent) => {
      const moved = Math.hypot(
        e.clientX - pointerDownPos.x,
        e.clientY - pointerDownPos.y,
      );
      if (moved > 6) return;

      const rect = renderer.domElement.getBoundingClientRect();
      pointer.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
      pointer.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;

      raycaster.setFromCamera(pointer, camera);
      const hits = raycaster.intersectObjects(st.clickableMeshes, false);
      if (hits.length > 0) {
        const hitId = hits[0].object.userData.partId as CadPartId | undefined;
        if (hitId) propsRef.current.onSelectPart(hitId);
      } else {
        propsRef.current.onSelectPart(null);
      }
    };

    renderer.domElement.addEventListener('pointerdown', onPointerDown);
    renderer.domElement.addEventListener('pointerup', onPointerUp);

    let frameId = 0;
    let renderBusy = false;
    let renderDirty = false;
    let disposed = false;
    let lastTime = performance.now();

    function updateAnchors() {
      const cb = propsRef.current.onAnchorsUpdate;
      const el = mountRef.current;
      if (!cb || !el) return;
      const w = el.clientWidth;
      const h = el.clientHeight;
      const out = {} as Record<CadPartId, PartScreenAnchor>;

      (Object.keys(st.partGroups) as CadPartId[]).forEach((id) => {
        const grp = st.partGroups[id];
        if (!grp) return;
        _projVec.copy(st.anchorLocalOffsets[id] || new THREE.Vector3(0, 0, 0)).applyMatrix4(grp.matrixWorld);
        _projVec.project(camera);
        out[id] = {
          id,
          x: ((_projVec.x + 1) / 2) * w,
          y: ((-_projVec.y + 1) / 2) * h,
          visible: _projVec.z < 1 && _projVec.z > -1,
        };
      });
      cb(out);
    }

    function applyVisualStates() {
      const {
        isolatedPartId: iso,
        selectedPartId: sel,
        degradationStates: deg,
        predictedDegradation: pDeg = 0.05,
      } = propsRef.current;

      const wearRatio = pDeg / 0.15; // 0.15 mg/cm² critical threshold

      // Update Procedural Presets
      (Object.keys(st.partGroups) as CadPartId[]).forEach((id) => {
        const mats = st.partMaterials[id] || [];
        const baseColors = st.partBaseColors[id] || [];
        const failGrp = st.failureSpheres[id];
        const degState = deg.find((d) => d.part.id === id);

        const isIsolatedOut = iso !== null && iso !== id;
        const isSelected = sel === id;
        const isCritical = degState ? degState.status === 'critical' : wearRatio >= 1.0;
        const isDegrading = degState ? degState.status === 'degrading' : wearRatio >= 0.62;

        if (failGrp) {
          failGrp.visible = Boolean(isCritical) && !isIsolatedOut;
        }

        mats.forEach((m, idx) => {
          const baseCol = baseColors[idx] || new THREE.Color(0x64748b);
          if (isIsolatedOut) {
            m.transparent = true;
            m.opacity = 0.14;
            m.depthWrite = false;
            m.emissive.setHex(0x000000);
          } else {
            m.transparent = false;
            m.opacity = 1.0;
            m.depthWrite = true;
            m.color.copy(baseCol);

            if (isCritical) {
              m.color.lerp(new THREE.Color(0xb91c1c), 0.38);
              m.emissive.setHex(0x3f0a0a);
            } else if (isDegrading) {
              m.color.lerp(new THREE.Color(0xd97706), 0.24);
              m.emissive.setHex(0x1c1002);
            } else if (isSelected) {
              m.emissive.setHex(0x163829);
            } else {
              m.emissive.setHex(0x000000);
            }
          }
        });
      });

      // Update Custom CAD Model Mesh Shading (interpolating nominal green, degraded amber, critical red)
      if (st.customMeshRecords.length > 0) {
        st.customMeshRecords.forEach(({ materials, baseColors, baseEmissives }) => {
          materials.forEach((m, idx) => {
            const baseCol = baseColors[idx] || new THREE.Color(0x94a3b8);
            const baseEmis = baseEmissives[idx] || new THREE.Color(0x000000);
            m.color.copy(baseCol);

            if (wearRatio >= 1.0) {
              // Critical Alert Red
              const t = Math.min(0.65, 0.35 + (wearRatio - 1.0) * 0.25);
              m.color.lerp(new THREE.Color(0xb91c1c), t);
              m.emissive.setHex(0x3f0a0a);
            } else if (wearRatio >= 0.62) {
              // Degraded Amber
              const t = Math.min(0.48, 0.2 + ((wearRatio - 0.62) / 0.38) * 0.22);
              m.color.lerp(new THREE.Color(0xd97706), t);
              m.emissive.setHex(0x1c1002);
            } else {
              // Nominal Aerospace Green Tint
              const t = Math.min(0.22, (wearRatio / 0.62) * 0.16);
              m.color.lerp(new THREE.Color(0x059669), t);
              m.emissive.copy(baseEmis);
            }
          });
        });
      }
    }

    function afterDraw(cb: () => void) {
      const gl = renderer.getContext() as WebGL2RenderingContext;
      const sync = gl.fenceSync?.(gl.SYNC_GPU_COMMANDS_COMPLETE, 0);
      gl.flush();
      const poll = () => {
        if (disposed) return;
        const status = sync && gl.getSyncParameter(sync, gl.SYNC_STATUS);
        if (status === gl.UNSIGNALED) {
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

        // Smooth exploded view damp
        const targetExp = propsRef.current.exploded ? 1 : 0;
        st.explodeProgress = THREE.MathUtils.damp(
          st.explodeProgress,
          targetExp,
          7.5,
          dt,
        );
        if (Math.abs(st.explodeProgress - targetExp) > 0.002) {
          renderDirty = true;
        } else {
          st.explodeProgress = targetExp;
        }

        // Apply explosion to procedural parts
        (Object.keys(st.partGroups) as CadPartId[]).forEach((id) => {
          const grp = st.partGroups[id];
          const base = st.basePositions[id];
          const off = st.explodeOffsets[id];
          if (grp && base && off) {
            grp.position.copy(base).addScaledVector(off, st.explodeProgress);
          }
        });

        // Apply radial separation to custom CAD parts if exploded
        if (st.customMeshRecords.length > 0) {
          st.customMeshRecords.forEach(({ mesh, originalPosition }) => {
            const dir = originalPosition.clone().normalize();
            if (dir.lengthSq() < 0.01) dir.set(0, 1, 0);
            mesh.position.copy(originalPosition).addScaledVector(dir, st.explodeProgress * 0.28);
          });
        }

        if (st.resetCamRequested) {
          const alpha = 1 - Math.exp(-7 * dt);
          camera.position.lerp(_projVec.set(2.45, 1.35, 2.75), alpha);
          controls.target.lerp(new THREE.Vector3(0, -0.15, 0), alpha);
          if (camera.position.distanceTo(_projVec) < 0.02) {
            st.resetCamRequested = false;
          } else {
            renderDirty = true;
          }
        }

        const ctrlChanged = controls.update();
        if (ctrlChanged) renderDirty = true;

        applyVisualStates();
        assemblyRoot.updateMatrixWorld(true);
        renderer.render(scene, camera);
        updateAnchors();

        const done = () => {
          renderBusy = false;
          if (renderDirty && !disposed) requestRender();
        };

        if (isSoftwareGl) afterDraw(done);
        else done();
      });
    }

    st.requestRender = requestRender;

    controls.addEventListener('start', () => {
      st.resetCamRequested = false;
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

    // Initial build
    rebuildActiveAssembly();

    return () => {
      disposed = true;
      cancelAnimationFrame(frameId);
      clearTimeout(frameId);
      resizeObs.disconnect();
      renderer.domElement.removeEventListener('pointerdown', onPointerDown);
      renderer.domElement.removeEventListener('pointerup', onPointerUp);
      renderer.domElement.removeEventListener(
        'webglcontextlost',
        handleContextLost,
      );
      controls.dispose();
      clearAssembly();
      shadowPlane.geometry.dispose();
      (shadowPlane.material as THREE.Material).dispose();
      contactShadowTex.dispose();
      brushedTex.dispose();
      renderer.dispose();
      if (renderer.domElement.parentNode === mount) {
        mount.removeChild(renderer.domElement);
      }
    };
  }, []);

  // Drag and Drop handlers
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const file = e.dataTransfer.files[0];
      onCustomFileSelect?.(file);
      onSelectPreset?.('custom');
      sceneStateRef.current.loadCustomFile?.(file);
    }
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const file = e.target.files[0];
      onCustomFileSelect?.(file);
      onSelectPreset?.('custom');
      sceneStateRef.current.loadCustomFile?.(file);
    }
  };

  if (webglError) {
    return (
      <div
        className={`flex items-center justify-center bg-[#EAECEF] rounded-2xl border border-[#7A7670]/20 ${className}`}
      >
        <div className="text-center p-6">
          <p className="font-display font-semibold text-[#1D1B17]">
            3D CAD Viewport Unavailable
          </p>
          <p className="text-xs text-[#414943] mt-1">
            Hardware acceleration disabled. Inspect failure mechanisms in the right diagnostic ledger.
          </p>
        </div>
      </div>
    );
  }

  const activePreset = CAD_MODEL_PRESETS.find((p) => p.id === activePresetId);

  return (
    <div
      className={`relative w-full h-full overflow-hidden select-none ${className}`}
      style={{
        background:
          'radial-gradient(circle at 50% 44%, #F4F5F7 0%, #EAECEF 68%, #DFE3E8 100%)',
      }}
      onDragOver={handleDragOver}
      onDragEnter={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      <div ref={mountRef} className="w-full h-full cursor-grab active:cursor-grabbing" />

      {/* Hidden CAD File Input */}
      <input
        ref={fileInputRef}
        type="file"
        accept=".glb,.gltf,.obj"
        className="hidden"
        onChange={handleFileInputChange}
      />

      {/* Drag & Drop Visual Backdrop Overlay */}
      {isDragging && (
        <div className="absolute inset-0 bg-[#0F172A]/85 backdrop-blur-sm border-2 border-dashed border-[#10B981] flex flex-col items-center justify-center text-white z-40 transition-all">
          <div className="w-16 h-16 rounded-3xl bg-[#10B981]/20 border border-[#10B981]/50 flex items-center justify-center mb-3 animate-bounce">
            <Upload className="w-8 h-8 text-[#10B981]" />
          </div>
          <h3 className="text-lg font-bold">Drop NASA CAD Model Here</h3>
          <p className="text-xs text-[#94A3B8] mt-1 max-w-sm text-center">
            Supports <strong>.glb</strong>, <strong>.gltf</strong>, and <strong>.obj</strong> formats. Instant origin alignment, auto-scale, and wear degradation shading.
          </p>
        </div>
      )}

      {/* Loading Model Spinner Overlay */}
      {isLoadingModel && (
        <div className="absolute inset-0 bg-[#0F172A]/80 backdrop-blur-xs flex flex-col items-center justify-center text-white z-30">
          <div className="w-10 h-10 border-3 border-[#10B981] border-t-transparent rounded-full animate-spin mb-3" />
          <div className="text-xs font-mono font-bold text-[#E2E8F0]">
            Ingesting NASA CAD Asset...
          </div>
          <div className="text-[10px] font-mono text-[#94A3B8] mt-1">
            Centering Bounding Envelope &amp; Compiling Degradation Shaders
          </div>
        </div>
      )}

      {/* Invalid File Graceful Fallback Error Banner */}
      {fileError && (
        <div className="absolute top-4 left-4 right-4 bg-[#7F1D1D]/95 backdrop-blur-md border border-[#F87171] rounded-2xl p-4 text-white z-30 shadow-lg flex items-start justify-between gap-3 animate-in fade-in duration-200">
          <div className="flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-[#FCA5A5] shrink-0 mt-0.5" />
            <div className="space-y-1">
              <h4 className="text-xs font-bold text-[#FEE2E2]">
                CAD Ingestion Alert
              </h4>
              <p className="text-[11px] text-[#FECACA] leading-relaxed">
                {fileError}
              </p>
              <div className="pt-2 flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="px-3 py-1 rounded-lg bg-[#DC2626] hover:bg-[#B91C1C] text-[10px] font-bold uppercase tracking-wider text-white transition-all cursor-pointer"
                >
                  Browse Valid CAD File
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setFileError(null);
                    onSelectPreset?.('drill');
                  }}
                  className="px-3 py-1 rounded-lg bg-[#FFFFFF]/15 hover:bg-[#FFFFFF]/25 text-[10px] font-bold text-white transition-all cursor-pointer"
                >
                  Reset to TX-DRL-40 Drill
                </button>
              </div>
            </div>
          </div>
          <button
            type="button"
            onClick={() => setFileError(null)}
            className="p-1 rounded-lg text-white/70 hover:text-white hover:bg-white/10 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Telemetry HUD (Top-Left) */}
      {showControlsOverlay && (
        <div className="pointer-events-none absolute top-3 left-3 bg-[#0F172A]/90 backdrop-blur-md border border-[#334155] rounded-xl px-3 py-2 text-white shadow-md z-10 max-w-xs">
          <div className="flex items-center justify-between gap-2">
            <span className="text-[10px] font-mono text-[#94A3B8] uppercase tracking-wider truncate">
              {activeTelemetry?.fileName || activePreset?.name || 'TX-DRL-40 Assembly'}
            </span>
            <span className="text-[9px] font-mono px-1.5 py-0.2 rounded bg-[#334155] text-[#CBD5E1]">
              {activeTelemetry?.format || 'CAD'}
            </span>
          </div>

          <div className="flex items-center gap-1.5 mt-1">
            <span
              className={`w-2 h-2 rounded-full ${
                activeTelemetry?.degradationStatus === 'critical'
                  ? 'bg-[#EF4444] animate-ping'
                  : activeTelemetry?.degradationStatus === 'degrading'
                    ? 'bg-[#F59E0B]'
                    : 'bg-[#10B981]'
              }`}
            />
            <span className="text-xs font-bold font-mono">
              {activeTelemetry?.degradationStatus === 'critical'
                ? 'CRITICAL WEAR EXCEEDED'
                : activeTelemetry?.degradationStatus === 'degrading'
                  ? 'ACCELERATED WEAR'
                  : 'NOMINAL ENVELOPE'}
            </span>
            {activeTelemetry && (
              <span className="text-[10px] font-mono text-[#94A3B8] ml-auto">
                {activeTelemetry.wearIndex}×
              </span>
            )}
          </div>

          {activeTelemetry && (
            <div className="mt-1.5 pt-1.5 border-t border-[#334155]/80 text-[10px] font-mono text-[#94A3B8] grid grid-cols-2 gap-x-2 gap-y-0.5">
              <div>
                Meshes: <strong className="text-white">{activeTelemetry.meshCount}</strong>
              </div>
              <div>
                Polys: <strong className="text-white">{(activeTelemetry.polygonCount / 1000).toFixed(1)}k</strong>
              </div>
              <div className="col-span-2 truncate">
                Bounds: <strong className="text-white">{activeTelemetry.dimensionsCm.x}×{activeTelemetry.dimensionsCm.y}×{activeTelemetry.dimensionsCm.z} cm</strong>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Floating Canvas Quick Action Toolbar (Top-Right) */}
      <div className="absolute top-3 right-3 flex items-center gap-2 z-20">
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          className="px-3 py-1.5 rounded-xl bg-[#0F172A]/90 hover:bg-[#1E293B] text-white border border-[#334155] text-xs font-semibold flex items-center gap-1.5 shadow-md backdrop-blur-md transition-all cursor-pointer"
          title="Upload Custom NASA CAD Model (.glb, .gltf, .obj)"
        >
          <Upload className="w-3.5 h-3.5 text-[#10B981]" />
          <span>Upload CAD</span>
        </button>
      </div>

      {/* Bottom Gesture Hint & Format Support */}
      <div className="pointer-events-none absolute bottom-3 left-3 right-3 flex items-center justify-between text-[10px] font-mono text-[#64748B] z-10">
        <span className="bg-[#0F172A]/80 backdrop-blur-md border border-[#334155]/60 rounded-lg px-2.5 py-1 text-[#94A3B8]">
          NASA CAD: .glb · .gltf · .obj
        </span>
        <span className="bg-[#0F172A]/80 backdrop-blur-md border border-[#334155]/60 rounded-lg px-2.5 py-1 text-[#94A3B8]">
          Orbit: Drag · Pan: Right-Click · Zoom: Scroll
        </span>
      </div>
    </div>
  );
};
