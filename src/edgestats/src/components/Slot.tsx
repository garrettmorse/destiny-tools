import { MOD_STAT_MAP } from "../util";
import "./Slot.css";

const ARMOR = ["Helmet", "Gloves", "Class", "Chest", "Boots"] as const;

type ArmorKind = "Helmet" | "Gloves" | "Chest" 
| "Class" | "Boots";

type ArchetypeKind = "Specialist" | "Grenadier" | "Bulwark" 
| "Brawler" | "Paragon" | "Gunner" | "Mod";

type ModKind = "Minor Class Mod" | "Class Mod" | 
"Health Mod" | "Minor Health Mod" | 
"Super Mod" | "Minor Super Mod" | 
"Weapons Mod" | "Minor Weapons Mod" | 
"Melee Mod" | "Minor Melee Mod" | 
"Grenade Mod" | "Minor Grenade Mod"; 

type SlotKind = ArmorKind | ArchetypeKind | ModKind;

interface SlotProps {
  identifier?: string | number
  light?: boolean
  animate?: boolean
  kind: SlotKind
}

const MODS = Object.keys(MOD_STAT_MAP) as (keyof typeof MOD_STAT_MAP)[];

const Slot: React.FC<SlotProps> = ({ identifier, kind, light, animate }) => {
  /* @ts-expect-error cant be asked */
  const slotKind = ARMOR.indexOf(kind) > -1 ? "armor" : MODS.indexOf(kind) > -1 ? "mod" : "stat";
  const fileType = slotKind === "mod" ? "png" : "svg";
  const fileName = (slotKind === "mod" ? kind.slice(0, 5) === "Minor" ? kind.split(" ").slice(0,2).join("_") : `Major ${kind}`.split(" ").slice(0,2).join("_") : kind).toLowerCase();
  const handleSlotClick = () => {
    if (animate) {
      const el = document.getElementById(`slot-${kind}-${identifier}`);
      el?.classList.toggle('slot-click');
      el?.classList.toggle('slot-animate');
      setTimeout(() => {
        el?.classList.toggle('slot-click');
      }, 300);
      setTimeout(() => {
        el?.classList.toggle('slot-animate');
      }, 500);
    }
  };

  return (
      <div onClick={handleSlotClick} className='hover:ring-1 relative min-w-[100px] min-h-[100px]'>
          <img className={light ? 'slot-outer' : ''} src='./slot.svg' width={100} height={100} />
          <div id={`slot-${kind}-${identifier}`} className='slot absolute inset-0 flex'>
            <img className={`${slotKind === "mod" ? "" : "slot-inner"}`} src={`./${slotKind}/${fileName}.${fileType}`} />
          </div>
      </div>
  );
}


export default Slot;