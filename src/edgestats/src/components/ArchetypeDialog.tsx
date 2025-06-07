import Slot from "./Slot";
import type { ArmorArchetype, ArmorKind } from "./Stats";

const STAT = ["Gunner", "Brawler", "Bulwark", "Paragon", "Grenadier", "Specialist"] as const;

const ArchetypeDialog: React.FC<{ armor: ArmorKind; handleClick: (s: ArmorArchetype | null) => void }> = ({ armor, handleClick }) => {
  // 3x2 grid
  return (
    <div className="grid grid-cols-3 min-w-[300px] gap-y-[1px] gap-x-1 ps-[1px]">
      <div className="px-[1px] cursor-pointer" onClick={() => handleClick(null)}><Slot light kind={armor} /></div>
      {STAT.map(stat => (
          <div className="px-[1px] cursor-pointer" key={stat} onClick={() => handleClick(stat)}>
            <Slot kind={stat} />
          </div>
      ))}
    </div>
  );
};

export default ArchetypeDialog;