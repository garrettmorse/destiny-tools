import { useState } from "react";
import ArchetypeDialog from "./ArchetypeDialog";
import type { Mods } from "../services/services";
import Slot from "./Slot";
import StatChart from "./StatChart";
import { ARMOR, getStats } from "../util";
import type { ArmorArchetype, ArmorKind, ArmorState } from "../util";
import "./Stats.css";

interface StatsProps {
  mods: Mods
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

  // @ts-expect-error cba
  const PLAYER_STATS = getStats(Object.keys(STATE_MAP).reduce((acc, armor) => ({ ...acc, [armor]: STATE_MAP[armor].get}), {}));

  console.log(PLAYER_STATS);
  let dialogTimeout: NodeJS.Timeout;
  const handleArchetypeEnter = (armor: ArmorKind) => {
    const el = document.getElementById(`dialog-${armor}`);
    el?.classList.toggle("fade-in");
    clearTimeout(dialogTimeout)
    setCurrentArmorHover(armor);
  }

  const handleArchetypeLeave = (armor: ArmorKind) => {
    const el = document.getElementById(`dialog-${armor}`);
    el?.classList.toggle("fade-out");
    dialogTimeout = setTimeout(() => setCurrentArmorHover(null), 200);
  };

  return (
      <div className="my-5">
        <div className="grid grid-cols-3 items-center">
          {ARMOR.map((armor, idx) =>
            (<div key={armor} className='col-span-3 grid grid-cols-subgrid'>
              <div className="relative col-span-1">
                <div className="flex items-center" onMouseEnter={() => handleArchetypeEnter(armor)} onMouseLeave={() => handleArchetypeLeave(armor)}>
                  <div className="text-center">
                    <p className='text-md'>{STATE_MAP[armor].get?.archetype ?? "Select Type"}</p>
                    <Slot identifier={idx} kind={STATE_MAP[armor].get?.archetype ?? armor} />
                  </div>
                    {currentArmorHover === armor && (
                      <div id={`dialog-${armor}`} className={`absolute left-full fade-in top-6 z-50`}>
                        <ArchetypeDialog
                        identifier={idx}
                        armor={armor} 
                        handleClick={(archetype: ArmorArchetype | null) => handleDialogClick(armor, archetype)} 
                        />
                      </div>
                    )}
                </div>
              </div>
              <div className='col-span-1'>this is where the tertiary selection goes</div>
              <div className='col-span-1'>this is where the mods go</div>
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