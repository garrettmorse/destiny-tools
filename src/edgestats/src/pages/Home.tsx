import { useEffect, useState } from "react";
import Slots from "../components/Slots";
import StatChart from "../components/StatChart";
import Buttons from "../components/Buttons";
import {
  ARCHETYPE_TERTIARY_STAT_MAP,
  getStats,
  useSearchParamEncoder,
} from "../util";
import type { ArmorKind, ArmorState, DialogClick } from "../util";
import { useSearchParams } from "react-router";
import "./Home.css";

const HomePage: React.FC = () => {
  const { decodeFromUrl, encodeToUrl } = useSearchParamEncoder();
  const params = decodeFromUrl(window.location.href);
  const [, setSearchParams] = useSearchParams();
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
  const [currentSlotHover, setCurrentSlotHover] = useState<{
    armorKind: ArmorKind;
    type: "archetype" | "mod" | "tertiary";
  } | null>(null);
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

  let copyTimeout: NodeJS.Timeout | null;
  const generateLink = () => {
    const encodedParams = encodeToUrl(
      Object.keys(STATE_MAP).reduce((acc, armor) => {
        const key = armor as keyof typeof STATE_MAP;
        // @ts-expect-error cba
        acc[armor] = [
          STATE_MAP[key].get?.archetype,
          STATE_MAP[key].get?.tertiary,
          STATE_MAP[key].get?.mod,
        ];
        return acc;
      }, {})
    );
    if (!copyTimeout) {
      const defaultButtonMsg = document.getElementById("default-message");
      const successButtonMsg = document.getElementById("success-message");
      const copyButton = document.getElementById("copy-button");
      defaultButtonMsg?.classList.toggle("hidden");
      successButtonMsg?.classList.toggle("hidden");
      copyButton?.classList.toggle("bg-green-500");
      copyButton?.classList.toggle("bg-green-600");
      copyTimeout = setTimeout(() => {
        defaultButtonMsg?.classList.toggle("hidden");
        successButtonMsg?.classList.toggle("hidden");
        copyButton?.classList.toggle("bg-green-500");
        copyButton?.classList.toggle("bg-green-600");
        copyTimeout = null;
      }, 2000);
    }
    navigator.clipboard.writeText(`${window.location.href}?${encodedParams}`);
  };

  useEffect(() => {
    setSearchParams({}, { replace: true });
  }, [setSearchParams]);

  const clearState = () => {
    for (const state of Object.values(STATE_MAP)) {
      state.set(null);
    }
  };

  const handleDialogClick: (options: DialogClick) => void = ({
    armorKind,
    updateType,
    selection,
  }) => {
    const prevArchetype = STATE_MAP[armorKind].get?.archetype;
    const prevMod = STATE_MAP[armorKind].get?.mod;
    const prevTertiary = STATE_MAP[armorKind].get?.tertiary;
    const update = {
      archetype: prevArchetype,
      mod: prevMod,
      tertiary: prevTertiary,
      [updateType]: selection,
    };
    if (updateType === "archetype") {
      // tertiary is illegal if incoming archetype does not support tertiary
      if (
        selection &&
        prevTertiary &&
        !ARCHETYPE_TERTIARY_STAT_MAP[selection].includes(prevTertiary as never)
      ) {
        update.tertiary = undefined;
      }
    }

    // @ts-expect-error cba
    STATE_MAP[armorKind].set({
      ...STATE_MAP[armorKind].get,
      ...update,
    });
  };

  let slotTimeout: NodeJS.Timeout;
  const handleSlotEnter = ({
    armorKind,
    updateType,
  }: {
    armorKind: ArmorKind;
    updateType: "archetype" | "mod" | "tertiary";
  }) => {
    const el = document.getElementById(`${updateType}-dialog-${armorKind}`);
    el?.classList.toggle("fade-in");
    clearTimeout(slotTimeout);
    setCurrentSlotHover({ armorKind, type: updateType });
  };

  const handleSlotLeave = ({
    armorKind,
    updateType,
  }: {
    armorKind: ArmorKind;
    updateType: "archetype" | "mod" | "tertiary";
  }) => {
    const el = document.getElementById(`${updateType}-dialog-${armorKind}`);
    el?.classList.toggle("fade-out");
    slotTimeout = setTimeout(() => setCurrentSlotHover(null), 100);
  };

  const PLAYER_STATS = getStats(
    // @ts-expect-error cba
    Object.keys(STATE_MAP).reduce(
      (acc, armor) => ({ ...acc, [armor]: STATE_MAP[armor as ArmorKind].get }),
      {}
    ),
    masterwork
  );

  return (
    <div className="min-h-screen place-items-center justify-top py-4">
      <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-2 text-center">
        Edgestats
      </h1>
      <p className="dark:text-gray-400 text-xl md:text-2xl lg:text-3xl text-center">
        Preview the Edge of Fate armor stats
      </p>
      <div className="my-4">
        <div id="buttons" className="flex justify-center gap-2 mb-2">
          <Buttons
            clearState={clearState}
            copyLink={generateLink}
            masterwork={masterwork}
            toggleMasterwork={toggleMasterwork}
          />
        </div>
        <div id="slots" className="flex flex-col">
          <Slots
            currentSlotHover={currentSlotHover}
            handleSlotEnter={handleSlotEnter}
            handleSlotLeave={handleSlotLeave}
            handleDialogClick={handleDialogClick}
            slotData={STATE_MAP}
          />
        </div>
        <div id="chart" className="flex flex-col items-center mb-4">
          <StatChart {...PLAYER_STATS} />
        </div>
      </div>
    </div>
  );
};

export default HomePage;
