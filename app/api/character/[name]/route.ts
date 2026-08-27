import { NextRequest, NextResponse } from "next/server";
import { ZodError } from "zod";
import { getFullCharacterData, LostarkApiError } from "@/lib/lostark";
import { getCached, setCached } from "@/lib/cache";
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
    if (err instanceof LostarkApiError) {
      const status =
        err.code === "NOT_FOUND" ? 404 : err.code === "RATE_LIMITED" ? 429 : 502;
      return NextResponse.json({ error: err.message }, { status });
    }
    if (err instanceof ZodError) {
      console.error("응답 스키마 검증 실패:", err.issues);
      return NextResponse.json(
        { error: "로스트아크 API 응답 형식이 예상과 다릅니다." },
        { status: 502 },
      );
    }
    console.error(err);
    return NextResponse.json(
      { error: "캐릭터 정보를 불러오는 중 오류가 발생했습니다." },
      { status: 500 },
    );
  }
}
