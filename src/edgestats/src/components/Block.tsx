import { STAT_DESCRIPTION_MAP, type StatType } from "../util";

interface BlockProps {
  value: string;
  isHighlighted: boolean;
  index: number;
  fractionFilled?: number; // 0-1 for partial fill, undefined for full blocks
  greenFilled?: number; // 0-1 for green portion, undefined for no green
}

const Block: React.FC<BlockProps> = ({ value, isHighlighted, index, fractionFilled, greenFilled }) => {
  const isFractional = fractionFilled !== undefined;
  const hasGreen = greenFilled !== undefined;
  
  if (isFractional) {
    return (
      <div className="w-12 h-12 border border-gray-400 flex items-center justify-center text-sm font-mono relative overflow-hidden">
        {/* Background (unfilled part) */}
        <div className="absolute inset-0 bg-gray-700"></div>
        {/* Filled part */}
        <div 
          className="absolute inset-0 bg-white"
          style={{
            clipPath: `polygon(0 0, ${fractionFilled * 100}% 0, ${fractionFilled * 100}% 100%, 0 100%)`
          }}
        ></div>
        {/* Green part (if any) */}
        {hasGreen && (
          <div 
            className="absolute inset-0 bg-green-500"
            style={{
              clipPath: `polygon(0 0, ${greenFilled * 100}% 0, ${greenFilled * 100}% 100%, 0 100%)`
            }}
          ></div>
        )}
        {/* Value text */}
        <span className="relative z-10 text-black font-bold">{value}</span>
      </div>
    );
  }

  // Full block
  if (hasGreen) {
    if (greenFilled === 1) {
      // Fully green block
      return (
        <div className="w-12 h-12 border border-gray-400 flex items-center justify-center text-sm font-mono bg-green-500 text-black font-bold">
          {value}
        </div>
      );
    } else {
      // Partially green block
      return (
        <div className="w-12 h-12 border border-gray-400 flex items-center justify-center text-sm font-mono relative overflow-hidden">
          {/* White background */}
          <div className="absolute inset-0 bg-white"></div>
          {/* Green part */}
          <div 
            className="absolute inset-0 bg-green-500"
            style={{
              clipPath: `polygon(0 0, ${greenFilled * 100}% 0, ${greenFilled * 100}% 100%, 0 100%)`
            }}
          ></div>
          {/* Value text */}
          <span className="relative z-10 text-black font-bold">{value}</span>
        </div>
      );
    }
  }

  return (
    <div
      className={`
        w-12 h-12 border border-gray-400 flex items-center justify-center text-sm font-mono
        ${isHighlighted ? 'bg-white text-black' : 'bg-gray-700 text-gray-300'}
        font-bold
      `}
    >
      {value}
    </div>
  );
};

interface BlockRowProps {
  stat: StatType;
  input: string;
  totalBlocks?: number;
}

const BlockRow: React.FC<BlockRowProps> = ({ stat, input, totalBlocks = 10 }) => {
  const parseInput = (input: string) => {
    if (!input) return { fullValue: 0, tensDigit: 0, onesDigit: 0 };
    
    const fullValue = parseInt(input) || 0;
    const tensDigit = Math.floor(fullValue / 10);
    const onesDigit = fullValue % 10;
    
    return { fullValue, tensDigit, onesDigit };
  };

  const { fullValue, tensDigit, onesDigit } = parseInput(input);
  
  // Determine if we're in overflow mode (101-200)
  const isOverflow = fullValue > 100;
  const overflowValue = isOverflow ? fullValue - 100 : 0;
  const overflowTens = Math.floor(overflowValue / 10);
  const overflowOnes = overflowValue % 10;
  
  // Handle special case for multiples of 10 (10, 20, 30, etc.)
  const isMultipleOf10 = fullValue > 0 && onesDigit === 0;
  
  // Full blocks to highlight
  const fullBlockCount = isOverflow ? totalBlocks : (isMultipleOf10 ? tensDigit : Math.floor(fullValue / 10));
  const fullBlockIndices = Array.from({ length: Math.min(fullBlockCount, totalBlocks) }, (_, i) => i);
  
  // Fractional block (if ones digit > 0 and we haven't filled all blocks)
  const hasFractionalBlock = !isOverflow && onesDigit > 0 && fullBlockCount < totalBlocks;
  const fractionalBlockIndex = fullBlockCount;
  const fractionValue = onesDigit / 10;

{/* <div className="group relative">
        <span className="left-[50%] -top-6 pointer-events-none translate-x-[-50%] absolute group-hover:opacity-100 transition-opacity bg-purple-800 px-1 text-lg text-gray-100 rounded-md opacity-0 text-center z-100">None</span>
        <div className="cursor-pointer" onClick={() => handleClick(null)}><Slot light animate kind={props.mod ? 'Mod' : armor} /></div>
      </div> */}


  return (
    <div className="group relative">
      <StatTooltip stat={stat} value={fullValue} />
      <div className="flex">
        {Array.from({ length: totalBlocks }, (_, index) => {
          const isFullBlock = fullBlockIndices.includes(index);
          const isFractionalBlock = hasFractionalBlock && index === fractionalBlockIndex;
          const isLastFullBlock = index === fullBlockCount - 1;
          
          // Calculate green fill for overflow mode
          let greenFilled: number | undefined = undefined;
          if (isOverflow) {
            if (index < overflowTens) {
              // Fully green blocks
              greenFilled = 1;
            } else if (index === overflowTens && overflowOnes > 0) {
              // Partially green block
              greenFilled = overflowOnes / 10;
            }
          }
          
          let displayValue = '';
          if (isLastFullBlock && fullBlockCount > 0 && !isOverflow) {
            // For multiples of 10, show the tens value (10, 20, 30, etc.)
            // For other numbers, show the tens digit
            displayValue = Math.floor(fullValue / 10).toString();
          } else if (isOverflow && index === overflowTens - 1 && overflowTens > 0) {
            // Show the overflow tens value in the last fully green block
            displayValue = Math.floor(fullValue / 10).toString();
          }

          return (
            <Block
              key={index}
              value={displayValue}
              isHighlighted={isFullBlock}
              index={index}
              fractionFilled={isFractionalBlock ? fractionValue : undefined}
              greenFilled={greenFilled}
            />
          );
        })}
      </div>
    </div>
  );
};

interface TooltipProps {
  stat: StatType;
  value: number
}

const StatTooltip: React.FC<TooltipProps> = ({ stat, value }) => {
  const topOffset = stat === "Health" ? value > 100 ? 130 : 115 :
  stat === "Melee" ? value > 100 ? 120 : 105 :
  stat === "Grenade" ? value > 100 ? 120 : 105 :
  stat === "Super" ? value > 100 ? 105 : 90 :
  stat === "Class" ? value > 100 ? 120 : 105 :
  value > 100 ? 158 : 124;
  return (<span className={`pointer-events-none
    translate-x-[-50%] absolute left-[50%] -top-${topOffset}
    group-hover:opacity-100 transition-opacity opacity-0
    text-lg text-gray-100 text-center
    rounded-md z-100 container`}>
      <StatTooltipCard statName={stat} value={value}/>
    </span>
  );
}
    

interface TooltipStatCardProps {
  statName: StatType;
  value: number;
}

const StatTooltipCard: React.FC<TooltipStatCardProps> = ({
  statName="Class",
  value=99
}) => {
  const { description, statBonus, statBonusDescription, overflow } = STAT_DESCRIPTION_MAP[statName];
  const currentTier = Math.floor(value / 10);

  const shouldLerpMid = value > 50;
  const isOverflow = value > 100;
  const shouldLerpOverflowMid = value > 150;

  const baseValue = value > 100 ? 100 : value;

  return (
    <div className="bg-gradient-to-br from-purple-900 via-gray-900 to-purple-800 p-6 rounded-lg shadow-2xl max-w-md mx-auto border border-purple-700/30">
      {/* Header Section */}
      <div className="mb-4">
        <h2 className="text-left text-white font-bold text-2xl tracking-wider mb-1">
          {statName}
        </h2>
        <p className="text-left text-gray-400 text-md font-medium">
          Character Stat
        </p>
      </div>

      {/* Description */}
      <div className="mb-6">
        <p className="text-gray-300 text-sm text-left leading-relaxed">
          {description}
        </p>
      </div>

      {/* Current Tier and Progress */}
      <div className="mb-4">
        <div className="flex justify-between items-center mb-2">
          <span className="text-gray-300">
            {statName} Tier {currentTier}
          </span>
          <span className="text-white font-bold">
            {value}/200
          </span>
        </div>
        
        {statBonusDescription.map((bonusDescription, idx) => (
          <div key={bonusDescription} className="flex justify-between items-center mb-2">
          <span className="text-gray-300 text-md">
            {bonusDescription}
          </span>
          <span className="text-white font-bold text-lg">
            {`${statBonus[idx].type === 'int' ? '+' : ''}${((baseValue / 100) * (statBonus[idx][shouldLerpMid ? "midValue" : "maxValue"])).toFixed(3)}${statBonus[idx].type === "pct" ? '%' : ''}`}
          </span>
        </div>
        ))}
              {/* Next Tier Preview */}
        {isOverflow ? (
          <div className="border-t border-gray-700 pt-2">
            <div className="flex justify-between items-center mb-2">
              <span className="text-white text-xl">ENHANCED BENEFIT</span>
            </div>
            <div className="flex justify-between items-center mb-4">
              <span className="text-left text-gray-300 text-sm">
                {overflow.description}
              </span>
            </div>
            {overflow.statBonusDescription.map((overflowBonusDescription, idx) => (
              <div key={overflowBonusDescription} className="flex justify-between items-center mb-2">
                <span className="text-left text-gray-300 text-md">
                  {overflowBonusDescription}
                </span>
                <span className="text-white font-bold text-lg">
                  {`${overflow.statBonus[idx].type === 'int' ? '+' : ''}${((value / 200) * (overflow.statBonus[idx][shouldLerpOverflowMid ? "midValue" : "maxValue"])).toFixed(3)}${overflow.statBonus[idx].type === "pct" ? '%' : ''}`}
          </span>
        </div>
            ))}
          </div>
        ) : (
        <div className="border-t border-gray-700 pt-2">
          <div className="flex justify-between items-center mb-2">
            <span className="text-gray-400 text-xl">ENHANCED BENEFIT</span>
            </div>
          <div className="flex justify-between items-center mb-4">
            <span className="text-left text-gray-400 text-sm">
              {overflow.description}
            </span>
          </div>
          <div className="flex justify-between items-center mb-[-30px] mt-4">
            <span className="text-gray-200 text-xl">
              Activates above Stat Level 100.
            </span>
          </div>
        </div>
        )}
      </div>
    </div>
  );
};



export default BlockRow;