import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';
import { CadPartId, PartDegradationState } from '../../types/terra';

export interface PartScreenAnchor {
  id: CadPartId;
  x: number;
  y: number;
  visible: boolean;
}

interface EquipmentTwin3DProps {
  selectedPartId: CadPartId | null;
  onSelectPart: (partId: CadPartId | null) => void;
  exploded: boolean;
  isolatedPartId: CadPartId | null;
  sectionMode: boolean;
  cameraResetTrigger: number;
  degradationStates: PartDegradationState[];
  onAnchorsUpdate?: (anchors: Record<CadPartId, PartScreenAnchor>) => void;
  className?: string;
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

export const EquipmentTwin3D: React.FC<EquipmentTwin3DProps> = ({
  selectedPartId,
  onSelectPart,
  exploded,
  isolatedPartId,
  sectionMode,
  cameraResetTrigger,
  degradationStates,
  onAnchorsUpdate,
  className = '',
}) => {
  const mountRef = useRef<HTMLDivElement | null>(null);
  const [webglError, setWebglError] = useState(false);

  const propsRef = useRef({
    selectedPartId,
    onSelectPart,
    exploded,
    isolatedPartId,
    sectionMode,
    degradationStates,
    onAnchorsUpdate,
  });
  propsRef.current = {
    selectedPartId,
    onSelectPart,
    exploded,
    isolatedPartId,
    sectionMode,
    degradationStates,
    onAnchorsUpdate,
  };

  const sceneStateRef = useRef<{
    requestRender?: () => void;
    renderer?: THREE.WebGLRenderer;
    camera?: THREE.PerspectiveCamera;
    controls?: OrbitControls;
    clipPlane?: THREE.Plane;
    explodeProgress: number;
    partGroups: Partial<Record<CadPartId, THREE.Group>>;
    partMaterials: Partial<Record<CadPartId, THREE.MeshStandardMaterial[]>>;
    partBaseColors: Partial<Record<CadPartId, THREE.Color[]>>;
    failureSpheres: Partial<Record<CadPartId, THREE.Group>>;
    basePositions: Partial<Record<CadPartId, THREE.Vector3>>;
    explodeOffsets: Record<CadPartId, THREE.Vector3>;
    anchorLocalOffsets: Record<CadPartId, THREE.Vector3>;
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
    resetCamRequested: false,
  });

  // Trigger camera reset when requested
  useEffect(() => {
    if (cameraResetTrigger > 0) {
      sceneStateRef.current.resetCamRequested = true;
      sceneStateRef.current.requestRender?.();
    }
  }, [cameraResetTrigger]);

  // Trigger render & material updates on state prop changes
  useEffect(() => {
    const st = sceneStateRef.current;
    if (st.renderer) {
      st.renderer.localClippingEnabled = sectionMode;
    }
    st.requestRender?.();
  }, [exploded, isolatedPartId, sectionMode, selectedPartId, degradationStates]);

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
    controls.minDistance = 1.6;
    controls.maxDistance = 6.5;

    // Studio lighting rig
    const keyLight = new THREE.DirectionalLight(0xfff6ea, 2.2);
    keyLight.position.set(3.5, 5.0, 3.2);
    keyLight.castShadow = !isSoftwareGl;
    keyLight.shadow.mapSize.set(1024, 1024);
    keyLight.shadow.camera.left = -2;
    keyLight.shadow.camera.right = 2;
    keyLight.shadow.camera.top = 2;
    keyLight.shadow.camera.bottom = -2;
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
      new THREE.PlaneGeometry(3.2, 3.2),
      new THREE.MeshBasicMaterial({
        map: contactShadowTex,
        transparent: true,
        depthWrite: false,
      }),
    );
    shadowPlane.rotation.x = -Math.PI / 2;
    shadowPlane.position.y = -1.62;
    scene.add(shadowPlane);

    const gridHelper = new THREE.GridHelper(3.4, 18, 0xcbd5e1, 0xdbe2ea);
    gridHelper.position.y = -1.63;
    scene.add(gridHelper);

    const brushedTex = createBrushedMetalTexture();
    brushedTex.anisotropy = renderer.capabilities.getMaxAnisotropy();

    const assemblyRoot = new THREE.Group();
    scene.add(assemblyRoot);

    const st = sceneStateRef.current;
    const geometriesToDispose: THREE.BufferGeometry[] = [];
    const materialsToDispose: THREE.Material[] = [];
    const clickableMeshes: THREE.Object3D[] = [];

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
          clickableMeshes.push(child);
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

      // Translucent crimson failure highlight sphere + hairline ring
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
      geometriesToDispose.push(sphereGeo, ringGeo);
      materialsToDispose.push(sphereMat, ringMat);
    }

    // 1. OUTER CRANKCASE / ACTUATOR HOUSING (Lathe barrel + Extruded bevel flange + cooling ribs)
    {
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

      // Cooling ribs
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

      // Top actuator cap
      const capGeo = new THREE.CylinderGeometry(0.28, 0.34, 0.14, 32);
      const capMat = new THREE.MeshStandardMaterial({
        color: 0x334155,
        metalness: 0.7,
        roughness: 0.42,
      });
      const cap = new THREE.Mesh(capGeo, capMat);
      cap.position.y = 0.56;
      housingGroup.add(cap);

      geometriesToDispose.push(barrelGeo, ribGeo, capGeo);
      materialsToDispose.push(barrelMat, ribMat, capMat);
      registerPart(
        'housing',
        housingGroup,
        0.15,
        new THREE.Vector3(0, 0.15, 0),
        0.6,
      );
    }

    // 2. Ti-6Al-4V STRUCTURAL FASTENER SCREWS (x6 radially arrayed hex bolts)
    {
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
        materialsToDispose.push(tiMat);
      }

      geometriesToDispose.push(headGeo, shankGeo, washerGeo);
      // Anchor failure sphere specifically on Fastener Screw #4 (index 3)
      const fAngle = (3 / 6) * Math.PI * 2 + Math.PI / 6;
      registerPart(
        'fasteners',
        fastGroup,
        0,
        new THREE.Vector3(Math.cos(fAngle) * 0.44, 0.67, Math.sin(fAngle) * 0.44),
        0.16,
      );
    }

    // 3. BRUSHLESS STATOR WINDING (Laminated core + copper coil loops via TubeGeometry)
    {
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

      geometriesToDispose.push(coreGeo, coilGeo);
      materialsToDispose.push(coreMat, copperMat);
      registerPart(
        'stator',
        statorGroup,
        0.22,
        new THREE.Vector3(0, 0, 0),
        0.38,
      );
    }

    // 4. PLANETARY REDUCTION GEAR CARRIER
    {
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

      geometriesToDispose.push(sunGeo, planetGeo, carrierGeo);
      materialsToDispose.push(steelMat, bronzeMat);
      registerPart(
        'gears',
        gearGroup,
        -0.16,
        new THREE.Vector3(0, 0, 0),
        0.34,
      );
    }

    // 5. FLUOROELASTOMER ROTARY SHAFT SEAL (Viton FKM + Stainless Garter Spring)
    {
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
      geometriesToDispose.push(vitonGeo, springGeo);
      materialsToDispose.push(vitonMat, springMat);
      registerPart(
        'seal',
        sealGroup,
        -0.36,
        new THREE.Vector3(0, 0, 0),
        0.25,
      );
    }

    // 6. TUNGSTEN-CARBIDE AUGER FLUTE & BIT
    {
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
      geometriesToDispose.push(shaftGeo, helixGeo, tipGeo);
      materialsToDispose.push(shaftMat, helixMat, tipMat);
      registerPart(
        'auger',
        augerGroup,
        -0.38,
        new THREE.Vector3(0, -1.05, 0),
        0.24,
      );
    }

    st.renderer = renderer;
    st.camera = camera;
    st.controls = controls;
    st.clipPlane = clipPlane;

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
      if (moved > 6) return; // Ignore orbit drags

      const rect = renderer.domElement.getBoundingClientRect();
      pointer.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
      pointer.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;

      raycaster.setFromCamera(pointer, camera);
      const hits = raycaster.intersectObjects(clickableMeshes, false);
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
        _projVec.copy(st.anchorLocalOffsets[id]).applyMatrix4(grp.matrixWorld);
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
      const { isolatedPartId: iso, selectedPartId: sel, degradationStates: deg } =
        propsRef.current;

      (Object.keys(st.partGroups) as CadPartId[]).forEach((id) => {
        const mats = st.partMaterials[id] || [];
        const baseColors = st.partBaseColors[id] || [];
        const failGrp = st.failureSpheres[id];
        const degState = deg.find((d) => d.part.id === id);

        const isIsolatedOut = iso !== null && iso !== id;
        const isSelected = sel === id;
        const isCritical = degState?.status === 'critical';
        const isDegrading = degState?.status === 'degrading';

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

        // Smooth damped exploded-view separation
        const targetExp = propsRef.current.exploded ? 1 : 0;
        const prevExp = st.explodeProgress;
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

        if (Math.abs(st.explodeProgress - prevExp) > 0.0001 || true) {
          (Object.keys(st.partGroups) as CadPartId[]).forEach((id) => {
            const grp = st.partGroups[id];
            const base = st.basePositions[id];
            const off = st.explodeOffsets[id];
            if (grp && base && off) {
              grp.position.copy(base).addScaledVector(off, st.explodeProgress);
            }
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

    requestRender();

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
      geometriesToDispose.forEach((g) => g.dispose());
      materialsToDispose.forEach((m) => m.dispose());
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
            Inspect part damage indices and failure mechanisms in the right diagnostic ledger.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div
      className={`relative w-full h-full overflow-hidden ${className}`}
      style={{
        background:
          'radial-gradient(circle at 50% 44%, #F4F5F7 0%, #EAECEF 68%, #DFE3E8 100%)',
      }}
    >
      <div ref={mountRef} className="w-full h-full cursor-grab active:cursor-grabbing" />
    </div>
  );
};
