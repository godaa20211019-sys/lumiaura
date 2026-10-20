'use client';

import { create } from 'zustand';
import {
  MATERIALS,
  MATERIAL_MAP,
  type Material,
  type MaterialCategory,
} from '@/lib/materials';
import {
  computeBraceletLayout,
  estimateWeight,
  type PlacedBead,
} from '@/lib/layout';

/** 一顆已串上的珠子（或吊墜） */
export interface StudioBead extends PlacedBead {
  materialId: string;
}

export type ViewMode = 'top' | 'angle';

interface StudioState {
  beads: StudioBead[];
  /** 吊墜（掛在 12 點鐘方向，最多一顆） */
  pendant: StudioBead | null;
  /** 目標手圍（cm） */
  targetWrist: number;
  /** 圈數：單圈 / 雙圈 / 三圈 */
  wraps: 1 | 2 | 3;
  /** 身高（cm）、體重（kg），用於估算手圍 */
  height: number;
  weight: number;
  selectedBeadId: string | null;
  hoveredBeadId: string | null;
  viewMode: ViewMode;
  autoRotate: boolean;
  /** 面板分類 */
  category: MaterialCategory;
  /** 面板子分類 */
  sub: string;
  /** 搜尋關鍵字 */
  keyword: string;
  /** 是否顯示提示橫幅 */
  showTip: boolean;
  /** 已開啟的彈窗 */
  sheet: null | 'wrist' | 'meaning' | 'detail' | 'share';
  /** 正在查看寓意的材質 */
  meaningMaterial: Material | null;

  addBead: (materialId: string, size: number) => void;
  removeBead: (id: string) => void;
  moveBead: (id: string, dir: -1 | 1) => void;
  clearAll: () => void;
  setPendant: (materialId: string, size: number) => void;
  clearPendant: () => void;
  selectBead: (id: string | null) => void;
  hoverBead: (id: string | null) => void;
  setTargetWrist: (cm: number) => void;
  setWraps: (n: 1 | 2 | 3) => void;
  setHeight: (cm: number) => void;
  setWeight: (kg: number) => void;
  setViewMode: (m: ViewMode) => void;
  toggleAutoRotate: () => void;
  setCategory: (c: MaterialCategory) => void;
  setSub: (s: string) => void;
  setKeyword: (k: string) => void;
  hideTip: () => void;
  openSheet: (s: 'wrist' | 'meaning' | 'detail' | 'share', material?: Material) => void;
  closeSheet: () => void;
}

let uid = 0;
const nextId = () => `bead-${Date.now().toString(36)}-${(uid++).toString(36)}`;

function buildBead(material: Material, size: number, id?: string): StudioBead {
  return {
    id: id ?? nextId(),
    materialId: material.id,
    crystalId: material.id,
    name: material.name,
    color: material.color,
    accent: material.accent,
    inner: material.inner,
    attenuation: material.attenuation,
    size: size as PlacedBead['size'],
    type: material.shape === 'disc' ? 'spacer' : 'crystal',
    meaning: material.meaning,
    category: material.category,
    materialProps: {
      transmission: material.transmission,
      ior: material.ior,
      roughness: material.roughness,
      metalness: material.metalness,
      clearcoat: material.clearcoat,
      clearcoatRoughness: 0.06,
      thickness: 2.5,
      envMapIntensity: 2.2,
      sheen: material.sheen,
      sheenColor: material.sheenColor,
      sheenRoughness: 0.3,
      iridescence: material.iridescence,
      iridescenceIOR: 1.5,
      emissive: material.emissive,
      emissiveIntensity: material.emissiveIntensity,
      attenuationDistance: material.transmission > 0.3 ? 1.5 : 0.8,
    },
    density: material.density,
    shape: material.shape === 'disc' ? 'disc' : 'sphere',
  };
}

/**
 * 初始手串：粉貓眼 + 銀曜石 + 頂部福字吊墜，共 31 顆，適用手圍約 18cm。
 */
function createInitialBeads(): StudioBead[] {
  const pink = MATERIAL_MAP['cat-eye-pink'];
  const obsidian = MATERIAL_MAP['silver-obsidian'];
  const beads: StudioBead[] = [];
  let i = 0;
  // 21 顆 8mm 粉貓眼 + 9 顆 6mm 銀曜石 = 30 顆
  for (let k = 0; k < 21; k++) beads.push(buildBead(pink, 8, `init-${i++}`));
  for (let k = 0; k < 9; k++) beads.push(buildBead(obsidian, 6, `init-${i++}`));
  return beads;
}

function createInitialPendant(): StudioBead | null {
  const fu = MATERIAL_MAP['fu-char'];
  if (!fu) return null;
  return buildBead(fu, 12, 'init-pendant');
}

export const useStudioStore = create<StudioState>((set, get) => ({
  beads: createInitialBeads(),
  pendant: createInitialPendant(),
  targetWrist: 18,
  wraps: 1,
  height: 165,
  weight: 52,
  selectedBeadId: null,
  hoveredBeadId: null,
  viewMode: 'top',
  autoRotate: false,
  category: 'bead',
  sub: '全部',
  keyword: '',
  showTip: true,
  sheet: null,
  meaningMaterial: null,

  addBead: (materialId, size) => {
    const material = MATERIAL_MAP[materialId];
    if (!material) return;
    if (material.pendant) {
      get().setPendant(materialId, size);
      return;
    }
    set((s) => ({ beads: [...s.beads, buildBead(material, size)] }));
  },

  removeBead: (id) =>
    set((s) => ({
      beads: s.beads.filter((b) => b.id !== id),
      selectedBeadId: s.selectedBeadId === id ? null : s.selectedBeadId,
    })),

  /** 前移 / 後移：調整珠子在串上的順序 */
  moveBead: (id, dir) =>
    set((s) => {
      const index = s.beads.findIndex((b) => b.id === id);
      if (index < 0) return {};
      const next = [...s.beads];
      const target = index + dir;
      if (target < 0 || target >= next.length) return {};
      const [item] = next.splice(index, 1);
      next.splice(target, 0, item);
      return { beads: next };
    }),

  clearAll: () => set({ beads: [], pendant: null, selectedBeadId: null }),

  setPendant: (materialId, size) => {
    const material = MATERIAL_MAP[materialId];
    if (!material) return;
    set({ pendant: buildBead(material, size) });
  },

  clearPendant: () => set({ pendant: null }),

  selectBead: (id) => set({ selectedBeadId: id }),
  hoverBead: (id) => set({ hoveredBeadId: id }),

  setTargetWrist: (cm) => set({ targetWrist: Math.min(20, Math.max(13, cm)) }),
  setWraps: (n) => set({ wraps: n }),
  setHeight: (cm) => set({ height: cm }),
  setWeight: (kg) => set({ weight: kg }),

  setViewMode: (m) => set({ viewMode: m, autoRotate: false }),
  toggleAutoRotate: () => set((s) => ({ autoRotate: !s.autoRotate })),
  setCategory: (c) => set({ category: c, sub: '全部' }),
  setSub: (sub) => set({ sub }),
  setKeyword: (keyword) => set({ keyword }),
  hideTip: () => set({ showTip: false }),

  openSheet: (sheet, material) =>
    set({ sheet, meaningMaterial: material ?? null }),
  closeSheet: () => set({ sheet: null }),
}));

/* ---------------- selectors ---------------- */

export const useBeads = () => useStudioStore((s) => s.beads);
export const useTargetWrist = () => useStudioStore((s) => s.targetWrist);

/** 目前設計的完整清單（主珠 + 吊墜） */
export function useAllBeads(): StudioBead[] {
  const beads = useStudioStore((s) => s.beads);
  const pendant = useStudioStore((s) => s.pendant);
  return pendant ? [...beads, pendant] : beads;
}

export function useLayout() {
  const beads = useStudioStore((s) => s.beads);
  const targetWrist = useStudioStore((s) => s.targetWrist);
  const wraps = useStudioStore((s) => s.wraps);
  // 單圈 → 一圈緊密排列；多圈 → 依圈數環繞
  const layout = computeBraceletLayout(beads, targetWrist);
  if (wraps === 1) return layout;
  return { ...layout, radius: layout.radius / wraps };
}

export function useSummary() {
  const beads = useStudioStore((s) => s.beads);
  const pendant = useStudioStore((s) => s.pendant);
  const targetWrist = useStudioStore((s) => s.targetWrist);
  const wraps = useStudioStore((s) => s.wraps);

  const materialIds = new Set(beads.map((b) => b.materialId));
  if (pendant) materialIds.add(pendant.materialId);
  const weight = estimateWeight(beads);

  // 依材質分組，產生「3種材質」描述
  const groups = new Map<string, { name: string; count: number }>();
  for (const b of beads) {
    const g = groups.get(b.materialId);
    if (g) g.count += 1;
    else groups.set(b.materialId, { name: b.name, count: 1 });
  }

  return {
    count: beads.length + (pendant ? 1 : 0),
    materialCount: materialIds.size,
    groups: [...groups.values()],
    weight,
    targetWrist,
    wraps,
    effectiveWrist: targetWrist / wraps,
  };
}

export { MATERIALS };
