import Link from "next/link";

const TOOLS = [
  {
    href: "/compare",
    title: "캐릭터 비교",
    description: "두 캐릭터를 나란히 검색해서 아이템레벨과 장비를 비교해보세요.",
  },
  {
    href: "/tracker",
    title: "성장 트래커",
    description: "내 캐릭터의 아이템레벨 성장 추이를 기록하고 차트로 확인하세요.",
  },
];

export default function Home() {
  return (
    <div className="mx-auto max-w-3xl px-5 py-10">
      <h1 className="mb-2 text-2xl font-bold">로스트아크 툴즈</h1>
      <p className="mb-8 text-sm text-gray-400">
        로스트아크 오픈 API를 활용한 캐릭터 분석 도구 모음이에요.
      </p>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        {TOOLS.map((tool) => (
          <Link
            key={tool.href}
            href={tool.href}
            className="rounded-xl border border-border bg-surface p-6 transition hover:border-accent"
          >
            <h2 className="mb-2 text-lg font-semibold">{tool.title}</h2>
            <p className="text-sm text-gray-400">{tool.description}</p>
          </Link>
        ))}
      </div>
    </div>
  );
}
