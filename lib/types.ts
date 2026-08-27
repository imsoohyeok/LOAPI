import { z } from "zod";

export const ProfileSchema = z.object({
  CharacterName: z.string(),
  ServerName: z.string(),
  CharacterClassName: z.string(),
  ItemAvgLevel: z.string(),
});
export type Profile = z.infer<typeof ProfileSchema>;

export const EquipmentItemSchema = z.object({
  Type: z.string(),
  Name: z.string(),
});
export type EquipmentItem = z.infer<typeof EquipmentItemSchema>;

export const EquipmentSchema = z.array(EquipmentItemSchema);
export type Equipment = z.infer<typeof EquipmentSchema>;

export const EngravingSchema = z.object({
  Name: z.string(),
  Level: z.number().nullable().optional(),
});

export const EngravingsSchema = z.object({
  Engravings: z.array(EngravingSchema).optional().default([]),
});
export type Engravings = z.infer<typeof EngravingsSchema>;

export const GemSchema = z.object({
  Name: z.string(),
  Level: z.number().nullable().optional(),
});

export const GemsSchema = z.object({
  Gems: z.array(GemSchema).optional().default([]),
});
export type Gems = z.infer<typeof GemsSchema>;

export const CharacterDataSchema = z.object({
  profile: ProfileSchema,
  equipment: EquipmentSchema,
  engravings: EngravingsSchema,
  gems: GemsSchema,
  fromCache: z.boolean().optional(),
});
export type CharacterData = z.infer<typeof CharacterDataSchema>;

// ── 로스트아크 API가 실제로 줄 수 있는 "날 것" 응답 스키마 ──────────
// 각인/보석이 없는 캐릭터는 필드가 null로 내려오는 경우가 있어서 별도로 관대하게 검증합니다.
// lib/lostark.ts에서 이 스키마로 먼저 검증한 뒤, 위의 정규화된 타입으로 변환합니다.

export const RawEquipmentSchema = z.array(EquipmentItemSchema).nullable();

export const RawEngravingsSchema = z
  .object({
    Engravings: z.array(EngravingSchema).nullable().optional(),
  })
  .nullable();

export const RawGemsSchema = z
  .object({
    Gems: z.array(GemSchema).nullable().optional(),
  })
  .nullable();
