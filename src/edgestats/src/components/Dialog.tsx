import Slot from "./Slot";
import type { ArmorArchetype, ArmorKind, StatType, ModType } from "../util";
import {
  ARCHETYPES,
  MODS,
  ARCHETYPE_PRIMARY_STAT_MAP,
  ARCHETYPE_SECONDARY_STAT_MAP,
  ARCHETYPE_TERTIARY_STAT_MAP,
  PRIMARY_STAT_ARCHETYPE_MAP,
  MOD_STAT_MAP,
} from "../util";
import "./Dialog.css";

interface BaseProps {
  armor: ArmorKind;
  identifier: number;
}

interface ArchetypeProps {
  archetype: true;
  mod?: never;
  tertiary?: never;
  withArchetype?: never;
  handleClick: (s: ArmorArchetype | null) => void;
}

interface ModProps {
  archetype?: never;
  mod: true;
  tertiary?: never;
  withArchetype?: never;
  handleClick: (s: ModType | null) => void;
}

interface TertiaryProps {
  archetype?: never;
  mod?: never;
  tertiary: true;
  withArchetype: ArmorArchetype;
  handleClick: (s: StatType | null) => void;
}

interface TooltipProps {
  archetype?: ArmorArchetype;
  tertiary?: StatType;
  mod?: ModType;
}

const Tooltip: React.FC<TooltipProps> = (props) => {
  // const primaryStat = ARCHETYPE_PRIMARY_STAT_MAP[archetype];
  // const secondaryStat = ARCHETYPE_SECONDARY_STAT_MAP[archetype];
  return (
    <div className="bg-purple-800 rounded-lg">
      {props.archetype && (
        <div>
          <div className="mb-1 max-sm:text-sm sm:text-lg font-bold text-left">
            {props.archetype}
          </div>
          <div className="text-left text-nowrap">
            {ARCHETYPE_PRIMARY_STAT_MAP[props.archetype]} +30
            <br />
            {ARCHETYPE_SECONDARY_STAT_MAP[props.archetype]} +25
          </div>
        </div>
      )}
      {props.mod && (
        <div>
          <div className="mb-1 max-sm:text-sm sm:text-lg text-nowrap font-bold text-left">
            {MOD_STAT_MAP[props.mod][0]}
          </div>
          <div className="text-left text-nowrap">
            {MOD_STAT_MAP[props.mod][1]} +{MOD_STAT_MAP[props.mod][2]}
          </div>
        </div>
      )}
      {props.tertiary && (
        <div>
          <div className="mb-1 max-sm:text-xs sm:text-lg text-nowrap text-left">
            {props.tertiary} +20
          </div>
        </div>
      )}
    </div>
  );
};

type DialogProps = BaseProps & (ArchetypeProps | ModProps | TertiaryProps);

const Dialog: React.FC<DialogProps> = (props) => {
  const { armor, identifier, handleClick } = props;
  // 3x2 grid
  return (
    <div className="bg-dialog grid grid-cols-3 max-sm:min-w-[150px] sm:min-w-[300px] gap-y-[1px] gap-x-3 mx-2 p-1 place-items-center">
      <div className="group relative">
        <span className="left-[50%] -top-6 pointer-events-none translate-x-[-50%] absolute group-hover:opacity-100 transition-opacity bg-purple-800 px-1 max-sm:text-xs sm:text-lg text-gray-100 rounded-md opacity-0 text-center z-100">
          None
        </span>
        <div className="cursor-pointer" onClick={() => handleClick(null)}>
          <Slot light animate kind={props.mod ? "Mod" : armor} />
        </div>
      </div>

      {props.archetype &&
        ARCHETYPES.map((archetype, idx) => (
          <div
            className="group relative cursor-pointer place-items-center"
            key={archetype}
            onClick={() => {
              /* @ts-expect-error cba */
              return handleClick(archetype);
            }}
          >
            <span
              className="left-[50%] sm:-top-20 max-sm:-top-13 pointer-events-none translate-x-[-50%] 
            absolute group-hover:opacity-100 transition-opacity bg-purple-800 
            px-1 max-sm:text-xs sm:text-lg text-gray-100 
            rounded-md opacity-0 text-center z-100"
            >
              <Tooltip archetype={archetype} />
            </span>
            <Slot
              identifier={identifier + "-" + idx}
              animate
              kind={archetype}
            />
          </div>
        ))}

      {props.tertiary &&
        ARCHETYPE_TERTIARY_STAT_MAP[props.withArchetype].map((stat, idx) => (
          <div
            className="group relative cursor-pointer place-items-center"
            key={stat}
            onClick={() => {
              /* @ts-expect-error cba */
              return handleClick(stat);
            }}
          >
            <span
              className="left-[50%] sm:-top-8 max-sm:-top-6 pointer-events-none translate-x-[-50%] 
            absolute group-hover:opacity-100 transition-opacity bg-purple-800 
            px-1 max-sm:text-xs sm:text-lg text-gray-100 
            rounded-md opacity-0 text-center z-100"
            >
              <Tooltip tertiary={stat} />
            </span>
            <Slot
              identifier={identifier + "-" + idx}
              animate
              kind={PRIMARY_STAT_ARCHETYPE_MAP[stat]}
            />
          </div>
        ))}

      {props.mod &&
        MODS.map((mod, idx) => (
          <div
            className="group relative cursor-pointer place-items-center"
            key={mod}
            onClick={() => {
              /* @ts-expect-error cba */
              return handleClick(mod);
            }}
          >
            <span
              className="left-[50%] sm:-top-13 max-sm:-top-9 pointer-events-none translate-x-[-50%] 
          absolute group-hover:opacity-100 transition-opacity bg-purple-800 
          px-1 max-sm:text-xs sm:text-lg text-gray-100 
          rounded-md opacity-0 text-center z-100"
            >
              <Tooltip mod={mod} />
            </span>
            <Slot identifier={identifier + "-" + idx} animate kind={mod} />
          </div>
        ))}
    </div>
  );
};

export default Dialog;
