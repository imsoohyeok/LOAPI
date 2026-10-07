import { NextRequest, NextResponse } from "next/server";
import { getSiblings } from "@/lib/lostark";
import { cacheMeta, getCached, setCached } from "@/lib/cache";
import { toErrorResponse } from "@/lib/apiError";
import type { Roster } from "@/lib/types";

export async function GET(
  _request: NextRequest,
  { params }: { params: { name: string } },
) {
  const { name } = params;

  if (!name || name.trim() === "") {
    return NextResponse.json({ error: "캐릭터명이 필요합니다." }, { status: 400 });
  }

  const cacheKey = `siblings:${name}`;
  const cached = getCached<Roster>(cacheKey);
  if (cached) {
    return NextResponse.json({ roster: cached.value, ...cacheMeta(cached, true) });
  }

  try {
    const roster = await getSiblings(name);
    const entry = setCached(cacheKey, roster);
    return NextResponse.json({ roster, ...cacheMeta(entry, false) });
  } catch (err) {
    return toErrorResponse(err, "원정대 정보를 불러오는 중 오류가 발생했습니다.");
  }
}
