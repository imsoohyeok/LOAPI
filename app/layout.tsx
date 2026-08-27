import type { Metadata } from "next";
import { Gothic_A1, Black_Han_Sans, JetBrains_Mono } from "next/font/google";
import "./globals.css";
import Navbar from "@/components/Navbar";

const gothicA1 = Gothic_A1({
  subsets: ["latin"],
  weight: ["400", "500", "700", "900"],
  variable: "--font-sans",
  display: "swap",
});

const blackHanSans = Black_Han_Sans({
  subsets: ["latin"],
  weight: "400",
  variable: "--font-display",
  display: "swap",
});

const jetBrainsMono = JetBrains_Mono({
  subsets: ["latin"],
  weight: ["400", "600", "700"],
  variable: "--font-mono",
  display: "swap",
});

export const metadata: Metadata = {
  title: "로스트아크 툴즈",
  description: "로스트아크 오픈 API를 활용한 캐릭터 비교·성장 트래커 도구 모음.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html
      lang="ko"
      className={`${gothicA1.variable} ${blackHanSans.variable} ${jetBrainsMono.variable}`}
    >
      <body className="bg-bg font-sans text-gray-100">
        <Navbar />
        {children}
      </body>
    </html>
  );
}
