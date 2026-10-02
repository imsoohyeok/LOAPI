import { NextRequest, NextResponse } from "next/server";
import { getFullCharacterData } from "@/lib/lostark";
import { getCached, setCached } from "@/lib/cache";
import { toErrorResponse } from "@/lib/apiError";
import type { CharacterData } from "@/lib/types";

export async function GET(
  _request: NextRequest,
  { params }: { params: { name: string } },
) {
  const { name } = params;

  if (!name || name.trim() === "") {
    return NextResponse.json({ error: "캐릭터명이 필요합니다." }, { status: 400 });
  }

  const cacheKey = `character:${name}`;
  const cached = getCached<CharacterData>(cacheKey);
  if (cached) {
    return NextResponse.json({ ...cached, fromCache: true });
  }

  try {
    const data = await getFullCharacterData(name);
    setCached(cacheKey, data);
    return NextResponse.json({ ...data, fromCache: false });
  } catch (err) {
    return toErrorResponse(err, "캐릭터 정보를 불러오는 중 오류가 발생했습니다.");
  }
}
