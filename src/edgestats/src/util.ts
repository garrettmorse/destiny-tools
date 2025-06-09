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
      ? "Melee" | "Health" | "Weapons"
      : T extends "Gunner"
      ? "Weapons" | "Grenade" | "Melee"
      : T extends "Specialist"
      ? "Class" | "Weapons" | "Super"
      : T extends "Grenadier"
      ? "Grenade" | "Super" | "Health"
      : T extends "Paragon"
      ? "Super" | "Melee" | "Class"
      : T extends "Bulwark"
      ? "Health" | "Class" | "Grenade"
      : never
  >;
}

type TertiaryArmorStat<T extends ArmorArchetype> =
  ArmorArchetypeConfig<T>["TERTIARY"];

export const ARCHETYPE_TERTIARY_STAT_MAP: {
  [K in ArmorArchetype]: TertiaryArmorStat<K>[];
} = {
  Brawler: ["Grenade", "Super", "Class"],
  Bulwark: ["Melee", "Super", "Weapons"],
  Grenadier: ["Class", "Melee", "Weapons"],
  Gunner: ["Super", "Class", "Health"],
  Specialist: ["Grenade", "Health", "Melee"],
  Paragon: ["Grenade", "Health", "Weapons"],
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
      const [stat, amount] = MOD_STAT_MAP[archetypes[armor].mod as ModType];
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

const PARAM_CODES = {
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

const ARMOR_PARAMS = {
  Helmet: "h",
  Gloves: "g",
  Chest: "c",
  Boots: "b",
  Class: "l",
} as const;

// Reverse lookup maps for decoding
const PARAM_CODES_REVERSE = Object.fromEntries(
  Object.entries(PARAM_CODES).map(([key, value]) => [value, key])
) as Record<number, keyof typeof PARAM_CODES>;

// const ARMOR_PARAMS_REVERSE = Object.fromEntries(
//   Object.entries(ARMOR_PARAMS).map(([key, value]) => [value, key])
// ) as Record<string, keyof typeof ARMOR_PARAMS>;

// Type definitions
type ParamCode = keyof typeof PARAM_CODES;
type ArmorParam = keyof typeof ARMOR_PARAMS;
type ArmorSlotParams = Partial<Record<ArmorParam, ParamCode[]>>;

// Encoding/Decoding utilities
class SearchParamEncoder {
  /**
   * Encodes an array of selected parameters into a compact base36 string
   * @param params Array of parameter names
   * @returns Base36 encoded string
   */
  static encodeParamList(params: ParamCode[]): string {
    if (params.length === 0) return "";
    const codes = params
      .filter((param) => !!param)
      .map((param) => PARAM_CODES[param])
      .sort((a, b) => a - b); // Sort for consistent encoding

    return codes.map((code) => code.toString(36)).join("");
  }

  /**
   * Decodes a compact string back into parameter names
   * @param encoded Base36 encoded string
   * @returns Array of parameter names
   */
  static decodeParamList(encoded: string): ParamCode[] {
    if (!encoded) return [];

    // Handle multi-character base36 numbers by trying different parsing strategies
    const codes: number[] = [];
    let i = 0;

    while (i < encoded.length) {
      // Try parsing 2-character sequences first (for numbers > 35)
      if (i + 1 < encoded.length) {
        const twoChar = parseInt(encoded.slice(i, i + 2), 36);
        if (twoChar in PARAM_CODES_REVERSE && twoChar > 35) {
          codes.push(twoChar);
          i += 2;
          continue;
        }
      }

      // Parse single character
      const oneChar = parseInt(encoded[i], 36);
      if (oneChar in PARAM_CODES_REVERSE) {
        codes.push(oneChar);
      }
      i++;
    }

    return codes.sort((a, b) => a - b).map((code) => PARAM_CODES_REVERSE[code]);
  }

  /**
   * Creates a complete search URL with per-armor-slot encoded parameters
   * @param armorParams Object mapping armor slots to their parameter arrays
   * @returns Complete URL with encoded parameters
   */
  static createSearchUrl(armorParams: ArmorSlotParams = {}): string {
    const searchParams = new URLSearchParams();

    // Encode each armor slot's parameters
    Object.entries(armorParams).forEach(([armorSlot, params]) => {
      if (params && params.length > 0) {
        const armorCode = ARMOR_PARAMS[armorSlot as ArmorParam];
        const encodedParams = this.encodeParamList(params);
        if (encodedParams) {
          searchParams.set(armorCode, encodedParams);
        }
      }
    });

    return searchParams.toString();
  }

  /**
   * Parses a search URL and returns decoded parameters per armor slot
   * @param url Full URL or search params string
   * @returns Decoded parameters organized by armor slot
   */
  static parseSearchUrl(url: string): Record<string, Record<string, string>> {
    const urlObj = new URL(url);
    const searchParams = urlObj.searchParams;
    const result: Record<string, Record<string, string>> = {};

    // Check each armor slot code in the URL
    Object.entries(ARMOR_PARAMS).forEach(([armorSlot, armorCode]) => {
      const encodedParams = searchParams.get(armorCode);
      if (encodedParams) {
        const decodedParams = this.decodeParamList(encodedParams);
        const mappedParams = decodedParams.reduce(
          (params, param) => ({ ...params, [SLOT_MAP[param]]: param }),
          {}
        );
        if (decodedParams.length > 0) {
          result[armorSlot as ArmorParam] = mappedParams as Record<
            string,
            string
          >;
        }
      }
    });

    return result;
  }
}

export const useSearchParamEncoder = () => {
  const encodeToUrl = (armorParams: ArmorSlotParams) => {
    return SearchParamEncoder.createSearchUrl(armorParams);
  };

  const decodeFromUrl = (
    url: string = window.location.href
  ): ArmorSlotParams => {
    return SearchParamEncoder.parseSearchUrl(url);
  };

  return { encodeToUrl, decodeFromUrl };
};
