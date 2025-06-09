import type { StatType } from "../util";
import Blocks from "./Block";

interface ChartProps {
  Health: number;
  Melee: number;
  Grenade: number;
  Super: number;
  Class: number;
  Weapons: number;
}

const StatChart: React.FC<ChartProps> = (props) => {
  return (
    <>
      {Object.entries(props).map(([stat, value]) => (
        <div className="flex items-center" key={stat}>
          <div className="w-30 text-right font-bold max-sm:text-lg sm:text-xl md:text-2xl">
            {stat}
          </div>
          <div className="m-2 flex">
            <Blocks stat={stat as StatType} input={value} />
          </div>
          <div className="w-30 text-left font-bold max-sm:text-lg sm:text-xl md:text-2xl">
            {value}
          </div>
        </div>
      ))}
    </>
  );
};

export default StatChart;
