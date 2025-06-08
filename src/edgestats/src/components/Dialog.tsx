import Slot from "./Slot";
import type { ArmorArchetype, ArmorKind, StatType, ModType } from "../util";
import { ARCHETYPES, MODS, ARCHETYPE_TERTIARY_STAT_MAP, PRIMARY_STAT_ARCHETYPE_MAP } from "../util";
import "./Dialog.css";

interface BaseProps {
  armor: ArmorKind;
  identifier: number;
}

interface ArchetypeProps {
  archetype: true;
  mod?: never
  tertiary?: never;
  withArchetype?: never;
  handleClick: (s: ArmorArchetype | null) => void;
};

interface ModProps {
  archetype?: never;
  mod: true;
  tertiary?: never;
  withArchetype?: never;
  handleClick: (s: ModType | null) => void;
};

interface TertiaryProps {
  archetype?: never;
  mod?: never;
  tertiary: true;
  withArchetype: ArmorArchetype;
  handleClick: (s: StatType | null) => void;
};

type DialogProps = BaseProps & (ArchetypeProps | ModProps | TertiaryProps)

const Dialog: React.FC<DialogProps> = (props) => {
  const { armor, identifier, handleClick } = props;
  // 3x2 grid
  return (
    <div className="bg-dialog grid grid-cols-3 min-w-[300px] gap-y-[1px] gap-x-2 mx-2 place-items-center">
      <div className="group relative">
        <span className="left-[50%] -top-6 pointer-events-none translate-x-[-50%] absolute group-hover:opacity-100 transition-opacity bg-purple-800 px-1 text-lg text-gray-100 rounded-md opacity-0 text-center z-100">None</span>
        <div className="cursor-pointer" onClick={() => handleClick(null)}><Slot light animate kind={props.mod ? 'Mod' : armor} /></div>
      </div>
      
      {props.archetype && ARCHETYPES.map((archetype, idx) => (
          <div className="group relative cursor-pointer place-items-center" key={archetype} onClick={() => {
            /* @ts-expect-error cba */
           return handleClick(archetype); 
           }}>
            <span className="left-[50%] -top-6 pointer-events-none translate-x-[-50%] absolute group-hover:opacity-100 transition-opacity bg-purple-800 px-1 text-lg text-gray-100 rounded-md opacity-0 text-center z-100">{archetype}</span>
            <Slot identifier={identifier + "-" + idx} animate kind={archetype} />
          </div>
      ))}

      {props.tertiary && ARCHETYPE_TERTIARY_STAT_MAP[props.withArchetype].map((stat, idx) => (
        <div className="group relative cursor-pointer place-items-center" key={stat} onClick={() => {
            /* @ts-expect-error cba */
           return handleClick(stat); 
           }}>
            <span className="left-[50%] -top-13 pointer-events-none translate-x-[-50%] absolute group-hover:opacity-100 transition-opacity bg-purple-800 px-1 text-lg text-gray-100 rounded-md opacity-0 text-center z-100">{stat} +20</span>
           <Slot identifier={identifier + "-" + idx} animate kind={PRIMARY_STAT_ARCHETYPE_MAP[stat]} />
        </div>
      ))}

      {props.mod && MODS.map((mod, idx) => (
        <div className="group relative cursor-pointer place-items-center" key={mod} onClick={() => {
            /* @ts-expect-error cba */
           return handleClick(mod);
           }}>
          <span className="left-[50%] -top-13 pointer-events-none translate-x-[-50%] absolute group-hover:opacity-100 transition-opacity bg-purple-800 px-1 text-lg text-gray-100 rounded-md opacity-0 text-center z-100">{mod} {mod.indexOf("Minor") > -1 ? '+5' : '+10'}</span>
          <Slot identifier={identifier + '-' + idx} animate kind={mod} />
        </div>
      ))}
    </div>
  );
};

export default Dialog;