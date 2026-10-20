'use client';

import dynamic from 'next/dynamic';
import { AnimatePresence, motion } from 'framer-motion';
import { ChevronLeft, ChevronRight, Trash2 } from 'lucide-react';
import BrandWatermark from '@/components/BrandWatermark';
import { useStudioStore } from '@/store/useStudioStore';

const CrystalCanvas = dynamic(() => import('@/components/CrystalCanvas'), {
  ssr: false,
  loading: () => (
    <div className="flex h-full w-full items-center justify-center">
      <div className="h-6 w-6 animate-spin rounded-full border-2 border-[#f0d7de] border-t-[#e79bb0]" />
    </div>
  ),
});

/** 3D 預覽舞台：純白畫布 + 品牌浮水印 + 選中工具列 */
export default function StudioStage() {
  const selectedBeadId = useStudioStore((s) => s.selectedBeadId);
  const beads = useStudioStore((s) => s.beads);
  const removeBead = useStudioStore((s) => s.removeBead);
  const moveBead = useStudioStore((s) => s.moveBead);
  const selectBead = useStudioStore((s) => s.selectBead);

  const selected = beads.find((b) => b.id === selectedBeadId) ?? null;

  return (
    <div className="relative h-[42%] w-full shrink-0 bg-white">
      {/* 3D 畫布 */}
      <div id="stage-canvas" className="absolute inset-0">
        <CrystalCanvas />
      </div>

      {/* 中央品牌浮水印 */}
      <BrandWatermark />

      {/* 選中珠子的浮動工具列 */}
      <AnimatePresence>
        {selected && (
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 12 }}
            transition={{ duration: 0.2 }}
            className="absolute bottom-3 left-1/2 z-30 -translate-x-1/2"
          >
            <div className="flex items-center gap-1 rounded-full bg-[#2f2b28]/92 px-1.5 py-1.5 shadow-[0_6px_24px_rgba(0,0,0,0.25)] backdrop-blur">
              <span className="max-w-[92px] truncate px-2 text-[11px] text-white/85">
                {selected.name}
              </span>
              <button
                type="button"
                onClick={() => moveBead(selected.id, -1)}
                title="前移"
                className="flex h-7 w-7 items-center justify-center rounded-full text-white/80 active:bg-white/15"
              >
                <ChevronLeft className="h-4 w-4" />
              </button>
              <button
                type="button"
                onClick={() => moveBead(selected.id, 1)}
                title="後移"
                className="flex h-7 w-7 items-center justify-center rounded-full text-white/80 active:bg-white/15"
              >
                <ChevronRight className="h-4 w-4" />
              </button>
              <button
                type="button"
                onClick={() => removeBead(selected.id)}
                title="移除此珠"
                className="flex h-7 w-7 items-center justify-center rounded-full bg-[#e07a8c] text-white active:bg-[#c96478]"
              >
                <Trash2 className="h-3.5 w-3.5" />
              </button>
              <button
                type="button"
                onClick={() => selectBead(null)}
                className="px-2 text-[11px] text-white/50"
              >
                取消
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
