'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { useFrame, useThree, type ThreeEvent } from '@react-three/fiber';
import * as THREE from 'three';
import { useStudioStore, useLayout } from '@/store/useStudioStore';
import type { PlacedBead } from '@/lib/layout';
import {
  getCrystalTexture,
  getMicroNoiseTexture,
  hashSeed,
  seededRandom,
  textureCarriesColor,
} from '@/lib/textures';

interface BeadProps {
  bead: PlacedBead;
  materialId: string;
  position: [number, number, number];
  /** 珠子中心在圓周上的角度（rad），用於對齊隔珠孔洞方向 */
  angle: number;
  radius: number;
  /** 這顆珠子在手串中的序號，用於產生固定的隨機初始旋轉 */
  index: number;
  selected: boolean;
  hovered: boolean;
  onSelect: (id: string) => void;
  onHover: (id: string | null) => void;
}

/** 幾何體以 99.5% 渲染，留下髮絲般的間隙，避免相鄰球珠視覺上黏成一片 */
const GEOMETRY_SCALE = 0.995;

function BeadMesh({
  bead,
  materialId,
  position,
  angle,
  radius,
  index,
  selected,
  hovered,
  onSelect,
  onHover,
}: BeadProps) {
  const group = useRef<THREE.Group>(null);
  const mesh = useRef<THREE.Mesh>(null);
  const [animScale, setAnimScale] = useState(1);
  const targetScale = selected ? 1.08 : hovered ? 1.05 : 1;
  const mp = bead.materialProps;
  const isDisc = bead.shape === 'disc';

  const texture = useMemo(() => getCrystalTexture(materialId), [materialId]);
  const noise = useMemo(() => getMicroNoiseTexture(), []);

  // 每顆珠子依序號決定固定的隨機初始旋轉
  const spin = useMemo(() => {
    const rnd = seededRandom(hashSeed(`${materialId}:${index}`));
    return [
      (rnd() - 0.5) * Math.PI,
      rnd() * Math.PI * 2,
      (rnd() - 0.5) * Math.PI,
    ] as [number, number, number];
  }, [materialId, index]);

  useFrame((_, delta) => {
    const g = group.current;
    if (!g) return;
    const next = THREE.MathUtils.lerp(animScale, targetScale, 1 - Math.pow(0.002, delta));
    setAnimScale(next);
    g.scale.setScalar(next);

    const targetY = selected ? radius * 1.15 : hovered ? radius * 0.35 : 0;
    g.position.y = THREE.MathUtils.lerp(g.position.y, targetY, 1 - Math.pow(0.005, delta));

    // 選中時沿圓周徑向微微外移，避免放大後嵌進左右相鄰的珠子
    const len = Math.hypot(position[0], position[2]) || 1;
    const rx = position[0] / len;
    const rz = position[2] / len;
    const targetOut = selected ? 0.08 : 0;
    const cur = Math.hypot(mesh.current?.position.x ?? 0, mesh.current?.position.z ?? 0);
    const nextOut = THREE.MathUtils.lerp(cur, targetOut, 1 - Math.pow(0.005, delta));
    if (mesh.current) {
      mesh.current.position.x = rx * nextOut;
      mesh.current.position.z = rz * nextOut;
    }
  });

  const handleOver = (e: ThreeEvent<PointerEvent>) => {
    e.stopPropagation();
    onHover(bead.id);
  };
  const handleOut = (e: ThreeEvent<PointerEvent>) => {
    e.stopPropagation();
    onHover(null);
  };
  const handleClick = (e: ThreeEvent<MouseEvent>) => {
    e.stopPropagation();
    // 拖曳換位後的 click 不應再次改變選取
    if (Date.now() - useStudioStore.getState().dragEndedAt < 250) return;
    onSelect(bead.id);
  };

  return (
    <group ref={group} position={position}>
      <mesh
        ref={mesh}
        onPointerOver={handleOver}
        onPointerOut={handleOut}
        onClick={handleClick}
        castShadow
        receiveShadow
        rotation={isDisc ? [0, -angle, 0] : spin}
        scale={isDisc ? [1, 1, 0.5] : undefined}
      >
        {isDisc ? (
          <torusGeometry args={[radius * 0.6, radius * 0.26, 20, 48]} />
        ) : (
          <sphereGeometry args={[radius * GEOMETRY_SCALE, 64, 64]} />
        )}
        <meshPhysicalMaterial
          color={textureCarriesColor(materialId) ? '#ffffff' : bead.color}
          map={texture ?? null}
          bumpMap={texture ?? null}
          bumpScale={isDisc ? 0.002 : 0.005}
          roughnessMap={noise}
          transmission={mp.transmission}
          ior={mp.ior}
          roughness={mp.roughness}
          metalness={mp.metalness}
          clearcoat={mp.clearcoat}
          clearcoatRoughness={mp.clearcoatRoughness}
          thickness={mp.thickness}
          envMapIntensity={mp.envMapIntensity}
          sheen={mp.sheen}
          sheenColor={mp.sheenColor}
          sheenRoughness={mp.sheenRoughness}
          attenuationColor={bead.attenuation}
          attenuationDistance={mp.attenuationDistance}
          emissive={mp.emissive}
          emissiveIntensity={mp.emissiveIntensity}
          specularIntensity={1}
          iridescence={mp.iridescence}
          iridescenceIOR={mp.iridescenceIOR}
          iridescenceThicknessRange={[100, 420]}
          transparent={mp.transmission > 0}
          opacity={1}
        />
      </mesh>
    </group>
  );
}

/** 吊墜：掛在圓環 12 點鐘方向外側 */
function Pendant({
  bead,
  radius,
  ringRadius,
}: {
  bead: PlacedBead;
  radius: number;
  ringRadius: number;
}) {
  const texture = useMemo(() => getCrystalTexture(bead.crystalId), [bead.crystalId]);
  const noise = useMemo(() => getMicroNoiseTexture(), []);
  const mp = bead.materialProps;

  // 12 點鐘方向 = +Z 軸（俯視時朝上）
  const outer = ringRadius + radius * 1.9;
  const plateSize = radius * 1.5;

  return (
    <group position={[0, -radius * 0.35, outer]} rotation={[0, 0, 0]}>
      {/* 連接環 */}
      <mesh position={[0, 0, -radius * 0.85]} rotation={[Math.PI / 2, 0, 0]}>
        <torusGeometry args={[radius * 0.26, radius * 0.08, 12, 32]} />
        <meshStandardMaterial color="#d9dde4" metalness={1} roughness={0.2} />
      </mesh>
      {/* 吊墜本體 */}
      <mesh castShadow receiveShadow>
        <boxGeometry args={[plateSize, plateSize, radius * 0.32]} />
        <meshPhysicalMaterial
          color={textureCarriesColor(bead.crystalId) ? '#ffffff' : bead.color}
          map={texture ?? null}
          roughnessMap={noise}
          bumpMap={texture ?? null}
          bumpScale={0.004}
          transmission={mp.transmission}
          ior={mp.ior}
          roughness={mp.roughness}
          metalness={mp.metalness}
          clearcoat={mp.clearcoat}
          envMapIntensity={mp.envMapIntensity}
          sheen={mp.sheen}
          sheenColor={mp.sheenColor}
          attenuationColor={bead.attenuation}
          attenuationDistance={mp.attenuationDistance}
          emissive={mp.emissive}
          emissiveIntensity={mp.emissiveIntensity}
          iridescence={mp.iridescence}
        />
      </mesh>
    </group>
  );
}

function BraceletBody() {
  const beads = useStudioStore((s) => s.beads);
  const pendant = useStudioStore((s) => s.pendant);
  const selectedBeadId = useStudioStore((s) => s.selectedBeadId);
  const hoveredBeadId = useStudioStore((s) => s.hoveredBeadId);
  const selectBead = useStudioStore((s) => s.selectBead);
  const hoverBead = useStudioStore((s) => s.hoverBead);
  const layout = useLayout();

  const positions = new Map<string, (typeof layout.positions)[number]>();
  layout.positions.forEach((p) => positions.set(p.id, p));

  // 彈力線：細緻的半透明微光纖維
  const cordRadius = Math.max(layout.radius * 0.005, 0.12);

  if (beads.length === 0) {
    return (
      <mesh rotation={[-Math.PI / 2, 0, 0]}>
        <torusGeometry args={[18, 0.18, 12, 96]} />
        <meshStandardMaterial
          color="#e7e3dc"
          roughness={0.7}
          metalness={0}
          transparent
          opacity={0.5}
        />
      </mesh>
    );
  }

  return (
    <group>
      {/* 彈力線：穿過所有珠子中心 */}
      <mesh rotation={[-Math.PI / 2, 0, 0]}>
        <torusGeometry args={[layout.radius, cordRadius, 12, 160]} />
        <meshStandardMaterial
          color="#e8e2d6"
          roughness={0.7}
          metalness={0}
          transparent
          opacity={0.35}
        />
      </mesh>

      {beads.map((bead, index) => {
        const p = positions.get(bead.id);
        if (!p) return null;
        return (
          <BeadMesh
            key={bead.id}
            bead={bead}
            materialId={bead.materialId}
            index={index}
            position={[p.x, p.y, p.z]}
            angle={p.angle}
            radius={p.radius}
            selected={selectedBeadId === bead.id}
            hovered={hoveredBeadId === bead.id}
            onSelect={selectBead}
            onHover={hoverBead}
          />
        );
      })}

      {pendant && (
        <Pendant
          bead={pendant}
          radius={pendant.size / 2}
          ringRadius={layout.radius}
        />
      )}
    </group>
  );
}

/**
 * 拖曳換位：在畫布上「按下」時找出離手指最近的珠子作為起點，
 * 拖動時把手指角度映射回最近的手串序位，即時重排珠子順序，
 * 做到「點一下 → 直接拖到其他位置」。
 */
function DragManager() {
  const gl = useThree((s) => s.gl);
  const camera = useThree((s) => s.camera);
  const controls = useThree((s) => s.controls) as { enabled: boolean } | null;
  const dragBeadId = useStudioStore((s) => s.dragBeadId);
  const beginDrag = useStudioStore((s) => s.beginDrag);
  const moveBeadToIndex = useStudioStore((s) => s.moveBeadToIndex);
  const endDrag = useStudioStore((s) => s.endDrag);
  const layout = useLayout();
  const layoutRef = useRef(layout);
  layoutRef.current = layout;

  // 按下：以「指尖最近的珠子」為拖曳起點（容忍按在珠子的邊緣附近）
  useEffect(() => {
    const el = gl.domElement;
    const onDown = (ev: PointerEvent) => {
      if (ev.pointerType === 'mouse' && ev.button !== 0) return;
      if (useStudioStore.getState().dragBeadId) return;
      const rect = el.getBoundingClientRect();
      if (rect.width === 0 || rect.height === 0) return;
      const v = new THREE.Vector3();
      let best: string | null = null;
      let bestD = Infinity;
      const tolerance = Math.max(28, rect.height * 0.045);
      for (const p of layoutRef.current.positions) {
        v.set(p.x, p.y, p.z).project(camera);
        const sx = rect.left + (v.x * 0.5 + 0.5) * rect.width;
        const sy = rect.top + (-v.y * 0.5 + 0.5) * rect.height;
        const d = Math.hypot(ev.clientX - sx, ev.clientY - sy);
        if (d < tolerance && d < bestD) {
          bestD = d;
          best = p.id;
        }
      }
      if (best) {
        // 在同一事件內立即停用 OrbitControls，避免拖曳同時旋轉場景
        if (controls) controls.enabled = false;
        beginDrag(best);
      }
    };
    el.addEventListener('pointerdown', onDown);
    return () => el.removeEventListener('pointerdown', onDown);
  }, [gl, camera, controls, beginDrag]);

  // 拖曳中：手指角度 → 最近序位 → 重新排列；放開即結束
  useEffect(() => {
    if (!dragBeadId) return;
    const el = gl.domElement;
    const raycaster = new THREE.Raycaster();
    const plane = new THREE.Plane(new THREE.Vector3(0, 1, 0), 0);
    const ndc = new THREE.Vector2();
    const hit = new THREE.Vector3();
    const twoPi = Math.PI * 2;
    const norm = (a: number) => ((a % twoPi) + twoPi) % twoPi;

    const onMove = (ev: PointerEvent) => {
      const rect = el.getBoundingClientRect();
      if (rect.width === 0 || rect.height === 0) return;
      ndc.set(
        ((ev.clientX - rect.left) / rect.width) * 2 - 1,
        -(((ev.clientY - rect.top) / rect.height) * 2 - 1),
      );
      raycaster.setFromCamera(ndc, camera);
      if (!raycaster.ray.intersectPlane(plane, hit)) return;

      const ang = norm(Math.atan2(hit.z, hit.x));
      const { positions } = layoutRef.current;
      let best = -1;
      let bestD = Infinity;
      for (let i = 0; i < positions.length; i++) {
        const center = norm(positions[i].angle + positions[i].arcAngle / 2);
        const raw = Math.abs(ang - center);
        const dist = Math.min(raw, twoPi - raw);
        if (dist < bestD) {
          bestD = dist;
          best = i;
        }
      }
      if (best >= 0) moveBeadToIndex(dragBeadId, best);
    };

    const onUp = () => {
      endDrag();
      if (controls) controls.enabled = true;
    };

    window.addEventListener('pointermove', onMove);
    window.addEventListener('pointerup', onUp);
    window.addEventListener('pointercancel', onUp);
    return () => {
      window.removeEventListener('pointermove', onMove);
      window.removeEventListener('pointerup', onUp);
      window.removeEventListener('pointercancel', onUp);
    };
  }, [dragBeadId, gl, camera, controls, moveBeadToIndex, endDrag]);

  return null;
}

export default function BraceletScene() {
  const group = useRef<THREE.Group>(null);
  const autoRotate = useStudioStore((s) => s.autoRotate);
  const hoveredBeadId = useStudioStore((s) => s.hoveredBeadId);
  const selectedBeadId = useStudioStore((s) => s.selectedBeadId);
  const idleRef = useRef(0);

  useEffect(() => {
    if (hoveredBeadId || selectedBeadId) idleRef.current = 0;
  }, [hoveredBeadId, selectedBeadId]);

  useFrame((state, delta) => {
    const g = group.current;
    if (!g) return;
    if (state.gl.domElement.matches(':hover')) {
      idleRef.current = 0;
      return;
    }
    idleRef.current += delta;
    if (autoRotate && idleRef.current > 1.2) {
      g.rotation.y += delta * 0.12;
    }
  });

  return (
    <group ref={group}>
      <BraceletBody />
      <DragManager />
    </group>
  );
}
