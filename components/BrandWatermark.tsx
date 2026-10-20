'use client';

/**
 * 品牌浮水印：置於 3D 畫布中央底層（pointer-events-none）。
 * 淡粉色手寫藝術感字體，營造「以珠造物 不逐俗同」的品牌氛圍。
 */
export default function BrandWatermark() {
  return (
    <div className="pointer-events-none absolute inset-0 z-10 flex flex-col items-center justify-center select-none">
      <div className="text-center">
        <div className="relative text-[34px] leading-none font-semibold tracking-[0.22em] text-[#f2c9d6]/70">
          靈曜閣
          <span className="absolute -top-1 -right-4 text-[13px] text-[#f2c9d6]/80">✦</span>
        </div>
        <div className="mt-2 text-[9px] tracking-[0.34em] text-[#e6bccb]/60 uppercase">
          — LUMIAURA —
        </div>
        <div className="mt-3 text-[11px] tracking-[0.26em] text-[#e8c3d1]/55">
          — 以珠造物 不逐俗同 —
        </div>
      </div>
    </div>
  );
}
