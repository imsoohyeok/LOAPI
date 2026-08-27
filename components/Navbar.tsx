"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const NAV_ITEMS = [
  { href: "/compare", label: "캐릭터 비교" },
  { href: "/tracker", label: "성장 트래커" },
  // 나중에 시세 트래커 추가 시 여기에 { href: "/market", label: "거래소 시세" } 추가
];

export default function Navbar() {
  const pathname = usePathname();

  return (
    <nav className="border-b border-border bg-surface">
      <div className="mx-auto flex max-w-3xl items-center gap-6 px-5 py-4">
        <Link href="/" className="font-bold">
          로스트아크 툴즈
        </Link>
        <div className="flex gap-4 text-sm">
          {NAV_ITEMS.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={
                pathname === item.href
                  ? "font-semibold text-accent"
                  : "text-gray-400 hover:text-gray-100"
              }
            >
              {item.label}
            </Link>
          ))}
        </div>
      </div>
    </nav>
  );
}
