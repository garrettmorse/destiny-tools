import Slot from "./Slot";
import type { ArmorArchetype, ArmorKind } from "./Stats";
import "./ArchetypeDialog.css";

const STAT = ["Gunner", "Brawler", "Bulwark", "Paragon", "Grenadier", "Specialist"] as const;

const ArchetypeDialog: React.FC<{ identifier: number; armor: ArmorKind; handleClick: (s: ArmorArchetype | null) => void }> = ({ identifier, armor, handleClick }) => {
  // 3x2 grid
  return (
    <div className="bg-dialog grid grid-cols-3 min-w-[300px] gap-y-[1px] gap-x-2 mx-2 place-items-center">
      <div className="group relative">
        <span className="left-[50%] -top-6 translate-x-[-50%] absolute group-hover:opacity-100 transition-opacity bg-purple-800 px-1 text-lg text-gray-100 rounded-md opacity-0 text-center z-100">None</span>
        <div className="cursor-pointer" onClick={() => handleClick(null)}><Slot light animate kind={armor} /></div>
      </div>
      
      {STAT.map((stat, idx) => (
          <div className="group relative cursor-pointer place-items-center" key={stat} onClick={() => handleClick(stat)}>
            <span className="left-[50%] -top-6 translate-x-[-50%] absolute group-hover:opacity-100 transition-opacity bg-purple-800 px-1 text-lg text-gray-100 rounded-md opacity-0 text-center z-100">{stat}</span>
            <Slot identifier={identifier + "-" + idx} animate kind={stat} />
          </div>
      ))}
    </div>
  );
};

export default ArchetypeDialog;