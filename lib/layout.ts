import type { BeadSize } from './materials';

export interface PlacedBead {
  id: string;
  crystalId: string;
  name: string;
  color: string;
  accent: string;
  inner: string;
  /** 透射吸收色（明亮色系） */
  attenuation: string;
  size: BeadSize;
  type: 'crystal' | 'spacer';
  meaning: string;
  category: string;
  materialProps: {
    transmission: number;
    ior: number;
    roughness: number;
    metalness: number;
    clearcoat: number;
    clearcoatRoughness: number;
    thickness: number;
    envMapIntensity: number;
    sheen: number;
    sheenColor: string;
    sheenRoughness: number;
    iridescence: number;
    iridescenceIOR: number;
    emissive: string;
    emissiveIntensity: number;
    attenuationDistance: number;
  };
  density: number;
  shape: 'sphere' | 'disc' | 'pendant';
}

export interface BeadPosition {
  id: string;
  /** 珠子中心在圓周上的角度（rad） */
  angle: number;
  x: number;
  y: number;
  z: number;
  /** 珠子半徑（mm） */
  radius: number;
  arcLength: number;
  arcAngle: number;
}

export interface BraceletLayout {
  radius: number;
  positions: BeadPosition[];
  centerCircumference: number;
  innerCircumference: number;
  totalBeadDiameter: number;
  wristShortfall: number;
  wristExcess: number;
}

const MM_PER_CM = 10;

/** 相鄰珠子之間預留的安全間隙比例（2%） */
export const BEAD_GAP_RATIO = 0.02;

/** 取得珠子實際半徑（mm）；扁平隔片略小以避免與相鄰球珠相切時凸出 */
export function beadRadius(size: BeadSize, shape: 'sphere' | 'disc' | 'pendant'): number {
  const base = size / 2;
  return shape === 'disc' ? base * 0.92 : base;
}

/**
 * 求出「珠子彼此相切（不重疊）」時的最小圓環半徑。
 * 相鄰兩珠中心弦長必須 ≥ r_i + r_{i+1}，弦長 = 2R·sin(θ/2)，
 * 因此相切時圓心角 θ = 2·asin((r_i + r_{i+1}) / 2R)，繞滿一圈即 Σθ = 2π，以二分法求解。
 */
export function solveTangentRadius(radii: number[], gap = 0): number {
  const n = radii.length;
  if (n === 0) return 0;
  if (n === 1) return radii[0] * 4;

  const sumAngles = (R: number) => {
    let total = 0;
    for (let i = 0; i < n; i++) {
      const a = radii[i];
      const b = radii[(i + 1) % n];
      const ratio = Math.min(0.999999, (a + b + gap * 2) / (2 * R));
      total += 2 * Math.asin(ratio);
    }
    return total;
  };

  let lo = Math.max(...radii) * 1.0001;
  let hi = lo * 2;
  let guard = 0;
  while (sumAngles(hi) > Math.PI * 2 && guard < 200) {
    hi *= 1.5;
    guard++;
  }
  for (let i = 0; i < 80; i++) {
    const mid = (lo + hi) / 2;
    if (sumAngles(mid) > Math.PI * 2) lo = mid;
    else hi = mid;
  }
  return (lo + hi) / 2;
}

function chordLength(a: { x: number; z: number }, b: { x: number; z: number }): number {
  return Math.hypot(a.x - b.x, a.z - b.z);
}

/**
 * 原則：珠子永遠「緊密相切」排列，並可依目標手圍微幅撐開。
 * - 圓環半徑由「所有珠子互相相切」的唯一解求出（solveTangentRadius）
 * - 每顆珠子的圓心角 = 2·asin((r_i + r_{i+1}) / 2R)
 * - 目標手圍比珠子總長大時，圓環最多撐開 15%，讓手圍設定即時反映在環徑上
 */
export function computeBraceletLayout(
  beads: PlacedBead[],
  targetWristCm: number,
): BraceletLayout {
  const radii = beads.map((b) => beadRadius(b.size, b.shape));
  // 預留 2% 安全間隙：相鄰兩珠之間留出極細的縫隙，避免放大 / 選取時互相嵌入
  const effective = radii.map((r) => r * (1 + BEAD_GAP_RATIO));
  const totalBeadDiameter = radii.reduce((s, r) => s + r * 2, 0);

  if (beads.length === 0) {
    return {
      radius: 0,
      centerCircumference: 0,
      innerCircumference: 0,
      totalBeadDiameter: 0,
      positions: [],
      wristShortfall: 0,
      wristExcess: 0,
    };
  }

  const tangentRadius = solveTangentRadius(effective);

  // 只有一顆珠子時直接放在正中央
  if (beads.length === 1) {
    const r0 = radii[0];
    return {
      radius: 0,
      centerCircumference: 0,
      innerCircumference: 0,
      totalBeadDiameter: r0 * 2,
      wristShortfall: 0,
      wristExcess: 0,
      positions: [{ id: beads[0].id, angle: 0, x: 0, y: 0, z: 0, radius: r0, arcLength: 0, arcAngle: 0 }],
    };
  }

  // 依目標手圍撐開圓環：一般情況最多 15%，
  // 但珠子較少時允許撐得更開（最多 2 倍），避免幾顆珠子全擠成一團看不出是手串。
  const targetInnerMm = targetWristCm * MM_PER_CM;
  const avgR = radii.reduce((sum, r) => sum + r, 0) / radii.length;
  const desiredRadius = targetInnerMm / (2 * Math.PI) + avgR;
  const lookRadius = avgR * 3.6;
  const stretchCap = Math.max(tangentRadius * 1.15, Math.min(lookRadius, tangentRadius * 2));
  let radius = Math.max(tangentRadius, Math.min(desiredRadius, stretchCap));

  const positions: BeadPosition[] = beads.map((b, i) => ({
    id: b.id,
    angle: 0,
    x: 0,
    y: 0,
    z: 0,
    radius: radii[i],
    arcLength: 0,
    arcAngle: 0,
  }));

  const place = (R: number) => {
    // 先算出每顆珠子「與下一顆相切」所需的圓心角，再把撐開後的剩餘角度平均分配到每個間隙，
    // 這樣圓環永遠首尾閉合，不會在接縫處留下孤零零的一段空隙。
    const arcs: number[] = [];
    let total = 0;
    for (let i = 0; i < beads.length; i++) {
      const r = effective[i];
      const next = effective[(i + 1) % beads.length];
      const ratio = Math.min(0.999999, (r + next) / (2 * R));
      const arcAngle = 2 * Math.asin(ratio);
      arcs.push(arcAngle);
      total += arcAngle;
    }
    const slack = Math.max(0, Math.PI * 2 - total) / beads.length;

    let a = 0;
    for (let i = 0; i < beads.length; i++) {
      const arcAngle = arcs[i] + slack;
      positions[i].angle = a;
      positions[i].x = Math.cos(a) * R;
      positions[i].z = Math.sin(a) * R;
      positions[i].arcAngle = arcAngle;
      positions[i].arcLength = arcAngle * R;
      a += arcAngle;
    }
  };
  place(radius);

  // 安全驗算：確保包含「最後一顆 ↔ 第一顆」在內的每一對相鄰珠子都確實不重疊。
  for (let attempt = 0; attempt < 24; attempt++) {
    let violated = false;
    for (let i = 0; i < positions.length; i++) {
      const nextPos = positions[(i + 1) % positions.length];
      const need = (radii[i] + radii[(i + 1) % radii.length]) * (1 + BEAD_GAP_RATIO);
      if (chordLength(positions[i], nextPos) < need - 1e-6) {
        violated = true;
        break;
      }
    }
    if (!violated) break;
    radius *= 1.005;
    place(radius);
  }

  // 微小的高度起伏，模擬自然串珠的交錯層次
  for (let i = 0; i < positions.length; i++) {
    positions[i].y = Math.sin(i * 2.399963) * positions[i].radius * 0.06;
  }

  const centerCircumference = 2 * Math.PI * radius;
  const avgRadius = radii.reduce((s, r) => s + r, 0) / radii.length;
  const innerCircumference = Math.max(0, 2 * Math.PI * (radius - avgRadius));

  const diff = targetInnerMm - innerCircumference;

  return {
    radius,
    centerCircumference,
    innerCircumference,
    totalBeadDiameter,
    positions,
    wristShortfall: diff > 0 ? diff : 0,
    wristExcess: diff < 0 ? -diff : 0,
  };
}

/** 依材質密度估算手串總重量（克） */
export function estimateWeight(beads: PlacedBead[]): number {
  let grams = 0;
  for (const b of beads) {
    const rCm = b.size / 20; // mm → cm
    const volume = (4 / 3) * Math.PI * rCm ** 3;
    grams += volume * b.density * 0.86;
  }
  return Math.round(grams * 10) / 10;
}
