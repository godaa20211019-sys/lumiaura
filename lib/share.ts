'use client';

/** 分享相關工具：截圖、分享文案、設計卡圖片 */

export interface DesignSummary {
  /** 材質組合描述，例如「粉貓眼+銀曜石」 */
  combo: string;
  /** 總顆數（含吊墜） */
  count: number;
  /** 材質數 */
  materialCount: number;
  /** 適用手圍 */
  wrist: number;
  /** 圈數 */
  wraps: number;
  /** 已選材質明細 */
  details: { name: string; count: number }[];
}

/** 取得 3D 畫布的截圖（dataURL） */
export function captureCanvas(canvas: HTMLCanvasElement | null): string | null {
  if (!canvas) return null;
  try {
    return canvas.toDataURL('image/png');
  } catch {
    return null;
  }
}

/** 產生分享文字 */
export function buildShareText(summary: DesignSummary): string {
  const wrapText = summary.wraps > 1 ? `（${summary.wraps}圈）` : '';
  return `✨ 我的獨家水晶手串設計：${summary.combo}${wrapText} (共${summary.count}顆)，請幫我看看這串！\n\n—— 來自「星軌所 Lumiaura」以珠造物 不逐俗同`;
}

/** 產生設計口令（可複製給客服快速還原設計） */
export function buildDesignCode(summary: DesignSummary): string {
  const parts = summary.details.map((d) => `${d.name}x${d.count}`).join('+');
  const wrist = summary.wrist.toFixed(1);
  return `LA-${parts}-W${wrist}-N${summary.count}`;
}

/** 依分享文字產生 WhatsApp 連結 */
export function buildWhatsAppLink(text: string, imageDataUrl?: string | null): string {
  const base = `https://wa.me/?text=${encodeURIComponent(text)}`;
  // 若有截圖，透過 Web Share API 或提示使用者另行上傳
  return imageDataUrl ? base : base;
}

/** 產生 IG 專屬設計卡（Canvas 合成圖） */
export function buildDesignCard(
  image: HTMLImageElement | null,
  summary: DesignSummary,
  width = 750,
): string | null {
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = Math.round(width * 1.5);
  const ctx = canvas.getContext('2d');
  if (!ctx) return null;

  // 背景：柔白 + 淡粉光暈
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  const glow = ctx.createRadialGradient(
    canvas.width / 2,
    canvas.height * 0.34,
    0,
    canvas.width / 2,
    canvas.height * 0.34,
    canvas.width * 0.72,
  );
  glow.addColorStop(0, 'rgba(250,225,232,0.95)');
  glow.addColorStop(1, 'rgba(255,255,255,0)');
  ctx.fillStyle = glow;
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  // 截圖主體
  const imgH = Math.round(canvas.width * 0.95);
  if (image) {
    const ratio = Math.min(canvas.width / image.width, imgH / image.height);
    const w = image.width * ratio;
    const h = image.height * ratio;
    ctx.drawImage(image, (canvas.width - w) / 2, canvas.height * 0.09, w, h);
  }

  // 文字區
  let y = canvas.height * 0.68;
  ctx.textAlign = 'center';
  ctx.fillStyle = '#2f2b28';
  ctx.font = '600 34px "PingFang SC", "Noto Sans TC", sans-serif';
  ctx.fillText('星軌所', canvas.width / 2, y);

  y += 30;
  ctx.fillStyle = '#a9a096';
  ctx.font = '15px "PingFang SC", sans-serif';
  ctx.fillText('— LUMIAURA STUDIO —', canvas.width / 2, y);

  y += 44;
  ctx.fillStyle = '#5d5750';
  ctx.font = '20px "PingFang SC", sans-serif';
  ctx.fillText(`${summary.combo}　共 ${summary.count} 顆`, canvas.width / 2, y);

  y += 32;
  ctx.fillStyle = '#8b8279';
  ctx.font = '16px "PingFang SC", sans-serif';
  ctx.fillText(
    `適用手圍 ${summary.wrist.toFixed(1)} cm${summary.wraps > 1 ? ` · ${summary.wraps}圈` : ''}`,
    canvas.width / 2,
    y,
  );

  y += 34;
  ctx.fillStyle = '#c9a3ae';
  ctx.font = '15px "PingFang SC", sans-serif';
  ctx.fillText('— 以珠造物 不逐俗同 —', canvas.width / 2, y);

  return canvas.toDataURL('image/png');
}

/** 將 dataURL 載入成 Image */
export function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = src;
  });
}

/** 下載圖片 */
export function downloadImage(dataUrl: string, filename: string) {
  const a = document.createElement('a');
  a.href = dataUrl;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
}
