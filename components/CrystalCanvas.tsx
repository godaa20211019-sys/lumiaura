'use client';

import { Suspense, useEffect, useMemo, useRef } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { ContactShadows, Environment, Lightformer, OrbitControls } from '@react-three/drei';
import * as THREE from 'three';
import BraceletScene from './BraceletScene';
import { useStudioStore, useLayout } from '@/store/useStudioStore';

/** 視角：俯視（Top-Down）與 3D 斜視 */
const VIEW_PRESETS: Record<string, { pos: [number, number, number]; target: [number, number, number] }> = {
  top: { pos: [0, 150, -30], target: [0, 0, 0] },
  angle: { pos: [72, 86, 104], target: [0, 0, 0] },
};

function CameraRig() {
  const viewMode = useStudioStore((s) => s.viewMode);
  const controls = useThree((s) => s.controls) as unknown as {
    target: THREE.Vector3;
    update: () => void;
  } | null;
  const camera = useThree((s) => s.camera) as THREE.PerspectiveCamera;
  const size = useThree((s) => s.size);
  const layout = useLayout();
  const target = useRef<THREE.Vector3>(new THREE.Vector3(0, 0, 0));
  const desired = useRef<THREE.Vector3 | null>(null);
  const desiredTarget = useRef<THREE.Vector3>(new THREE.Vector3(0, 0, 0));
  const initialised = useRef(false);

  /** 依手串半徑與畫布長寬比，計算「剛好看得完」的攝影距離 */
  const fitDistance = useMemo(() => {
    // 以「圓環半徑 + 最大珠半徑」估外框，避免近側珠子被畫面邊緣裁切
    const maxBead = layout.positions.reduce((m, p) => Math.max(m, p.radius), 4);
    const r = Math.max((layout.radius + maxBead) * 1.5, 20);
    const vFov = ((camera.fov ?? 38) * Math.PI) / 180;
    const aspect = Math.max(size.width / Math.max(size.height, 1), 0.35);
    const dV = r / Math.tan(vFov / 2);
    const dH = r / (Math.tan(vFov / 2) * aspect);
    return Math.max(dV, dH, 40);
  }, [layout.radius, layout.positions, camera.fov, size.width, size.height]);

  useEffect(() => {
    const preset = VIEW_PRESETS[viewMode] ?? VIEW_PRESETS.top;
    const dir = new THREE.Vector3(...preset.pos).normalize();
    desired.current = dir.multiplyScalar(fitDistance);
    desiredTarget.current = new THREE.Vector3(...preset.target);
    if (!initialised.current) {
      camera.position.copy(desired.current);
      target.current.copy(desiredTarget.current);
      initialised.current = true;
    }
  }, [viewMode, camera, fitDistance]);

  useFrame((_, delta) => {
    if (!desired.current) return;
    const lambda = 1 - Math.pow(0.0015, delta);
    camera.position.lerp(desired.current, lambda);
    target.current.lerp(desiredTarget.current, lambda);
    if (controls) {
      controls.target.copy(target.current);
      controls.update();
    }
    if (camera.position.distanceTo(desired.current) < 0.4) {
      desired.current = null;
    }
  });

  return null;
}

function AdaptiveShadow() {
  const layout = useLayout();
  const maxBead = layout.positions.reduce((m, p) => Math.max(m, p.radius), 4);
  const scale = Math.max(layout.radius * 3.2, 40);
  return (
    <ContactShadows
      position={[0, -maxBead - 0.6, 0]}
      opacity={0.28}
      scale={scale}
      blur={3}
      far={layout.radius * 1.6}
      resolution={512}
      color="#b9b2a6"
    />
  );
}

export default function CrystalCanvas() {
  return (
    <Canvas
      dpr={[1, 2]}
      gl={{
        antialias: true,
        alpha: true,
        preserveDrawingBuffer: true, // 供截圖分享使用
        toneMappingExposure: 1.15,
      }}
      camera={{ position: [0, 150, -30], fov: 38, near: 0.1, far: 2000 }}
    >
      {/* 透明畫布：由外層白色容器提供純白背景 */}

      {/* 純白高光攝影棚 */}
      <ambientLight intensity={0.85} />
      <hemisphereLight args={['#ffffff', '#efe9df', 0.7]} />
      <directionalLight
        position={[50, 90, 60]}
        intensity={1.6}
        castShadow
        shadow-mapSize={[1024, 1024]}
        shadow-radius={8}
      />

      {/* 程序化柔光箱：大面積圓形／環形光源 */}
      <Environment resolution={256} frames={1}>
        <Lightformer intensity={2.2} position={[0, 6, -8]} scale={16} form="circle" color="#ffffff" />
        <Lightformer
          intensity={1.3}
          position={[-8, 1, -1]}
          rotation={[0, Math.PI / 2, 0]}
          scale={11}
          form="circle"
          color="#fff4e6"
        />
        <Lightformer
          intensity={1.1}
          position={[8, 1, 1]}
          rotation={[0, -Math.PI / 2, 0]}
          scale={11}
          form="circle"
          color="#eef4ff"
        />
        <Lightformer intensity={0.7} position={[0, 0, 9]} scale={14} form="circle" color="#ffffff" />
        <Lightformer
          intensity={0.5}
          position={[0, -7, 0]}
          rotation={[Math.PI / 2, 0, 0]}
          scale={15}
          form="circle"
          color="#efe9df"
        />
        <Lightformer form="ring" intensity={1.4} position={[3, 4, 5]} scale={8} color="#ffffff" />
      </Environment>

      <Suspense fallback={null}>
        <BraceletScene />
      </Suspense>

      <AdaptiveShadow />
      <CameraRig />

      <OrbitControls
        enablePan={false}
        enableDamping
        dampingFactor={0.08}
        minDistance={22}
        maxDistance={420}
        minPolarAngle={0.02}
        maxPolarAngle={Math.PI / 2 + 0.4}
        makeDefault
      />
    </Canvas>
  );
}
