'use client';

import dynamic from 'next/dynamic';
import { motion } from 'framer-motion';
import { Gem } from 'lucide-react';

// Canvas 依賴 WebGL / browser API，必須關閉 SSR
const CrystalCanvas = dynamic(() => import('@/components/CrystalCanvas'), {
  ssr: false,
  loading: () => (
    <div className="flex h-full w-full items-center justify-center">
      <div className="flex flex-col items-center gap-3 text-white/40">
        <span className="h-8 w-8 animate-spin rounded-full border-2 border-amber-200/25 border-t-amber-200" />
        <span className="text-[11px] tracking-[0.25em] uppercase">Loading Atelier</span>
      </div>
    </div>
  ),
});

// 依賴 Zustand 狀態的介面一律僅於客戶端掛載，杜絕 hydration 不一致
const CanvasOverlays = dynamic(() => import('@/components/CanvasOverlays'), {
  ssr: false,
  loading: () => null,
});

const ControlPanel = dynamic(() => import('@/components/ControlPanel'), {
  ssr: false,
  loading: () => (
    <div className="glass-panel h-64 animate-pulse rounded-3xl p-5" />
  ),
});

export default function Home() {
  return (
    <main className="relative min-h-screen w-full overflow-hidden">
      {/* 頂部品牌列 */}
      <header className="pointer-events-none absolute inset-x-0 top-0 z-30 flex items-center justify-between px-5 py-5 md:px-8">
        <motion.div
          initial={{ opacity: 0, y: -12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="pointer-events-auto flex items-center gap-2.5"
        >
          <span className="flex h-8 w-8 items-center justify-center rounded-full border border-amber-200/35 bg-amber-200/10">
            <Gem className="h-4 w-4 text-amber-200" />
          </span>
          <div className="leading-tight">
            <div className="text-[13px] font-semibold tracking-[0.3em] text-white/90 uppercase">
              Aurum
            </div>
            <div className="text-[9px] tracking-[0.25em] text-white/35 uppercase">
              Crystal Atelier
            </div>
          </div>
        </motion.div>
      </header>

      <div className="grid h-screen grid-rows-[minmax(340px,52vh)_1fr] lg:grid-cols-[1fr_420px] lg:grid-rows-1 xl:grid-cols-[1fr_460px]">
        {/* 3D 互動畫布 */}
        <section className="relative h-full w-full overflow-hidden">
          <div className="absolute inset-0">
            <CrystalCanvas />
          </div>
          <CanvasOverlays />
        </section>

        {/* 右側控制面板：嚴格三段式固定佈局 */}
        <aside className="relative z-20 flex h-full min-h-0 flex-col px-4 pt-16 pb-4 lg:px-5 lg:pt-20 lg:pb-5">
          <ControlPanel />
          <p className="mt-2 shrink-0 px-1 text-center text-[9px] leading-relaxed text-white/25">
            拖曳手串可 360° 旋轉 · 滾輪縮放 · 點擊珠子可選取、替換或移除
          </p>
        </aside>
      </div>
    </main>
  );
}
