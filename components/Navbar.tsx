"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { FEATURES } from "@/lib/features";

export default function Navbar() {
  const pathname = usePathname();

  return (
    <nav className="border-b border-border bg-surface">
      <div className="mx-auto flex max-w-3xl items-center gap-6 px-5 py-4">
        <Link href="/" className="font-bold">
          로스트아크 툴즈
        </Link>
        <div className="flex gap-4 text-sm">
          {FEATURES.map((item) => (
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
