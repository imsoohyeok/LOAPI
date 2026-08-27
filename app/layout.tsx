import type { Metadata } from "next";
import "./globals.css";
import Navbar from "@/components/Navbar";

export const metadata: Metadata = {
  title: "로스트아크 툴즈",
  description: "로스트아크 오픈 API를 활용한 캐릭터 비교·성장 트래커 도구 모음.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ko">
      <body className="bg-bg text-gray-100">
        <Navbar />
        {children}
      </body>
    </html>
  );
}
