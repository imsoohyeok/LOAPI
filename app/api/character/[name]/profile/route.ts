import { NextRequest, NextResponse } from "next/server";
import { getProfile } from "@/lib/lostark";
import { cacheMeta, getCached, setCached } from "@/lib/cache";
import { toErrorResponse } from "@/lib/apiError";
import type { CharacterData, Profile } from "@/lib/types";

// 원정대 일괄 조회용 가벼운 엔드포인트. 전체 상세(/api/character/[name])는 로스트아크 API를
// 4번 부르지만 이 라우트는 프로필 1번만 불러서, 캐릭터 30개짜리 원정대도 분당 한도(100회) 안에 들어옵니다.
export async function GET(
  request: NextRequest,
  { params }: { params: { name: string } },
) {
  const { name } = params;

  if (!name || name.trim() === "") {
    return NextResponse.json({ error: "캐릭터명이 필요합니다." }, { status: 400 });
  }

  // 이미 전체 상세를 조회한 캐릭터라면 그 안의 프로필을 그대로 씁니다.
  const fullCached = getCached<CharacterData>(`character:${name}`);
  if (fullCached) {
    return NextResponse.json({
      profile: fullCached.value.profile,
      ...cacheMeta(fullCached, true),
    });
  }

  const cacheKey = `profile:${name}`;
  const cached = getCached<Profile>(cacheKey);
  if (cached) {
    return NextResponse.json({ profile: cached.value, ...cacheMeta(cached, true) });
  }

  try {
    // 브라우저가 요청을 취소하면(다른 원정대를 검색한 경우 등) 큐에서 기다리던 로스트아크 요청도 뺍니다.
    const profile = await getProfile(name, request.signal);
    const entry = setCached(cacheKey, profile);
    return NextResponse.json({ profile, ...cacheMeta(entry, false) });
  } catch (err) {
    return toErrorResponse(err, "캐릭터 프로필을 불러오는 중 오류가 발생했습니다.");
  }
}
