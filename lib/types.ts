import { z } from "zod";

export const ProfileSchema = z.object({
  CharacterName: z.string(),
  ServerName: z.string(),
  CharacterClassName: z.string(),
  ItemAvgLevel: z.string(),
  CombatPower: z.string().nullable().optional(),
});
export type Profile = z.infer<typeof ProfileSchema>;

export const EquipmentItemSchema = z.object({
  Type: z.string(),
  Name: z.string(),
  Grade: z.string().nullable().optional(),
});
export type EquipmentItem = z.infer<typeof EquipmentItemSchema>;

export const EquipmentSchema = z.array(EquipmentItemSchema);
export type Equipment = z.infer<typeof EquipmentSchema>;

// 화면에서 쓰는 정규화된 각인 한 줄. 아크 패시브 각인이면 Grade(영웅/전설/유물)와
// 어빌리티 스톤 레벨이 같이 들어옵니다.
export const EngravingSchema = z.object({
  Name: z.string(),
  Level: z.number().nullable().optional(),
  Grade: z.string().nullable().optional(),
  AbilityStoneLevel: z.number().nullable().optional(),
});
export type Engraving = z.infer<typeof EngravingSchema>;

export const EngravingsSchema = z.object({
  Engravings: z.array(EngravingSchema).optional().default([]),
});
export type Engravings = z.infer<typeof EngravingsSchema>;

// Name은 "<FONT COLOR='#F99200'>10레벨 겁화의 보석</FONT>"처럼 HTML 태그가 섞여서 옵니다.
export const GemSchema = z.object({
  Slot: z.number().nullable().optional(),
  Name: z.string(),
  Icon: z.string().nullable().optional(),
  Level: z.number().nullable().optional(),
  Grade: z.string().nullable().optional(),
});
export type Gem = z.infer<typeof GemSchema>;

// 보석이 적용되는 스킬 정보. GemSlot으로 Gems[].Slot과 연결됩니다.
export const GemSkillSchema = z.object({
  GemSlot: z.number(),
  Name: z.string(),
  Icon: z.string().nullable().optional(),
});
export type GemSkill = z.infer<typeof GemSkillSchema>;

// Effects는 API 개편 전후로 형태가 달라서(배열 → 객체), 예상과 다르면 버리고 보석 목록만 살립니다.
const GemEffectsSchema = z
  .object({
    Skills: z.array(GemSkillSchema).nullish(),
  })
  .nullish()
  .catch(null);

export const GemsSchema = z.object({
  Gems: z.array(GemSchema).optional().default([]),
  Skills: z.array(GemSkillSchema).optional().default([]),
});
export type Gems = z.infer<typeof GemsSchema>;

// API 라우트가 응답마다 붙이는 캐시 정보. fromCache는 서버 메모리 캐시 적중 여부,
// ageMs는 로스트아크 API에서 받아온 뒤 서버가 응답하기까지 지난 시간입니다.
export const CacheMetaSchema = z.object({
  fromCache: z.boolean().optional(),
  ageMs: z.number().nonnegative().optional(),
});
export type CacheMeta = z.infer<typeof CacheMetaSchema>;

export const CharacterDataSchema = z
  .object({
    profile: ProfileSchema,
    equipment: EquipmentSchema,
    engravings: EngravingsSchema,
    gems: GemsSchema,
  })
  .merge(CacheMetaSchema);
export type CharacterData = z.infer<typeof CharacterDataSchema>;

// /characters/{name}/siblings 응답의 한 항목. 같은 계정(원정대)의 모든 서버 캐릭터가 담겨 옵니다.
export const SiblingSchema = z.object({
  ServerName: z.string(),
  CharacterName: z.string(),
  CharacterLevel: z.number(),
  CharacterClassName: z.string(),
  ItemAvgLevel: z.string(),
});
export type Sibling = z.infer<typeof SiblingSchema>;

export const RosterSchema = z.array(SiblingSchema);
export type Roster = z.infer<typeof RosterSchema>;

export const RosterResponseSchema = z
  .object({
    roster: RosterSchema,
  })
  .merge(CacheMetaSchema);
export type RosterResponse = z.infer<typeof RosterResponseSchema>;

export const RawEquipmentSchema = z.array(EquipmentItemSchema).nullable();

// /engravings 원본 응답. 아크 패시브 도입 이후 실제 각인 정보는 ArkPassiveEffects에 있고,
// Engravings(장착 각인서 슬롯)·Effects("원한 Lv. 3" 형태)는 구 시스템 필드라 null로 오는 경우가 많습니다.
export const RawEngravingsSchema = z
  .object({
    Engravings: z
      .array(z.object({ Name: z.string(), Slot: z.number().nullable().optional() }))
      .nullable()
      .optional(),
    Effects: z
      .array(
        z.object({ Name: z.string(), Description: z.string().nullable().optional() }),
      )
      .nullable()
      .optional(),
    ArkPassiveEffects: z
      .array(
        z.object({
          Name: z.string(),
          Level: z.number().nullable().optional(),
          Grade: z.string().nullable().optional(),
          AbilityStoneLevel: z.number().nullable().optional(),
        }),
      )
      .nullable()
      .optional(),
  })
  .nullable();
export type RawEngravings = z.infer<typeof RawEngravingsSchema>;

export const RawGemsSchema = z
  .object({
    Gems: z.array(GemSchema).nullable().optional(),
    Effects: GemEffectsSchema,
  })
  .nullable();

export const RawSiblingsSchema = z.array(SiblingSchema).nullable();
