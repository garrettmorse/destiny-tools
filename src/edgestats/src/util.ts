interface ArmorArchetypeOptions {
  Brawler: {
    PRIMARY: 'Melee',
    SECONDARY: 'Health',
    TERTIARY: Exclude<StatType, 'Melee' | 'Health' | 'Weapons'>
  };
  Gunner: {
    PRIMARY: 'Weapons',
    SECONDARY: 'Grenade',
    TERTIARY: Exclude<StatType, 'Weapons' | 'Grenade' | 'Melee'>
  };
  Specialist: {
    PRIMARY: 'Class',
    SECONDARY: 'Weapons',
    TERTIARY: Exclude<StatType, 'Class' | 'Weapons' | 'Super'>
  };
  Grenadier: {
    PRIMARY: 'Grenade',
    SECONDARY: 'Super',
    TERTIARY: Exclude<StatType, 'Grenade' | 'Super' | 'Health'>
  };
  Paragon: {
    PRIMARY: 'Super',
    SECONDARY: 'Melee',
    TERTIARY: Exclude<StatType, 'Super' | 'Melee' | 'Class'>
  };
  Bulwark: {
    PRIMARY: 'Health',
    SECONDARY: 'Class',
    TERTIARY: Exclude<StatType, 'Health' | 'Class' | 'Grenade'>
  };
};

export interface ArmorState {
  archetype: ArmorArchetype;
  tertiary: ArmorArchetypeOptions[ArmorState["archetype"]]['TERTIARY']
  mod: string;
  tuning: boolean;
  masterwork: boolean;
};

export type ArmorKind = "Helmet" | "Gloves" | "Chest" | "Boots" | "Class";

export type ArmorArchetype = "Brawler" | "Gunner" | "Specialist" | "Grenadier" | "Paragon" | "Bulwark";

export type StatType = "Weapons" | "Melee" | "Health" | "Super" | "Grenade" | "Class";

export const STATS: StatType[] = ["Weapons", "Melee", "Health", "Super", "Grenade", "Class"] as const;

export const ARMOR: ArmorKind[] = ["Helmet", "Gloves", "Chest", "Boots", "Class"] as const;

export const ARCHETYPES: ArmorArchetype[] = ["Gunner", "Brawler", "Bulwark", "Paragon", "Grenadier", "Specialist"] as const;

export const STAT_COUNT = {
  PRIMARY: 30,
  SECONDARY: 25,
  TERTIARY: 20,
  MAJOR_MOD: 10,
  MINOR_MOD: 5,
  MASTERWORK: 5,
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

export const MOD_STAT_MAP: Record<string, [StatType, number]> = {
"Discipline Mod": ["Grenade", STAT_COUNT.MAJOR_MOD],
"Minor Discipline Mod": ["Grenade", STAT_COUNT.MINOR_MOD],
"Intellect Mod": ["Super", STAT_COUNT.MAJOR_MOD],
"Minor Intellect Mod": ["Super", STAT_COUNT.MINOR_MOD],
"Mobility Mod": ["Class", STAT_COUNT.MAJOR_MOD],
"Minor Mobility Mod": ["Class", STAT_COUNT.MINOR_MOD],
"Recovery Mod": ["Health", STAT_COUNT.MAJOR_MOD],
"Minor Recovery Mod": ["Health", STAT_COUNT.MINOR_MOD],
"Resilience Mod": ["Weapons", STAT_COUNT.MAJOR_MOD],
"Minor Resilience Mod": ["Weapons", STAT_COUNT.MINOR_MOD],
"Strength Mod": ["Melee", STAT_COUNT.MAJOR_MOD],
"Minor Strength Mod": ["Melee", STAT_COUNT.MINOR_MOD],
} as const;

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
    const tertiaryStat = archetypes[armor]?.tertiary;
    stats[primaryStat] += STAT_COUNT.PRIMARY;
    stats[secondaryStat] += STAT_COUNT.SECONDARY;
    if (tertiaryStat) {
      stats[tertiaryStat] += STAT_COUNT.TERTIARY;
    }
    if (archetypes[armor].mod) {
      const [stat, amount] = MOD_STAT_MAP[archetypes[armor].mod];
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
}

export {
  getStats
};