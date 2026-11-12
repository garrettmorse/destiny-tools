import type {
  ArmorArchetype,
  ArmorKind,
  ArmorState,
  DialogClick,
  StatType,
  ModType,
  SlotUpdateType,
  Tuning,
} from "../util";
import {
  ARMOR,
  ARCHETYPE_SECONDARY_STAT_MAP,
  PRIMARY_STAT_ARCHETYPE_MAP,
} from "../util";
import Dialog from "./Dialog";
import Slot from "./Slot";

// fits a tuning label in the narrow mobile column
const STAT_ABBREVIATION: Record<StatType, string> = {
  Weapons: "Wpn",
  Melee: "Mel",
  Health: "Hlth",
  Super: "Sup",
  Grenade: "Gren",
  Class: "Cls",
};

interface SlotProps {
  currentSlotHover: {
    armorKind: ArmorKind;
    type: SlotUpdateType;
  } | null;
  handleSlotEnter: ({
    armorKind,
    updateType,
  }: {
    armorKind: ArmorKind;
    updateType: SlotUpdateType;
  }) => void;
  handleSlotLeave: ({
    armorKind,
    updateType,
  }: {
    armorKind: ArmorKind;
    updateType: SlotUpdateType;
  }) => void;
  handleDialogClick: ({
    armorKind,
    updateType,
    selection,
  }: DialogClick) => void;
  slotData: Record<
    string,
    { get: ArmorState | null; set: (a: ArmorState) => void }
  >;
}

const Slots: React.FC<SlotProps> = ({
  currentSlotHover,
  handleDialogClick,
  handleSlotEnter,
  handleSlotLeave,
  slotData,
}) => (
  <>
    <div className="flex justify-center max-sm:gap-1.5 sm:gap-4 mb-2">
      <div className="border-b max-sm:w-[84px] sm:w-36 justify-center flex max-sm:text-base sm:text-2xl font-bold text-center">
        Archetype
      </div>
      <div className="border-b max-sm:w-[84px] sm:w-36 justify-center flex max-sm:text-base sm:text-2xl font-bold text-center">
        Tertiary
      </div>
      <div className="border-b max-sm:w-[84px] sm:w-36 justify-center flex max-sm:text-base sm:text-2xl font-bold text-center">
        Tuning
      </div>
      <div className="border-b max-sm:w-[84px] sm:w-36 justify-center flex max-sm:text-base sm:text-2xl font-bold text-center">
        Mod
      </div>
    </div>
    {ARMOR.map((armor, idx) => (
      <div
        key={armor}
        className="relative flex justify-center max-sm:gap-1.5 sm:gap-4"
      >
        <div id="archetype-slots" className="flex max-sm:w-[84px] sm:w-36">
          <div
            className="flex flex-col items-center"
            onMouseLeave={() =>
              handleSlotLeave({ armorKind: armor, updateType: "archetype" })
            }
          >
            <div className="text-center max-sm:w-[84px] sm:w-36 max-sm:text-xs sm:text-sm">
              {slotData[armor].get?.archetype ?? "Select Type"}
            </div>
            <div className="relative">
              <div
                onMouseEnter={() =>
                  handleSlotEnter({
                    armorKind: armor,
                    updateType: "archetype",
                  })
                }
                onClick={() =>
                  currentSlotHover?.armorKind === armor &&
                  currentSlotHover?.type === "archetype"
                    ? handleSlotLeave({
                        armorKind: armor,
                        updateType: "archetype",
                      })
                    : handleSlotEnter({
                        armorKind: armor,
                        updateType: "archetype",
                      })
                }
              >
                <Slot
                  identifier={`archetype-${idx}`}
                  kind={slotData[armor].get?.archetype ?? armor}
                  secondary={
                    slotData[armor].get?.archetype &&
                    ARCHETYPE_SECONDARY_STAT_MAP[slotData[armor].get.archetype]
                  }
                />
              </div>
              {currentSlotHover?.armorKind === armor &&
                currentSlotHover?.type === "archetype" && (
                  <div
                    id={`archetype-dialog-${armor}`}
                    className="absolute max-xl:left-full xl:right-full fade-in -top-1 z-50"
                  >
                    <Dialog
                      identifier={idx}
                      armor={armor}
                      archetype
                      handleClick={(archetype: ArmorArchetype | null) =>
                        handleDialogClick({
                          armorKind: armor,
                          updateType: "archetype",
                          selection: archetype,
                        })
                      }
                    />
                  </div>
                )}
            </div>
          </div>
        </div>
        <div
          id="tertiary-slots"
          className={`flex max-sm:w-[84px] sm:w-36 ${
            slotData[armor].get?.archetype
              ? ""
              : "select-none pointer-events-none opacity-40"
          }`}
        >
          <div
            className="flex flex-col items-center"
            onMouseLeave={() =>
              handleSlotLeave({ armorKind: armor, updateType: "tertiary" })
            }
          >
            <div className="text-center max-sm:w-[84px] sm:w-36 max-sm:text-xs sm:text-sm text-center">
              {slotData[armor].get?.tertiary ?? "Select Tertiary"}
            </div>
            <div className="relative">
              <div
                onMouseEnter={() =>
                  handleSlotEnter({
                    armorKind: armor,
                    updateType: "tertiary",
                  })
                }
                onClick={() =>
                  currentSlotHover?.armorKind === armor &&
                  currentSlotHover?.type === "tertiary"
                    ? handleSlotLeave({
                        armorKind: armor,
                        updateType: "tertiary",
                      })
                    : handleSlotEnter({
                        armorKind: armor,
                        updateType: "tertiary",
                      })
                }
              >
                <Slot
                  identifier={`tertiary-${idx}`}
                  kind={
                    PRIMARY_STAT_ARCHETYPE_MAP[
                      slotData[armor].get?.tertiary as StatType
                    ] ?? armor
                  }
                />
              </div>
              {currentSlotHover?.armorKind === armor &&
                currentSlotHover?.type === "tertiary" && (
                  <div
                    id={`tertiary-dialog-${armor}`}
                    className={`absolute fade-in max-sm:top-12 max-sm:-left-[58px] sm:top-25 sm:-left-27 z-50`}
                  >
                    {/* @ts-expect-error cba */}
                    <Dialog
                      identifier={idx}
                      armor={armor}
                      tertiary
                      withArchetype={slotData[armor].get?.archetype}
                      handleClick={(tertiary: StatType | null) =>
                        handleDialogClick({
                          armorKind: armor,
                          updateType: "tertiary",
                          selection: tertiary,
                        })
                      }
                    />
                  </div>
                )}
            </div>
          </div>
        </div>
        <div
          id="tuning-slots"
          className={`flex max-sm:w-[84px] sm:w-36 ${
            slotData[armor].get?.archetype
              ? ""
              : "select-none pointer-events-none opacity-40"
          }`}
        >
          <div
            className="flex flex-col items-center"
            onMouseLeave={() =>
              handleSlotLeave({ armorKind: armor, updateType: "tuning" })
            }
          >
            <div className="text-center max-sm:w-[84px] sm:w-36 max-sm:text-xs sm:text-sm text-nowrap">
              {slotData[armor].get?.tuningPlus &&
              slotData[armor].get?.tuningMinus ? (
                <>
                  <span className="max-sm:hidden">
                    +{slotData[armor].get.tuningPlus} −
                    {slotData[armor].get.tuningMinus}
                  </span>
                  <span className="sm:hidden">
                    +{STAT_ABBREVIATION[slotData[armor].get.tuningPlus]} −
                    {STAT_ABBREVIATION[slotData[armor].get.tuningMinus]}
                  </span>
                </>
              ) : (
                "Select Tuning"
              )}
            </div>
            {/* not positioned, so the dialog anchors to the whole row */}
            <div>
              <div
                onMouseEnter={() =>
                  handleSlotEnter({ armorKind: armor, updateType: "tuning" })
                }
                onClick={() =>
                  currentSlotHover?.armorKind === armor &&
                  currentSlotHover?.type === "tuning"
                    ? handleSlotLeave({
                        armorKind: armor,
                        updateType: "tuning",
                      })
                    : handleSlotEnter({
                        armorKind: armor,
                        updateType: "tuning",
                      })
                }
              >
                <Slot
                  identifier={`tuning-${idx}`}
                  kind={
                    slotData[armor].get?.tuningPlus &&
                    slotData[armor].get?.tuningMinus
                      ? PRIMARY_STAT_ARCHETYPE_MAP[
                          slotData[armor].get.tuningPlus
                        ]
                      : "Tuning"
                  }
                  cost={
                    slotData[armor].get?.tuningPlus
                      ? slotData[armor].get?.tuningMinus
                      : undefined
                  }
                />
              </div>
              {currentSlotHover?.armorKind === armor &&
                currentSlotHover?.type === "tuning" && (
                  <div
                    id={`tuning-dialog-${armor}`}
                    className="absolute left-1/2 -translate-x-1/2 top-full fade-in z-50"
                  >
                    <Dialog
                      identifier={idx}
                      armor={armor}
                      tuning
                      current={
                        slotData[armor].get?.tuningPlus &&
                        slotData[armor].get?.tuningMinus
                          ? {
                              plus: slotData[armor].get.tuningPlus,
                              minus: slotData[armor].get.tuningMinus,
                            }
                          : null
                      }
                      handleClick={(tuning: Tuning | null) =>
                        handleDialogClick({
                          armorKind: armor,
                          updateType: "tuning",
                          selection: tuning,
                        })
                      }
                    />
                  </div>
                )}
            </div>
          </div>
        </div>
        <div id="mod-slots" className={`flex max-sm:w-[84px] sm:w-36`}>
          <div
            className="flex flex-col items-center"
            onMouseLeave={() =>
              handleSlotLeave({ armorKind: armor, updateType: "mod" })
            }
          >
            <div className="text-center max-sm:w-[84px] sm:w-36 max-sm:text-xs sm:text-sm">
              {slotData[armor].get?.mod?.slice(0, -3) ?? "Select Mod"}
            </div>
            <div className="relative">
              <div
                onMouseEnter={() =>
                  handleSlotEnter({ armorKind: armor, updateType: "mod" })
                }
                onClick={() =>
                  currentSlotHover?.armorKind === armor &&
                  currentSlotHover?.type === "mod"
                    ? handleSlotLeave({ armorKind: armor, updateType: "mod" })
                    : handleSlotEnter({ armorKind: armor, updateType: "mod" })
                }
              >
                <Slot
                  identifier={`mod-${idx}`}
                  kind={(slotData[armor].get?.mod as ModType) ?? "Mod"}
                />
              </div>
              {currentSlotHover?.armorKind === armor &&
                currentSlotHover?.type === "mod" && (
                  <div
                    id={`mod-dialog-${armor}`}
                    className={`absolute max-xl:right-full xl:left-full fade-in -top-1 z-50`}
                  >
                    <Dialog
                      identifier={idx}
                      armor={armor}
                      mod
                      handleClick={(mod: ModType | null) =>
                        handleDialogClick({
                          armorKind: armor,
                          updateType: "mod",
                          selection: mod,
                        })
                      }
                    />
                  </div>
                )}
            </div>
          </div>
        </div>
      </div>
    ))}
  </>
);

export default Slots;
