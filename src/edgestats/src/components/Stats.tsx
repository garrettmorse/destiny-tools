import { useState } from "react";
import Dialog from "./Dialog";
import Slot from "./Slot";
import StatChart from "./StatChart";
import { ARMOR, getStats, PRIMARY_STAT_ARCHETYPE_MAP, useSearchParamEncoder } from "../util";
import { type ArmorArchetype, type ArmorKind, type ArmorState, ARCHETYPE_TERTIARY_STAT_MAP, type StatType, type ModType } from "../util";
import "./Stats.css";
import { useSearchParams } from "react-router";

const Stats: React.FC = () => {
  const { decodeFromUrl, encodeToUrl } = useSearchParamEncoder();
  const [, setSearchParams] = useSearchParams();
  const params = decodeFromUrl(window.location.href);
  const [helmetArchetype, setHelmetArchetype] = useState<ArmorState | null>(params.Helmet as unknown as ArmorState);
  const [glovesArchetype, setGlovesArchetype] = useState<ArmorState | null>(params.Gloves as unknown as ArmorState);
  const [chestArchetype, setChestArchetype] = useState<ArmorState | null>(params.Chest as unknown as ArmorState);
  const [bootsArchetype, setBootsArchetype] = useState<ArmorState | null>(params.Boots as unknown as ArmorState);
  const [classItemArchetype, setClassItemArchetype] = useState<ArmorState | null>(params.Class as unknown as ArmorState);
  const [currentArchetypeHover, setCurrentArchetypeHover] = useState<ArmorKind | null>(null);
  const [currentTertiaryHover, setCurrentTertiaryHover] = useState<ArmorKind | null>(null);
  const [currentModHover, setCurrentModHover] = useState<ArmorKind | null>(null);
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

  const handleArchetypeDialogClick = (armorKind: ArmorKind, archetype: ArmorArchetype | null) => {
    // handle illegal tertiary
    let tertiary = STATE_MAP[armorKind].get?.tertiary;
    if (STATE_MAP[armorKind].get?.tertiary) {
      // tertiary is illegal if incoming archetype does not support tertiary
      if (archetype && !ARCHETYPE_TERTIARY_STAT_MAP[archetype].includes(tertiary as never)) {
        tertiary = undefined;
      }
    }
    const encodedParams = encodeToUrl(Object.keys(STATE_MAP).reduce((acc, armor) => {
        const key = armor as keyof typeof STATE_MAP;
        const _archetype = armor === armorKind ? archetype : STATE_MAP[key].get?.archetype;
        // @ts-expect-error cba
        acc[armor] = [_archetype, STATE_MAP[key].get?.tertiary, STATE_MAP[key].get?.mod];
        return acc;
      }, {}));
    STATE_MAP[armorKind].set({
      ...STATE_MAP[armorKind].get,
      // @ts-expect-error cba
      archetype,
      // @ts-expect-error cba
      tertiary
    });
    setSearchParams(encodedParams);
  }

  const handleTertiaryDialogClick = (armorKind: ArmorKind, stat: StatType | null) => {
    const encodedParams = encodeToUrl(Object.keys(STATE_MAP).reduce((acc, armor) => {
        const key = armor as keyof typeof STATE_MAP;
        const _stat = armor === armorKind ? stat : STATE_MAP[key].get?.tertiary;
        // @ts-expect-error cba
        acc[armor] = [STATE_MAP[key].get?.archetype, _stat, STATE_MAP[key].get?.mod];
        return acc;
      }, {}));
    STATE_MAP[armorKind].set({
      ...STATE_MAP[armorKind].get,
      // @ts-expect-error cba
      tertiary: stat
    });
    setSearchParams(encodedParams);
  };

  const handleModDialogClick = (armorKind: ArmorKind, mod: ModType | null) => {
    const encodedParams = encodeToUrl(Object.keys(STATE_MAP).reduce((acc, armor) => {
        const key = armor as keyof typeof STATE_MAP;
        const _mod = armor === armorKind ? mod : STATE_MAP[key].get?.mod;
        // @ts-expect-error cba
        acc[armor] = [STATE_MAP[key].get?.archetype, STATE_MAP[key].get?.tertiary, _mod];
        return acc;
      }, {}));
    STATE_MAP[armorKind].set({
      ...STATE_MAP[armorKind].get,
      // @ts-expect-error cba
      mod
    });
    setSearchParams(encodedParams);
  };

  // @ts-expect-error cba
  const PLAYER_STATS = getStats(Object.keys(STATE_MAP).reduce((acc, armor) => ({ ...acc, [armor]: STATE_MAP[armor].get}), {}));

  let archetypeTimeout: NodeJS.Timeout;
  const handleArchetypeEnter = (armor: ArmorKind) => {
    const el = document.getElementById(`dialog-${armor}`);
    el?.classList.toggle("fade-in");
    clearTimeout(archetypeTimeout)
    setCurrentArchetypeHover(armor);
  }

  const handleArchetypeLeave = (armor: ArmorKind) => {
    const el = document.getElementById(`archetype-dialog-${armor}`);
    el?.classList.toggle("fade-out");
    archetypeTimeout = setTimeout(() => setCurrentArchetypeHover(null), 100);
  };

  let tertiaryTimeout: NodeJS.Timeout;
  const handleTertiaryEnter = (armor: ArmorKind) => {
    const el = document.getElementById(`tertiary-dialog-${armor}`);
    el?.classList.toggle("fade-in");
    clearTimeout(tertiaryTimeout);
    setCurrentTertiaryHover(armor);
  }

  const handleTertiaryLeave = (armor: ArmorKind) => {
    const el = document.getElementById(`tertiary-dialog-${armor}`);
    el?.classList.toggle("fade-out");
    tertiaryTimeout = setTimeout(() => setCurrentTertiaryHover(null), 100);
  }

  let modTimeout: NodeJS.Timeout;
  const handleModEnter = (armor: ArmorKind) => {
    const el = document.getElementById(`mod-dialog-${armor}`);
    el?.classList.toggle("fade-in");
    clearTimeout(modTimeout);
    setCurrentModHover(armor);
  }

  const handleModLeave = (armor: ArmorKind) => {
    const el = document.getElementById(`mod-dialog-${armor}`);
    el?.classList.toggle("fade-out");
    modTimeout = setTimeout(() => setCurrentModHover(null), 100);
  }

  return (
      <div className="my-5">
        <div className="grid grid-cols-3 items-center">
          <div className="max-sm:text-lg sm:text-2xl font-bold text-center">Archetype</div>
          <div className="max-sm:text-lg sm:text-2xl font-bold text-center">Tertiary</div>
          <div className="max-sm:text-lg sm:text-2xl font-bold text-center">Mod</div>
          {ARMOR.map((armor, idx) =>
            (<div key={armor} className='place-items-center col-span-3 grid grid-cols-subgrid'>
              <div className=" col-span-1">
                <div className="flex flex-col items-center" onMouseEnter={() => handleArchetypeEnter(armor)} onMouseLeave={() => handleArchetypeLeave(armor)}>
                  <div className="text-center place-items-center">
                    <p className='max-sm:text-xs sm:text-sm'>{STATE_MAP[armor].get?.archetype ?? "Select Type"}</p>
                  </div>
                  <div className="relative">
                    <Slot identifier={`archetype-${idx}`} kind={STATE_MAP[armor].get?.archetype ?? armor} />
                    {currentArchetypeHover === armor && (
                      <div id={`archetype-dialog-${armor}`} className="absolute max-xl:left-full xl:right-full fade-in -top-1 z-50">
                        <Dialog
                        identifier={idx}
                        armor={armor} 
                        archetype
                        handleClick={(archetype: ArmorArchetype | null) => handleArchetypeDialogClick(armor, archetype)} 
                        />
                      </div>
                    )}
                  </div>
                </div>
              </div>
              <div className={`col-span-1 ${STATE_MAP[armor].get?.archetype ? '' : 'select-none pointer-events-none opacity-40'}`}>
                <div className="flex flex-col items-center" onMouseEnter={() => handleTertiaryEnter(armor)} onMouseLeave={() => handleTertiaryLeave(armor)}>
                  <div className="text-center place-items-center">
                    <p className='max-sm:text-xs sm:text-sm text-center'>{STATE_MAP[armor].get?.tertiary ?? "Select Tertiary"}</p>
                  </div>
                  <div className="relative">
                    <Slot identifier={`tertiary-${idx}`} kind={PRIMARY_STAT_ARCHETYPE_MAP[STATE_MAP[armor].get?.tertiary as StatType] ?? armor} />
                    {currentTertiaryHover === armor && (
                      <div id={`tertiary-dialog-${armor}`} className={`absolute fade-in max-sm:top-12 max-sm:-left-[58px] sm:top-25 sm:-left-27 z-50`}>
                        {/* @ts-expect-error cba */}
                        <Dialog 
                        identifier={idx}
                        armor={armor}
                        tertiary
                        withArchetype={STATE_MAP[armor].get?.archetype}
                        handleClick={(tertiary: StatType | null) => handleTertiaryDialogClick(armor, tertiary)}
                        />
                      </div>
                    )}
                  </div>
                </div>
              </div>
              <div className={`col-span-1`}>
                <div className="flex flex-col items-center" onMouseEnter={() => handleModEnter(armor)} onMouseLeave={() => handleModLeave(armor)}>
                  <div className="text-center place-items-center">
                    <p className='max-sm:text-xs sm:text-sm'>{STATE_MAP[armor].get?.mod?.slice(0, -3) ?? "Select Mod"}</p>
                  </div>
                  <div className="relative">
                    <Slot identifier={`mod-${idx}`} kind={STATE_MAP[armor].get?.mod as ModType ?? 'Mod'} />
                    {currentModHover === armor && (
                      <div id={`mod-dialog-${armor}`} className={`absolute max-xl:right-full xl:left-full fade-in -top-1 z-50`}>
                        <Dialog 
                        identifier={idx}
                        armor={armor}
                        mod
                        handleClick={(mod: ModType | null) => handleModDialogClick(armor, mod)}
                        />
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
                )
          )}
        </div>
          <StatChart 
            {...PLAYER_STATS}
          />
      </div>
  );
}


export default Stats;