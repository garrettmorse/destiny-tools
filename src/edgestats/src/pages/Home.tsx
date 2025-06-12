import { useCallback, useEffect, useState } from "react";
import Slots from "../components/Slots";
import StatChart from "../components/StatChart";
import Buttons from "../components/Buttons";
import Tiers from "../components/Tiers";
import {
  ARCHETYPE_TERTIARY_STAT_MAP,
  FRAGMENTS,
  getStats,
  INITIAL_FRAGMENT_STATE,
  useArmorParamEncoder,
  useFragmentParamEncoder,
} from "../util";
import type {
  ArmorKind,
  ArmorState,
  DialogClick,
  FragmentType,
  StatType,
  Fragments,
  Tier,
} from "../util";
import { useSearchParams } from "react-router";
import "./Home.css";
import FragmentsCard from "../components/Fragments";

const initialFragmentState = structuredClone(INITIAL_FRAGMENT_STATE);

const HomePage: React.FC = () => {
  const { decodeFromUrl: decodeArmor, encodeToUrl: encodeArmor } =
    useArmorParamEncoder();
  const { decodeFromUrl: decodeFragments, encodeToUrl: encodeFragments } =
    useFragmentParamEncoder();
  const armorParams = decodeArmor(window.location.href);
  const fragmentParams = decodeFragments(window.location.href);
  const [searchParams, setSearchParams] = useSearchParams();
  const [helmetArchetype, setHelmetArchetype] = useState<ArmorState | null>(
    armorParams.Helmet as unknown as ArmorState
  );
  const [glovesArchetype, setGlovesArchetype] = useState<ArmorState | null>(
    armorParams.Gloves as unknown as ArmorState
  );
  const [chestArchetype, setChestArchetype] = useState<ArmorState | null>(
    armorParams.Chest as unknown as ArmorState
  );
  const [bootsArchetype, setBootsArchetype] = useState<ArmorState | null>(
    armorParams.Boots as unknown as ArmorState
  );
  const [classItemArchetype, setClassItemArchetype] =
    useState<ArmorState | null>(armorParams.Class as unknown as ArmorState);
  const [currentSlotHover, setCurrentSlotHover] = useState<{
    armorKind: ArmorKind;
    type: "archetype" | "mod" | "tertiary";
  } | null>(null);
  const [masterwork, toggleMasterwork] = useState<boolean>(
    !!searchParams.get("mw")
  );
  const [tier, setTier] = useState<Tier>(
    Number(searchParams.get("e") ?? "5") as Tier
  );
  const [selectedFragmentTab, setSelectedFragmentTab] = useState<FragmentType>(
    (fragmentParams?.f?.at(0) as FragmentType) ?? "Arc"
  );

  useEffect(() => {
    Object.entries(fragmentParams?.f?.at(1) ?? {}).forEach(
      ([fragmentType, fragmentCollection]) => {
        for (const enabledFragment of Object.keys(fragmentCollection)) {
          // @ts-expect-error cba
          initialFragmentState[fragmentType][enabledFragment] = true;
        }
      }
    );
  }, []);
  const [fragments, setFragments] = useState(initialFragmentState);
  // const [selectedFragments];
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

  const [playerStats, setPlayerStats] = useState<Record<StatType, number>>(
    getStats(
      // @ts-expect-error cba
      Object.keys(STATE_MAP).reduce(
        (acc, armor) => ({
          ...acc,
          [armor]: STATE_MAP[armor as ArmorKind].get,
        }),
        {}
      ),
      masterwork,
      tier
    )
  );

  let copyTimeout: NodeJS.Timeout | null;
  const generateLink = () => {
    const encodedArmorParams = encodeArmor(
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
    const allFragments = Object.keys(fragments)
      .map((fragmentType) =>
        // @ts-expect-error cba
        Object.keys(fragments[fragmentType]).filter(
          // @ts-expect-error cba
          (fragmentName) => fragments[fragmentType][fragmentName]
        )
      )
      .flat() as Fragments[];
    const encodedFragmentParams = encodeFragments({
      fragments: allFragments,
      active: selectedFragmentTab,
    });
    const masterworkParams = masterwork ? "mw=1" : null;
    const tierParams = `e=${tier}`;
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
    const paramArr: string[] = [];
    if (encodedArmorParams) {
      paramArr.push(encodedArmorParams);
    }
    if (encodedFragmentParams) {
      paramArr.push(encodedFragmentParams);
    }
    if (masterworkParams) {
      paramArr.push(masterworkParams);
    }
    if (tierParams) {
      paramArr.push(tierParams);
    }

    navigator.clipboard.writeText(
      `${window.location.href}?${paramArr.join("&")}`
    );
  };

  useEffect(() => {
    setSearchParams({}, { replace: true });
  }, [setSearchParams]);

  const clearState = () => {
    for (const state of Object.values(STATE_MAP)) {
      state.set(null);
    }
    // TODO clear fragment selections
    setFragments(INITIAL_FRAGMENT_STATE);
  };

  const calculateTotalStats = useCallback(() => {
    const armorStates = Object.keys(STATE_MAP).reduce(
      (acc, armor) => ({
        ...acc,
        [armor]: STATE_MAP[armor as ArmorKind].get,
      }),
      {}
    );
    // @ts-expect-error cba
    const baseStats = getStats(armorStates, masterwork, tier);
    const fragmentStats = Object.keys(fragments[selectedFragmentTab])
      .filter(
        // @ts-expect-error cba
        (fragmentName) => fragments[selectedFragmentTab][fragmentName]
      )
      .reduce(
        (stats, fragment) => {
          // @ts-expect-error cba
          const fragmentStats = FRAGMENTS[selectedFragmentTab][fragment];
          Object.keys(fragmentStats).forEach(
            (statName) =>
              (stats[statName as StatType] += fragmentStats[statName])
          );
          return stats;
        },
        { Super: 0, Class: 0, Weapons: 0, Health: 0, Grenade: 0, Melee: 0 }
      );
    const totalStats = { ...baseStats };
    Object.entries(fragmentStats).forEach(([stat, value]) => {
      totalStats[stat as StatType] += value || 0;
    });

    return totalStats;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    fragments,
    masterwork,
    selectedFragmentTab,
    glovesArchetype,
    chestArchetype,
    helmetArchetype,
    classItemArchetype,
    bootsArchetype,
    tier,
  ]);

  useEffect(() => {
    setPlayerStats(calculateTotalStats());
  }, [calculateTotalStats]);
  const handleFragmentToggle = (fragment: Fragments) => {
    setFragments({
      ...fragments,
      [selectedFragmentTab]: {
        ...fragments[selectedFragmentTab],
        // @ts-expect-error cba
        [fragment]: !fragments[selectedFragmentTab][fragment],
      },
    });
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

  const handleTierSelect = (selectedTier: Tier) => {
    setTier(selectedTier);
  };

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
        <div id="slots" className="flex flex-col mb-2">
          <Slots
            currentSlotHover={currentSlotHover}
            handleSlotEnter={handleSlotEnter}
            handleSlotLeave={handleSlotLeave}
            handleDialogClick={handleDialogClick}
            slotData={STATE_MAP}
          />
        </div>
        <div
          id="tiers"
          className="flex gap-2 align-middle border- items-center justify-center  mb-2"
        >
          <Tiers
            handleTierSelect={handleTierSelect}
            selectedTier={tier as Tier}
          />
        </div>
        <div id="chart" className="flex flex-col items-center mb-4">
          <StatChart {...playerStats} />
        </div>
        <div id="fragments" className="flex flex-col items-center">
          <FragmentsCard
            // @ts-expect-error cba
            fragments={{
              [selectedFragmentTab]: fragments[selectedFragmentTab],
            }}
            handleFragmentTabClick={(fragmentType) =>
              setSelectedFragmentTab(fragmentType)
            }
            handleFragmentToggle={handleFragmentToggle}
          />
        </div>
      </div>
    </div>
  );
};

export default HomePage;
