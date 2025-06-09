import { useState } from "react";
import Dialog from "./Dialog";
import Slot from "./Slot";
import StatChart from "./StatChart";
import {
  ARMOR,
  getStats,
  PRIMARY_STAT_ARCHETYPE_MAP,
  useSearchParamEncoder,
} from "../util";
import {
  type ArmorArchetype,
  type ArmorKind,
  type ArmorState,
  ARCHETYPE_TERTIARY_STAT_MAP,
  type StatType,
  type ModType,
} from "../util";
import "./Stats.css";
import { useSearchParams } from "react-router";

const Stats: React.FC = () => {
  const { decodeFromUrl, encodeToUrl } = useSearchParamEncoder();
  const [, setSearchParams] = useSearchParams();
  const params = decodeFromUrl(window.location.href);
  const [helmetArchetype, setHelmetArchetype] = useState<ArmorState | null>(
    params.Helmet as unknown as ArmorState
  );
  const [glovesArchetype, setGlovesArchetype] = useState<ArmorState | null>(
    params.Gloves as unknown as ArmorState
  );
  const [chestArchetype, setChestArchetype] = useState<ArmorState | null>(
    params.Chest as unknown as ArmorState
  );
  const [bootsArchetype, setBootsArchetype] = useState<ArmorState | null>(
    params.Boots as unknown as ArmorState
  );
  const [classItemArchetype, setClassItemArchetype] =
    useState<ArmorState | null>(params.Class as unknown as ArmorState);
  const [currentArchetypeHover, setCurrentArchetypeHover] =
    useState<ArmorKind | null>(null);
  const [currentTertiaryHover, setCurrentTertiaryHover] =
    useState<ArmorKind | null>(null);
  const [currentModHover, setCurrentModHover] = useState<ArmorKind | null>(
    null
  );
  const [masterwork, toggleMasterwork] = useState<boolean>(false);

  const STATE_MAP = {
    Helmet: {
      get: helmetArchetype,
      set: setHelmetArchetype,
    },
    Gloves: {
      get: glovesArchetype,
      set: setGlovesArchetype,
    },
    Chest: {
      get: chestArchetype,
      set: setChestArchetype,
    },
    Boots: {
      get: bootsArchetype,
      set: setBootsArchetype,
    },
    Class: {
      get: classItemArchetype,
      set: setClassItemArchetype,
    },
  };

  const clearState = () => {
    for (const state of Object.values(STATE_MAP)) {
      state.set(null);
    }
  };

  const handleArchetypeDialogClick = (
    armorKind: ArmorKind,
    archetype: ArmorArchetype | null
  ) => {
    // handle illegal tertiary
    let tertiary = STATE_MAP[armorKind].get?.tertiary;
    if (STATE_MAP[armorKind].get?.tertiary) {
      // tertiary is illegal if incoming archetype does not support tertiary
      if (
        archetype &&
        !ARCHETYPE_TERTIARY_STAT_MAP[archetype].includes(tertiary as never)
      ) {
        tertiary = undefined;
      }
    }
    const encodedParams = encodeToUrl(
      Object.keys(STATE_MAP).reduce((acc, armor) => {
        const key = armor as keyof typeof STATE_MAP;
        const _archetype =
          armor === armorKind ? archetype : STATE_MAP[key].get?.archetype;
        // @ts-expect-error cba
        acc[armor] = [
          _archetype,
          STATE_MAP[key].get?.tertiary,
          STATE_MAP[key].get?.mod,
        ];
        return acc;
      }, {})
    );
    STATE_MAP[armorKind].set({
      ...STATE_MAP[armorKind].get,
      // @ts-expect-error cba
      archetype,
      // @ts-expect-error cba
      tertiary,
    });
    setSearchParams(encodedParams, { replace: true });
  };

  const handleTertiaryDialogClick = (
    armorKind: ArmorKind,
    stat: StatType | null
  ) => {
    const encodedParams = encodeToUrl(
      Object.keys(STATE_MAP).reduce((acc, armor) => {
        const key = armor as keyof typeof STATE_MAP;
        const _stat = armor === armorKind ? stat : STATE_MAP[key].get?.tertiary;
        // @ts-expect-error cba
        acc[armor] = [
          STATE_MAP[key].get?.archetype,
          _stat,
          STATE_MAP[key].get?.mod,
        ];
        return acc;
      }, {})
    );
    STATE_MAP[armorKind].set({
      ...STATE_MAP[armorKind].get,
      // @ts-expect-error cba
      tertiary: stat,
    });
    setSearchParams(encodedParams, { replace: true });
  };

  const handleModDialogClick = (armorKind: ArmorKind, mod: ModType | null) => {
    const encodedParams = encodeToUrl(
      Object.keys(STATE_MAP).reduce((acc, armor) => {
        const key = armor as keyof typeof STATE_MAP;
        const _mod = armor === armorKind ? mod : STATE_MAP[key].get?.mod;
        // @ts-expect-error cba
        acc[armor] = [
          STATE_MAP[key].get?.archetype,
          STATE_MAP[key].get?.tertiary,
          _mod,
        ];
        return acc;
      }, {})
    );
    STATE_MAP[armorKind].set({
      ...STATE_MAP[armorKind].get,
      // @ts-expect-error cba
      mod,
    });
    setSearchParams(encodedParams, { replace: true });
  };

  const PLAYER_STATS = getStats(
    // @ts-expect-error cba
    Object.keys(STATE_MAP).reduce(
      (acc, armor) => ({ ...acc, [armor]: STATE_MAP[armor as ArmorKind].get }),
      {}
    ),
    masterwork
  );

  let archetypeTimeout: NodeJS.Timeout;
  const handleArchetypeEnter = (armor: ArmorKind) => {
    const el = document.getElementById(`dialog-${armor}`);
    el?.classList.toggle("fade-in");
    clearTimeout(archetypeTimeout);
    setCurrentArchetypeHover(armor);
  };

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
  };

  const handleTertiaryLeave = (armor: ArmorKind) => {
    const el = document.getElementById(`tertiary-dialog-${armor}`);
    el?.classList.toggle("fade-out");
    tertiaryTimeout = setTimeout(() => setCurrentTertiaryHover(null), 100);
  };

  let modTimeout: NodeJS.Timeout;
  const handleModEnter = (armor: ArmorKind) => {
    const el = document.getElementById(`mod-dialog-${armor}`);
    el?.classList.toggle("fade-in");
    clearTimeout(modTimeout);
    setCurrentModHover(armor);
  };

  const handleModLeave = (armor: ArmorKind) => {
    const el = document.getElementById(`mod-dialog-${armor}`);
    el?.classList.toggle("fade-out");
    modTimeout = setTimeout(() => setCurrentModHover(null), 100);
  };

  return (
    <div className="my-4">
      <div className="">
        <div className="flex flex-col">
          <div className="flex  justify-center gap-4 mb-2">
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
              <div className="flex max-sm:w-24 sm:w-36">
                <div
                  className="flex flex-col items-center"
                  onMouseLeave={() => handleArchetypeLeave(armor)}
                >
                  <div className="text-center max-sm:w-24 sm:w-36 max-sm:text-xs sm:text-sm">
                    {STATE_MAP[armor].get?.archetype ?? "Select Type"}
                  </div>
                  <div className="relative">
                    <div
                      onMouseEnter={() => handleArchetypeEnter(armor)}
                      onClick={() =>
                        currentArchetypeHover === armor
                          ? handleArchetypeLeave(armor)
                          : handleArchetypeEnter(armor)
                      }
                    >
                      <Slot
                        identifier={`archetype-${idx}`}
                        kind={STATE_MAP[armor].get?.archetype ?? armor}
                      />
                    </div>
                    {currentArchetypeHover === armor && (
                      <div
                        id={`archetype-dialog-${armor}`}
                        className="absolute max-lg:left-full lg:right-full fade-in -top-1 z-50"
                      >
                        <Dialog
                          identifier={idx}
                          armor={armor}
                          archetype
                          handleClick={(archetype: ArmorArchetype | null) =>
                            handleArchetypeDialogClick(armor, archetype)
                          }
                        />
                      </div>
                    )}
                  </div>
                </div>
              </div>
              <div
                className={`flex max-sm:w-24 sm:w-36 ${
                  STATE_MAP[armor].get?.archetype
                    ? ""
                    : "select-none pointer-events-none opacity-40"
                }`}
              >
                <div
                  className="flex flex-col items-center"
                  onMouseLeave={() => handleTertiaryLeave(armor)}
                >
                  <div className="text-center max-sm:w-24 sm:w-36 max-sm:text-xs sm:text-sm text-center">
                    {STATE_MAP[armor].get?.tertiary ?? "Select Tertiary"}
                  </div>
                  <div className="relative">
                    <div
                      onMouseEnter={() => handleTertiaryEnter(armor)}
                      onClick={() =>
                        currentTertiaryHover === armor
                          ? handleTertiaryLeave(armor)
                          : handleTertiaryEnter(armor)
                      }
                    >
                      <Slot
                        identifier={`tertiary-${idx}`}
                        kind={
                          PRIMARY_STAT_ARCHETYPE_MAP[
                            STATE_MAP[armor].get?.tertiary as StatType
                          ] ?? armor
                        }
                      />
                    </div>
                    {currentTertiaryHover === armor && (
                      <div
                        id={`tertiary-dialog-${armor}`}
                        className={`absolute fade-in max-sm:top-12 max-sm:-left-[58px] sm:top-25 sm:-left-27 z-50`}
                      >
                        {/* @ts-expect-error cba */}
                        <Dialog
                          identifier={idx}
                          armor={armor}
                          tertiary
                          withArchetype={STATE_MAP[armor].get?.archetype}
                          handleClick={(tertiary: StatType | null) =>
                            handleTertiaryDialogClick(armor, tertiary)
                          }
                        />
                      </div>
                    )}
                  </div>
                </div>
              </div>
              <div className={`flex max-sm:w-24 sm:w-36`}>
                <div
                  className="flex flex-col items-center"
                  onMouseLeave={() => handleModLeave(armor)}
                >
                  <div className="text-center max-sm:w-24 sm:w-36 max-sm:text-xs sm:text-sm">
                    {STATE_MAP[armor].get?.mod?.slice(0, -3) ?? "Select Mod"}
                  </div>
                  <div className="relative">
                    <div
                      onMouseEnter={() => handleModEnter(armor)}
                      onClick={() =>
                        currentModHover === armor
                          ? handleModLeave(armor)
                          : handleModEnter(armor)
                      }
                    >
                      <Slot
                        identifier={`mod-${idx}`}
                        kind={(STATE_MAP[armor].get?.mod as ModType) ?? "Mod"}
                      />
                    </div>
                    {currentModHover === armor && (
                      <div
                        id={`mod-dialog-${armor}`}
                        className={`absolute max-lg:right-full lg:left-full fade-in -top-1 z-50`}
                      >
                        <Dialog
                          identifier={idx}
                          armor={armor}
                          mod
                          handleClick={(mod: ModType | null) =>
                            handleModDialogClick(armor, mod)
                          }
                        />
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
      <div className="flex flex-col items-center">
        <StatChart {...PLAYER_STATS} />
      </div>
      <div className="flex justify-center gap-2">
        <button
          className={`${
            masterwork
              ? "bg-yellow-500 hover:bg-gradient-to-l active:bg-gradient-to-r from-yellow-500 to-blue-500"
              : "bg-blue-500 hover:bg-gradient-to-l active:bg-gradient-to-r from-blue-500 to-yellow-500"
          } bg-size-200 hover:ring-1 active:scale-99 bg-pos-0 hover:bg-pos-100 via-yellow items-center transition-all duration-1000 p-1 rounded`}
          onClick={() => toggleMasterwork(!masterwork)}
        >
          Masterwork
        </button>
        <button
          className="bg-gradient-to-t hover:bg-gradient-to-b hover:ring-1 active:scale-99 from-red-400 to-red-800 bg-size-200 bg-pos-0 hover:bg-pos-100 via-yellow items-center transition-all p-1 rounded"
          onClick={() => clearState()}
        >
          Reset Options
        </button>
      </div>
    </div>
  );
};

export default Stats;
