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

export const EngravingSchema = z.object({
  Name: z.string(),
  Level: z.number().nullable().optional(),
});

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

export const CharacterDataSchema = z.object({
  profile: ProfileSchema,
  equipment: EquipmentSchema,
  engravings: EngravingsSchema,
  gems: GemsSchema,
  fromCache: z.boolean().optional(),
});
export type CharacterData = z.infer<typeof CharacterDataSchema>;

export const RawEquipmentSchema = z.array(EquipmentItemSchema).nullable();

export const RawEngravingsSchema = z
  .object({
    Engravings: z.array(EngravingSchema).nullable().optional(),
  })
  .nullable();

export const RawGemsSchema = z
  .object({
    Gems: z.array(GemSchema).nullable().optional(),
    Effects: GemEffectsSchema,
  })
  .nullable();
