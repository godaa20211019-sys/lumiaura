import type { Metadata, Viewport } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "靈曜閣 Lumiaura — 以珠造物 不逐俗同",
  description:
    "靈曜閣 Lumiaura：手機優先的 360° 3D 水晶手串 DIY 定制與分享工作室，設計完成後可一鍵產生美圖卡並分享到 WhatsApp 與 Instagram。",
  applicationName: "靈曜閣 Lumiaura",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  themeColor: "#ffffff",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="zh-Hant" className="h-full antialiased">
      <body className="min-h-full">{children}</body>
    </html>
  );
}
