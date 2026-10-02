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
  })
  .nullable();
