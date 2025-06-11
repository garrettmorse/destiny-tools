import {
  FRAGMENT_BG_MAP,
  FRAGMENT_DISPLAY_MAP,
  FRAGMENTS,
  PRIMARY_STAT_ARCHETYPE_MAP,
} from "../util";
import type {
  Fragment,
  Fragments,
  FragmentState,
  FragmentType,
  StatType,
} from "../util";

interface FragmentProps {
  fragments: FragmentState;
  handleFragmentTabClick: (fragmentType: FragmentType) => void;
  handleFragmentToggle: (fragment: Fragments) => void;
}

const fragmentEntries = Object.entries(FRAGMENTS);

const FragmentsCard: React.FC<FragmentProps> = ({
  fragments,
  handleFragmentTabClick,
  handleFragmentToggle,
}) => {
  const activeFragmentName = Object.keys(fragments)[0] as FragmentType;

  return (
    <div>
      <div id="fragment-toggle" className="">
        {fragmentEntries.map(([fragmentName]) => (
          <button
            className={`${
              FRAGMENT_BG_MAP[fragmentName as FragmentType]
            } p-2 cursor-pointer rounded-xs active:scale-90 transition-transform duration-100 ${
              activeFragmentName === fragmentName ? "border-b-2" : ""
            }`}
            key={fragmentName}
            onClick={() => handleFragmentTabClick(fragmentName as FragmentType)}
          >
            {fragmentName}
          </button>
        ))}
      </div>
      <div id="fragment-list">
        <FragmentList
          fragmentType={activeFragmentName}
          //@ts-expect-error cba
          fragmentDetails={Object.values(fragments)[0]}
          onClickFragment={handleFragmentToggle}
        />
      </div>
    </div>
  );
};

interface FragmentListProps<T extends FragmentType> {
  fragmentType: T;
  fragmentDetails: Fragment<T>;
  onClickFragment: (fragmentName: Fragment<FragmentType>) => void;
}

const STAT_COLUMN_MAP = {
  Weapons: 0,
  Health: 1,
  Class: 2,
  Grenade: 3,
  Super: 4,
  Melee: 5,
};

const FragmentList: React.FC<FragmentListProps<FragmentType>> = ({
  fragmentDetails,
  fragmentType,
  onClickFragment,
}) => {
  const fragmentNames = Object.keys(fragmentDetails);
  const fragmentStatMatrix = new Array(fragmentNames.length);
  for (let i = 0; i < fragmentNames.length; i++) {
    fragmentStatMatrix[i] = Array(6).fill(0); // 6 stats
  }
  // console.log(fragmentStatMatrix);
  return (
    <div className="flex flex-col border border-gray-800 shadow-xl mb-50">
      <div className="flex max-sm:gap-2 sm:gap-4">
        <div className="border-r font-bold sm:text-lg sm:w-[250px] max-sm:w-[170px]">
          Fragment Name
        </div>
        {Object.keys(STAT_COLUMN_MAP).map((statName) => (
          <div className="" key={statName}>
            <img
              className="slot-inner max-sm:max-w-[20px] sm:max-w-[30px]"
              src={`./stat/${PRIMARY_STAT_ARCHETYPE_MAP[
                statName as StatType
              ].toLowerCase()}.svg`}
            />
          </div>
        ))}
      </div>
      {fragmentNames.map((fragmentName, idx) => {
        const fragmentDisplayName = `${FRAGMENT_DISPLAY_MAP[fragmentType]} ${fragmentName}`;
        // @ts-expect-error cba
        const fragmentStats = FRAGMENTS[fragmentType][fragmentName];
        for (const stat of Object.keys(fragmentStats)) {
          fragmentStatMatrix[idx][STAT_COLUMN_MAP[stat as StatType]] =
            fragmentStats[stat];
        }
        // @ts-expect-error cba
        const isFragmentActive = fragmentDetails[fragmentName];
        return (
          <div
            key={fragmentName}
            id={`fragment-${fragmentName}`}
            className="flex max-sm:gap-2 sm:gap-4"
          >
            <div className={`sm:w-[250px] max-sm:w-[170px] border-r`}>
              <div
                onClick={() =>
                  onClickFragment(fragmentName as Fragment<FragmentType>)
                }
                className={`max-sm:py-2 sm:text-lg max-sm:text-sm active:scale-98 px-1 font-bold cursor-pointer transform hover:scale-105 hover-radial-gradient rounded-lg transition-background duration-400 max-sm:text-center sm:text-left ${
                  isFragmentActive ? "bg-green-400" : "bg-red-500"
                }`}
              >
                {fragmentDisplayName}
              </div>
            </div>
            <div
              className={`flex items-center max-sm:gap-2 sm:gap-4 ${
                idx % 2 ? "bg-gray-800" : ""
              }`}
            >
              {fragmentStatMatrix[idx].map((num: number, numIdx: number) => (
                <div
                  key={fragmentName + "-" + idx + "-" + numIdx}
                  className="max-sm:min-w-[20px] max-sm:min-h-[20px] sm:min-w-[30px] sm:min-h-[30px] sm:text-lg text-center"
                >
                  {num !== 0 ? num : ""}
                </div>
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default FragmentsCard;
