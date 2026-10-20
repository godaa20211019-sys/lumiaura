'use client';

import { useMemo, useState } from 'react';
import { Search, X, Gem, Heart } from 'lucide-react';
import {
  CATEGORY_LABEL,
  MATERIALS,
  SUBCATEGORIES,
  type MaterialCategory,
} from '@/lib/materials';
import { useStudioStore } from '@/store/useStudioStore';
import MaterialCard from '@/components/MaterialCard';

const TABS: MaterialCategory[] = ['bead', 'accessory', 'pendant', 'wood'];

export default function MaterialPanel() {
  const category = useStudioStore((s) => s.category);
  const setCategory = useStudioStore((s) => s.setCategory);
  const sub = useStudioStore((s) => s.sub);
  const setSub = useStudioStore((s) => s.setSub);
  const keyword = useStudioStore((s) => s.keyword);
  const setKeyword = useStudioStore((s) => s.setKeyword);
  const showTip = useStudioStore((s) => s.showTip);
  const hideTip = useStudioStore((s) => s.hideTip);
  const clearAll = useStudioStore((s) => s.clearAll);
  const openSheet = useStudioStore((s) => s.openSheet);
  const [searchOpen, setSearchOpen] = useState(false);

  const list = useMemo(() => {
    return MATERIALS.filter((m) => {
      if (m.category !== category) return false;
      if (sub !== '全部' && m.sub !== sub) return false;
      if (keyword && !m.name.includes(keyword) && !m.sub.includes(keyword)) return false;
      return true;
    });
  }, [category, sub, keyword]);

  const subs = SUBCATEGORIES[category];

  return (
    <div className="flex min-h-0 flex-1 flex-col bg-[#F7F8FA] rounded-t-3xl">
      {/* A. 主分類列 */}
      <div className="flex shrink-0 items-center justify-between px-3 pt-2.5 pb-1.5">
        {/* 復古綠金珠寶盒：清空重來 */}
        <button
          type="button"
          onClick={clearAll}
          title="清空重來"
          className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-[#d9c48f] to-[#7d8f6d] text-white shadow-sm active:scale-95"
        >
          <Gem className="h-4 w-4" />
        </button>

        {/* 膠囊 Tabs */}
        <div className="flex flex-1 justify-center gap-1 rounded-full bg-white px-1 py-1 shadow-[0_1px_6px_rgba(0,0,0,0.05)]">
          {TABS.map((t) => {
            const active = category === t;
            return (
              <button
                key={t}
                type="button"
                onClick={() => setCategory(t)}
                className={`rounded-full px-3 py-1 text-[12px] transition-colors ${
                  active
                    ? 'bg-[#f6d7df] font-medium text-[#c25f7d]'
                    : 'text-[#8b8279] active:bg-[#f4f1ee]'
                }`}
              >
                {CATEGORY_LABEL[t]}
              </button>
            );
          })}
        </div>

        {/* 可愛小精靈分享徽章 */}
        <button
          type="button"
          onClick={() => openSheet('share')}
          className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-white shadow-[0_1px_6px_rgba(0,0,0,0.05)] active:scale-95"
          title="分享同款"
        >
          <Heart className="h-3.5 w-3.5 fill-[#f3c2ce] text-[#e59bb0]" />
        </button>
      </div>

      {/* B. 搜尋與提示橫幅 */}
      <div className="flex shrink-0 items-center gap-2 px-3 pb-2">
        {searchOpen ? (
          <div className="flex flex-1 items-center gap-1.5 rounded-full bg-white px-2.5 py-1.5 shadow-[0_1px_6px_rgba(0,0,0,0.05)]">
            <Search className="h-3.5 w-3.5 text-[#b3aaa1]" />
            <input
              autoFocus
              value={keyword}
              onChange={(e) => setKeyword(e.target.value)}
              placeholder="搜尋材質"
              className="flex-1 bg-transparent text-[12px] text-[#3c3a38] outline-none placeholder:text-[#c2bab2]"
            />
            <button type="button" onClick={() => { setKeyword(''); setSearchOpen(false); }}>
              <X className="h-3.5 w-3.5 text-[#b3aaa1]" />
            </button>
          </div>
        ) : (
          <button
            type="button"
            onClick={() => setSearchOpen(true)}
            className="flex h-7 w-7 items-center justify-center rounded-full bg-white text-[#9b9188] shadow-[0_1px_6px_rgba(0,0,0,0.05)]"
          >
            <Search className="h-3.5 w-3.5" />
          </button>
        )}

        {showTip && (
          <div className="flex flex-1 items-center justify-between gap-2 rounded-full bg-[#FDF8EA] px-3 py-1.5 text-[11px] text-[#8C7A5B]">
            <span className="truncate">長按材料可查看詳情</span>
            <button type="button" onClick={hideTip} className="shrink-0 text-[#b3a88f]">
              <X className="h-3 w-3" />
            </button>
          </div>
        )}
      </div>

      {/* C. 左側子分類 + 右側網格 */}
      <div className="flex min-h-0 flex-1">
        {/* 左側垂直子分類 */}
        <div className="scrollbar-thin w-[68px] shrink-0 overflow-y-auto pb-3">
          {subs.map((s) => {
            const active = sub === s;
            return (
              <button
                key={s}
                type="button"
                onClick={() => setSub(s)}
                className={`relative block w-full py-2 text-[12px] transition-colors ${
                  active ? 'font-medium text-[#c25f7d]' : 'text-[#8b8279]'
                }`}
              >
                {active && (
                  <span className="absolute top-1/2 left-1 h-3.5 w-[3px] -translate-y-1/2 rounded-full bg-[#e79bb0]" />
                )}
                {s}
              </button>
            );
          })}
        </div>

        {/* 右側三欄網格 */}
        <div className="scrollbar-thin min-h-0 flex-1 overflow-y-auto px-2 pb-4">
          <div className="grid grid-cols-3 gap-2">
            {list.map((m) => (
              <MaterialCard key={m.id} material={m} />
            ))}
          </div>
          {list.length === 0 && (
            <p className="py-10 text-center text-[12px] text-[#a9a096]">沒有符合的材質</p>
          )}
        </div>
      </div>
    </div>
  );
}
