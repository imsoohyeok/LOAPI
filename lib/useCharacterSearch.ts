"use client";

import { useState } from "react";
import { CharacterDataSchema, type CharacterData } from "@/lib/types";

interface UseCharacterSearchResult {
  data: CharacterData | null;
  loading: boolean;
  error: string | null;
  search: (name: string) => Promise<CharacterData | null>;
  reset: () => void;
}

export function useCharacterSearch(): UseCharacterSearchResult {
  const [data, setData] = useState<CharacterData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function search(name: string): Promise<CharacterData | null> {
    setLoading(true);
    setError(null);
    setData(null);

    try {
      const res = await fetch(`/api/character/${encodeURIComponent(name)}`);
      const json = await res.json();

      if (!res.ok) {
        setError(json.error ?? "알 수 없는 오류가 발생했습니다.");
        return null;
      }

      const parsed = CharacterDataSchema.safeParse(json);
      if (!parsed.success) {
        setError("서버 응답 형식이 예상과 다릅니다.");
        return null;
      }

      setData(parsed.data);
      return parsed.data;
    } catch {
      setError("네트워크 오류가 발생했습니다.");
      return null;
    } finally {
      setLoading(false);
    }
  }

  function reset() {
    setData(null);
    setError(null);
  }

  return { data, loading, error, search, reset };
}
