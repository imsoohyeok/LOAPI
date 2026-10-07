import Link from "next/link";
import TrackedCharacters from "@/components/TrackedCharacters";
import { FEATURES } from "@/lib/features";

export default function HomePage() {
  return (
    <div className="mx-auto max-w-3xl px-5 py-12">
      <section className="mb-12 motion-safe:animate-fade-slide-up">
        <h1 className="mb-3 font-display text-4xl tracking-wide text-gray-50 sm:text-5xl">
          로스트아크 툴즈
        </h1>
        <p className="max-w-xl text-sm leading-relaxed text-gray-400 sm:text-base">
          로스트아크 오픈 API로 캐릭터를 비교하고, 성장을 기록하고, 원정대를 한눈에
          확인해요.
        </p>
      </section>

      <section aria-labelledby="features-heading" className="mb-12">
        <h2
          id="features-heading"
          className="mb-4 text-xs font-bold uppercase tracking-widest text-gray-500"
        >
          기능
        </h2>
        <ul className="grid grid-cols-1 gap-3 sm:grid-cols-3">
          {FEATURES.map((feature) => (
            <li key={feature.href}>
              <Link
                href={feature.href}
                className="group flex h-full flex-col rounded-xl border border-border bg-surface p-5 transition hover:border-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
              >
                <span className="mb-2 flex items-center justify-between font-semibold text-gray-100">
                  {feature.label}
                  <span
                    aria-hidden
                    className="text-gray-600 transition group-hover:translate-x-0.5 group-hover:text-accent"
                  >
                    →
                  </span>
                </span>
                <span className="text-sm leading-relaxed text-gray-400">
                  {feature.description}
                </span>
              </Link>
            </li>
          ))}
        </ul>
      </section>

      <section aria-labelledby="tracked-heading">
        <h2
          id="tracked-heading"
          className="mb-4 text-xs font-bold uppercase tracking-widest text-gray-500"
        >
          최근 기록한 캐릭터
        </h2>
        <TrackedCharacters />
        <p className="mt-2 text-xs text-gray-600">
          성장 트래커 기록은 이 브라우저에만 저장돼요.
        </p>
      </section>
    </div>
  );
}
