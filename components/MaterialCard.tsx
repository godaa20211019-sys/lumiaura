'use client';

import { useRef, useState } from 'react';
import { type Material } from '@/lib/materials';
import { useStudioStore } from '@/store/useStudioStore';

/** 卡片上的擬真珠子預覽（純 CSS 渲染） */
export function MaterialPreview({ material, size = 56 }: { material: Material; size?: number }) {
  const isCatEye = material.texture === 'cat-eye-pink' || material.texture === 'cat-eye-blue';
  const isWood = material.texture === 'wood-rosewood' || material.texture === 'wood-ebony';
  const isDark = material.texture === 'silver-sand' || material.texture === 'obsidian';

  return (
    <span
      className="relative block shrink-0 rounded-full"
      style={{ width: size, height: size }}
    >
      {/* 珠體 */}
      <span
        className="absolute inset-0 rounded-full"
        style={{
          background: isWood
            ? `repeating-linear-gradient(38deg, ${material.color} 0 3px, ${material.inner} 3px 6px)`
            : `radial-gradient(circle at 34% 28%, #ffffff 0%, ${material.accent} 18%, ${material.color} 58%, ${material.inner} 100%)`,
          boxShadow: isDark
            ? `0 2px 10px rgba(0,0,0,0.35), inset 0 0 ${size * 0.3}px rgba(255,255,255,0.35)`
            : `0 2px 10px ${material.accent}55, inset 0 0 ${size * 0.28}px rgba(255,255,255,0.45)`,
        }}
      />
      {/* 貓眼光帶 */}
      {isCatEye && (
        <span
          className="absolute inset-0 overflow-hidden rounded-full"
          style={{ transform: 'rotate(-18deg)' }}
        >
          <span
            className="absolute top-1/2 left-[-20%] h-[18%] w-[140%] -translate-y-1/2"
            style={{
              background:
                'linear-gradient(90deg, rgba(255,255,255,0) 0%, rgba(255,255,255,0.75) 45%, rgba(255,255,255,0.95) 52%, rgba(255,255,255,0.6) 60%, rgba(255,255,255,0) 100%)',
              filter: 'blur(1.5px)',
            }}
          />
        </span>
      )}
      {/* 高光 */}
      <span
        className="absolute rounded-full"
        style={{
          width: size * 0.28,
          height: size * 0.18,
          left: size * 0.18,
          top: size * 0.14,
          background: 'radial-gradient(circle, rgba(255,255,255,0.95) 0%, rgba(255,255,255,0) 70%)',
        }}
      />
    </span>
  );
}

export default function MaterialCard({ material }: { material: Material }) {
  const addBead = useStudioStore((s) => s.addBead);
  const openSheet = useStudioStore((s) => s.openSheet);
  const [size, setSize] = useState(material.sizes[Math.min(1, material.sizes.length - 1)]);
  const timer = useRef<number | null>(null);

  // 長按：查看材質寓意與功效
  const startPress = () => {
    timer.current = window.setTimeout(() => {
      openSheet('meaning', material);
    }, 550);
  };
  const cancelPress = () => {
    if (timer.current) {
      window.clearTimeout(timer.current);
      timer.current = null;
    }
  };

  const handleClick = () => {
    cancelPress();
    addBead(material.id, size);
  };

  return (
    <button
      type="button"
      onClick={handleClick}
      onPointerDown={startPress}
      onPointerUp={cancelPress}
      onPointerLeave={cancelPress}
      onContextMenu={(e) => e.preventDefault()}
      className="group relative flex flex-col items-center gap-1.5 rounded-2xl bg-white px-1.5 py-3 shadow-[0_2px_10px_rgba(0,0,0,0.04)] transition-transform active:scale-95"
    >
      <div className="relative">
        <MaterialPreview material={material} />
        {/* 庫存不足遮罩 */}
        {material.stock === false && (
          <div className="absolute inset-0 flex items-center justify-center rounded-full bg-white/70">
            <span className="rotate-[-12deg] text-[10px] font-medium text-[#9b9188]">
              暫缺
            </span>
          </div>
        )}
      </div>

      <div className="w-full truncate text-center text-[11px] leading-tight text-[#3c3a38]">
        {material.name}
      </div>
      <div className="text-[10px] text-[#a9a096] tabular-nums">
        {size.toFixed(2)}mm
      </div>

      {/* 尺寸快選 */}
      <div className="flex gap-1">
        {material.sizes.map((s) => (
          <span
            key={s}
            onClick={(e) => {
              e.stopPropagation();
              setSize(s);
            }}
            className={`rounded px-1 text-[9px] tabular-nums ${
              s === size ? 'bg-[#f6d7df] text-[#c25f7d]' : 'bg-[#f4f2ef] text-[#a9a096]'
            }`}
          >
            {s}
          </span>
        ))}
      </div>
    </button>
  );
}
