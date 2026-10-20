'use client';

import { MaterialPreview } from '@/components/MaterialCard';
import { Sheet } from '@/components/WristSheet';
import { useStudioStore } from '@/store/useStudioStore';

/** 材質寓意與功效詳情 */
export function MeaningSheet() {
  const sheet = useStudioStore((s) => s.sheet);
  const closeSheet = useStudioStore((s) => s.closeSheet);
  const material = useStudioStore((s) => s.meaningMaterial);

  return (
    <Sheet open={sheet === 'meaning' && !!material} onClose={closeSheet}>
      {material && (
        <div className="flex flex-col items-center gap-3 px-5 pb-2">
          <MaterialPreview material={material} size={88} />
          <div className="text-center">
            <h3 className="text-[15px] font-medium text-[#2f2b28]">{material.name}</h3>
            <p className="mt-0.5 text-[11px] text-[#a9a096]">
              {material.sizes.map((s) => `${s}mm`).join(' · ')}
            </p>
          </div>
          <div className="w-full rounded-2xl bg-[#F7F8FA] p-3.5">
            <h4 className="mb-1.5 text-[12px] font-medium text-[#5d5750]">材質寓意與功效</h4>
            <p className="text-[12px] leading-relaxed text-[#8b8279]">{material.meaning}</p>
          </div>
          <div className="w-full rounded-2xl border border-[#f0e2e6] bg-[#fdf6f8] p-3.5">
            <h4 className="mb-1.5 text-[12px] font-medium text-[#c25f7d]">佩戴小提醒</h4>
            <p className="text-[11px] leading-relaxed text-[#a98a95]">
              天然礦物每顆色澤與紋理皆不相同，商品照片僅供參考，實際以收到的手串為準。
            </p>
          </div>
        </div>
      )}
    </Sheet>
  );
}

/** 已選珠序列明細（可單顆刪除） */
export function DetailSheet() {
  const sheet = useStudioStore((s) => s.sheet);
  const closeSheet = useStudioStore((s) => s.closeSheet);
  const beads = useStudioStore((s) => s.beads);
  const pendant = useStudioStore((s) => s.pendant);
  const removeBead = useStudioStore((s) => s.removeBead);
  const clearPendant = useStudioStore((s) => s.clearPendant);

  return (
    <Sheet open={sheet === 'detail'} onClose={closeSheet} title="已選珠序列">
      <div className="flex flex-col gap-4 px-4">
        <section>
          <h4 className="mb-2 text-[12px] text-[#5d5750]">
            主珠（{beads.length} 顆）
          </h4>
          <div className="scrollbar-thin flex max-h-[38vh] flex-wrap gap-1.5 overflow-y-auto">
            {beads.map((b, i) => (
              <button
                key={b.id}
                type="button"
                onClick={() => removeBead(b.id)}
                title={`${b.name} ${b.size}mm（點擊移除）`}
                className="flex w-[74px] flex-col items-center gap-0.5 rounded-xl bg-[#F7F8FA] py-1.5 active:bg-[#f6d7df]"
              >
                <span className="text-[8px] text-[#b3aaa1] tabular-nums">{i + 1}</span>
                <span
                  className="block h-4 w-4 rounded-full"
                  style={{
                    background: `radial-gradient(circle at 34% 28%, #ffffff 0%, ${b.accent} 18%, ${b.color} 58%, ${b.inner} 100%)`,
                  }}
                />
                <span className="max-w-full truncate text-[9px] text-[#8b8279]">{b.name}</span>
                <span className="text-[8px] text-[#b3aaa1] tabular-nums">{b.size}mm</span>
              </button>
            ))}
            {beads.length === 0 && (
              <p className="py-6 text-center text-[12px] text-[#a9a096]">尚未加入任何珠子</p>
            )}
          </div>
        </section>

        {pendant && (
          <section>
            <h4 className="mb-2 text-[12px] text-[#5d5750]">吊墜</h4>
            <button
              type="button"
              onClick={clearPendant}
              className="flex items-center gap-2 rounded-xl bg-[#F7F8FA] px-3 py-2 text-[12px] text-[#6b6259] active:bg-[#f6d7df]"
            >
              <span
                className="block h-5 w-5 rounded"
                style={{
                  background: `radial-gradient(circle at 34% 28%, #ffffff 0%, ${pendant.accent} 18%, ${pendant.color} 58%, ${pendant.inner} 100%)`,
                }}
              />
              {pendant.name} {pendant.size}mm
              <span className="ml-auto text-[10px] text-[#b3aaa1]">點擊移除</span>
            </button>
          </section>
        )}

        <button
          type="button"
          onClick={closeSheet}
          className="w-full rounded-full bg-[#2f2b28] py-3 text-[13px] font-medium text-white active:opacity-90"
        >
          完成
        </button>
      </div>
    </Sheet>
  );
}
