import type { Tier } from "../util";
import { STAT_COUNT } from "../util";

interface TierProps {
  handleTierSelect: (selectedTier: Tier) => void;
  selectedTier: Tier;
}

const TIERS = [1, 2, 3, 4, 5];

const Tiers: React.FC<TierProps> = ({ handleTierSelect, selectedTier }) => {
  const stats = STAT_COUNT.tier;
  return (
    <>
      {TIERS.map((tier) => (
        <div
          onClick={() => handleTierSelect(tier as Tier)}
          className={`flex flex-col cursor-pointer max-sm:w-[50px] max-sm:h-[50px] sm:w-[100px] sm:h-[100px] 
        justify-center
        border hover:border-gray-500 align ${
          selectedTier === tier ? "border-gray-400" : "border-gray-600"
        } max-sm:rounded-md sm:rounded-xl`}
        >
          <div className="max-sm:text-lg sm:text-4xl font-bold text-center">
            T{tier}
          </div>
          <div className="text-center max-sm:text-xs sm:text-md">
            {stats[tier as Tier].PRIMARY}/{stats[tier as Tier].SECONDARY}/
            {stats[tier as Tier].TERTIARY}
          </div>
        </div>
      ))}
    </>
  );
};

export default Tiers;
