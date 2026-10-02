import "server-only";
import { NextResponse } from "next/server";
import { ZodError } from "zod";
import { LostarkApiError } from "@/lib/lostark";

// API 라우트에서 공통으로 쓰는 에러 → HTTP 응답 변환기
export function toErrorResponse(err: unknown, fallbackMessage: string): NextResponse {
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
  return NextResponse.json({ error: fallbackMessage }, { status: 500 });
}
