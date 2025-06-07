import { useState } from "react";
import ArchetypeDialog from "./ArchetypeDialog";
import type { Mods } from "../services/services";
import Slot from "./Slot";
interface StatsProps {
  mods: Mods
};

export type ArmorKind = "Helmet" | "Gloves" | "Chest" | "Boots" | "Class";

export type ArmorArchetype = "Brawler" | "Gunner" | "Specialist" | "Grenadier" | "Paragon" | "Bulwark";

export type StatType = "Weapons" | "Melee" | "Health" | "Super" | "Grenade" | "Class";

interface ArmorState {
  archetype: ArmorArchetype;
  kind: Partial<ArmorArchetypeOptions[ArmorState["archetype"]]>;
  mod: string;
  tuning: boolean;
  masterwork: boolean;
};

interface ArmorArchetypeOptions {
  Brawler: {
    PRIMARY: 'Melee',
    SECONDARY: 'Health',
    TERTIARY: Omit<StatType, 'Melee' | 'Health' | 'Weapons'>
  };
  Gunner: {
    PRIMARY: 'Weapons',
    SECONDARY: 'Grenade',
    TERTIARY: Omit<StatType, 'Weapons' | 'Grenade' | 'Melee'>
  };
  Specialist: {
    PRIMARY: 'Class',
    SECONDARY: 'Weapons',
    TERTIARY: Omit<StatType, 'Class' | 'Weapons' | 'Super'>
  };
  Grenadier: {
    PRIMARY: 'Grenade',
    SECONDARY: 'Super',
    TERTIARY: Omit<StatType, 'Grenade' | 'Super' | 'Health'>
  };
  Paragon: {
    PRIMARY: 'Super',
    SECONDARY: 'Melee',
    TERTIARY: Omit<StatType, 'Super' | 'Melee' | 'Class'>
  };
  Bulwark: {
    PRIMARY: 'Health',
    SECONDARY: 'Class',
    TERTIARY: Omit<StatType, 'Health' | 'Class' | 'Grenade'>
  };
};

const ARMOR = ["Helmet", "Gloves", "Chest", "Boots", "Class"] as const;

const STAT_COUNT_MAP = {
  PRIMARY: 30,
  SECONDARY: 25,
  TERTIARY: 20
} as const;

const STAT_ARCHETYPE_MAP: Record<StatType, ArmorArchetype> = {
  Class: 'Specialist',
  Grenade: 'Grenadier',
  Weapons: 'Gunner',
  Super: 'Paragon',
  Health: 'Bulwark',
  Melee: 'Brawler'
};

const Stats: React.FC<StatsProps> = ({ mods }) => {
  const [helmetArchetype, setHelmetArchetype] = useState<ArmorState | null>(null);
  const [glovesArchetype, setGlovesArchetype] = useState<ArmorState | null>(null);
  const [chestArchetype, setChestArchetype] = useState<ArmorState | null>(null);
  const [bootsArchetype, setBootsArchetype] = useState<ArmorState | null>(null);
  const [classItemArchetype, setClassItemArchetype] = useState<ArmorState | null>(null);
  const [currentArmorHover, setCurrentArmorHover] = useState<ArmorKind | null>(null);
  
  const STATE_MAP = {
    Helmet: {
      get: helmetArchetype,
      set: setHelmetArchetype,
    },
    Gloves: {
      get: glovesArchetype, 
      set: setGlovesArchetype
    },
    Chest: { 
      get: chestArchetype, 
      set: setChestArchetype
    },
    Boots: {
      get: bootsArchetype, 
      set: setBootsArchetype
    },
    Class: {
      get: classItemArchetype, 
      set: setClassItemArchetype
    }
  };

  const handleDialogClick = (armorKind: ArmorKind, archetype: ArmorArchetype | null) => {
    
    STATE_MAP[armorKind].set({
      ...STATE_MAP[armorKind].get,
      // @ts-expect-error cba
      archetype
    });
  };

  const handleArchetypeLeave = () => {
    setCurrentArmorHover(null);
  };

  return (
      <div className="my-5">
        <div className="flex flex-col items-center">
          {ARMOR.map(armor => 
            (<div className="relative" key={armor}>
              <div className="flex items-center" onMouseEnter={() => setCurrentArmorHover(armor)}>
                <div className="text-center">
                  <p className='text-md'>{STATE_MAP[armor].get?.archetype ?? "Select Type"}</p>
                  <Slot kind={STATE_MAP[armor].get?.archetype ?? armor} />
                </div>
                  {currentArmorHover === armor && (
                    <div onMouseLeave={handleArchetypeLeave} className="absolute left-full top-6 z-50">
                      <ArchetypeDialog 
                      armor={armor} 
                      handleClick={(archetype: ArmorArchetype | null) => handleDialogClick(armor, archetype)} 
                      />
                    </div>
                  )}
              </div>
            </div>)
          )}
        </div>
      </div>
  );
}

const STAT = ["Gunner", "Brawler", "Bulwark", "Paragon", "Grenadier", "Specialist"] as const;


export default Stats;