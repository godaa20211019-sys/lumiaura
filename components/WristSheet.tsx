'use client';

import { AnimatePresence, motion } from 'framer-motion';
import { Check, X } from 'lucide-react';
import { useStudioStore } from '@/store/useStudioStore';

const WRIST_SIZES = [13, 14, 15, 16, 17, 18, 19, 20];

/** 依身高體重估算手圍（業界常用經驗公式） */
export function estimateWrist(heightCm: number, weightKg: number): number {
  // 以身高體重推估手腕周長（165cm / 52kg ≈ 16.6cm）
  const raw = (heightCm - 150) * 0.06 + (weightKg - 50) * 0.08 + 15.5;
  return Math.min(20, Math.max(13, Math.round(raw * 10) / 10));
}

/** 底部彈窗容器 */
export function Sheet({
  open,
  onClose,
  title,
  children,
}: {
  open: boolean;
  onClose: () => void;
  title?: string;
  children: React.ReactNode;
}) {
  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 z-40 bg-black/35"
          />
          <motion.div
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', stiffness: 320, damping: 34 }}
            className="absolute inset-x-0 bottom-0 z-50 max-h-[82%] overflow-y-auto rounded-t-3xl bg-white pb-6"
          >
            <div className="sticky top-0 z-10 flex items-center justify-between bg-white/95 px-4 pt-4 pb-2 backdrop-blur">
              <span className="h-1 w-9 rounded-full bg-[#e6e1dc]" />
              {title && <h3 className="text-[14px] font-medium text-[#2f2b28]">{title}</h3>}
              <button
                type="button"
                onClick={onClose}
                aria-label="關閉"
                className="ml-auto flex h-7 w-7 items-center justify-center rounded-full bg-[#f4f2ef] text-[#8b8279]"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            </div>
            {children}
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

/** 定制手圍底部彈窗 */
export function WristSheet() {
  const sheet = useStudioStore((s) => s.sheet);
  const closeSheet = useStudioStore((s) => s.closeSheet);
  const targetWrist = useStudioStore((s) => s.targetWrist);
  const setTargetWrist = useStudioStore((s) => s.setTargetWrist);
  const height = useStudioStore((s) => s.height);
  const weight = useStudioStore((s) => s.weight);
  const setHeight = useStudioStore((s) => s.setHeight);
  const setWeight = useStudioStore((s) => s.setWeight);

  const open = sheet === 'wrist';
  const suggested = estimateWrist(height, weight);

  return (
    <Sheet open={open} onClose={closeSheet} title="定制手圍">
      <div className="flex flex-col gap-4 px-4">
        {/* 身高體重換算 */}
        <section className="rounded-2xl bg-[#F7F8FA] p-3">
          <div className="mb-2 flex items-center justify-between">
            <span className="text-[12px] text-[#5d5750]">身高體重估算</span>
            <span className="rounded-full bg-[#f6d7df] px-2 py-0.5 text-[10px] text-[#c25f7d]">
              約 {suggested.toFixed(1)} cm
            </span>
          </div>

          <label className="mt-2 block">
            <span className="flex justify-between text-[11px] text-[#8b8279]">
              <span>身高</span>
              <span className="tabular-nums">{height} cm</span>
            </span>
            <input
              type="range"
              min={140}
              max={200}
              step={1}
              value={height}
              onChange={(e) => setHeight(Number(e.target.value))}
              className="mt-1 w-full accent-[#e79bb0]"
            />
          </label>

          <label className="mt-2 block">
            <span className="flex justify-between text-[11px] text-[#8b8279]">
              <span>體重</span>
              <span className="tabular-nums">{weight} kg</span>
            </span>
            <input
              type="range"
              min={35}
              max={100}
              step={1}
              value={weight}
              onChange={(e) => setWeight(Number(e.target.value))}
              className="mt-1 w-full accent-[#e79bb0]"
            />
          </label>

          <button
            type="button"
            onClick={() => setTargetWrist(suggested)}
            className="mt-2 w-full rounded-full bg-white py-1.5 text-[11px] text-[#c25f7d] shadow-[0_1px_6px_rgba(0,0,0,0.05)]"
          >
            套用估算值
          </button>
        </section>

        {/* 常用尺寸 */}
        <section>
          <h4 className="mb-2 text-[12px] text-[#5d5750]">常用手腕尺寸</h4>
          <div className="grid grid-cols-4 gap-2">
            {WRIST_SIZES.map((w) => {
              const active = Math.abs(targetWrist - w) < 0.05;
              return (
                <button
                  key={w}
                  type="button"
                  onClick={() => setTargetWrist(w)}
                  className={`relative rounded-xl py-2.5 text-[12px] tabular-nums transition-colors ${
                    active
                      ? 'bg-[#f6d7df] font-medium text-[#c25f7d]'
                      : 'bg-[#F7F8FA] text-[#6b6259]'
                  }`}
                >
                  {w}
                  <span className="ml-0.5 text-[9px]">cm</span>
                  {active && (
                    <Check className="absolute top-1 right-1 h-3 w-3 text-[#c25f7d]" />
                  )}
                </button>
              );
            })}
          </div>
        </section>

        <button
          type="button"
          onClick={closeSheet}
          className="mt-1 w-full rounded-full bg-[#2f2b28] py-3 text-[13px] font-medium text-white active:opacity-90"
        >
          確認設置
        </button>
        <p className="pb-1 text-center text-[10px] text-[#b3aaa1]">
          當前手圍 {targetWrist.toFixed(1)} cm
        </p>
      </div>
    </Sheet>
  );
}
