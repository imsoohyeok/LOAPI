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

export const RosterResponseSchema = z.object({
  roster: RosterSchema,
  fromCache: z.boolean().optional(),
});
export type RosterResponse = z.infer<typeof RosterResponseSchema>;

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

export const RawSiblingsSchema = z.array(SiblingSchema).nullable();
