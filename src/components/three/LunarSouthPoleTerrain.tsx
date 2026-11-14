import { useState } from 'react';
import { Canvas, useLoader } from '@react-three/fiber';
import { Html, OrbitControls } from '@react-three/drei';
import * as THREE from 'three';

const SOUTH_POLE_LATITUDE = -90;

function LunarTerrainMesh() {
  const [showData, setShowData] = useState(false);
  const colorMap = useLoader(THREE.TextureLoader, '/moon_color.jpg');
  const displacementMap = useLoader(
    THREE.TextureLoader,
    '/moon_displacement.jpg',
  );

  colorMap.colorSpace = THREE.SRGBColorSpace;
  colorMap.anisotropy = 8;
  displacementMap.colorSpace = THREE.NoColorSpace;
  displacementMap.anisotropy = 8;

  return (
    <mesh castShadow receiveShadow>
      <sphereGeometry args={[1, 1024, 1024]} />
      <meshStandardMaterial
        map={colorMap}
        displacementMap={displacementMap}
        displacementScale={0.015}
        displacementBias={-0.0075}
        roughness={1}
        metalness={0}
      />
      <Html position={[0, -1.01, 0]} center zIndexRange={[100, 0]}>
        <div className="flex flex-col items-center">
          <div
            className="relative flex items-center justify-center cursor-pointer pointer-events-auto group"
            onClick={() => setShowData(!showData)}
          >
            <div className="absolute w-4 h-4 bg-orange-500 rounded-full animate-ping opacity-75" />
            <div className="relative w-2 h-2 bg-orange-500 rounded-full border border-white group-hover:scale-150 transition-transform" />
          </div>

          {!showData && (
            <div
              className="mt-2 px-2 py-1 bg-black/80 border border-orange-500/50 rounded text-orange-500 text-[10px] font-mono uppercase tracking-widest cursor-pointer pointer-events-auto hover:bg-orange-500/20"
              onClick={() => setShowData(true)}
            >
              Artemis IV Target
            </div>
          )}

          {showData && (
            <div className="mt-3 w-48 bg-black/90 border border-orange-500 rounded-md p-3 text-left pointer-events-auto shadow-[0_0_15px_rgba(249,115,22,0.2)] backdrop-blur-md">
              <div className="flex justify-between items-start border-b border-orange-500/30 pb-2 mb-2">
                <span className="text-orange-500 text-xs font-bold font-mono tracking-wider">
                  SHACKLETON RIM
                </span>
                <button
                  type="button"
                  onClick={() => setShowData(false)}
                  className="text-gray-400 hover:text-white text-xs"
                  aria-label="Close Shackleton data"
                >
                  ✕
                </button>
              </div>
              <div className="space-y-2 font-mono text-[10px] text-gray-300">
                <div className="flex justify-between">
                  <span>MIN TEMP:</span>
                  <span className="text-blue-400 font-bold">-203°C</span>
                </div>
                <div className="flex justify-between">
                  <span>MAX TEMP:</span>
                  <span className="text-red-400 font-bold">-48°C</span>
                </div>
                <div className="flex justify-between">
                  <span>SLOPE:</span>
                  <span className="text-orange-400">14.8°</span>
                </div>
                <div className="flex justify-between">
                  <span>SOLAR ELEV:</span>
                  <span className="text-yellow-400">1.8°</span>
                </div>
              </div>
            </div>
          )}
        </div>
      </Html>
    </mesh>
  );
}

interface LunarSouthPoleTerrainProps {
  className?: string;
}

export function LunarSouthPoleTerrain({
  className = 'h-full w-full',
}: LunarSouthPoleTerrainProps) {
  return (
    <div className={className}>
      <Canvas
        shadows
        camera={{
          position: [0, -2.5, 1.5],
          fov: 45,
        }}
      >
        <ambientLight intensity={0.7} />
        <OrbitControls
          makeDefault
          target={[0, 0, 0]}
          enablePan={false}
          enableDamping
          dampingFactor={0.06}
          minDistance={1.2}
          maxDistance={4}
        />
        <directionalLight
          castShadow
          intensity={2.5}
          color="#fff4d6"
          position={[15, 5, 2]}
          shadow-mapSize={[2048, 2048]}
          shadow-camera-near={0.1}
          shadow-camera-far={10}
          shadow-camera-left={-3}
          shadow-camera-right={3}
          shadow-camera-top={3}
          shadow-camera-bottom={-3}
          shadow-bias={-0.00015}
        />
        <LunarTerrainMesh />
      </Canvas>
    </div>
  );
}

export { SOUTH_POLE_LATITUDE };
