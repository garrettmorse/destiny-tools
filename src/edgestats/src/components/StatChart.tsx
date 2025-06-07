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
  <div className="grid grid-cols-12 grid-rows-6 gap-4 min-w-100">
    {Object.entries(props).map(([stat, value]) => (
      <div className="row-span-1" key={stat}>
        <div>
          {stat}
        </div>
        <div>
          {value}
        </div>
      </div>
    ))}
    </div>
  );
};

export default StatChart;