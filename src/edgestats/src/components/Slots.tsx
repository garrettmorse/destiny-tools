import type {
  ArmorArchetype,
  ArmorKind,
  ArmorState,
  DialogClick,
  StatType,
  ModType,
} from "../util";
import { ARMOR, PRIMARY_STAT_ARCHETYPE_MAP } from "../util";
import Dialog from "./Dialog";
import Slot from "./Slot";

interface SlotProps {
  currentSlotHover: {
    armorKind: ArmorKind;
    type: "archetype" | "mod" | "tertiary";
  } | null;
  handleSlotEnter: ({
    armorKind,
    updateType,
  }: {
    armorKind: ArmorKind;
    updateType: "archetype" | "mod" | "tertiary";
  }) => void;
  handleSlotLeave: ({
    armorKind,
    updateType,
  }: {
    armorKind: ArmorKind;
    updateType: "archetype" | "mod" | "tertiary";
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
    <div className="flex justify-center gap-4 mb-2">
      <div className="border-b max-sm:w-24 sm:w-36 justify-center flex max-sm:text-lg sm:text-2xl font-bold text-center">
        Archetype
      </div>
      <div className="border-b max-sm:w-24 sm:w-36 justify-center flex max-sm:text-lg sm:text-2xl font-bold text-center">
        Tertiary
      </div>
      <div className="border-b max-sm:w-24 sm:w-36 justify-center flex max-sm:text-lg sm:text-2xl font-bold text-center">
        Mod
      </div>
    </div>
    {ARMOR.map((armor, idx) => (
      <div key={armor} className="flex justify-center gap-4">
        <div id="archetype-slots" className="flex max-sm:w-24 sm:w-36">
          <div
            className="flex flex-col items-center"
            onMouseLeave={() =>
              handleSlotLeave({ armorKind: armor, updateType: "archetype" })
            }
          >
            <div className="text-center max-sm:w-24 sm:w-36 max-sm:text-xs sm:text-sm">
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
                />
              </div>
              {currentSlotHover?.armorKind === armor &&
                currentSlotHover?.type === "archetype" && (
                  <div
                    id={`archetype-dialog-${armor}`}
                    className="absolute max-lg:left-full lg:right-full fade-in -top-1 z-50"
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
          className={`flex max-sm:w-24 sm:w-36 ${
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
            <div className="text-center max-sm:w-24 sm:w-36 max-sm:text-xs sm:text-sm text-center">
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
        <div id="mod-slots" className={`flex max-sm:w-24 sm:w-36`}>
          <div
            className="flex flex-col items-center"
            onMouseLeave={() =>
              handleSlotLeave({ armorKind: armor, updateType: "mod" })
            }
          >
            <div className="text-center max-sm:w-24 sm:w-36 max-sm:text-xs sm:text-sm">
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
                    className={`absolute max-lg:right-full lg:left-full fade-in -top-1 z-50`}
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
