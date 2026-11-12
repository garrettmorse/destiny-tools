import { useState } from "react";
import Slot from "./Slot";
import type {
  ArmorArchetype,
  ArmorKind,
  StatType,
  ModType,
  Tuning,
} from "../util";
import {
  ARCHETYPE_GROUPS,
  MODS,
  ARCHETYPE_PRIMARY_STAT_MAP,
  ARCHETYPE_SECONDARY_STAT_MAP,
  ARCHETYPE_TERTIARY_STAT_MAP,
  PRIMARY_STAT_ARCHETYPE_MAP,
  MOD_STAT_MAP,
  STAT_COUNT,
  STATS,
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
  tuning?: never;
  withArchetype?: never;
  handleClick: (s: ArmorArchetype | null) => void;
}

interface ModProps {
  archetype?: never;
  mod: true;
  tertiary?: never;
  tuning?: never;
  withArchetype?: never;
  handleClick: (s: ModType | null) => void;
}

interface TertiaryProps {
  archetype?: never;
  mod?: never;
  tertiary: true;
  tuning?: never;
  withArchetype: ArmorArchetype;
  handleClick: (s: StatType | null) => void;
}

interface TuningProps {
  archetype?: never;
  mod?: never;
  tertiary?: never;
  tuning: true;
  current: Tuning | null;
  withArchetype?: never;
  handleClick: (s: Tuning | null) => void;
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
            {ARCHETYPE_PRIMARY_STAT_MAP[props.archetype]} +{STAT_COUNT.PRIMARY}
            <br />
            {ARCHETYPE_SECONDARY_STAT_MAP[props.archetype]} +
            {STAT_COUNT.SECONDARY}
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
            {props.tertiary} +{STAT_COUNT.TERTIARY}
          </div>
        </div>
      )}
    </div>
  );
};

type DialogProps = BaseProps &
  (ArchetypeProps | ModProps | TertiaryProps | TuningProps);

const ArchetypeDialog: React.FC<BaseProps & ArchetypeProps> = ({
  armor,
  identifier,
  handleClick,
}) => (
  // one cell per primary stat, each holding its two archetypes
  <div className="bg-gray-800 rounded-md shadow-xl ring-1 ring-white/10 flex flex-col w-max mx-2 p-1 gap-1">
    <div className="flex items-center justify-between gap-2 px-1">
      <span className="max-sm:text-[10px] sm:text-xs text-gray-400 text-left text-nowrap">
        Archetypes
      </span>
      <button
        className="cursor-pointer rounded-md px-2 max-sm:text-xs sm:text-sm bg-white/10 hover:bg-purple-800 text-gray-100"
        onClick={() => handleClick(null)}
        title={`Clear ${armor} archetype`}
      >
        None
      </button>
    </div>
    <div className="grid grid-cols-2 gap-1">
      {ARCHETYPE_GROUPS.map(({ stat, archetypes }) => (
        <div
          key={stat}
          className="flex flex-col rounded-md bg-black/25 max-sm:px-1 sm:px-2 pb-1 sm:pb-2"
        >
          <div className="max-sm:text-[10px] sm:text-xs uppercase tracking-wider text-gray-400 text-left py-0.5">
            {stat}
          </div>
          <div className="flex max-sm:gap-1 sm:gap-2">
            {archetypes.map((archetype) => (
              <div
                className="group relative cursor-pointer place-items-center"
                key={archetype}
                onClick={() => handleClick(archetype)}
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
                  identifier={identifier + "-" + archetype}
                  animate
                  compact
                  kind={archetype}
                  secondary={ARCHETYPE_SECONDARY_STAT_MAP[archetype]}
                />
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  </div>
);

const TuningDialog: React.FC<BaseProps & TuningProps> = ({
  armor,
  identifier,
  current,
  handleClick,
}) => {
  // the boost is held locally until a cost is picked, unless the current cost still applies
  const [plus, setPlus] = useState<StatType | null>(current?.plus ?? null);
  const minus = current && current.plus === plus ? current.minus : null;

  const selectPlus = (stat: StatType) => {
    setPlus(stat);
    if (current && current.minus !== stat) {
      handleClick({ plus: stat, minus: current.minus });
    }
  };
  const selectMinus = (stat: StatType) => {
    if (plus && plus !== stat) {
      handleClick({ plus, minus: stat });
    }
  };

  const rows = [
    {
      sign: "+",
      label: "text-green-400",
      ring: "ring-green-400",
      selected: plus,
      disabled: () => false,
      onSelect: selectPlus,
    },
    {
      sign: "−",
      label: "text-red-400",
      ring: "ring-red-400",
      selected: minus,
      disabled: (stat: StatType) => !plus || stat === plus,
      onSelect: selectMinus,
    },
  ];

  return (
    <div className="bg-gray-800 rounded-md shadow-xl ring-1 ring-white/10 flex flex-col w-max p-1 gap-1">
      <div className="flex items-center justify-between gap-2 px-1">
        <span className="max-sm:text-[10px] sm:text-xs text-gray-400 text-left text-nowrap">
          {!plus ? (
            `Choose a stat to boost by ${STAT_COUNT.TUNING}`
          ) : !minus ? (
            `Choose a stat to lower by ${STAT_COUNT.TUNING}`
          ) : (
            <>
              <span className="text-green-400">
                +{STAT_COUNT.TUNING} {plus}
              </span>
              {" · "}
              <span className="text-red-400">
                −{STAT_COUNT.TUNING} {minus}
              </span>
            </>
          )}
        </span>
        <button
          className="cursor-pointer rounded-md px-2 max-sm:text-xs sm:text-sm bg-white/10 hover:bg-purple-800 text-gray-100"
          onClick={() => {
            setPlus(null);
            handleClick(null);
          }}
          title={`Clear ${armor} tuning`}
        >
          None
        </button>
      </div>
      {rows.map(({ sign, label, ring, selected, disabled, onSelect }) => (
        <div
          key={sign}
          className="flex items-center rounded-md bg-black/25 max-sm:px-1 sm:px-2 py-1 max-sm:gap-1 sm:gap-2"
        >
          <div
            className={`font-bold max-sm:text-sm sm:text-lg max-sm:w-5 sm:w-7 text-center ${label}`}
          >
            {sign}
            {STAT_COUNT.TUNING}
          </div>
          {STATS.map((stat) => (
            <div
              key={stat}
              className={`flex flex-col items-center ${
                disabled(stat)
                  ? "opacity-30 pointer-events-none"
                  : "cursor-pointer"
              }`}
              onClick={() => onSelect(stat)}
            >
              <div className={selected === stat ? `ring-2 ${ring}` : undefined}>
                <Slot
                  identifier={`${identifier}-${sign}-${stat}`}
                  animate
                  compact
                  kind={PRIMARY_STAT_ARCHETYPE_MAP[stat]}
                />
              </div>
              <span
                className={`max-sm:text-[9px] sm:text-xs ${
                  selected === stat ? "text-gray-100" : "text-gray-400"
                }`}
              >
                {stat}
              </span>
            </div>
          ))}
        </div>
      ))}
    </div>
  );
};

const Dialog: React.FC<DialogProps> = (props) => {
  const { armor, identifier, handleClick } = props;
  if (props.archetype) {
    return <ArchetypeDialog {...props} />;
  }
  if (props.tuning) {
    return <TuningDialog {...props} />;
  }
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
