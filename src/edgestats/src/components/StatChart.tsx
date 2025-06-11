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
          <div className="sm:w-30 max-sm:w-15 text-right font-bold max-sm:text-sm sm:text-xl md:text-2xl">
            {stat}
          </div>
          <div className="m-2 flex">
            <Blocks stat={stat as StatType} input={value > 200 ? 200 : value} />
          </div>
          <div className="sm:w-30 max-sm:w-15 text-left font-bold max-sm:text-sm sm:text-xl md:text-2xl">
            {value < 0 ? 0 : value}
          </div>
        </div>
      ))}
    </>
  );
};

export default StatChart;
