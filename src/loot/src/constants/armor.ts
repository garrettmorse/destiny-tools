// Archetype definitions and mappings

export const archetypes = [
  "Gunner",
  "Grenadier",
  "Paragon",
  "Brawler",
  "Bulwark",
  "Specialist",
] as const;

export const tertiaryStats = [
  "Weapons",
  "Grenade",
  "Super",
  "Melee",
  "Health",
  "Class",
] as const;

// Map archetype to Tailwind color classes
export const archetypeColors: { [key: string]: { [key: string]: string } } = {
  bg: {
    Specialist: "bg-purple-600",
    Gunner: "bg-red-600",
    Bulwark: "bg-blue-600",
    Grenadier: "bg-green-600",
    Paragon: "bg-yellow-600",
    Brawler: "bg-orange-600",
  },
  text: {
    Specialist: "text-purple-600",
    Gunner: "text-red-600",
    Bulwark: "text-blue-600",
    Grenadier: "text-green-600",
    Paragon: "text-yellow-600",
    Brawler: "text-orange-600",
  },
};

// Map archetype to primary and secondary stats
export const archetypeStatMapping: {
  [key: string]: { primary: string; secondary: string };
} = {
  Specialist: { primary: "Class", secondary: "Weapons" },
  Gunner: { primary: "Weapons", secondary: "Grenade" },
  Bulwark: { primary: "Health", secondary: "Class" },
  Grenadier: { primary: "Grenade", secondary: "Super" },
  Paragon: { primary: "Super", secondary: "Melee" },
  Brawler: { primary: "Melee", secondary: "Health" },
};

export const primaryStatArchetypeMapping: {
  [key: string]: string;
} = {
  Grenade: "Grenadier",
  Class: "Specialist",
  Weapons: "Gunner",
  Super: "Paragon",
  Health: "Bulwark",
  Melee: "Brawler",
};

export type Archetype = (typeof archetypes)[number];
export type TertiaryStat = (typeof tertiaryStats)[number];
