type ArmorStateBase = {
  mod: ModType;
  tuning: boolean;
  masterwork: boolean;
};

type ArmorStateMap = {
  [K in ArmorArchetype]: {
    archetype: K;
    tertiary: TertiaryArmorStat<K>[number];
  } & ArmorStateBase
};

export type ArmorState = ArmorStateMap[ArmorArchetype];

export type ArmorKind = "Helmet" | "Gloves" | "Chest" | "Boots" | "Class";

export type ArmorArchetype = "Brawler" | "Gunner" | "Specialist" | "Grenadier" | "Paragon" | "Bulwark";

export type StatType = "Weapons" | "Melee" | "Health" | "Super" | "Grenade" | "Class";

export const ARCHETYPES: ArmorArchetype[] = ["Gunner", "Brawler", "Bulwark", "Paragon", "Grenadier", "Specialist"] as const;

export const STATS: StatType[] = ["Weapons", "Melee", "Health", "Super", "Grenade", "Class"] as const;

export const MODS: ModType[] = ["Grenade Mod", "Minor Grenade Mod", 
  "Super Mod", "Minor Super Mod", 
  "Weapons Mod", "Minor Weapons Mod", 
  "Class Mod", "Minor Class Mod", 
  "Health Mod", "Minor Health Mod", 
  "Melee Mod", "Minor Melee Mod"];

export const ARMOR: ArmorKind[] = ["Helmet", "Gloves", "Chest", "Boots", "Class"] as const;

export const STAT_COUNT = {
  PRIMARY: 30,
  SECONDARY: 25,
  TERTIARY: 20,
  MAJOR_MOD: 10,
  MINOR_MOD: 5,
  MASTERWORK: 5,
} as const;

export const PRIMARY_STAT_ARCHETYPE_MAP: Record<StatType, ArmorArchetype> = {
  Class: 'Specialist',
  Grenade: 'Grenadier',
  Weapons: 'Gunner',
  Super: 'Paragon',
  Health: 'Bulwark',
  Melee: 'Brawler'
} as const;

export const ARCHETYPE_PRIMARY_STAT_MAP: Record<ArmorArchetype, StatType> = {
  Specialist: 'Class',
  Grenadier: 'Grenade',
  Gunner: 'Weapons',
  Paragon: 'Super',
  Bulwark: 'Health',
  Brawler: 'Melee'
} as const;

export const ARCHETYPE_SECONDARY_STAT_MAP: Record<ArmorArchetype, StatType> = {
  Specialist: 'Weapons',
  Grenadier: 'Super',
  Gunner: 'Grenade',
  Paragon: 'Melee',
  Bulwark: 'Class',
  Brawler: 'Health'
} as const;

interface ArmorArchetypeConfig<T extends ArmorArchetype> {
  PRIMARY: StatType,
  SECONDARY: StatType,
  TERTIARY: Exclude<StatType, T extends "Brawler"
  ? 'Melee' | 'Health' | 'Weapons'
  : T extends "Gunner"
  ? 'Weapons' | 'Grenade' | 'Melee'
  : T extends "Specialist"
  ? 'Class' | 'Weapons' | 'Super'
  : T extends "Grenadier"
  ? 'Grenade' | 'Super' | 'Health'
  : T extends "Paragon"
  ? 'Super' | 'Melee' | 'Class'
  : T extends "Bulwark"
  ? 'Health' | 'Class' | 'Grenade'
  : never>;
};

type TertiaryArmorStat<T extends ArmorArchetype> = ArmorArchetypeConfig<T>["TERTIARY"];

export const ARCHETYPE_TERTIARY_STAT_MAP: {[K in ArmorArchetype]: TertiaryArmorStat<K>[] } = {
  Brawler: ["Grenade", "Super", "Class"],
  Bulwark: ["Melee", "Super", "Weapons"],
  Grenadier: ["Class", "Melee", "Weapons"],
  Gunner: ["Super", "Class", "Health"],
  Specialist: ["Grenade", "Health", "Melee"],
  Paragon: ["Grenade", "Health", "Weapons"],
} as const;

export const MOD_STAT_MAP = {
"Grenade Mod": ["Grenade", STAT_COUNT.MAJOR_MOD],
"Minor Grenade Mod": ["Grenade", STAT_COUNT.MINOR_MOD],
"Super Mod": ["Super", STAT_COUNT.MAJOR_MOD],
"Minor Super Mod": ["Super", STAT_COUNT.MINOR_MOD],
"Weapons Mod": ["Weapons", STAT_COUNT.MAJOR_MOD],
"Minor Weapons Mod": ["Weapons", STAT_COUNT.MINOR_MOD],
"Class Mod": ["Class", STAT_COUNT.MAJOR_MOD],
"Minor Class Mod": ["Class", STAT_COUNT.MINOR_MOD],
"Health Mod": ["Health", STAT_COUNT.MAJOR_MOD],
"Minor Health Mod": ["Health", STAT_COUNT.MINOR_MOD],
"Melee Mod": ["Melee", STAT_COUNT.MAJOR_MOD],
"Minor Melee Mod": ["Melee", STAT_COUNT.MINOR_MOD],
} as const;

export type ModType = keyof typeof MOD_STAT_MAP;

export const getStats = (archetypes: Record<ArmorKind, ArmorState | null>) => {
  const stats: Record<StatType, number> = {
    Class: 0,
    Health: 0,
    Grenade: 0,
    Super: 0,
    Weapons: 0,
    Melee: 0
  };

  for (const armor of Object.keys(archetypes) as ArmorKind[]) {
    if (!archetypes[armor]?.archetype) {
      continue;
    }
    const { archetype } = archetypes[armor]
    const primaryStat = ARCHETYPE_PRIMARY_STAT_MAP[archetype];
    const secondaryStat = ARCHETYPE_SECONDARY_STAT_MAP[archetype];
    const tertiaryStat = archetypes[armor]?.tertiary as StatType;
    stats[primaryStat] += STAT_COUNT.PRIMARY;
    stats[secondaryStat] += STAT_COUNT.SECONDARY;
    if (tertiaryStat) {
      stats[tertiaryStat] += STAT_COUNT.TERTIARY;
    }
    if (archetypes[armor].mod) {
      const [stat, amount] = MOD_STAT_MAP[archetypes[armor].mod as ModType];
      stats[stat] += amount;
    }
    if (archetypes[armor].masterwork && tertiaryStat) {
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