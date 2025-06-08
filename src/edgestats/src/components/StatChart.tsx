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
  <div className="flex flex-col min-w-100">
    {Object.entries(props).map(([stat, value]) => (
      <div className="flex items-center" key={stat}>
        <div className="text-right w-30 font-bold text-2xl">
          {stat}
        </div>
          <div className="flex-1 flex m-2 justify-center">
            <Blocks 
              stat={stat as StatType}
              input={value}
            />
          </div>
        <div className="text-left w-30 font-bold text-2xl">
          {value}
          </div>
      </div>
    ))}
  </div>
  );
};

export default StatChart;