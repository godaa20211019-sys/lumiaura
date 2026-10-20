import * as THREE from 'three';

/**
 * 程序化礦石紋理（Canvas Texture）。
 * 為每種水晶生成專屬的表面紋理，避免所有珠子看起來像同一顆塑膠糖果球。
 * 紋理以 crystalId 快取，確保同一種水晶共用一份 GPU 資源。
 */

const cache = new Map<string, THREE.CanvasTexture>();

/** 固定種子的偽亂數（同一顆珠子的紋理方向在每次渲染都一致） */
export function seededRandom(seed: number): () => number {
  let t = seed + 0x6d2b79f5;
  return () => {
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** 依字串產生穩定的數值種子 */
export function hashSeed(input: string): number {
  let h = 2166136261;
  for (let i = 0; i < input.length; i++) {
    h ^= input.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

function createCanvas(size = 512): {
  canvas: HTMLCanvasElement;
  ctx: CanvasRenderingContext2D;
} {
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d')!;
  return { canvas, ctx };
}

function toTexture(canvas: HTMLCanvasElement): THREE.CanvasTexture {
  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.wrapS = THREE.RepeatWrapping;
  tex.wrapT = THREE.RepeatWrapping;
  tex.anisotropy = 8;
  tex.needsUpdate = true;
  return tex;
}

/** 虎眼石：深棕與金黃交錯的絲絲貓眼條紋（經向條紋 + 中央明亮貓眼帶） */
function drawTigerEye(ctx: CanvasRenderingContext2D, size: number) {
  const rnd = seededRandom(9137);
  ctx.fillStyle = '#1d0e05';
  ctx.fillRect(0, 0, size, size);

  // 經向條紋（貼在球面上呈現為橫跨珠身的絲絲貓眼線）
  const bands = 26;
  for (let i = 0; i < bands; i++) {
    const x = (i / bands) * size;
    const w = size / bands;
    const warm = rnd();
    const g = ctx.createLinearGradient(x, 0, x + w, 0);
    if (warm > 0.42) {
      const hue = 34 + rnd() * 12;
      const sat = 62 + rnd() * 26;
      const lit = 30 + rnd() * 26;
      g.addColorStop(0, '#1a0c03');
      g.addColorStop(0.42, `hsl(${hue}, ${sat}%, ${lit * 0.62}%)`);
      g.addColorStop(0.62, `hsl(${hue + 6}, ${sat}%, ${lit}%)`);
      g.addColorStop(1, '#1a0c03');
    } else {
      g.addColorStop(0, '#120702');
      g.addColorStop(0.5, `hsl(${26 + rnd() * 10}, ${48 + rnd() * 22}%, ${10 + rnd() * 12}%)`);
      g.addColorStop(1, '#120702');
    }
    ctx.fillStyle = g;
    ctx.beginPath();
    const amp = 3 + rnd() * 9;
    const freq = 1 + rnd() * 2.5;
    ctx.moveTo(x, 0);
    for (let y = 0; y <= size; y += 8) {
      ctx.lineTo(x + Math.sin((y / size) * Math.PI * 2 * freq) * amp, y);
    }
    for (let y = size; y >= 0; y -= 8) {
      ctx.lineTo(
        x + w + Math.sin((y / size) * Math.PI * 2 * freq + 0.5) * amp,
        y,
      );
    }
    ctx.closePath();
    ctx.fill();
  }

  // 中央貓眼亮帶（強烈的金黃色帶橫跨珠身）
  const eyeW = size * 0.11;
  const eye = ctx.createLinearGradient(size / 2 - eyeW, 0, size / 2 + eyeW, 0);
  eye.addColorStop(0, 'rgba(255,190,90,0)');
  eye.addColorStop(0.35, 'rgba(255,206,110,0.85)');
  eye.addColorStop(0.5, 'rgba(255,246,214,1)');
  eye.addColorStop(0.65, 'rgba(255,206,110,0.85)');
  eye.addColorStop(1, 'rgba(255,190,90,0)');
  ctx.fillStyle = eye;
  ctx.fillRect(size / 2 - eyeW, 0, eyeW * 2, size);

  // 絲絲纖維細節
  ctx.globalAlpha = 0.4;
  for (let i = 0; i < 420; i++) {
    const x = rnd() * size;
    const y = rnd() * size;
    const len = size * (0.03 + rnd() * 0.14);
    ctx.strokeStyle = rnd() > 0.5 ? 'rgba(255,214,128,0.55)' : 'rgba(26,12,3,0.55)';
    ctx.lineWidth = 0.4 + rnd() * 1.3;
    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.lineTo(x + (rnd() - 0.5) * 5, y + len);
    ctx.stroke();
  }
  ctx.globalAlpha = 1;
}

/** 月光石：純白基底 + 淡藍色暈彩光斑 */
function drawMoonstone(ctx: CanvasRenderingContext2D, size: number) {
  const rnd = seededRandom(4471);
  ctx.fillStyle = '#f7f9ff';
  ctx.fillRect(0, 0, size, size);

  // 藍色暈彩
  for (let i = 0; i < 26; i++) {
    const x = rnd() * size;
    const y = rnd() * size;
    const r = size * (0.08 + rnd() * 0.26);
    const g = ctx.createRadialGradient(x, y, 0, x, y, r);
    g.addColorStop(0, `rgba(${120 + rnd() * 60}, ${160 + rnd() * 60}, 255, ${0.1 + rnd() * 0.2})`);
    g.addColorStop(1, 'rgba(160,190,255,0)');
    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.arc(x, y, r, 0, Math.PI * 2);
    ctx.fill();
  }

  // 絹絲般的柔和紋理
  for (let i = 0; i < 140; i++) {
    const x = rnd() * size;
    const y = rnd() * size;
    const len = size * (0.02 + rnd() * 0.06);
    ctx.strokeStyle = `rgba(255,255,255,${0.1 + rnd() * 0.25})`;
    ctx.lineWidth = 0.6 + rnd() * 1.6;
    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.lineTo(x + len * Math.cos(rnd() * 6.28), y + len * Math.sin(rnd() * 6.28));
    ctx.stroke();
  }
}

/** 透體水晶：極細微的冰裂 / 雲霧雜訊（作為 map 與 bumpMap） */
function drawFrost(ctx: CanvasRenderingContext2D, size: number) {
  const rnd = seededRandom(2213);
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(0, 0, size, size);

  // 雲霧
  for (let i = 0; i < 60; i++) {
    const x = rnd() * size;
    const y = rnd() * size;
    const r = size * (0.04 + rnd() * 0.16);
    const g = ctx.createRadialGradient(x, y, 0, x, y, r);
    const v = 226 + Math.floor(rnd() * 26);
    g.addColorStop(0, `rgba(${v},${v},${v + 6},${0.25 + rnd() * 0.3})`);
    g.addColorStop(1, 'rgba(255,255,255,0)');
    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.arc(x, y, r, 0, Math.PI * 2);
    ctx.fill();
  }

  // 冰裂（細分叉線）
  ctx.lineCap = 'round';
  for (let i = 0; i < 26; i++) {
    let x = rnd() * size;
    let y = rnd() * size;
    const branches = 2 + Math.floor(rnd() * 3);
    for (let b = 0; b < branches; b++) {
      let dir = rnd() * Math.PI * 2;
      ctx.beginPath();
      ctx.moveTo(x, y);
      const segs = 6 + Math.floor(rnd() * 10);
      for (let s = 0; s < segs; s++) {
        dir += (rnd() - 0.5) * 1.1;
        const step = size * (0.01 + rnd() * 0.035);
        x += Math.cos(dir) * step;
        y += Math.sin(dir) * step;
        ctx.lineTo(x, y);
      }
      ctx.strokeStyle = `rgba(255,255,255,${0.35 + rnd() * 0.4})`;
      ctx.lineWidth = 0.5 + rnd() * 1.2;
      ctx.stroke();
    }
  }

  // 細微雜訊
  const img = ctx.getImageData(0, 0, size, size);
  const d = img.data;
  for (let i = 0; i < d.length; i += 4) {
    const n = (rnd() - 0.5) * 10;
    d[i] = Math.max(0, Math.min(255, d[i] + n));
    d[i + 1] = Math.max(0, Math.min(255, d[i + 1] + n));
    d[i + 2] = Math.max(0, Math.min(255, d[i + 2] + n));
  }
  ctx.putImageData(img, 0, 0);
}

/** 濃色不透明寶石：細膩的斑點雜質，避免塑膠感 */
function drawSpeckle(
  ctx: CanvasRenderingContext2D,
  size: number,
  base: string,
  spec: string,
  seed: number,
) {
  const rnd = seededRandom(seed);
  ctx.fillStyle = base;
  ctx.fillRect(0, 0, size, size);

  for (let i = 0; i < 420; i++) {
    const x = rnd() * size;
    const y = rnd() * size;
    const r = 0.6 + rnd() * 3.2;
    ctx.fillStyle = `rgba(${spec},${0.05 + rnd() * 0.22})`;
    ctx.beginPath();
    ctx.arc(x, y, r, 0, Math.PI * 2);
    ctx.fill();
  }

  // 雲霧狀深淺
  for (let i = 0; i < 22; i++) {
    const x = rnd() * size;
    const y = rnd() * size;
    const r = size * (0.08 + rnd() * 0.22);
    const g = ctx.createRadialGradient(x, y, 0, x, y, r);
    g.addColorStop(0, `rgba(${spec},${0.08 + rnd() * 0.12})`);
    g.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.arc(x, y, r, 0, Math.PI * 2);
    ctx.fill();
  }
}


/** 貓眼石：斜向白色絲絲「貓眼光帶（Chatoyancy）」 */
function drawCatEye(
  ctx: CanvasRenderingContext2D,
  size: number,
  base: string,
  band: string,
  seed: number,
) {
  const rnd = seededRandom(seed);
  ctx.fillStyle = base;
  ctx.fillRect(0, 0, size, size);

  // 深色底層的絲狀纖維（沿斜向排列）
  ctx.save();
  ctx.translate(size / 2, size / 2);
  ctx.rotate(-0.5);
  ctx.translate(-size / 2, -size / 2);
  for (let i = 0; i < 320; i++) {
    const y = rnd() * size * 1.4 - size * 0.2;
    const x = rnd() * size;
    const len = size * (0.25 + rnd() * 0.6);
    ctx.strokeStyle = `rgba(255,255,255,${0.02 + rnd() * 0.05})`;
    ctx.lineWidth = 0.5 + rnd() * 1.6;
    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.lineTo(x + len, y + (rnd() - 0.5) * 10);
    ctx.stroke();
  }
  ctx.restore();

  // 主貓眼光帶（柔邊亮帶）
  ctx.save();
  ctx.translate(size / 2, size / 2);
  ctx.rotate(-0.5);
  const w = size * 0.2;
  const g = ctx.createLinearGradient(0, -w, 0, w);
  g.addColorStop(0, 'rgba(255,255,255,0)');
  g.addColorStop(0.42, 'rgba(255,255,255,0.35)');
  g.addColorStop(0.5, 'rgba(255,255,255,0.95)');
  g.addColorStop(0.58, 'rgba(255,255,255,0.35)');
  g.addColorStop(1, 'rgba(255,255,255,0)');
  ctx.fillStyle = g;
  ctx.fillRect(-size, -w, size * 2, w * 2);
  ctx.restore();

  // 貓眼帶內的細絲理
  ctx.save();
  ctx.translate(size / 2, size / 2);
  ctx.rotate(-0.5);
  for (let i = 0; i < 150; i++) {
    const y = (rnd() - 0.5) * size * 0.4;
    const x = rnd() * size;
    const len = size * (0.1 + rnd() * 0.35);
    ctx.strokeStyle = `rgba(255,255,255,${0.12 + rnd() * 0.4})`;
    ctx.lineWidth = 0.4 + rnd() * 1.1;
    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.lineTo(x + len, y + (rnd() - 0.5) * 3);
    ctx.stroke();
  }
  ctx.restore();

  // 邊緣加深，增加立體感
  const vign = ctx.createRadialGradient(size / 2, size / 2, size * 0.2, size / 2, size / 2, size * 0.62);
  vign.addColorStop(0, 'rgba(0,0,0,0)');
  vign.addColorStop(1, 'rgba(0,0,0,0.42)');
  ctx.fillStyle = vign;
  ctx.fillRect(0, 0, size, size);
}

/** 曜石：深邃黑亮球體，帶細緻銀沙反光 */
function drawObsidian(ctx: CanvasRenderingContext2D, size: number, seed: number) {
  const rnd = seededRandom(seed);
  ctx.fillStyle = '#0a0a0e';
  ctx.fillRect(0, 0, size, size);

  // 銀沙（銀曜石）
  for (let i = 0; i < 2600; i++) {
    const x = rnd() * size;
    const y = rnd() * size;
    const r = 0.4 + rnd() * 1.8;
    const a = 0.1 + rnd() * 0.5;
    ctx.fillStyle = `rgba(226,232,244,${a})`;
    ctx.beginPath();
    ctx.arc(x, y, r, 0, Math.PI * 2);
    ctx.fill();
  }

  // 少量深邃的雲霧
  for (let i = 0; i < 26; i++) {
    const x = rnd() * size;
    const y = rnd() * size;
    const r = size * (0.05 + rnd() * 0.16);
    const g = ctx.createRadialGradient(x, y, 0, x, y, r);
    g.addColorStop(0, 'rgba(90,100,130,0.18)');
    g.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.arc(x, y, r, 0, Math.PI * 2);
    ctx.fill();
  }
}

/** 木珠：真實環狀木紋 */
function drawWood(
  ctx: CanvasRenderingContext2D,
  size: number,
  light: string,
  dark: string,
  ringColor: string,
  seed: number,
) {
  const rnd = seededRandom(seed);
  ctx.fillStyle = light;
  ctx.fillRect(0, 0, size, size);

  // 以偏心圓心繪製年輪
  const cx = size * (0.42 + rnd() * 0.16);
  const cy = size * (0.42 + rnd() * 0.16);
  const rings = 26;
  for (let i = rings; i > 0; i--) {
    const r = (i / rings) * size * 0.85 + rnd() * 4;
    ctx.beginPath();
    ctx.ellipse(cx, cy, r, r * (0.82 + rnd() * 0.1), rnd() * 0.4, 0, Math.PI * 2);
    ctx.strokeStyle = i % 3 === 0 ? ringColor : dark;
    ctx.globalAlpha = 0.25 + rnd() * 0.4;
    ctx.lineWidth = 1 + rnd() * 3.2;
    ctx.stroke();
  }
  ctx.globalAlpha = 1;

  // 細長的絲狀纖維
  for (let i = 0; i < 220; i++) {
    const y = rnd() * size;
    const x = rnd() * size;
    const len = size * (0.05 + rnd() * 0.25);
    ctx.strokeStyle = rnd() > 0.5 ? 'rgba(255,235,205,0.18)' : 'rgba(60,32,12,0.2)';
    ctx.lineWidth = 0.5 + rnd() * 1.4;
    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.lineTo(x + len, y + (rnd() - 0.5) * 6);
    ctx.stroke();
  }
}

/** 福字銀牌 */
function drawFuChar(ctx: CanvasRenderingContext2D, size: number) {
  const g = ctx.createLinearGradient(0, 0, size, size);
  g.addColorStop(0, '#f4f6f9');
  g.addColorStop(0.4, '#c9ced8');
  g.addColorStop(0.55, '#eef1f6');
  g.addColorStop(1, '#aeb4c0');
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, size, size);

  // 外框
  ctx.strokeStyle = 'rgba(90,96,108,0.65)';
  ctx.lineWidth = size * 0.035;
  ctx.strokeRect(size * 0.1, size * 0.1, size * 0.8, size * 0.8);
  ctx.strokeStyle = 'rgba(255,255,255,0.55)';
  ctx.lineWidth = size * 0.012;
  ctx.strokeRect(size * 0.15, size * 0.15, size * 0.7, size * 0.7);

  // 福字
  ctx.fillStyle = '#7c8494';
  ctx.font = `600 ${size * 0.56}px "Songti SC", "SimSun", "Noto Serif SC", serif`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('福', size / 2, size * 0.54);
}

/** 茉莉花吊墜 */
function drawJasmine(ctx: CanvasRenderingContext2D, size: number) {
  ctx.clearRect(0, 0, size, size);
  const cx = size / 2;
  const cy = size / 2;

  // 八片花瓣
  for (let i = 0; i < 8; i++) {
    const a = (i / 8) * Math.PI * 2;
    ctx.save();
    ctx.translate(cx, cy);
    ctx.rotate(a);
    const grad = ctx.createLinearGradient(0, 0, 0, -size * 0.44);
    grad.addColorStop(0, 'rgba(255,255,255,1)');
    grad.addColorStop(0.6, 'rgba(252,250,242,0.95)');
    grad.addColorStop(1, 'rgba(232,228,214,0.8)');
    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.ellipse(0, -size * 0.24, size * 0.11, size * 0.24, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }

  // 花心
  const core = ctx.createRadialGradient(cx, cy, 0, cx, cy, size * 0.13);
  core.addColorStop(0, '#f8e9b8');
  core.addColorStop(1, 'rgba(248,233,184,0)');
  ctx.fillStyle = core;
  ctx.beginPath();
  ctx.arc(cx, cy, size * 0.13, 0, Math.PI * 2);
  ctx.fill();
}

/** 紫水葫蘆吊墜 */
function drawGourd(ctx: CanvasRenderingContext2D, size: number) {
  ctx.clearRect(0, 0, size, size);
  const cx = size / 2;

  const body = (cy: number, r: number) => {
    const g = ctx.createRadialGradient(cx - r * 0.35, cy - r * 0.4, r * 0.1, cx, cy, r);
    g.addColorStop(0, '#c79ae8');
    g.addColorStop(0.6, '#8a5bb5');
    g.addColorStop(1, '#4c2f6b');
    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.ellipse(cx, cy, r, r * 1.12, 0, 0, Math.PI * 2);
    ctx.fill();
    // 金邊
    ctx.strokeStyle = 'rgba(232,200,119,0.9)';
    ctx.lineWidth = size * 0.018;
    ctx.stroke();
  };

  body(size * 0.68, size * 0.2);
  body(size * 0.36, size * 0.29);

  // 葫蘆蒂
  ctx.strokeStyle = '#8a6a3a';
  ctx.lineWidth = size * 0.022;
  ctx.beginPath();
  ctx.moveTo(cx, size * 0.18);
  ctx.quadraticCurveTo(cx + size * 0.06, size * 0.1, cx + size * 0.02, size * 0.05);
  ctx.stroke();
}

/** 各水晶的紋理設定 */
const TEXTURE_RECIPES: Record<
  string,
  {
    draw: (ctx: CanvasRenderingContext2D, size: number) => void;
    size?: number;
    /** 貼圖本身已包含礦石本色時為 true，材質 color 需設為白色避免二次相乘變暗 */
    mapColor?: boolean;
  }
> = {
  'tiger-eye': { draw: drawTigerEye, mapColor: true },
  moonstone: { draw: drawMoonstone, mapColor: true },
  'clear-quartz': { draw: drawFrost },
  amethyst: { draw: drawFrost },
  citrine: { draw: drawFrost },
  'rose-quartz': { draw: drawFrost },
  aquamarine: { draw: drawFrost },
  'green-ghost': { draw: drawFrost },
  'lapis-lazuli': {
    draw: (ctx, size) => drawSpeckle(ctx, size, '#1c3a72', '236,214,140', 553),
    mapColor: true,
  },
  'gold-fill': {
    draw: (ctx, size) => drawSpeckle(ctx, size, '#c9a227', '255,245,210', 331),
    mapColor: true,
  },
  'silver-925': {
    draw: (ctx, size) => drawSpeckle(ctx, size, '#b9bec6', '255,255,255', 887),
    mapColor: true,
  },
  'cat-eye-pink': {
    draw: (ctx, size) => drawCatEye(ctx, size, '#8d3f55', '#ffd9e4', 4409),
    mapColor: true,
  },
  'cat-eye-blue': {
    draw: (ctx, size) => drawCatEye(ctx, size, '#1d3350', '#bcd8ff', 5171),
    mapColor: true,
  },
  'silver-sand': {
    draw: (ctx, size) => drawObsidian(ctx, size, 8837),
    mapColor: true,
  },
  obsidian: {
    draw: (ctx, size) => drawObsidian(ctx, size, 2251),
    mapColor: true,
  },
  'wood-rosewood': {
    draw: (ctx, size) => drawWood(ctx, size, '#b2763c', '#5d3418', '#e6b47c', 3391),
    mapColor: true,
  },
  'wood-ebony': {
    draw: (ctx, size) => drawWood(ctx, size, '#2a2320', '#0d0a09', '#6b5a4c', 6613),
    mapColor: true,
  },
  'fu-char': { draw: drawFuChar, mapColor: true },
  jasmine: { draw: drawJasmine, mapColor: true },
  gourd: { draw: drawGourd, mapColor: true },
  gold: {
    draw: (ctx, size) => drawSpeckle(ctx, size, '#c9a227', '255,245,210', 331),
    mapColor: true,
  },
  silver: {
    draw: (ctx, size) => drawSpeckle(ctx, size, '#b9bec6', '255,255,255', 887),
    mapColor: true,
  },
};

/**
 * 取得（並快取）指定水晶的程序化紋理。
 * 沒有專屬配方時回傳 null，由呼叫端沿用純色材質。
 */
export function getCrystalTexture(crystalId: string): THREE.CanvasTexture | null {
  const cached = cache.get(crystalId);
  if (cached) return cached;

  const recipe = TEXTURE_RECIPES[crystalId];
  if (!recipe) return null;

  const size = recipe.size ?? 512;
  const { canvas, ctx } = createCanvas(size);
  recipe.draw(ctx, size);

  const tex = toTexture(canvas);
  cache.set(crystalId, tex);
  return tex;
}

/**
 * 微細雜訊貼圖：作為 roughnessMap / bumpMap 使用，
 * 打破每顆珠子一模一樣的死板反光（模擬拋光表面的微小起伏）。
 */
export function getMicroNoiseTexture(): THREE.CanvasTexture {
  const cached = cache.get('__micro-noise__');
  if (cached) return cached;

  const size = 512;
  const { canvas, ctx } = createCanvas(size);
  const rnd = seededRandom(6673);

  ctx.fillStyle = '#808080';
  ctx.fillRect(0, 0, size, size);

  const img = ctx.getImageData(0, 0, size, size);
  const d = img.data;
  for (let i = 0; i < d.length; i += 4) {
    // 以數種頻率疊加的柔和雜訊，模擬拋光痕跡
    const v = 128 + (rnd() - 0.5) * 90;
    d[i] = d[i + 1] = d[i + 2] = v;
  }
  ctx.putImageData(img, 0, 0);

  // 細長的拋光拋光紋（沿單一方向的極淡條痕）
  ctx.globalAlpha = 0.16;
  for (let i = 0; i < 260; i++) {
    const y = rnd() * size;
    const x = rnd() * size;
    const len = size * (0.05 + rnd() * 0.35);
    ctx.strokeStyle = rnd() > 0.5 ? '#ffffff' : '#000000';
    ctx.lineWidth = 0.6 + rnd() * 2.2;
    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.lineTo(x + len, y + (rnd() - 0.5) * 4);
    ctx.stroke();
  }
  ctx.globalAlpha = 1;

  const tex = toTexture(canvas);
  tex.colorSpace = THREE.NoColorSpace;
  cache.set('__micro-noise__', tex);
  return tex;
}

/** 該水晶的貼圖是否已自帶本色（此時材質 color 需設為白色） */
export function textureCarriesColor(crystalId: string): boolean {
  return TEXTURE_RECIPES[crystalId]?.mapColor ?? false;
}

/** 釋放所有快取的紋理（卸載時呼叫） */
export function disposeCrystalTextures() {
  cache.forEach((tex) => tex.dispose());
  cache.clear();
}
