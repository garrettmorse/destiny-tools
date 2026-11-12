import {
  ARCHETYPE_PRIMARY_STAT_MAP,
  MOD_STAT_MAP,
  PRIMARY_STAT_ARCHETYPE_MAP,
} from "../util";
import type { ArmorArchetype, StatType } from "../util";
import "./Slot.css";

const ARMOR = ["Helmet", "Gloves", "Class", "Chest", "Boots"] as const;

type ArmorKind = "Helmet" | "Gloves" | "Chest" | "Class" | "Boots";

type ModKind =
  | "Minor Class Mod"
  | "Class Mod"
  | "Health Mod"
  | "Minor Health Mod"
  | "Super Mod"
  | "Minor Super Mod"
  | "Weapons Mod"
  | "Minor Weapons Mod"
  | "Melee Mod"
  | "Minor Melee Mod"
  | "Grenade Mod"
  | "Minor Grenade Mod";

type SlotKind = ArmorKind | ArmorArchetype | ModKind | "Mod" | "Tuning";

interface SlotProps {
  identifier?: string | number;
  light?: boolean;
  animate?: boolean;
  compact?: boolean;
  // renders the secondary stat as a corner badge to tell apart archetypes sharing a primary stat
  secondary?: StatType;
  // renders a tuning cost as a corner badge
  cost?: StatType;
  kind: SlotKind;
}

const MODS = Object.keys(MOD_STAT_MAP) as (keyof typeof MOD_STAT_MAP)[];

const Slot: React.FC<SlotProps> = ({
  identifier,
  kind,
  light,
  animate,
  compact,
  secondary,
  cost,
}) => {
  const slotKind =
    /* @ts-expect-error cant be asked */
    ARMOR.indexOf(kind) > -1
      ? "armor"
      : /* @ts-expect-error cant be asked */
        MODS.indexOf(kind) > -1
        ? "mod"
        : "stat";
  const fileType = slotKind === "mod" ? "png" : "svg";
  const fileName = (
    slotKind === "mod"
      ? kind.slice(0, 5) === "Minor"
        ? kind.split(" ").slice(0, 2).join("_")
        : `Major ${kind}`.split(" ").slice(0, 2).join("_")
      : kind in ARCHETYPE_PRIMARY_STAT_MAP
        ? // archetypes use the icon of their primary stat
          PRIMARY_STAT_ARCHETYPE_MAP[
            ARCHETYPE_PRIMARY_STAT_MAP[kind as ArmorArchetype]
          ]
        : kind
  ).toLowerCase();
  const handleSlotClick = () => {
    if (animate) {
      const el = document.getElementById(`slot-${kind}-${identifier}`);
      el?.classList.toggle("slot-click");
      el?.classList.toggle("slot-animate");
      setTimeout(() => {
        el?.classList.toggle("slot-click");
      }, 300);
      setTimeout(() => {
        el?.classList.toggle("slot-animate");
      }, 500);
    }
  };

  const outerSize = compact
    ? "sm:w-[72px] sm:h-[72px] max-sm:w-[44px] max-sm:h-[44px]"
    : "sm:min-w-[100px] max-sm:max-w-[50px] max-sm:max-h-[50px]";
  const innerSize = compact
    ? "sm:w-[56px] sm:h-[56px] sm:m-[8px] max-sm:w-[34px] max-sm:h-[34px] max-sm:m-[5px]"
    : "sm:min-w-[80px] sm:m-[10px] max-sm:m-[5px] max-sm:max-w-[40px] max-sm:max-h-[40px]";
  const badgeSize = compact
    ? "sm:w-6 sm:h-6 max-sm:w-4 max-sm:h-4"
    : "sm:w-8 sm:h-8 max-sm:w-[18px] max-sm:h-[18px]";

  return (
    <div
      onClick={handleSlotClick}
      className={`hover:ring-1 relative ${outerSize}`}
    >
      <img
        className={`${light ? "slot-outer" : ""} ${outerSize}`}
        src="./slot.svg"
      />
      <div
        id={`slot-${kind}-${identifier}`}
        className="slot absolute inset-0 flex"
      >
        <img
          className={`${
            slotKind === "mod"
              ? "max-sm:max-w-[50px] max-sm:max-h-[50px]"
              : `slot-inner bg-none ${innerSize}`
          }`}
          src={`./${slotKind}/${fileName}.${fileType}`}
        />
      </div>
      {(secondary || cost) && (
        <div
          title={secondary ? `Secondary: ${secondary}` : `Tuning cost: ${cost}`}
          className={`absolute -bottom-1 -right-1 rounded-full bg-[#2F3038] ring-1 ${
            cost ? "ring-red-400" : "ring-[#828286]"
          } flex p-[2px] ${badgeSize}`}
        >
          <img
            className="slot-inner w-full h-full"
            src={`./stat/${PRIMARY_STAT_ARCHETYPE_MAP[(secondary ?? cost) as StatType].toLowerCase()}.svg`}
          />
        </div>
      )}
    </div>
  );
};

export default Slot;
