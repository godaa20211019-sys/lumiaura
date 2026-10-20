'use client';

import { Ruler, Rotate3d } from 'lucide-react';
import { useStudioStore } from '@/store/useStudioStore';

export default function StudioHeader() {
  const openSheet = useStudioStore((s) => s.openSheet);
  const viewMode = useStudioStore((s) => s.viewMode);
  const setViewMode = useStudioStore((s) => s.setViewMode);

  return (
    <header className="relative z-20 grid shrink-0 grid-cols-[1fr_auto_1fr] items-center bg-white px-3 py-2.5">
      {/* 左側：手圍設置 */}
      <div className="flex items-center justify-start">
        <button
          type="button"
          onClick={() => openSheet('wrist')}
          className="flex items-center gap-1 rounded-full bg-[#f7f4f1] px-2.5 py-1.5 text-[11px] text-[#6b6259] transition-colors active:bg-[#efe9e3]"
        >
          <Ruler className="h-3 w-3" />
          手圍設置
        </button>
      </div>

      {/* 中間：品牌（精準置中） */}
      <h1 className="px-2 text-[17px] leading-none font-semibold tracking-[0.22em] text-[#2f2b28]">
        靈曜閣
      </h1>

      {/* 右側：3D / 俯視視角切換 */}
      <div className="flex items-center justify-end">
        <button
          type="button"
          onClick={() => setViewMode(viewMode === 'top' ? 'angle' : 'top')}
          title={viewMode === 'top' ? '切換 3D 視角' : '切換俯視角'}
          className={`flex h-7 w-7 items-center justify-center rounded-full border transition-colors ${
            viewMode === 'angle'
              ? 'border-[#f0c0cd] bg-[#fdeff3] text-[#d4708c]'
              : 'border-[#e6e1dc] bg-white text-[#8b8279]'
          }`}
        >
          <Rotate3d className="h-3.5 w-3.5" />
        </button>
      </div>
    </header>
  );
}
