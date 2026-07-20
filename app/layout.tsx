import type { Metadata } from "next";
import "./globals.css";
export const metadata: Metadata = { title: "PA 防火牆設定比較", description: "在瀏覽器內比較 Palo Alto 防火牆 XML 設定檔" };
export default function RootLayout({children}:{children:React.ReactNode}) { return <html lang="zh-Hant"><body>{children}</body></html>; }
