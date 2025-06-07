import "./Slot.css";

const ARMOR = ["Helmet", "Gloves", "Class", "Chest", "Boots"] as const;

type Kind = "Specialist" | "Grenadier" | "Bulwark" | "Brawler" | "Paragon" | "Gunner" | "Helmet" | "Gloves" | "Chest" | "Class" | "Boots"

interface SlotProps {
  identifier?: string | number
  light?: boolean
  animate?: boolean
  kind: Kind
}

const Slot: React.FC<SlotProps> = ({ identifier, kind, light, animate }) => {
  const handleSlotClick = () => {
    if (animate) {
      const el = document.getElementById(`slot-${kind}-${identifier}`);
      el?.classList.toggle('slot-click');
      el?.classList.toggle('slot-animate');
      setTimeout(() => {
        el?.classList.toggle('slot-click');
      }, 300);
      setTimeout(() => {
        el?.classList.toggle('slot-animate');
      }, 500);
    }
  };

  return (
      <div onClick={handleSlotClick} className='hover:ring-1 relative min-w-[100px] min-h-[100px]'>
          <img className={light ? 'slot-outer' : ''} src='/slot.svg' width={100} height={100} />
          <div id={`slot-${kind}-${identifier}`} className='slot absolute inset-0 flex'>
            {/* @ts-expect-error cant be asked */}
            <img className="slot-inner" src={`/${ARMOR.indexOf(kind) > -1 ? "armor" : "stat"}/${kind.toLowerCase()}.svg`} width={80} height={80} />
          </div>
      </div>
  );
}


export default Slot;