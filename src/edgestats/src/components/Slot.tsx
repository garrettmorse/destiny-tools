const ARMOR = ["Helmet", "Gloves", "Class", "Chest", "Boots"] as const;

type Kind = "Specialist" | "Grenadier" | "Bulwark" | "Brawler" | "Paragon" | "Gunner" | "Helmet" | "Gloves" | "Chest" | "Class" | "Boots"

interface SlotProps {
  light?: boolean
  kind: Kind
}

const Slot: React.FC<SlotProps> = ({ kind, light }) => {
  const outerStyle = {
    filter: "invert(20%) "
  }
  const innerStyle = {
    margin: "10px",
    filter: "invert(73%) sepia(0%) saturate(1471%) hue-rotate(143deg) brightness(92%) contrast(107%)"
  }
  return (
    
      <div className='hover:ring-1 relative z-0 min-w-[100px] min-h-[100px]'>
          <img style={light ? outerStyle : {}}src='/slot.svg' width={100} height={100} />
          <div className="absolute inset-0 flex z-10">
            {/* @ts-expect-error cant be asked */}
            <img style={innerStyle} src={`/${ARMOR.indexOf(kind) > -1 ? "armor" : "stat"}/${kind.toLowerCase()}.svg`} width={80} height={80} />
          </div>
      </div>
  );
}


export default Slot;