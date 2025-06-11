type ArmorStateBase = {
  mod: ModType;
  tuning: boolean;
  masterwork: boolean;
};

type ArmorStateMap = {
  [K in ArmorArchetype]: {
    archetype: K;
    tertiary: TertiaryArmorStat<K>[number];
  } & ArmorStateBase;
};

export type ArmorState = ArmorStateMap[ArmorArchetype];

export type ArmorKind = "Helmet" | "Gloves" | "Chest" | "Boots" | "Class";

export type ArmorArchetype =
  | "Brawler"
  | "Gunner"
  | "Specialist"
  | "Grenadier"
  | "Paragon"
  | "Bulwark";

export type StatType =
  | "Weapons"
  | "Melee"
  | "Health"
  | "Super"
  | "Grenade"
  | "Class";

export const ARCHETYPES: ArmorArchetype[] = [
  "Gunner",
  "Brawler",
  "Bulwark",
  "Paragon",
  "Grenadier",
  "Specialist",
] as const;

export const STATS: StatType[] = [
  "Weapons",
  "Melee",
  "Health",
  "Super",
  "Grenade",
  "Class",
] as const;

export const MODS: ModType[] = [
  "Grenade Mod",
  "Minor Grenade Mod",
  "Super Mod",
  "Minor Super Mod",
  "Weapons Mod",
  "Minor Weapons Mod",
  "Class Mod",
  "Minor Class Mod",
  "Health Mod",
  "Minor Health Mod",
  "Melee Mod",
  "Minor Melee Mod",
];

export const ARMOR: ArmorKind[] = [
  "Helmet",
  "Gloves",
  "Chest",
  "Boots",
  "Class",
] as const;

export const STAT_COUNT = {
  PRIMARY: 30,
  SECONDARY: 25,
  TERTIARY: 20,
  MAJOR_MOD: 10,
  MINOR_MOD: 5,
  MASTERWORK: 5,
} as const;

export const PRIMARY_STAT_ARCHETYPE_MAP: Record<StatType, ArmorArchetype> = {
  Class: "Specialist",
  Grenade: "Grenadier",
  Weapons: "Gunner",
  Super: "Paragon",
  Health: "Bulwark",
  Melee: "Brawler",
} as const;

export const ARCHETYPE_PRIMARY_STAT_MAP: Record<ArmorArchetype, StatType> = {
  Specialist: "Class",
  Grenadier: "Grenade",
  Gunner: "Weapons",
  Paragon: "Super",
  Bulwark: "Health",
  Brawler: "Melee",
} as const;

export const ARCHETYPE_SECONDARY_STAT_MAP: Record<ArmorArchetype, StatType> = {
  Specialist: "Weapons",
  Grenadier: "Super",
  Gunner: "Grenade",
  Paragon: "Melee",
  Bulwark: "Class",
  Brawler: "Health",
} as const;

interface ArmorArchetypeConfig<T extends ArmorArchetype> {
  PRIMARY: StatType;
  SECONDARY: StatType;
  TERTIARY: Exclude<
    StatType,
    T extends "Brawler"
      ? "Melee" | "Health"
      : T extends "Gunner"
      ? "Weapons" | "Grenade"
      : T extends "Specialist"
      ? "Class" | "Weapons"
      : T extends "Grenadier"
      ? "Grenade" | "Super"
      : T extends "Paragon"
      ? "Super" | "Melee"
      : T extends "Bulwark"
      ? "Health" | "Class"
      : never
  >;
}

type TertiaryArmorStat<T extends ArmorArchetype> =
  ArmorArchetypeConfig<T>["TERTIARY"];

export const ARCHETYPE_TERTIARY_STAT_MAP: {
  [K in ArmorArchetype]: TertiaryArmorStat<K>[];
} = {
  Brawler: ["Grenade", "Super", "Class", "Weapons"],
  Bulwark: ["Melee", "Super", "Weapons", "Grenade"],
  Grenadier: ["Class", "Melee", "Weapons", "Health"],
  Gunner: ["Super", "Class", "Health", "Melee"],
  Specialist: ["Grenade", "Health", "Melee", "Super"],
  Paragon: ["Grenade", "Health", "Weapons", "Class"],
} as const;

export const MOD_STAT_MAP = {
  "Grenade Mod": ["Grenade", "Grenade", STAT_COUNT.MAJOR_MOD],
  "Minor Grenade Mod": ["Minor Grenade", "Grenade", STAT_COUNT.MINOR_MOD],
  "Super Mod": ["Super", "Super", STAT_COUNT.MAJOR_MOD],
  "Minor Super Mod": ["Minor Super", "Super", STAT_COUNT.MINOR_MOD],
  "Weapons Mod": ["Weapons", "Weapons", STAT_COUNT.MAJOR_MOD],
  "Minor Weapons Mod": ["Minor Weapons", "Weapons", STAT_COUNT.MINOR_MOD],
  "Class Mod": ["Class", "Class", STAT_COUNT.MAJOR_MOD],
  "Minor Class Mod": ["Minor Class", "Class", STAT_COUNT.MINOR_MOD],
  "Health Mod": ["Health", "Health", STAT_COUNT.MAJOR_MOD],
  "Minor Health Mod": ["Minor Health", "Health", STAT_COUNT.MINOR_MOD],
  "Melee Mod": ["Melee", "Melee", STAT_COUNT.MAJOR_MOD],
  "Minor Melee Mod": ["Minor Melee", "Melee", STAT_COUNT.MINOR_MOD],
} as const;

export type ModType = keyof typeof MOD_STAT_MAP;

export const STAT_DESCRIPTION_MAP = {
  Health: {
    description:
      "Increases the amount of health you gain each time you pick up an Orb of Power. Reduces flinching from incoming fire while aiming a weapon.",
    statBonus: [
      { type: "int", midValue: 35, maxValue: 70 },
      { type: "pct", midValue: 5.0, maxValue: 10.0 },
    ],
    statBonusDescription: ["Health Per Orb", "Flinch Resistance"],
    overflow: {
      description:
        "Your shields recharge more quickly and have additional health when facing combatants",
      statBonus: [
        { type: "pct", midValue: 31.6, maxValue: 45.0 },
        { type: "int", midValue: 14, maxValue: 20 },
      ],
      statBonusDescription: ["Shield Recharge Rate", "Shield Health"],
    },
  },
  Melee: {
    description:
      "Reduces your melee cooldown. Increases the amount of melee energy from all sources.",
    statBonus: [
      { type: "pct", midValue: 35.0, maxValue: 65.0 },
      { type: "pct", midValue: 56.0, maxValue: 190.0 },
    ],
    statBonusDescription: ["Melee Ability Cooldown", "Melee Energy"],
    overflow: {
      description: "Increases the damage done by your melee attacks.",
      statBonus: [
        { type: "pct", midValue: 15.0, maxValue: 30.0 },
        { type: "pct", midValue: 10.0, maxValue: 20.0 },
      ],
      statBonusDescription: ["PVE Damage", "PVP Damage"],
    },
  },
  Grenade: {
    description:
      "Reduces your grenade ability cooldown. Increases the amount of grenade energy from all sources.",
    statBonus: [
      { type: "pct", midValue: 35.0, maxValue: 65.0 },
      { type: "pct", midValue: 56.0, maxValue: 190.0 },
    ],
    statBonusDescription: ["Grenade Ability Cooldown", "Grenade Energy"],
    overflow: {
      description: "Increases the damage done by your grenades.",
      statBonus: [
        { type: "pct", midValue: 32.3, maxValue: 65.0 },
        { type: "pct", midValue: 9.9, maxValue: 20.0 },
      ],
      statBonusDescription: ["PVE Damage", "PVP Damage"],
    },
  },
  Super: {
    description: "Increases the amount of Super energy from all sources.",
    statBonus: [{ type: "pct", midValue: 56.0, maxValue: 190.0 }], // TODO
    statBonusDescription: ["Super Energy"],
    overflow: {
      description: "Increases the damage done by your Super.",
      statBonus: [
        { type: "pct", midValue: 22.3, maxValue: 45.0 },
        { type: "pct", midValue: 7.4, maxValue: 15.0 },
      ],
      statBonusDescription: ["PVE Damage", "PVP Damage"],
    },
  },
  Class: {
    description:
      "Reduces your class ability cooldown. Increases the amount of class ability energy provided by all sources.",
    statBonus: [
      { type: "pct", midValue: 35.0, maxValue: 65.0 },
      { type: "pct", midValue: 56.0, maxValue: 190.0 },
    ],
    statBonusDescription: ["Class Ability Cooldown", "Class Ability Energy"],
    overflow: {
      description: "You gain an overshield when you use your class ability.",
      statBonus: [
        { type: "int", midValue: 19.8, maxValue: 40 },
        { type: "int", midValue: 4.9, maxValue: 10 },
      ],
      statBonusDescription: ["PVE Overshield", "PVP Overshield"],
    },
  },
  Weapons: {
    description:
      "Increases weapon reload speed and handling. Increases weapon damage against minor and major combatants.",
    statBonus: [
      { type: "pct", midValue: 5.0, maxValue: 10.0 },
      { type: "pct", midValue: 7.5, maxValue: 15.0 },
      { type: "pct", midValue: 4.9, maxValue: 10.0 },
    ],
    statBonusDescription: [
      "Weapon Reload and Handling Speed",
      "Minor/Major Primary/Special Damage",
      "Minor/Major Heavy Damage",
    ],
    overflow: {
      description:
        "Ammo bricks from defeated targets have a chance to contain additional rounds. Increases weapon damage against bosses and opposing Guardians.",
      statBonus: [
        { type: "pct", midValue: 49.0, maxValue: 100.0 },
        { type: "pct", midValue: 7.4, maxValue: 15.0 },
        { type: "pct", midValue: 4.9, maxValue: 10.0 },
        { type: "pct", midValue: 3.0, maxValue: 6.0 },
      ],
      statBonusDescription: [
        "Large Ammo Brick Chance",
        "Boss Primary/Special Damage",
        "Boss Heavy Damage",
        "PVP Damage",
      ],
    },
  },
} as const;

export const getStats = (
  archetypes: Record<ArmorKind, ArmorState | null>,
  masterwork: boolean
) => {
  const stats: Record<StatType, number> = {
    Health: 0,
    Melee: 0,
    Grenade: 0,
    Super: 0,
    Class: 0,
    Weapons: 0,
  };

  for (const armor of Object.keys(archetypes) as ArmorKind[]) {
    if (archetypes[armor]?.mod) {
      const [, stat, amount] = MOD_STAT_MAP[archetypes[armor].mod as ModType];
      stats[stat] += amount;
    }
    if (!archetypes[armor]?.archetype) {
      continue;
    }
    const { archetype } = archetypes[armor];
    const primaryStat = ARCHETYPE_PRIMARY_STAT_MAP[archetype];
    const secondaryStat = ARCHETYPE_SECONDARY_STAT_MAP[archetype];
    const tertiaryStat = archetypes[armor]?.tertiary as StatType;
    stats[primaryStat] += STAT_COUNT.PRIMARY;
    stats[secondaryStat] += STAT_COUNT.SECONDARY;
    if (tertiaryStat) {
      stats[tertiaryStat] += STAT_COUNT.TERTIARY;
    }
    if (masterwork && tertiaryStat) {
      // get the 3 stats that arent primary, secondary, tertiary
      const masterworkStats = structuredClone(STATS);
      masterworkStats.splice(masterworkStats.indexOf(primaryStat), 1);
      masterworkStats.splice(masterworkStats.indexOf(secondaryStat), 1);
      masterworkStats.splice(masterworkStats.indexOf(tertiaryStat), 1);
      for (const masterworkStat of masterworkStats) {
        stats[masterworkStat] += STAT_COUNT.MASTERWORK;
      }
    }
  }
  return stats;
};

// URL format: ?h=06g&c=1a&b=5 (helmet, chest, boots with their respective params)

const SLOT_MAP = {
  Gunner: "archetype",
  Brawler: "archetype",
  Bulwark: "archetype",
  Paragon: "archetype",
  Grenadier: "archetype",
  Specialist: "archetype",
  Health: "tertiary",
  Melee: "tertiary",
  Grenade: "tertiary",
  Super: "tertiary",
  Class: "tertiary",
  Weapons: "tertiary",
  "Grenade Mod": "mod",
  "Super Mod": "mod",
  "Weapons Mod": "mod",
  "Class Mod": "mod",
  "Health Mod": "mod",
  "Melee Mod": "mod",
  "Minor Grenade Mod": "mod",
  "Minor Super Mod": "mod",
  "Minor Weapons Mod": "mod",
  "Minor Class Mod": "mod",
  "Minor Health Mod": "mod",
  "Minor Melee Mod": "mod",
} as const;

const FRAGMENT_MAP: Record<Fragments, FragmentType> = {
  //prismatic
  Awakening: "Prismatic",
  Courage: "Prismatic",
  Dawn: "Prismatic",
  Defiance: "Prismatic",
  Devotion: "Prismatic",
  Dominance: "Prismatic",
  Grace: "Prismatic",
  Honor: "Prismatic",
  Justice: "Prismatic",
  Protection: "Prismatic",
  Purpose: "Prismatic",
  Ruin: "Prismatic",
  Sacrifice: "Prismatic",
  //strand
  Ascent: "Strand",
  Binding: "Strand",
  Evolution: "Strand",
  Finality: "Strand",
  Fury: "Strand",
  Generation: "Strand",
  Propagation: "Strand",
  Transmutation: "Strand",
  Warding: "Strand",
  //stasis
  Bonds: "Stasis",
  Chains: "Stasis",
  Conduction: "Stasis",
  Durance: "Stasis",
  Fractures: "Stasis",
  Hunger: "Stasis",
  Impetus: "Stasis",
  Torment: "Stasis",
  //void
  Dilation: "Void",
  Domineering: "Void",
  Expulsion: "Void",
  Harvest: "Void",
  Instability: "Void",
  Leeching: "Void",
  Obscurity: "Void",
  Persistence: "Void",
  Provision: "Void",
  Starvation: "Void",
  Undermining: "Void",
  Vigilance: "Void",
  //solar
  Beams: "Solar",
  Benevolence: "Solar",
  Char: "Solar",
  Combustion: "Solar",
  Empyrean: "Solar",
  Eruption: "Solar",
  Mercy: "Solar",
  Searing: "Solar",
  Tempering: "Solar",
  Torches: "Solar",
  Wonder: "Solar",
  //arc
  Brilliance: "Arc",
  Discharge: "Arc",
  Feedback: "Arc",
  Focus: "Arc",
  Resistance: "Arc",
  Shock: "Arc",
  Volts: "Arc",
};

const ARMOR_PARAM_CODES = {
  // Archetypes (0-5)
  Gunner: 0,
  Brawler: 1,
  Bulwark: 2,
  Paragon: 3,
  Grenadier: 4,
  Specialist: 5,
  // Stats (6-11)
  Health: 6,
  Melee: 7,
  Grenade: 8,
  Super: 9,
  Class: 10,
  Weapons: 11,
  // Major Mods (12-17)
  "Grenade Mod": 12,
  "Super Mod": 13,
  "Weapons Mod": 14,
  "Class Mod": 15,
  "Health Mod": 16,
  "Melee Mod": 17,
  // Minor Mods (18-23)
  "Minor Grenade Mod": 18,
  "Minor Super Mod": 19,
  "Minor Weapons Mod": 20,
  "Minor Class Mod": 21,
  "Minor Health Mod": 22,
  "Minor Melee Mod": 23,
} as const;

export const FRAGMENT_PARAM_CODES: Record<Fragments, number> = {
  // Arc Fragments (0-6)
  Brilliance: 0,
  Discharge: 1,
  Feedback: 2,
  Focus: 3,
  Resistance: 4,
  Shock: 5,
  Volts: 6,

  // Solar Fragments (7-17)
  Beams: 7,
  Benevolence: 8,
  Char: 9,
  Combustion: 10,
  Empyrean: 11,
  Eruption: 12,
  Mercy: 13,
  Searing: 14,
  Tempering: 15,
  Torches: 16,
  Wonder: 17,

  // Void Fragments (18-29)
  Dilation: 18,
  Domineering: 19,
  Expulsion: 20,
  Harvest: 21,
  Instability: 22,
  Leeching: 23,
  Obscurity: 24,
  Persistence: 25,
  Provision: 26,
  Starvation: 27,
  Undermining: 28,
  Vigilance: 29,

  // Stasis Fragments (30-37)
  Bonds: 30,
  Chains: 31,
  Conduction: 32,
  Durance: 33,
  Fractures: 34,
  Hunger: 35,
  Impetus: 36,
  Torment: 37,

  // Strand Fragments (38-46)
  Ascent: 38,
  Binding: 39,
  Evolution: 40,
  Finality: 41,
  Fury: 42,
  Generation: 43,
  Propagation: 44,
  Transmutation: 45,
  Warding: 46,

  // Prismatic Fragments (47-59)
  Awakening: 47,
  Courage: 48,
  Dawn: 49,
  Defiance: 50,
  Devotion: 51,
  Dominance: 52,
  Grace: 53,
  Honor: 54,
  Justice: 55,
  Protection: 56,
  Purpose: 57,
  Ruin: 58,
  Sacrifice: 59,
};

const ARMOR_PARAMS = {
  Helmet: "h",
  Gloves: "g",
  Chest: "c",
  Boots: "b",
  Class: "l",
} as const;

// Reverse lookup maps for decoding
const ARMOR_PARAM_CODES_REVERSE = Object.fromEntries(
  Object.entries(ARMOR_PARAM_CODES).map(([key, value]) => [value, key])
) as Record<number, keyof typeof ARMOR_PARAM_CODES>;

const FRAGMENT_PARAM_CODES_REVERSE = Object.fromEntries(
  Object.entries(FRAGMENT_PARAM_CODES).map(([k, v]) => [v, k])
) as Record<number, keyof typeof FRAGMENT_PARAM_CODES>;
// const ARMOR_PARAMS_REVERSE = Object.fromEntries(
//   Object.entries(ARMOR_PARAMS).map(([key, value]) => [value, key])
// ) as Record<string, keyof typeof ARMOR_PARAMS>;

// Type definitions
type ArmorParamCode = keyof typeof ARMOR_PARAM_CODES;
type FragmentParamCode = keyof typeof FRAGMENT_PARAM_CODES;
type ArmorParam = keyof typeof ARMOR_PARAMS;
type FragmentParam = "f";
type ArmorSlotParams = Partial<Record<ArmorParam, ArmorParamCode[]>>;
type FragmentParams = Partial<Record<FragmentParam, FragmentParamCode[]>>;

const B64_MAP: Record<number, string> = {
  // 0-25: A-Z
  0: "A",
  1: "B",
  2: "C",
  3: "D",
  4: "E",
  5: "F",
  6: "G",
  7: "H",
  8: "I",
  9: "J",
  10: "K",
  11: "L",
  12: "M",
  13: "N",
  14: "O",
  15: "P",
  16: "Q",
  17: "R",
  18: "S",
  19: "T",
  20: "U",
  21: "V",
  22: "W",
  23: "X",
  24: "Y",
  25: "Z",

  // 26-51: a-z
  26: "a",
  27: "b",
  28: "c",
  29: "d",
  30: "e",
  31: "f",
  32: "g",
  33: "h",
  34: "i",
  35: "j",
  36: "k",
  37: "l",
  38: "m",
  39: "n",
  40: "o",
  41: "p",
  42: "q",
  43: "r",
  44: "s",
  45: "t",
  46: "u",
  47: "v",
  48: "w",
  49: "x",
  50: "y",
  51: "z",

  // 52-59: 0-7 (we only need up to 59, so only use 0-7)
  52: "0",
  53: "1",
  54: "2",
  55: "3",
  56: "4",
  57: "5",
  58: "6",
  59: "7",
};

// Reverse mapping: character -> number
const B64_MAP_REVERSE: Record<string, number> = {
  // A-Z -> 0-25
  A: 0,
  B: 1,
  C: 2,
  D: 3,
  E: 4,
  F: 5,
  G: 6,
  H: 7,
  I: 8,
  J: 9,
  K: 10,
  L: 11,
  M: 12,
  N: 13,
  O: 14,
  P: 15,
  Q: 16,
  R: 17,
  S: 18,
  T: 19,
  U: 20,
  V: 21,
  W: 22,
  X: 23,
  Y: 24,
  Z: 25,

  // a-z -> 26-51
  a: 26,
  b: 27,
  c: 28,
  d: 29,
  e: 30,
  f: 31,
  g: 32,
  h: 33,
  i: 34,
  j: 35,
  k: 36,
  l: 37,
  m: 38,
  n: 39,
  o: 40,
  p: 41,
  q: 42,
  r: 43,
  s: 44,
  t: 45,
  u: 46,
  v: 47,
  w: 48,
  x: 49,
  y: 50,
  z: 51,

  // 0-7 -> 52-59
  "0": 52,
  "1": 53,
  "2": 54,
  "3": 55,
  "4": 56,
  "5": 57,
  "6": 58,
  "7": 59,
};

// Encoding/Decoding utilities
class SearchParamEncoder {
  /**
   * Encodes an array of selected parameters into a compact base36 string
   * @param params Array of parameter names
   * @returns Base36 encoded string
   */
  static encodeParamList<T extends "armor" | "fragment">(
    params: T extends "armor" ? ArmorParamCode[] : FragmentParamCode[],
    mode: T
  ): string {
    if (params.length === 0) return "";
    const codes = params
      .filter((param) => !!param)
      .map((param) =>
        mode === "armor"
          ? ARMOR_PARAM_CODES[param as ArmorParamCode]
          : FRAGMENT_PARAM_CODES[param as FragmentParamCode]
      )
      .sort((a, b) => a - b); // Sort for consistent encoding

    return codes
      .map((code) => (mode === "armor" ? code.toString(36) : B64_MAP[code]))
      .join("");
  }

  /**
   * Decodes a compact string back into parameter names
   * @param encoded Base36 encoded string
   * @returns Array of parameter names
   */
  static decodeParamList<T extends "armor" | "fragment">(
    encoded: string,
    mode: T
  ): T extends "armor" ? ArmorParamCode[] : FragmentParamCode[] {
    if (!encoded) return [];
    const REVERSE_CODES =
      mode === "armor"
        ? ARMOR_PARAM_CODES_REVERSE
        : FRAGMENT_PARAM_CODES_REVERSE;
    const base = mode === "armor" ? 36 : 64;
    const base2Char = mode === "armor" ? 35 : 59;
    // Handle multi-character base36 numbers by trying different parsing strategies
    const codes: number[] = [];
    let i = 0;

    while (i < encoded.length) {
      // Try parsing 2-character sequences first (for numbers > 35 | 59)
      if (i + 1 < encoded.length) {
        const char = encoded.slice(i, i + 2);
        const twoChar =
          base === 64 ? B64_MAP_REVERSE[Number(char)] : parseInt(char, base);
        if (twoChar in REVERSE_CODES && twoChar > base2Char) {
          codes.push(twoChar);
          i += 2;
          continue;
        }
      }
      // Parse single character
      const oneChar =
        base === 64 ? B64_MAP_REVERSE[encoded[i]] : parseInt(encoded[i], base);

      if (oneChar in REVERSE_CODES) {
        codes.push(oneChar);
      }
      i++;
    }
    return codes
      .sort((a, b) => a - b)
      .map((code) => REVERSE_CODES[code]) as T extends "armor"
      ? ArmorParamCode[]
      : FragmentParamCode[];
  }

  /**
   * Creates a complete search URL with per-armor-slot encoded parameters
   * @param armorParams Object mapping armor slots to their parameter arrays
   * @returns Complete URL with encoded parameters
   */
  static createSearchUrl(params: {
    armorParams?: ArmorSlotParams;
    fragmentParams?: { fragments: Fragments[]; active: FragmentType };
  }): string {
    const searchParams = new URLSearchParams();
    // Encode each armor slot's parameters
    Object.entries(params.armorParams ?? {}).forEach(([armorSlot, params]) => {
      if (params && params.length > 0) {
        const armorCode = ARMOR_PARAMS[armorSlot as ArmorParam];
        const encodedParams = this.encodeParamList(params, "armor");
        if (encodedParams) {
          searchParams.set(armorCode, encodedParams);
        }
      }
    });
    if (params?.fragmentParams) {
      console.log(params.fragmentParams.fragments);
      const encodedParams = this.encodeParamList(
        params.fragmentParams.fragments,
        "fragment"
      );
      if (encodedParams) {
        searchParams.set("f", encodedParams);
        searchParams.set("t", params.fragmentParams.active);
      }
    }

    return searchParams.toString();
  }

  /**
   * Parses a search URL and returns decoded parameters per armor slot
   * @param url Full URL or search params string
   * @returns Decoded parameters organized by armor slot
   */
  static parseSearchUrl(
    url: string
  ): Record<string, [string, Record<string, string>] | Record<string, string>> {
    const urlObj = new URL(url);
    const searchParams = urlObj.searchParams;
    const result: Record<
      string,
      [string, Record<string, string>] | Record<string, string>
    > = {};

    // Check each armor slot code in the URL
    Object.entries(ARMOR_PARAMS).forEach(([armorSlot, armorCode]) => {
      const encodedArmorParams = searchParams.get(armorCode);
      if (encodedArmorParams) {
        const decodedArmorParams = this.decodeParamList(
          encodedArmorParams,
          "armor"
        );
        const mappedArmorParams = decodedArmorParams.reduce(
          (params, param) => ({ ...params, [SLOT_MAP[param]]: param }),
          {}
        );
        if (decodedArmorParams.length > 0) {
          result[armorSlot as ArmorParam] = mappedArmorParams as Record<
            string,
            string
          >;
        }
      }
    });

    const encodedFragmentParams = searchParams.get("f");
    const enabledFragmentCollection = searchParams.get("t") as FragmentType;
    if (encodedFragmentParams) {
      const decodedFragmentParams = this.decodeParamList(
        encodedFragmentParams,
        "fragment"
      );
      const mappedFragmentParams = decodedFragmentParams.reduce(
        (params, param) => {
          const fragmentKind = FRAGMENT_MAP[param];
          // @ts-expect-error cba
          if (!params[fragmentKind]) {
            // @ts-expect-error cba
            params[fragmentKind] = {};
          }
          // @ts-expect-error cba
          params[fragmentKind] = {
            // @ts-expect-error cba
            ...params[fragmentKind],
            [param]: true,
          };
          return params;
        },
        {}
      );
      if (decodedFragmentParams.length > 0) {
        result.f = [enabledFragmentCollection, mappedFragmentParams];
      }
    }
    return result;
  }
}

export const useArmorParamEncoder = () => {
  const encodeToUrl = (armorParams: ArmorSlotParams) => {
    return SearchParamEncoder.createSearchUrl({ armorParams });
  };

  const decodeFromUrl = (
    url: string = window.location.href
  ): ArmorSlotParams => {
    return SearchParamEncoder.parseSearchUrl(url);
  };

  return { encodeToUrl, decodeFromUrl };
};

export const useFragmentParamEncoder = () => {
  const encodeToUrl = (fragmentParams: {
    fragments: Fragments[];
    active: FragmentType;
  }) => {
    return SearchParamEncoder.createSearchUrl({ fragmentParams });
  };
  const decodeFromUrl = (
    url: string = window.location.href
  ): { f: [FragmentType, FragmentParams] } => {
    // @ts-expect-error cba
    return SearchParamEncoder.parseSearchUrl(url);
  };
  return { encodeToUrl, decodeFromUrl };
};

export const TYPE_PARAM_MAP = {
  archetype: 0,
  tertiary: 1,
  mod: 2,
};

interface BaseDialogClick {
  armorKind: ArmorKind;
}

interface ArchetypeDialogClick {
  selection: ArmorArchetype | null;
  updateType: "archetype";
}

interface ModDialogClick {
  selection: ModType | null;
  updateType: "mod";
}

interface TertiaryDialogClick {
  selection: StatType | null;
  updateType: "tertiary";
}

export type DialogClick = BaseDialogClick &
  (ArchetypeDialogClick | ModDialogClick | TertiaryDialogClick);

export type FragmentType =
  | "Arc"
  | "Solar"
  | "Void"
  | "Stasis"
  | "Strand"
  | "Prismatic";

type ArcFragment =
  | "Brilliance"
  | "Discharge"
  | "Feedback"
  | "Focus"
  | "Resistance"
  | "Shock"
  | "Volts";

type SolarFragment =
  | "Beams"
  | "Benevolence"
  | "Char"
  | "Combustion"
  | "Empyrean"
  | "Eruption"
  | "Mercy"
  | "Searing"
  | "Tempering"
  | "Torches"
  | "Wonder";

type VoidFragment =
  | "Dilation"
  | "Domineering"
  | "Expulsion"
  | "Harvest"
  | "Instability"
  | "Leeching"
  | "Obscurity"
  | "Persistence"
  | "Provision"
  | "Starvation"
  | "Undermining"
  | "Vigilance";

type StasisFragment =
  | "Bonds"
  | "Chains"
  | "Conduction"
  | "Durance"
  | "Fractures"
  | "Hunger"
  | "Impetus"
  | "Torment";

type StrandFragment =
  | "Ascent"
  | "Binding"
  | "Evolution"
  | "Finality"
  | "Fury"
  | "Generation"
  | "Propagation"
  | "Transmutation"
  | "Warding";

type PrismaticFragment =
  | "Awakening"
  | "Courage"
  | "Dawn"
  | "Defiance"
  | "Devotion"
  | "Dominance"
  | "Grace"
  | "Honor"
  | "Justice"
  | "Protection"
  | "Purpose"
  | "Ruin"
  | "Sacrifice";

export type Fragments =
  | ArcFragment
  | SolarFragment
  | VoidFragment
  | StasisFragment
  | StrandFragment
  | PrismaticFragment;

export type Fragment<T> = T extends "Arc"
  ? ArcFragment
  : T extends "Solar"
  ? SolarFragment
  : T extends "Void"
  ? VoidFragment
  : T extends "Stasis"
  ? StasisFragment
  : T extends "Strand"
  ? StrandFragment
  : T extends "Prismatic"
  ? PrismaticFragment
  : never;

type FragmentMap = {
  [K in FragmentType]: Record<Fragment<K>, Partial<Record<StatType, number>>>;
};

export type ToggleSignature = { [K in StatType]: number };

export const FRAGMENTS: FragmentMap = {
  Arc: {
    Brilliance: {
      Super: 10,
    },
    Discharge: {
      Melee: -10,
    },
    Feedback: {
      Health: 10,
    },
    Focus: {
      Health: -10,
    },
    Resistance: {
      Melee: 10,
    },
    Shock: {
      Grenade: -10,
    },
    Volts: {
      Class: 10,
    },
  },
  Solar: {
    Beams: {
      Super: 10,
    },
    Benevolence: {
      Grenade: -10,
    },
    Char: {
      Grenade: 10,
    },
    Combustion: {
      Melee: 10,
    },
    Empyrean: {
      Health: -10,
    },
    Eruption: {
      Melee: 10,
    },
    Mercy: {
      Health: 10,
    },
    Searing: {
      Class: 10,
    },
    Tempering: {
      Class: -10,
    },
    Torches: {
      Grenade: -10,
    },
    Wonder: {
      Health: 10,
    },
  },
  Void: {
    Dilation: {
      Weapons: 10,
      Super: 10,
    },
    Domineering: {
      Grenade: 10,
    },
    Expulsion: {
      Super: 10,
    },
    Harvest: {
      Super: -10,
    },
    Instability: {
      Melee: 10,
    },
    Leeching: {
      Health: 10,
    },
    Obscurity: {
      Class: 10,
    },
    Persistence: {
      Health: -10,
    },
    Provision: {
      Melee: -10,
    },
    Starvation: {
      Class: -10,
    },
    Undermining: {
      Grenade: -20,
    },
    Vigilance: {
      Class: 10,
    },
  },
  Stasis: {
    Bonds: {
      Super: -10,
    },
    Chains: {
      Class: 10,
    },
    Conduction: {
      Health: 10,
      Melee: 10,
    },
    Durance: {
      Melee: 10,
    },
    Fractures: {
      Grenade: 10,
    },
    Hunger: {
      Melee: -20,
    },
    Impetus: {
      Health: 10,
    },
    Torment: {
      Grenade: -10,
    },
  },
  Strand: {
    Ascent: {
      Weapons: 10,
    },
    Binding: {
      Health: 10,
    },
    Evolution: {
      Super: 10,
    },
    Finality: {
      Class: 10,
    },
    Fury: {
      Melee: -10,
    },
    Generation: {
      Grenade: -10,
    },
    Propagation: {
      Melee: 10,
    },
    Transmutation: {
      Melee: 10,
    },
    Warding: {
      Health: -10,
    },
  },
  Prismatic: {
    Awakening: {
      Health: 10,
    },
    Courage: {
      Grenade: 10,
    },
    Dawn: {
      Melee: -10,
    },
    Defiance: {
      Class: 10,
    },
    Devotion: {
      Melee: 10,
    },
    Dominance: {
      Grenade: -10,
    },
    Grace: {
      Health: -10,
    },
    Honor: {
      Melee: 10,
    },
    Justice: {
      Super: 10,
    },
    Protection: {
      Melee: 10,
    },
    Purpose: {
      Class: -10,
    },
    Ruin: {
      Weapons: 10,
    },
    Sacrifice: {
      Grenade: 10,
    },
  },
};

export const FRAGMENT_BG_MAP: Record<FragmentType, string> = {
  Arc: "bg-arc",
  Solar: "bg-solar",
  Void: "bg-void",
  Stasis: "bg-stasis",
  Strand: "bg-strand",
  Prismatic: "bg-prismatic",
};

export const FRAGMENT_DISPLAY_MAP = {
  Stasis: "Whisper of",
  Solar: "Ember of",
  Prismatic: "Facet of",
  Strand: "Thread of",
  Void: "Echo of",
  Arc: "Spark of",
};

export type FragmentCollection<T> = Record<Fragment<T>, boolean>;

export type FragmentState = {
  [K in FragmentType]: FragmentCollection<K>;
};

export const INITIAL_FRAGMENT_STATE: FragmentState = {
  Arc: {
    Brilliance: false,
    Discharge: false,
    Feedback: false,
    Focus: false,
    Resistance: false,
    Shock: false,
    Volts: false,
  },
  Solar: {
    Beams: false,
    Benevolence: false,
    Char: false,
    Combustion: false,
    Empyrean: false,
    Eruption: false,
    Mercy: false,
    Searing: false,
    Tempering: false,
    Torches: false,
    Wonder: false,
  },
  Void: {
    Dilation: false,
    Domineering: false,
    Expulsion: false,
    Harvest: false,
    Instability: false,
    Leeching: false,
    Obscurity: false,
    Persistence: false,
    Provision: false,
    Starvation: false,
    Undermining: false,
    Vigilance: false,
  },
  Stasis: {
    Bonds: false,
    Chains: false,
    Conduction: false,
    Durance: false,
    Fractures: false,
    Hunger: false,
    Impetus: false,
    Torment: false,
  },
  Strand: {
    Ascent: false,
    Binding: false,
    Evolution: false,
    Finality: false,
    Fury: false,
    Generation: false,
    Propagation: false,
    Transmutation: false,
    Warding: false,
  },
  Prismatic: {
    Awakening: false,
    Courage: false,
    Dawn: false,
    Defiance: false,
    Devotion: false,
    Dominance: false,
    Grace: false,
    Honor: false,
    Justice: false,
    Protection: false,
    Purpose: false,
    Ruin: false,
    Sacrifice: false,
  },
};
