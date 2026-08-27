import type { Profile } from "@/lib/types";

export default function CharacterCard({ profile }: { profile: Profile }) {
  return (
    <div className="mb-5 rounded-xl border border-border bg-surface p-6">
      <div className="mb-2 flex items-baseline justify-between">
        <h2 className="text-xl font-bold">{profile.CharacterName}</h2>
        <span className="font-bold text-gold">Lv. {profile.ItemAvgLevel}</span>
      </div>
      <p className="text-gray-400">
        {profile.ServerName} · {profile.CharacterClassName}
      </p>
    </div>
  );
}
