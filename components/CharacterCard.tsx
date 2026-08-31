import type { Profile } from "@/lib/types";

export default function CharacterCard({ profile }: { profile: Profile }) {
  return (
    <div className="mb-5 rounded-xl border border-border bg-surface p-6">
      <div className="mb-3 flex items-start justify-between">
        <div>
          <h2 className="text-xl font-bold">{profile.CharacterName}</h2>
          <p className="text-sm text-gray-400">
            {profile.ServerName} · {profile.CharacterClassName}
          </p>
        </div>
        <span className="font-mono text-sm text-gray-500">
          Lv. {profile.ItemAvgLevel}
        </span>
      </div>

      {profile.CombatPower && (
        <div className="rounded-lg bg-bg/60 px-4 py-3">
          <p className="mb-0.5 text-[11px] font-bold uppercase tracking-widest text-gray-500">
            전투력
          </p>
          <p className="font-mono text-2xl font-bold text-gold">{profile.CombatPower}</p>
          <p className="mt-1 text-[11px] text-gray-600">
            로스트아크 API 캐시 특성상 실제 게임과 값이 다를 수 있어요.
          </p>
        </div>
      )}
    </div>
  );
}
