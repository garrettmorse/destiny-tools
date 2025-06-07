import Slot from "./Slot";
import type { ArmorArchetype, ArmorKind } from "./Stats";
import "./ArchetypeDialog.css";

const STAT = ["Gunner", "Brawler", "Bulwark", "Paragon", "Grenadier", "Specialist"] as const;

const ArchetypeDialog: React.FC<{ identifier: number; armor: ArmorKind; handleClick: (s: ArmorArchetype | null) => void }> = ({ identifier, armor, handleClick }) => {
  // 3x2 grid
  return (
    <div className="bg-dialog grid grid-cols-3 min-w-[300px] gap-y-[1px] gap-x-2 mx-2 place-items-center">
      <div className="cursor-pointer" onClick={() => handleClick(null)}><Slot light animate kind={armor} /></div>
      {STAT.map((stat, idx) => (
          <div className="cursor-pointer" key={stat} onClick={() => handleClick(stat)}>
            <Slot identifier={identifier + "-" + idx} animate kind={stat} />
          </div>
      ))}
    </div>
  );
};

export default ArchetypeDialog;