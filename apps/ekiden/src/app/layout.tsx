import type { Metadata, Viewport } from "next";
import RegisterSW from "@/components/RegisterSW";
import "@/styles/globals.css";

export const metadata: Metadata = {
  title: "駅伝盛り上げ",
  description: "沿道からゼッケンをタップして選手の位置を共有するアプリ",
  manifest: "/manifest.webmanifest",
  appleWebApp: { capable: true, title: "駅伝", statusBarStyle: "default" },
};

export const viewport: Viewport = {
  themeColor: "#e11d48",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ja">
      <body>
        {children}
        <RegisterSW />
      </body>
    </html>
  );
}
