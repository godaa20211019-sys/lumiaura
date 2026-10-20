# Aurum Atelier — 360° 3D 水晶手串客製化配置器

以 **Next.js 16 (App Router) + TypeScript + Three.js / React Three Fiber** 打造的輕奢珠寶 3D 配置器。
所有水晶皆使用 **Three.js 原生幾何體**（`SphereGeometry` / `TorusGeometry`）+ `MeshPhysicalMaterial`
（transmission / ior / clearcoat / attenuation）與程序化環境光（`Environment` + `Lightformer`）還原折射與金屬光澤，
**不需要任何外部 .glb 模型檔，也不需要下載 HDRI**。

---

## 快速開始

```bash
cd ~/crystal-bracelet-configurator
npm install          # 若尚未安裝
npm run dev          # http://localhost:3000
```

其他指令：

```bash
npm run build        # 正式建置（已驗證通過）
npm run start        # 啟動正式版本
npm run lint         # ESLint
npx tsc --noEmit     # 型別檢查
```

> **需求**：Node.js 20+（本機驗證於 Node 26 / npm 11）。
> R3F 9 需要 React 19，Next.js 16 已內建 React 19.3，無需額外設定。

---

## 功能總覽

| 區塊 | 說明 |
| --- | --- |
| 左上資訊欄 | 即時顯示實際內周長 vs 目標手圍、珠數、預估重量（依密度計算） |
| 右側面板 | 三段式固定佈局：手圍設定（固定）／水晶挑選（獨立捲動）／已選珠序列＋結帳（固定底部） |
| 3D 畫布 | 360° 拖曳旋轉、滾輪縮放、禁用平移、閒置自動慢速自轉、程序化攝影棚背景 + 反射環境光 + 接觸陰影 |
| 3D 互動 | Hover 放大 + 游標改變；點擊珠子選中（金色光環 + 浮起 + 柔光），可於 UI 替換尺寸 / 移除 |
| 手圍滑桿 | 13–19 cm 即時調整，自動求解符合手圍的珠子數量與圓環半徑 |
| 水晶挑選 | 12 款水晶（透體 / 濃色 / 金屬隔珠），分類標籤、尺寸選擇、單價、加入手串、一鍵自動排滿 |
| 已選珠序列 | 橫向捲動檢視順序，點擊選取 / 移除，支援「鏡像對稱排列」、一鍵清空 |
| 結帳欄 | 總價、功效標籤匯總、加入購物車 / 立即結帳 → 設計明細 Modal（分材質小計、Esc 關閉） |

---

## 程序化礦石紋理（`lib/textures.ts`）

每種水晶都有專屬的 `CanvasTexture`（依 `crystalId` 快取，共用一份 GPU 資源），
作為 `map` + `bumpMap` 貼在球體上，消除「純色塑膠球」感：

| 水晶 | 紋理 | 材質重點 |
| --- | --- | --- |
| 虎眼石 | 深棕／金黃經向條紋 + 中央明亮貓眼帶 + 絲絲纖維 | `sheen 0.7`、`sheenColor #ffd700`、`sheenRoughness 0.2` |
| 月光石 | 純白基底 + 淡藍暈彩光斑 + 絹絲紋 | `iridescence 0.8`、`iridescenceIOR 1.3`、`sheen 0.8`、`sheenColor #60a5fa` |
| 透體水晶（白／紫／粉／黃／海藍） | 細微冰裂 + 雲霧雜訊 | `transmission 0.95`、`ior 1.54`、`thickness 2.5`、`roughness 0.05` |
| 黑曜石／青金石／金／銀 | 斑點雜質 + 雲霧深淺 | 貼圖自帶本色時材質 `color` 設白避免二次相乘變暗 |

此外每顆珠子會依 `序號 + 水晶 id` 產生**固定種子的隨機初始旋轉**，
讓每顆珠子的紋理方向與貓眼位置都不盡相同。

## 打光

主光源完全交給 `<Environment>` 內的**大面積 Lightformer 柔光箱**（頂部 16×16、左右 12×8、正面補光、環形光），
不使用會造成死白圓點的 PointLight，換來珠寶攝影棚般的柔和弧形高光。

## 環形排列演算法（`lib/layout.ts`）

這是本專案的核心：**珠子永遠緊密相切排列，不因目標手圍而留下空隙**。

1. 依每顆珠子**自身半徑**求出相鄰兩珠相切時的圓心角
   `θᵢ = 2 · asin((rᵢ + rᵢ₊₁) / 2R)`，大珠自然佔據較大弧度，小珠不會被擠壓。
2. 以**二分法**求解 `Σθ = 2π` 的最小相切半徑 `R`（`solveTangentRadius`），
   其中 `θᵢ = 2 · asin((rᵢ + rᵢ₊₁) / 2R)`，並以 `θᵢ` 累加每顆珠子的角度。
   實測相鄰珠中心弦長與半徑和的誤差為 `0.000000 mm`，首尾同樣精準相切、絕不穿模。
   另加一道**安全驗算**：若因數值誤差導致任一對（含最後一顆 ↔ 第一顆）弦長不足，
   便自動放大 `R` 重算（弦長隨 `R` 單調增加，必定收斂）。
   渲染時球體再乘上 `0.995` 的幾何比例，留出髮絲般的視覺間隙。
3. 佩戴內周長 = 珠子**內表面**圓的周長 `2π(R − r̄)`（`r̄` 為平均珠半徑），
   這才是手腕實際接觸到的尺寸。例：8mm 珠 23 顆 → 內周長 15.94cm。
4. 目標手圍僅作為**建議依據**：若珠數不足，InfoBar 會提示「比目標手圍小 X cm，可再加入珠子」；
   `自動排滿` 會連同隔珠一起試算主珠數量，取內周長最接近目標的組合。
5. 每顆珠子再疊加微量高度起伏（`sin(i·2.399963)`）模擬自然串珠的交錯層次。

中央彈力線以 `<torusGeometry args={[R, cordRadius, 12, 160]} />` 動態生成，穿過所有珠子中心；
金屬隔珠的孔洞軸向以 `rotation.y = -angle` 對齊圓周切線，彈力線會精準由孔洞穿過。

---

## 檔案結構

```
app/
  layout.tsx            # 根 layout（Geist 字體、metadata、lang=zh-Hant）
  page.tsx              # 主頁：'use client'，Canvas / 覆蓋層 / 控制面板皆以 dynamic + ssr:false 載入
  globals.css           # Tailwind v4 主題、毛玻璃面板、滑桿與捲軸樣式
components/
  CrystalCanvas.tsx     # <Canvas>、OrbitControls、Environment+Lightformer、ContactShadows、CameraRig
  BraceletScene.tsx     # 珠子 Mesh（MeshPhysicalMaterial + 程序化紋理）、選中指示、彈力線、自動旋轉
  CanvasOverlays.tsx    # 3D 畫布浮層（InfoBar + ViewControls），client-only
  ControlPanel.tsx      # 右側控制面板（三段式固定佈局），client-only
  InfoBar.tsx           # 左上資料卡（內周長 / 珠數 / 預估重量）
  ViewControls.tsx      # 底部快捷視角（俯視 / 側視 / 重置 / 自轉）
  SizeSlider.tsx        # 目標手圍滑桿
  CrystalPicker.tsx     # 分類標籤 + 水晶卡片
  BeadTray.tsx          # 已選珠序列 + 選取面板（隔珠以扁平環狀圖示區隔）
  CheckoutBar.tsx       # 總價 / 功效標籤 / 結帳 + 設計明細 Modal
lib/
  crystals.ts           # 12 款水晶資料庫（materialProps、功效、密度、分類）
  layout.ts             # 環形排列演算法、重量估算、珠數求解
  textures.ts           # 程序化礦石紋理（Canvas Texture）與固定種子亂數
store/
  useBraceletStore.ts   # Zustand store（珠子陣列、手圍、選中、視角、分類、Modal）
```

---

## 技術重點

- **無 SSR 問題**：`CrystalCanvas`、`CanvasOverlays`、`ControlPanel` 皆以 `next/dynamic({ ssr:false })` 載入，
  避免 Zustand 狀態與伺服器 HTML 不一致造成 hydration 錯誤。
- **無外部資源**：環境光用 `<Environment resolution={256} frames={1}>` + 多個 `<Lightformer>` 程序化產生；
  背景用自製 `CanvasTexture` 漸層貼圖貼上大型內翻球，提供水晶折射時的「背景物」而不會變成灰黑死珠。
- **相容性注意**：`AnimatePresence mode="popLayout"` 在 React 19 + React Compiler 下會導致卡片停留在
  `opacity: 0`，本專案改用預設 `sync` 模式。
- **相機自適應**：`CameraRig` 會依手串半徑與畫布長寬比計算「剛好看得完」的攝影距離，切換視角時平滑過渡。

## 免責聲明

本專案為設計示範，水晶功效描述僅供參考，尚未串接金流 / 後端 API。
