'use client';

import { useState } from 'react';
import { ChevronDown, MessageCircle, Sparkles } from 'lucide-react';
import { useStudioStore, useSummary } from '@/store/useStudioStore';
import {
  buildShareText,
  buildWhatsAppLink,
  captureCanvas,
  type DesignSummary,
} from '@/lib/share';

export default function StudioBottomBar() {
  const summary = useSummary();
  const openSheet = useStudioStore((s) => s.openSheet);
  const [showToast, setShowToast] = useState(false);

  const design: DesignSummary = {
    combo: summary.groups.map((g) => g.name).join('+') || '尚未選珠',
    count: summary.count,
    materialCount: summary.materialCount,
    wrist: summary.targetWrist,
    wraps: summary.wraps,
    details: summary.groups,
  };

  const handleWhatsApp = () => {
    const canvas = document.querySelector('#stage-canvas canvas') as HTMLCanvasElement | null;
    const shot = captureCanvas(canvas);
    const text = buildShareText(design);
    const url = buildWhatsAppLink(text, shot);
    window.open(url, '_blank', 'noopener,noreferrer');
  };

  const handleIG = () => {
    const canvas = document.querySelector('#stage-canvas canvas') as HTMLCanvasElement | null;
    const shot = captureCanvas(canvas);
    openSheet('share');
    if (!shot) {
      setShowToast(true);
      window.setTimeout(() => setShowToast(false), 1800);
    }
  };

  return (
    <div className="relative z-20 flex h-16 shrink-0 items-center justify-between border-t border-gray-100 bg-white px-3">
      {/* 左側：總顆數黑圈 */}
      <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-[#2f2b28] text-white">
        <span className="text-[12px] leading-none font-semibold tabular-nums">
          {summary.count}
        </span>
        <span className="ml-0.5 text-[9px] leading-none text-white/70">顆</span>
      </div>

      {/* 中間：設計簡介 */}
      <button
        type="button"
        onClick={() => openSheet('detail')}
        className="mx-2 flex min-w-0 flex-1 flex-col items-start gap-0.5 text-left"
      >
        <span className="w-full truncate text-[12px] text-[#3c3a38]">
          當前設計 · {summary.materialCount}種材質
        </span>
        <span className="flex w-full items-center gap-1 text-[10px] text-[#a9a096]">
          適用手圍 {summary.targetWrist.toFixed(1)}cm
          {summary.wraps > 1 && ` · ${summary.wraps}圈`}
          <ChevronDown className="h-3 w-3 shrink-0" />
        </span>
      </button>

      {/* 右側：分享按鈕組 */}
      <div className="flex shrink-0 items-center gap-1.5">
        <button
          type="button"
          onClick={handleWhatsApp}
          className="flex items-center gap-1 rounded-full bg-[#25D366] px-3.5 py-2.5 text-xs font-medium text-white shadow-sm active:opacity-90"
        >
          <MessageCircle className="h-3.5 w-3.5" />
          WhatsApp
        </button>
        <button
          type="button"
          onClick={handleIG}
          className="flex items-center gap-1 rounded-full bg-gradient-to-r from-[#833AB4] via-[#FD1D1D] to-[#F77737] px-3.5 py-2.5 text-xs font-medium text-white shadow-sm active:opacity-90"
        >
          <Sparkles className="h-3.5 w-3.5" />
          IG
        </button>
      </div>

      {showToast && (
        <div className="absolute -top-10 left-1/2 -translate-x-1/2 rounded-full bg-[#2f2b28] px-3 py-1.5 text-[11px] text-white shadow-lg">
          截圖失敗，請稍後再試
        </div>
      )}
    </div>
  );
}
