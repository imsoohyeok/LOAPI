import { describe, it, expect } from "vitest";
import {
  AuctionItemsPageSchema,
  AuctionOptionsSchema,
  formatAuctionOption,
  formatTimeLeft,
  parseAuctionEndDate,
} from "@/lib/auction";

describe("AuctionItemsPageSchema", () => {
  it("결과가 없어 Items가 null이면 빈 배열로 바꾼다", () => {
    expect(
      AuctionItemsPageSchema.parse({
        PageNo: 1,
        PageSize: 10,
        TotalCount: 0,
        Items: null,
      }).Items,
    ).toEqual([]);
  });

  it("즉시 구매가가 없는 매물(BuyPrice: null)과 옵션 없는 매물을 받아들인다", () => {
    const page = AuctionItemsPageSchema.parse({
      PageNo: 1,
      PageSize: 10,
      TotalCount: 1,
      Items: [
        {
          Name: "10레벨 겁화의 보석",
          Grade: "고대",
          Tier: 4,
          Level: null,
          Icon: "https://cdn/icon.png",
          GradeQuality: null,
          AuctionInfo: {
            StartPrice: 100,
            BuyPrice: null,
            BidPrice: 0,
            EndDate: "2026-10-07T21:15:12.6",
            BidCount: 0,
            BidStartPrice: 100,
            IsCompetitive: false,
            TradeAllowCount: 2,
            UpgradeLevel: null,
          },
          Options: null,
        },
      ],
    });
    expect(page.Items[0]!.AuctionInfo.BuyPrice).toBeNull();
    expect(page.Items[0]!.Options).toEqual([]);
  });
});

describe("AuctionOptionsSchema", () => {
  it("EtcValues 형태가 예상과 달라도 옵션 목록 전체를 버리지 않는다", () => {
    const options = AuctionOptionsSchema.parse({
      Categories: [{ Code: 210000, CodeName: "보석", Subs: null }],
      ItemGrades: ["유물", "고대"],
      ItemTiers: [3, 4],
      ItemGradeQualities: [10, 20],
      EtcOptions: [
        {
          Value: 7,
          Text: "연마 효과",
          EtcSubs: [{ Value: 41, Text: "추가 피해", Class: "", EtcValues: "이상한 값" }],
        },
      ],
    });
    expect(options.EtcOptions[0]!.EtcSubs[0]!.EtcValues).toBeNull();
    expect(options.Categories[0]!.Subs).toEqual([]);
  });
});

describe("formatAuctionOption", () => {
  it("퍼센트 옵션과 감소 옵션을 부호·단위와 함께 보여준다", () => {
    expect(
      formatAuctionOption({
        Type: "ACCESSORY_UPGRADE",
        OptionName: "추가 피해",
        Value: 2.6,
        IsPenalty: false,
        IsValuePercentage: true,
      }),
    ).toBe("추가 피해 +2.6%");
    expect(
      formatAuctionOption({
        Type: "ABILITY_ENGRAVE",
        OptionName: "공격력 감소",
        Value: 1,
        IsPenalty: true,
      }),
    ).toBe("공격력 감소 -1");
  });
});

describe("formatTimeLeft", () => {
  // 시간대 표기가 없는 EndDate는 한국 시간입니다. 2026-10-07T12:00 KST = 03:00 UTC.
  const now = Date.parse("2026-10-07T03:00:00Z");

  it("시간대가 없는 마감 시각을 한국 시간으로 읽는다", () => {
    expect(parseAuctionEndDate("2026-10-07T12:00:00")).toBe(now);
    expect(parseAuctionEndDate("말도 안 되는 값")).toBeNull();
  });

  it("남은 시간을 분·시간·일 단위로 보여준다", () => {
    expect(formatTimeLeft("2026-10-07T12:30:00", now)).toBe("30분 남음");
    expect(formatTimeLeft("2026-10-07T17:00:00", now)).toBe("5시간 남음");
    expect(formatTimeLeft("2026-10-09T12:00:00", now)).toBe("2일 남음");
    expect(formatTimeLeft("2026-10-07T11:00:00", now)).toBe("곧 마감");
  });
});
