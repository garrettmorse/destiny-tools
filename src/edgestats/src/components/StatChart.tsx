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
    <div className="grid grid-cols-5">
      {Object.entries(props).map(([stat, value]) => (
        <div
          className="col-span-5 grid grid-cols-subgrid items-center"
          key={stat}
        >
          <div className="col-span-1 text-right font-bold max-sm:text-lg sm:text-xl md:text-2xl">
            {stat}
          </div>
          <div className="col-span-3 m-2 justify-center">
            <Blocks stat={stat as StatType} input={value} />
          </div>
          <div className="col-span-1 text-left font-bold max-sm:text-lg sm:text-xl md:text-2xl">
            {value}
          </div>
        </div>
      ))}
    </div>
  );
};

export default StatChart;
