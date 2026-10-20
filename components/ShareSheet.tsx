'use client';

import { useEffect, useState } from 'react';
import { Copy, Download, Loader2 } from 'lucide-react';
import { Sheet } from '@/components/WristSheet';
import { useStudioStore, useSummary } from '@/store/useStudioStore';
import {
  buildDesignCard,
  buildDesignCode,
  captureCanvas,
  downloadImage,
  loadImage,
  type DesignSummary,
} from '@/lib/share';

export default function ShareSheet() {
  const sheet = useStudioStore((s) => s.sheet);
  const closeSheet = useStudioStore((s) => s.closeSheet);
  const summary = useSummary();
  const [cardUrl, setCardUrl] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [loading, setLoading] = useState(true);

  const design: DesignSummary = {
    combo: summary.groups.map((g) => g.name).join('+') || '尚未選珠',
    count: summary.count,
    materialCount: summary.materialCount,
    wrist: summary.targetWrist,
    wraps: summary.wraps,
    details: summary.groups,
  };

  useEffect(() => {
    if (sheet !== 'share') return;
    let cancelled = false;

    const generate = async () => {
      const canvas = document.querySelector('#stage-canvas canvas') as HTMLCanvasElement | null;
      const shot = captureCanvas(canvas);
      if (!shot) return;
      try {
        const img = await loadImage(shot);
        const url = buildDesignCard(img, design);
        if (!cancelled) setCardUrl(url);
      } catch {
        /* 忽略截圖失敗 */
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    void generate();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sheet]);

  const handleDownload = () => {
    if (!cardUrl) return;
    downloadImage(cardUrl, '靈曜閣-我的手串設計.png');
  };

  const handleCopy = async () => {
    const code = buildDesignCode(design);
    try {
      await navigator.clipboard.writeText(code);
    } catch {
      const ta = document.createElement('textarea');
      ta.value = code;
      document.body.appendChild(ta);
      ta.select();
      document.execCommand('copy');
      document.body.removeChild(ta);
    }
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1800);
  };

  return (
    <Sheet open={sheet === 'share'} onClose={closeSheet} title="IG 專屬美圖卡">
      <div className="flex flex-col items-center gap-3 px-4">
        <div className="relative w-full max-w-[320px] overflow-hidden rounded-2xl border border-[#f0e2e6] bg-[#FDF8FA] shadow-[0_6px_24px_rgba(0,0,0,0.08)]">
          {cardUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={cardUrl} alt="設計卡" className="w-full" />
          ) : (
            <div className="flex aspect-[2/3] items-center justify-center">
              {loading ? (
                <Loader2 className="h-6 w-6 animate-spin text-[#e79bb0]" />
              ) : (
                <span className="text-[12px] text-[#a9a096]">無法擷取 3D 畫面</span>
              )}
            </div>
          )}
        </div>

        <div className="w-full max-w-[320px] rounded-2xl bg-[#F7F8FA] p-3">
          <h4 className="mb-1.5 text-[12px] font-medium text-[#5d5750]">設計明細</h4>
          {design.details.length === 0 ? (
            <p className="text-[11px] text-[#a9a096]">尚未加入任何材質</p>
          ) : (
            <ul className="flex flex-col gap-1">
              {design.details.map((d) => (
                <li key={d.name} className="flex justify-between text-[11px] text-[#8b8279]">
                  <span>{d.name}</span>
                  <span className="tabular-nums">× {d.count}</span>
                </li>
              ))}
            </ul>
          )}
          <div className="mt-2 flex justify-between border-t border-[#e9e5e0] pt-2 text-[11px] text-[#a9a096]">
            <span>適用手圍</span>
            <span className="tabular-nums">
              {design.wrist.toFixed(1)} cm{design.wraps > 1 ? ` · ${design.wraps}圈` : ''}
            </span>
          </div>
        </div>

        <div className="flex w-full max-w-[320px] gap-2">
          <button
            type="button"
            onClick={handleDownload}
            disabled={!cardUrl}
            className="flex flex-1 items-center justify-center gap-1.5 rounded-full bg-gradient-to-r from-[#833AB4] via-[#FD1D1D] to-[#F77737] py-2.5 text-[12px] font-medium text-white disabled:opacity-40"
          >
            <Download className="h-3.5 w-3.5" />
            下載設計卡圖片
          </button>
          <button
            type="button"
            onClick={handleCopy}
            className="flex flex-1 items-center justify-center gap-1.5 rounded-full bg-[#2f2b28] py-2.5 text-[12px] font-medium text-white"
          >
            <Copy className="h-3.5 w-3.5" />
            {copied ? '已複製' : '複製設計口令'}
          </button>
        </div>

        <p className="pb-1 text-center text-[10px] text-[#b3aaa1]">
          設計口令：{buildDesignCode(design)}
        </p>
      </div>
    </Sheet>
  );
}
